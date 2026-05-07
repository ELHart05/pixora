import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc/init.js';
import { prisma } from '../lib/prisma.js';
import {
  countFollowers,
  countFollowing,
  followUser,
  isFollowing,
  paginatedFollowerIds,
  paginatedFollowingIds,
  unfollowUser,
} from '../lib/follows.js';

export const userRouter = router({
  /** Current signed-in user's full profile */
  me: protectedProcedure.query(({ ctx }) =>
    prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { id: true, name: true, username: true, bio: true, avatar: true, email: true, createdAt: true },
    })
  ),

  /** Update current user's profile */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(60).optional(),
        username: z
          .string()
          .min(3)
          .max(30)
          .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, _ and - allowed')
          .optional(),
        bio: z.string().max(200).optional(),
        avatar: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.username) {
        const existing = await prisma.user.findUnique({ where: { username: input.username } });
        if (existing && existing.id !== ctx.user.id)
          throw new TRPCError({ code: 'CONFLICT', message: 'Username already taken' });
      }
      return prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.username !== undefined && { username: input.username }),
          ...(input.bio !== undefined && { bio: input.bio }),
          ...(input.avatar !== undefined && { avatar: input.avatar }),
        },
        select: { id: true, name: true, username: true, bio: true, avatar: true },
      });
    }),

  /** Public profile + their public canvases */
  byUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const targetUser = await prisma.user.findUnique({
        where: { username: input.username },
        select: { id: true },
      });
      if (!targetUser) throw new TRPCError({ code: 'NOT_FOUND' });

      const isOwnProfile = ctx.user?.id === targetUser.id;
      const user = await prisma.user.findUnique({
        where: { username: input.username },
        select: {
          id: true, name: true, username: true, bio: true, avatar: true, createdAt: true,
          canvases: {
            ...(isOwnProfile ? {} : { where: { isPublic: true } }),
            orderBy: { createdAt: 'desc' },
            select: {
              id: true, title: true, description: true, data: true, thumbnail: true, createdAt: true, isPublic: true,
              _count: { select: { likes: true, comments: true } },
            },
          },
        },
      });
      const [viewerFollows, followersCount, followingCount] = user
        ? await Promise.all([
            ctx.user?.id ? isFollowing(prisma, ctx.user.id, user.id) : Promise.resolve(false),
            countFollowers(prisma, user.id),
            countFollowing(prisma, user.id),
          ])
        : [false, 0, 0];

      return {
        ...user,
        viewerFollows,
        _count: {
          followers: followersCount,
          following: followingCount,
        },
      };
    }),

  /** Search users by username or name (for the "share with" lookup) */
  search: protectedProcedure
    .input(z.object({ q: z.string().min(1).max(60) }))
    .query(async ({ ctx, input }) => {
      return prisma.user.findMany({
        where: {
          AND: [
            { id: { not: ctx.user.id } }, // exclude self
            {
              OR: [
                { username: { contains: input.q, mode: 'insensitive' } },
                { name: { contains: input.q, mode: 'insensitive' } },
              ],
            },
          ],
        },
        select: { id: true, name: true, username: true, avatar: true },
        take: 10,
      });
    }),

  /** Top creators by public canvas count (for the landing page leaderboard) */
  topCreators: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(10).default(5) }).optional())
    .query(async ({ input }) => {
      const limit = input?.limit ?? 5;

      // Aggregate public canvases per user
      const groups = await prisma.canvas.groupBy({
        by: ['userId'],
        where: { isPublic: true },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: limit,
      });

      if (groups.length === 0) return [];

      // Fetch user details + their latest public canvases for thumbnails
      const userIds = groups.map((g) => g.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true, name: true, username: true, avatar: true,
          canvases: {
            where: { isPublic: true },
            orderBy: { createdAt: 'desc' },
            take: 3,
            select: { id: true, title: true, thumbnail: true },
          },
        },
      });

      // Merge count with user data, preserve order
      const userMap = new Map(users.map((u) => [u.id, u]));
      return groups.map((g) => ({
        ...userMap.get(g.userId),
        canvasCount: g._count.id,
      })).filter(Boolean);
    }),

  /** Public directory of users / creators */
  creatorsList: publicProcedure
    .input(z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(48).default(12),
      search: z.string().max(80).optional(),
      sort: z.enum(['most-canvases', 'newest', 'oldest', 'name']).default('most-canvases'),
      filter: z.enum(['all', 'with-canvases', 'without-canvases']).default('all'),
    }))
    .query(async ({ input }) => {
      const search = input.search?.trim();
      const users = await prisma.user.findMany({
        where: search
          ? {
              OR: [
                { username: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { bio: { contains: search, mode: 'insensitive' } },
              ],
            }
          : undefined,
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          bio: true,
          createdAt: true,
        },
      });

      if (users.length === 0) {
        return { items: [], total: 0, pages: 0 };
      }

      const userIds = users.map((user) => user.id);
      const groups = await prisma.canvas.groupBy({
        by: ['userId'],
        where: {
          isPublic: true,
          userId: { in: userIds },
        },
        _count: { id: true },
      });

      const countMap = new Map(groups.map((group) => [group.userId, group._count.id]));
      let items = users.map((user) => ({
        ...user,
        canvasCount: countMap.get(user.id) ?? 0,
      }));

      if (input.filter === 'with-canvases') {
        items = items.filter((user) => user.canvasCount > 0);
      } else if (input.filter === 'without-canvases') {
        items = items.filter((user) => user.canvasCount === 0);
      }

      items.sort((a, b) => {
        if (input.sort === 'name') {
          return (a.name ?? a.username ?? '').localeCompare(b.name ?? b.username ?? '');
        }
        if (input.sort === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (input.sort === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return (
          b.canvasCount - a.canvasCount
          || (a.name ?? a.username ?? '').localeCompare(b.name ?? b.username ?? '')
        );
      });

      const total = items.length;
      const pages = Math.ceil(total / input.limit);
      const skip = (input.page - 1) * input.limit;

      return {
        items: items.slice(skip, skip + input.limit),
        total,
        pages,
      };
    }),

  /** Follow another user */
  follow: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.userId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot follow yourself.' });
      }

      const target = await prisma.user.findUnique({ where: { id: input.userId }, select: { id: true } });
      if (!target) throw new TRPCError({ code: 'NOT_FOUND' });

      await followUser(prisma, ctx.user.id, input.userId);

      return { following: true };
    }),

  /** Unfollow a user */
  unfollow: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await unfollowUser(prisma, ctx.user.id, input.userId);

      return { following: false };
    }),

  /** Paginated followers list */
  followers: publicProcedure
    .input(z.object({
      username: z.string(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(50).default(12),
    }))
    .query(async ({ input }) => {
      const target = await prisma.user.findUnique({
        where: { username: input.username },
        select: { id: true },
      });
      if (!target) throw new TRPCError({ code: 'NOT_FOUND' });

      const { ids, total, pages } = await paginatedFollowerIds(prisma, target.id, input.page, input.limit);
      const users = ids.length === 0
        ? []
        : await prisma.user.findMany({
            where: { id: { in: ids } },
            select: { id: true, name: true, username: true, avatar: true, bio: true, createdAt: true },
          });
      const userMap = new Map(users.map((user) => [user.id, user]));

      return {
        items: ids.map((id) => userMap.get(id)).filter(Boolean),
        total,
        pages,
      };
    }),

  /** Paginated following list */
  following: publicProcedure
    .input(z.object({
      username: z.string(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(50).default(12),
    }))
    .query(async ({ input }) => {
      const target = await prisma.user.findUnique({
        where: { username: input.username },
        select: { id: true },
      });
      if (!target) throw new TRPCError({ code: 'NOT_FOUND' });

      const { ids, total, pages } = await paginatedFollowingIds(prisma, target.id, input.page, input.limit);
      const users = ids.length === 0
        ? []
        : await prisma.user.findMany({
            where: { id: { in: ids } },
            select: { id: true, name: true, username: true, avatar: true, bio: true, createdAt: true },
          });
      const userMap = new Map(users.map((user) => [user.id, user]));

      return {
        items: ids.map((id) => userMap.get(id)).filter(Boolean),
        total,
        pages,
      };
    }),
});
