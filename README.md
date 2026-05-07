# Pixora

Pixora is a collaborative canvas and diagram editor for creating, saving, sharing, and discussing visual work.

It combines:

- A Fabric.js-based editor (shapes, text, drawing, image tools, import/export)
- A social layer (gallery, likes, threaded comments, profiles, following)
- Ownership workflows (publish/private, revision history, owner actions across views)

The app is split into a React frontend and an Express + tRPC API, with Prisma connected to MongoDB.

## Feature Overview

### Editor and canvas workflows

- Shapes, text styling, free drawing, image upload, background removal
- Save canvas privately or publish publicly
- Autosave for existing canvases
- Revision history with restore
- Export and JSON import/export

### Social and discovery

- Public gallery with search, sorting, and pagination
- Feed of your own public canvases + creators you follow
- Likes, comments, replies, and likes modal
- Creator directory and top creators leaderboard
- Public profile pages with followers/following

### Ownership and permissions

- Owner actions available beyond My Canvases:
	- Post page (`/p/:id`)
	- Feed cards (for owned canvases)
	- Gallery cards (for owned canvases)
- Owner actions include:
	- Edit
	- Publish / Make private
	- History
	- Delete
- Non-owners use "Try this" / copy workflow
- Private sharing with specific users

### Data freshness and cache consistency

Client cache invalidation is wired so UI updates immediately after mutations.
Examples:

- Follow/unfollow refreshes relevant profile + feed data
- Publish/private/delete refreshes list/detail/profile aggregate surfaces
- Social actions refresh counts shown in detail/list/profile cards
- Restore revision refreshes history + related list/detail views

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Mantine
- Canvas: Fabric.js
- API + data fetching: tRPC + React Query
- Backend: Express + tRPC
- Database: Prisma + MongoDB
- Auth: Passport.js (GitHub + Google OAuth)

## Project Structure

```text
.
├── src/               Frontend application
├── server/            Express server, tRPC routers, auth, Prisma helpers
├── prisma/            Prisma schema and seed script
├── public/            Static assets
└── README.md
```

## Requirements

- Node.js 18+
- MongoDB database
- GitHub OAuth credentials
- Google OAuth credentials

Optional:

- ImgBB API key (image uploads / thumbnail hosting)
- Remove.bg API key (background removal)

## Environment Variables

Create `.env` in project root:

```env
DATABASE_URL=mongodb+srv://...
PORT=3001
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:3001
VITE_API_URL=http://localhost:3001
JWT_SECRET=replace-this-in-production

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

VITE_IMGBB_API_KEY=...
VITE_APP_BG_KEY=...
```

Notes:

- `FRONTEND_URL` is used by API CORS and OAuth redirects.
- `API_URL` is used to build OAuth callback URLs.
- `VITE_API_URL` is the frontend's API base URL (set this to your Render backend URL in Vercel).
- `VITE_IMGBB_API_KEY` is used by the frontend for image upload.
- `VITE_APP_BG_KEY` is used by the remove-background feature.

## Install

```bash
npm install
npx prisma generate
```

## Run Locally

Run frontend + backend together:

```bash
npm run dev:all
```

Or separately:

```bash
npm run dev
npm run dev:server
```

Default local URLs:

- Frontend: http://localhost:5173
- API: http://localhost:3001

The Vite dev server proxies `/api` to the backend.

## Seed Data

```bash
npm run db:seed
```

Warning:

- Seed clears users, canvases, likes, comments, shares, and revisions before reseeding.

## Scripts

```bash
npm run dev         # frontend
npm run dev:server  # backend
npm run dev:all     # both
npm run build       # production build
npm run preview     # preview build
npm run lint        # eslint
npm run db:seed     # reseed db
```

## Authentication Notes

- OAuth providers: GitHub, Google
- Successful OAuth creates signed auth cookie
- New OAuth users get an auto-generated username if needed
- Existing account can be linked by matching OAuth email

## Deployment Checklist

- Set strong `JWT_SECRET`
- Set production `FRONTEND_URL` and `API_URL`
- Configure provider callback URLs for production domain
- Verify secure cookie and CORS configuration

## Development Notes

- Canvas data is stored as serialized Fabric.js JSON
- Public canvases may include hosted thumbnails
- MongoDB provider means Prisma SQL migration flow is not used here

## Status

Pixora is an actively developed product codebase focused on a usable collaborative editor + social experience, not a minimal starter template.
