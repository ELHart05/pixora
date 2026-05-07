import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc/init.js';
import { prisma } from '../lib/prisma.js';

export const socialRouter = router({
  /** Like count + whether the current user has liked this canvas */
  likeStatus: publicProcedure
    .input(z.object({ canvasId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [count, userLike] = await Promise.all([
        prisma.like.count({ where: { canvasId: input.canvasId } }),
        ctx.user
          ? prisma.like.findUnique({
              where: { userId_canvasId: { userId: ctx.user.id, canvasId: input.canvasId } },
            })
          : null,
      ]);
      return { count, liked: !!userLike };
    }),

  /** Paginated list of people who liked a canvas */
  likes: publicProcedure
    .input(z.object({
      canvasId: z.string(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(50).default(12),
    }))
    .query(async ({ input }) => {
      const skip = (input.page - 1) * input.limit;
      const [items, total] = await Promise.all([
        prisma.like.findMany({
          where: { canvasId: input.canvasId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: input.limit,
          include: { user: { select: { id: true, name: true, username: true, avatar: true } } },
        }),
        prisma.like.count({ where: { canvasId: input.canvasId } }),
      ]);

      return { items, total, pages: Math.ceil(total / input.limit) };
    }),

  /** Toggle like on a canvas */
  toggleLike: protectedProcedure
    .input(z.object({ canvasId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.like.findUnique({
        where: { userId_canvasId: { userId: ctx.user.id, canvasId: input.canvasId } },
      });

      if (existing) {
        await prisma.like.delete({ where: { id: existing.id } });
        return { liked: false };
      }

      const canvas = await prisma.canvas.findUnique({ where: { id: input.canvasId } });
      if (!canvas || (!canvas.isPublic && canvas.userId !== ctx.user.id))
        throw new TRPCError({ code: 'FORBIDDEN' });

      await prisma.like.create({ data: { userId: ctx.user.id, canvasId: input.canvasId } });
      return { liked: true };
    }),

  /** Fetch paginated top-level comments for a canvas */
  comments: publicProcedure
    .input(z.object({
      canvasId: z.string(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(30).default(8),
      repliesLimit: z.number().int().min(0).max(10).default(3),
    }))
    .query(async ({ input }) => {
      const skip = (input.page - 1) * input.limit;
      const where = {
        canvasId: input.canvasId,
        OR: [
          { parentId: null },
          { parentId: { isSet: false } },
        ],
      };
      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: input.limit,
          include: { user: { select: { id: true, name: true, username: true, avatar: true } } },
        }),
        prisma.comment.count({ where }),
      ]);

      const items = await Promise.all(comments.map(async (comment) => {
        const [replies, replyCount] = await Promise.all([
          input.repliesLimit > 0
            ? prisma.comment.findMany({
                where: { canvasId: input.canvasId, parentId: comment.id },
                orderBy: { createdAt: 'asc' },
                take: input.repliesLimit,
                include: { user: { select: { id: true, name: true, username: true, avatar: true } } },
              })
            : Promise.resolve([]),
          prisma.comment.count({ where: { canvasId: input.canvasId, parentId: comment.id } }),
        ]);
        return { ...comment, replies, replyCount };
      }));

      return { items, total, pages: Math.ceil(total / input.limit) };
    }),

  /** Fetch paginated replies for a single top-level comment */
  replies: publicProcedure
    .input(z.object({
      canvasId: z.string(),
      parentId: z.string(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(30).default(10),
    }))
    .query(async ({ input }) => {
      const skip = (input.page - 1) * input.limit;
      const where = { canvasId: input.canvasId, parentId: input.parentId };
      const [items, total] = await Promise.all([
        prisma.comment.findMany({
          where,
          orderBy: { createdAt: 'asc' },
          skip,
          take: input.limit,
          include: { user: { select: { id: true, name: true, username: true, avatar: true } } },
        }),
        prisma.comment.count({ where }),
      ]);

      return { items, total, pages: Math.ceil(total / input.limit) };
    }),

  /** Post a comment */
  addComment: protectedProcedure
    .input(z.object({
      canvasId: z.string(),
      text: z.string().min(1).max(500),
      parentId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const canvas = await prisma.canvas.findUnique({ where: { id: input.canvasId } });
      if (!canvas || (!canvas.isPublic && canvas.userId !== ctx.user.id))
        throw new TRPCError({ code: 'FORBIDDEN' });

      if (input.parentId) {
        const parent = await prisma.comment.findUnique({ where: { id: input.parentId } });
        if (!parent || parent.canvasId !== input.canvasId) throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return prisma.comment.create({
        data: {
          text: input.text,
          userId: ctx.user.id,
          canvasId: input.canvasId,
          parentId: input.parentId,
        },
        include: { user: { select: { id: true, name: true, username: true, avatar: true } } },
      });
    }),

  /** Delete a comment (comment owner or canvas owner) */
  deleteComment: protectedProcedure
    .input(z.object({ commentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const comment = await prisma.comment.findUnique({ where: { id: input.commentId } });
      if (!comment) throw new TRPCError({ code: 'NOT_FOUND' });

      if (comment.userId !== ctx.user.id) {
        const canvas = await prisma.canvas.findUnique({ where: { id: comment.canvasId } });
        if (canvas?.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await prisma.comment.deleteMany({ where: { parentId: input.commentId } });
      await prisma.comment.delete({ where: { id: input.commentId } });
      return { ok: true };
    }),
});
