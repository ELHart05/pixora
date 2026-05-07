import type { PrismaClient, Prisma } from '@prisma/client';

const FOLLOW_COLLECTION = 'Follow';

function oid(id: string) {
  return { $oid: id };
}

function readOid(value: unknown) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && '$oid' in value) {
    return String((value as { $oid: string }).$oid);
  }
  return null;
}

async function findFollowRecords(
  prisma: PrismaClient,
  filter: Record<string, unknown>,
  skip = 0,
  limit = 50
) {
  const result = await prisma.$runCommandRaw({
    find: FOLLOW_COLLECTION,
    filter: filter as Prisma.InputJsonObject,
    skip,
    limit,
    sort: { _id: -1 },
  }) as { cursor?: { firstBatch?: Array<Record<string, unknown>> } };

  return result.cursor?.firstBatch ?? [];
}

async function countFollowRecords(prisma: PrismaClient, filter: Record<string, unknown>) {
  const result = await prisma.$runCommandRaw({
    count: FOLLOW_COLLECTION,
    query: filter as Prisma.InputJsonObject,
  }) as { n?: number };

  return result.n ?? 0;
}

export async function isFollowing(prisma: PrismaClient, followerId: string, followingId: string) {
  const items = await findFollowRecords(
    prisma,
    { followerId: oid(followerId), followingId: oid(followingId) },
    0,
    1
  );
  return items.length > 0;
}

export async function followUser(prisma: PrismaClient, followerId: string, followingId: string) {
  if (await isFollowing(prisma, followerId, followingId)) return;

  await prisma.$runCommandRaw({
    insert: FOLLOW_COLLECTION,
    documents: [{ followerId: oid(followerId), followingId: oid(followingId) }],
  });
}

export async function unfollowUser(prisma: PrismaClient, followerId: string, followingId: string) {
  await prisma.$runCommandRaw({
    delete: FOLLOW_COLLECTION,
    deletes: [{ q: { followerId: oid(followerId), followingId: oid(followingId) }, limit: 1 }],
  });
}

export async function countFollowers(prisma: PrismaClient, userId: string) {
  return countFollowRecords(prisma, { followingId: oid(userId) });
}

export async function countFollowing(prisma: PrismaClient, userId: string) {
  return countFollowRecords(prisma, { followerId: oid(userId) });
}

export async function listFollowingIds(prisma: PrismaClient, userId: string) {
  const items = await findFollowRecords(prisma, { followerId: oid(userId) }, 0, 500);
  return items
    .map((item) => readOid(item.followingId))
    .filter((value): value is string => !!value);
}

export async function paginatedFollowerIds(prisma: PrismaClient, userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    findFollowRecords(prisma, { followingId: oid(userId) }, skip, limit),
    countFollowers(prisma, userId),
  ]);

  return {
    ids: items
      .map((item) => readOid(item.followerId))
      .filter((value): value is string => !!value),
    total,
    pages: Math.ceil(total / limit),
  };
}

export async function paginatedFollowingIds(prisma: PrismaClient, userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    findFollowRecords(prisma, { followerId: oid(userId) }, skip, limit),
    countFollowing(prisma, userId),
  ]);

  return {
    ids: items
      .map((item) => readOid(item.followingId))
      .filter((value): value is string => !!value),
    total,
    pages: Math.ceil(total / limit),
  };
}
