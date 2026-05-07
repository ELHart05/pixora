import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from './prisma.js';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const DEFAULT_BIOS = [
  'Visual thinker collecting ideas one canvas at a time.',
  'Sketching systems, flows, and half-finished thoughts.',
  'Turning rough ideas into cleaner diagrams.',
  'Usually here mapping product ideas and user journeys.',
  'Building, annotating, and organizing ideas visually.',
  'Quietly making diagrams that explain the hard parts.',
  'Using Pixora to sort out workflows, concepts, and plans.',
  'Documenting ideas with shapes, arrows, and a little patience.',
];

function createDefaultBio(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return DEFAULT_BIOS[hash % DEFAULT_BIOS.length];
}

function cleanUsername(value: string | undefined | null) {
  const base = (value ?? '')
    .toLowerCase()
    .replace(/@.*/, '')
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30);

  if (base.length >= 3) return base;
  return '';
}

async function createUniqueUsername(candidates: Array<string | undefined | null>) {
  const candidate =
    candidates.map(cleanUsername).find(Boolean) ||
    `user_${Math.random().toString(36).slice(2, 10)}`;
  const base = candidate.slice(0, 30);

  for (let attempt = 0; attempt < 100; attempt++) {
    const suffix = attempt === 0 ? '' : String(attempt + 1);
    const username = `${base.slice(0, 30 - suffix.length)}${suffix}`;
    const existing = await prisma.user.findUnique({ where: { username } });
    if (!existing) return username;
  }

  return `${base.slice(0, 21)}_${Date.now().toString(36)}`;
}

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: `${API_URL}/api/auth/github/callback`,
    },
    async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
      try {
        const email: string | undefined = profile.emails?.[0]?.value;
        let user = await prisma.user.findUnique({ where: { githubId: String(profile.id) } });

        if (!user && email) {
          const existing = await prisma.user.findUnique({ where: { email } });
          if (existing) {
            const username = existing.username ?? (await createUniqueUsername([
              profile.username,
              profile.displayName,
              email,
              `github_${profile.id}`,
            ]));
            user = await prisma.user.update({
              where: { id: existing.id },
              data: { githubId: String(profile.id), username },
            });
          }
        }

        if (!user) {
          const username = await createUniqueUsername([
            profile.username,
            profile.displayName,
            email,
            `github_${profile.id}`,
          ]);
          user = await prisma.user.create({
            data: {
              githubId: String(profile.id),
              email,
              name: profile.displayName || profile.username || 'GitHub User',
              username,
              bio: createDefaultBio(email || profile.username || String(profile.id)),
              avatar: profile.photos?.[0]?.value,
            },
          });
        } else {
          const username = user.username ?? (await createUniqueUsername([
            profile.username,
            profile.displayName,
            email,
            `github_${profile.id}`,
          ]));
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              name: profile.displayName || profile.username || user.name,
              username,
              avatar: profile.photos?.[0]?.value ?? user.avatar,
            },
          });
        }

        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${API_URL}/api/auth/google/callback`,
    },
    async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
      try {
        const email: string | undefined = profile.emails?.[0]?.value;
        let user = await prisma.user.findUnique({ where: { googleId: profile.id } });

        if (!user && email) {
          // Link Google to an existing email account (e.g. already signed in via GitHub)
          const existing = await prisma.user.findUnique({ where: { email } });
          if (existing) {
            const username = existing.username ?? (await createUniqueUsername([
              profile.displayName,
              email,
              `google_${profile.id}`,
            ]));
            user = await prisma.user.update({
              where: { id: existing.id },
              data: { googleId: profile.id, username },
            });
          }
        }

        if (!user) {
          const username = await createUniqueUsername([
            profile.displayName,
            email,
            `google_${profile.id}`,
          ]);
          user = await prisma.user.create({
            data: {
              googleId: profile.id,
              email,
              name: profile.displayName || 'Google User',
              username,
              bio: createDefaultBio(email || profile.displayName || String(profile.id)),
              avatar: profile.photos?.[0]?.value,
            },
          });
        } else if (!user.username) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              username: await createUniqueUsername([
                profile.displayName,
                email,
                `google_${profile.id}`,
              ]),
            },
          });
        }

        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);
