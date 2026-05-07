import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc/init.js';
import { prisma } from '../lib/prisma.js';
import { listFollowingIds } from '../lib/follows.js';

export const canvasRouter = router({
  /** List the signed-in user's own canvases */
  myList: protectedProcedure.query(async ({ ctx }) => {
    return prisma.canvas.findMany({
      where: { userId: ctx.user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        data: true,
        thumbnail: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { likes: true, comments: true } },
        shares: { select: { user: { select: { id: true, name: true, username: true, avatar: true } } } },
      },
    });
  }),

  /** Canvases that other users shared privately with the current user */
  sharedWithMe: protectedProcedure.query(async ({ ctx }) => {
    const shares = await prisma.canvasShare.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        canvas: {
          select: {
            id: true, title: true, description: true, data: true, thumbnail: true,
            isPublic: true, createdAt: true, updatedAt: true,
            user: { select: { id: true, name: true, username: true, avatar: true } },
            _count: { select: { likes: true, comments: true } },
          },
        },
      },
    });
    return shares.map((s) => s.canvas);
  }),

  /** Paginated public gallery */
  publicList: publicProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(48).default(12),
        search: z.string().max(80).optional(),
        sort: z.enum(['latest', 'oldest', 'popular', 'discussed']).default('latest'),
      })
    )
    .query(async ({ input }) => {
      const skip = (input.page - 1) * input.limit;
      const search = input.search?.trim();
      const where = {
        isPublic: true,
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' as const } },
                { description: { contains: search, mode: 'insensitive' as const } },
                { user: { is: { name: { contains: search, mode: 'insensitive' as const } } } },
                { user: { is: { username: { contains: search, mode: 'insensitive' as const } } } },
              ],
            }
          : {}),
      };
      const orderBy =
        input.sort === 'popular'
          ? [{ likes: { _count: 'desc' as const } }, { createdAt: 'desc' as const }]
          : input.sort === 'discussed'
          ? [{ comments: { _count: 'desc' as const } }, { createdAt: 'desc' as const }]
          : input.sort === 'oldest'
          ? [{ createdAt: 'asc' as const }]
          : [{ createdAt: 'desc' as const }];

      const [items, total] = await Promise.all([
        prisma.canvas.findMany({
          where,
          orderBy,
          skip,
          take: input.limit,
          select: {
            id: true,
            title: true,
            description: true,
            data: true,
            thumbnail: true,
            isPublic: true,
            createdAt: true,
            user: { select: { id: true, name: true, username: true, avatar: true } },
            _count: { select: { likes: true, comments: true } },
          },
        }),
        prisma.canvas.count({ where }),
      ]);
      return { items, total, pages: Math.ceil(total / input.limit) };
    }),

  /** Feed of public canvases from followed users and your own public canvases */
  feed: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(48).default(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const followingIds = await listFollowingIds(prisma, ctx.user.id);
      const userIds = Array.from(new Set([ctx.user.id, ...followingIds]));
      const skip = (input.page - 1) * input.limit;
      const where = {
        isPublic: true,
        userId: { in: userIds },
      };

      const [items, total] = await Promise.all([
        prisma.canvas.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }],
          skip,
          take: input.limit,
          select: {
            id: true,
            title: true,
            description: true,
            data: true,
            thumbnail: true,
            isPublic: true,
            createdAt: true,
            user: { select: { id: true, name: true, username: true, avatar: true } },
            _count: { select: { likes: true, comments: true } },
          },
        }),
        prisma.canvas.count({ where }),
      ]);

      return { items, total, pages: Math.ceil(total / input.limit) };
    }),

  /** Get a single canvas by ID — visible to: owner, sharers, or anyone if public */
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const canvas = await prisma.canvas.findUnique({
        where: { id: input.id },
        include: {
          user: { select: { id: true, name: true, username: true, avatar: true } },
          _count: { select: { likes: true, comments: true } },
          shares: { select: { userId: true } },
        },
      });
      if (!canvas) throw new TRPCError({ code: 'NOT_FOUND' });
      const isOwner = canvas.userId === ctx.user?.id;
      const isSharedWith = canvas.shares.some((s) => s.userId === ctx.user?.id);
      if (!canvas.isPublic && !isOwner && !isSharedWith)
        throw new TRPCError({ code: 'FORBIDDEN' });
      return canvas;
    }),

  /** Create a private copy of a visible canvas for the signed-in user */
  tryThis: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const source = await prisma.canvas.findUnique({
        where: { id: input.id },
        include: { shares: { select: { userId: true } } },
      });
      if (!source) throw new TRPCError({ code: 'NOT_FOUND' });

      const isOwner = source.userId === ctx.user.id;
      const isSharedWith = source.shares.some((s) => s.userId === ctx.user.id);
      if (!source.isPublic && !isOwner && !isSharedWith)
        throw new TRPCError({ code: 'FORBIDDEN' });

      const copy = await prisma.canvas.create({
        data: {
          title: `Try this: ${source.title}`.slice(0, 120),
          description: source.description,
          data: source.data,
          thumbnail: source.thumbnail,
          isPublic: false,
          userId: ctx.user.id,
        },
        select: {
          id: true,
          title: true,
          description: true,
          data: true,
          thumbnail: true,
          isPublic: true,
          createdAt: true,
        },
      });

      await prisma.canvasRevision.create({
        data: {
          canvasId: copy.id,
          data: source.data,
          note: `Copied from ${source.title}`,
        },
      });

      return copy;
    }),

  /** Create or update a canvas — auto-snapshots a revision on each save */
  save: protectedProcedure
    .input(
      z.object({
        id: z.string().nullish(),
        title: z.string().min(1).max(120),
        description: z.string().max(500).optional(),
        data: z.string(),
        thumbnail: z.string().optional(),
        isPublic: z.boolean().default(false),
        revisionNote: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.id) {
        const existing = await prisma.canvas.findUnique({ where: { id: input.id } });
        if (!existing) throw new TRPCError({ code: 'NOT_FOUND' });
        if (existing.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });

        // snapshot previous state before overwriting
        await prisma.canvasRevision.create({
          data: {
            canvasId: input.id,
            data: existing.data,
            note: input.revisionNote ?? 'Auto-save',
          },
        });

        // keep only last 50 revisions per canvas
        const revisions = await prisma.canvasRevision.findMany({
          where: { canvasId: input.id },
          orderBy: { createdAt: 'desc' },
          skip: 50,
          select: { id: true },
        });
        if (revisions.length > 0) {
          await prisma.canvasRevision.deleteMany({
            where: { id: { in: revisions.map((r) => r.id) } },
          });
        }

        return prisma.canvas.update({
          where: { id: input.id },
          data: {
            title: input.title,
            description: input.description,
            data: input.data,
            thumbnail: input.thumbnail,
            isPublic: input.isPublic,
          },
          select: { id: true, title: true, description: true, isPublic: true, updatedAt: true },
        });
      }

      const canvas = await prisma.canvas.create({
        data: {
          title: input.title,
          description: input.description,
          data: input.data,
          thumbnail: input.thumbnail,
          isPublic: input.isPublic,
          userId: ctx.user.id,
        },
        select: { id: true, title: true, description: true, isPublic: true, createdAt: true },
      });

      // first revision
      await prisma.canvasRevision.create({
        data: { canvasId: canvas.id, data: input.data, note: 'Initial save' },
      });

      return canvas;
    }),

  /** Delete a canvas (owner only) */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const canvas = await prisma.canvas.findUnique({ where: { id: input.id } });
      if (!canvas) throw new TRPCError({ code: 'NOT_FOUND' });
      if (canvas.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
      await prisma.canvas.delete({ where: { id: input.id } });
      return { ok: true };
    }),

  /** Toggle public ↔ private (owner only) */
  togglePublic: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const canvas = await prisma.canvas.findUnique({ where: { id: input.id } });
      if (!canvas) throw new TRPCError({ code: 'NOT_FOUND' });
      if (canvas.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
      return prisma.canvas.update({
        where: { id: input.id },
        data: { isPublic: !canvas.isPublic },
        select: { id: true, isPublic: true },
      });
    }),

  /** Share a private canvas with a specific user (by userId) */
  shareWith: protectedProcedure
    .input(z.object({ canvasId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const canvas = await prisma.canvas.findUnique({ where: { id: input.canvasId } });
      if (!canvas) throw new TRPCError({ code: 'NOT_FOUND' });
      if (canvas.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
      if (input.userId === ctx.user.id)
        throw new TRPCError({ code: 'BAD_REQUEST', message: "You can't share with yourself" });

      await prisma.canvasShare.upsert({
        where: { canvasId_userId: { canvasId: input.canvasId, userId: input.userId } },
        create: { canvasId: input.canvasId, userId: input.userId },
        update: {},
      });
      return { ok: true };
    }),

  /** Revoke a private share */
  revokeShare: protectedProcedure
    .input(z.object({ canvasId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const canvas = await prisma.canvas.findUnique({ where: { id: input.canvasId } });
      if (!canvas) throw new TRPCError({ code: 'NOT_FOUND' });
      if (canvas.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
      await prisma.canvasShare.deleteMany({
        where: { canvasId: input.canvasId, userId: input.userId },
      });
      return { ok: true };
    }),

  /** List revisions for a canvas (owner only) */
  history: protectedProcedure
    .input(z.object({ canvasId: z.string() }))
    .query(async ({ ctx, input }) => {
      const canvas = await prisma.canvas.findUnique({ where: { id: input.canvasId } });
      if (!canvas) throw new TRPCError({ code: 'NOT_FOUND' });
      if (canvas.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
      return prisma.canvasRevision.findMany({
        where: { canvasId: input.canvasId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, note: true, createdAt: true },
      });
    }),

  /** Restore canvas to a specific revision */
  restoreRevision: protectedProcedure
    .input(z.object({ revisionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const revision = await prisma.canvasRevision.findUnique({ where: { id: input.revisionId } });
      if (!revision) throw new TRPCError({ code: 'NOT_FOUND' });
      const canvas = await prisma.canvas.findUnique({ where: { id: revision.canvasId } });
      if (!canvas) throw new TRPCError({ code: 'NOT_FOUND' });
      if (canvas.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });

      // snapshot current state before restoring
      await prisma.canvasRevision.create({
        data: { canvasId: canvas.id, data: canvas.data, note: 'Before restore' },
      });

      await prisma.canvas.update({
        where: { id: canvas.id },
        data: { data: revision.data },
      });

      return { data: revision.data };
    }),
});
