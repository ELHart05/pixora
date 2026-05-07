import { PrismaClient } from '@prisma/client';
import { followUser } from '../server/lib/follows.js';

const prisma = new PrismaClient();

// Simple flowchart canvas JSON — a process diagram with shapes and connectors
const CANVAS_TEMPLATES = [
  {
    title: 'User Login Flow',
    description: 'A simple authentication flowchart showing login, validation, and redirect steps.',
    data: JSON.stringify({
      version: '5.3.0',
      objects: [
        { type: 'rect', left: 100, top: 50, width: 120, height: 50, rx: 6, fill: 'rgba(99,102,241,0.1)', stroke: '#6366f1', strokeWidth: 2 },
        { type: 'text', left: 120, top: 65, text: 'Start', fontSize: 14, fill: '#818cf8', fontFamily: 'Inter' },
        { type: 'line', x1: 160, y1: 100, x2: 160, y2: 150, stroke: '#818cf8', strokeWidth: 2 },
        { type: 'rect', left: 80, top: 150, width: 160, height: 50, rx: 6, fill: 'rgba(167,139,250,0.1)', stroke: '#a78bfa', strokeWidth: 2 },
        { type: 'text', left: 100, top: 165, text: 'Enter Creds', fontSize: 14, fill: '#a78bfa', fontFamily: 'Inter' },
        { type: 'line', x1: 160, y1: 200, x2: 160, y2: 260, stroke: '#c084fc', strokeWidth: 2 },
        { type: 'circle', left: 130, top: 260, radius: 30, fill: 'rgba(196,132,252,0.1)', stroke: '#c084fc', strokeWidth: 2 },
        { type: 'text', left: 140, top: 280, text: 'Valid?', fontSize: 12, fill: '#c084fc', fontFamily: 'Inter' },
        { type: 'line', x1: 190, y1: 290, x2: 250, y2: 275, stroke: '#f87171', strokeWidth: 2 },
        { type: 'rect', left: 250, top: 250, width: 120, height: 50, rx: 6, fill: 'rgba(248,113,113,0.1)', stroke: '#f87171', strokeWidth: 2 },
        { type: 'text', left: 275, top: 265, text: 'Error', fontSize: 14, fill: '#f87171', fontFamily: 'Inter' },
        { type: 'line', x1: 160, y1: 320, x2: 160, y2: 350, stroke: '#34d399', strokeWidth: 2 },
        { type: 'rect', left: 80, top: 350, width: 160, height: 50, rx: 25, fill: 'rgba(52,211,153,0.1)', stroke: '#34d399', strokeWidth: 2 },
        { type: 'text', left: 110, top: 365, text: 'Dashboard', fontSize: 14, fill: '#34d399', fontFamily: 'Inter' },
      ],
      background: '#1e2128',
    }),
    isPublic: true,
  },
  {
    title: 'E-Commerce Checkout',
    description: 'Checkout process with cart review, payment, and order confirmation.',
    data: JSON.stringify({
      version: '5.3.0',
      objects: [
        { type: 'rect', left: 50, top: 40, width: 140, height: 55, rx: 8, fill: 'rgba(99,102,241,0.12)', stroke: '#6366f1', strokeWidth: 2 },
        { type: 'text', left: 75, top: 57, text: 'View Cart', fontSize: 14, fill: '#818cf8', fontFamily: 'Inter' },
        { type: 'line', x1: 120, y1: 95, x2: 120, y2: 140, stroke: '#a78bfa', strokeWidth: 2 },
        { type: 'rect', left: 50, top: 140, width: 140, height: 55, rx: 8, fill: 'rgba(167,139,250,0.12)', stroke: '#a78bfa', strokeWidth: 2 },
        { type: 'text', left: 65, top: 157, text: 'Add Address', fontSize: 14, fill: '#a78bfa', fontFamily: 'Inter' },
        { type: 'line', x1: 120, y1: 195, x2: 120, y2: 240, stroke: '#f472b6', strokeWidth: 2 },
        { type: 'rect', left: 50, top: 240, width: 140, height: 55, rx: 8, fill: 'rgba(244,114,182,0.12)', stroke: '#f472b6', strokeWidth: 2 },
        { type: 'text', left: 70, top: 257, text: 'Payment', fontSize: 14, fill: '#f472b6', fontFamily: 'Inter' },
        { type: 'line', x1: 120, y1: 295, x2: 120, y2: 340, stroke: '#34d399', strokeWidth: 2 },
        { type: 'rect', left: 50, top: 340, width: 140, height: 55, rx: 27, fill: 'rgba(52,211,153,0.12)', stroke: '#34d399', strokeWidth: 2 },
        { type: 'text', left: 70, top: 357, text: 'Confirmed ✓', fontSize: 14, fill: '#34d399', fontFamily: 'Inter' },
      ],
      background: '#1e2128',
    }),
    isPublic: true,
  },
  {
    title: 'API Request Lifecycle',
    description: 'Shows the complete lifecycle of a REST API request from client to server and back.',
    data: JSON.stringify({
      version: '5.3.0',
      objects: [
        { type: 'rect', left: 40, top: 60, width: 100, height: 50, rx: 6, fill: 'rgba(56,189,248,0.12)', stroke: '#38bdf8', strokeWidth: 2 },
        { type: 'text', left: 60, top: 75, text: 'Client', fontSize: 14, fill: '#38bdf8', fontFamily: 'Inter' },
        { type: 'line', x1: 140, y1: 85, x2: 200, y2: 85, stroke: '#6366f1', strokeWidth: 2 },
        { type: 'rect', left: 200, top: 60, width: 100, height: 50, rx: 6, fill: 'rgba(99,102,241,0.12)', stroke: '#6366f1', strokeWidth: 2 },
        { type: 'text', left: 215, top: 75, text: 'Gateway', fontSize: 14, fill: '#818cf8', fontFamily: 'Inter' },
        { type: 'line', x1: 300, y1: 85, x2: 360, y2: 85, stroke: '#a78bfa', strokeWidth: 2 },
        { type: 'rect', left: 360, top: 60, width: 100, height: 50, rx: 6, fill: 'rgba(167,139,250,0.12)', stroke: '#a78bfa', strokeWidth: 2 },
        { type: 'text', left: 380, top: 75, text: 'Server', fontSize: 14, fill: '#a78bfa', fontFamily: 'Inter' },
        { type: 'line', x1: 410, y1: 110, x2: 410, y2: 160, stroke: '#f472b6', strokeWidth: 2 },
        { type: 'rect', left: 360, top: 160, width: 100, height: 50, rx: 6, fill: 'rgba(244,114,182,0.12)', stroke: '#f472b6', strokeWidth: 2 },
        { type: 'text', left: 395, top: 175, text: 'DB', fontSize: 14, fill: '#f472b6', fontFamily: 'Inter' },
      ],
      background: '#1e2128',
    }),
    isPublic: true,
  },
  {
    title: 'CI/CD Pipeline',
    description: 'Continuous integration pipeline from commit to production deployment.',
    data: JSON.stringify({
      version: '5.3.0',
      objects: [
        { type: 'rect', left: 30, top: 80, width: 90, height: 45, rx: 6, fill: 'rgba(99,102,241,0.1)', stroke: '#6366f1', strokeWidth: 2 },
        { type: 'text', left: 42, top: 93, text: 'Commit', fontSize: 12, fill: '#818cf8', fontFamily: 'Inter' },
        { type: 'line', x1: 120, y1: 102, x2: 150, y2: 102, stroke: '#fbbf24', strokeWidth: 2 },
        { type: 'rect', left: 150, top: 80, width: 90, height: 45, rx: 6, fill: 'rgba(251,191,36,0.1)', stroke: '#fbbf24', strokeWidth: 2 },
        { type: 'text', left: 170, top: 93, text: 'Build', fontSize: 12, fill: '#fbbf24', fontFamily: 'Inter' },
        { type: 'line', x1: 240, y1: 102, x2: 270, y2: 102, stroke: '#38bdf8', strokeWidth: 2 },
        { type: 'rect', left: 270, top: 80, width: 90, height: 45, rx: 6, fill: 'rgba(56,189,248,0.1)', stroke: '#38bdf8', strokeWidth: 2 },
        { type: 'text', left: 293, top: 93, text: 'Test', fontSize: 12, fill: '#38bdf8', fontFamily: 'Inter' },
        { type: 'line', x1: 360, y1: 102, x2: 390, y2: 102, stroke: '#34d399', strokeWidth: 2 },
        { type: 'rect', left: 390, top: 80, width: 90, height: 45, rx: 22, fill: 'rgba(52,211,153,0.1)', stroke: '#34d399', strokeWidth: 2 },
        { type: 'text', left: 403, top: 93, text: 'Deploy', fontSize: 12, fill: '#34d399', fontFamily: 'Inter' },
      ],
      background: '#1e2128',
    }),
    isPublic: true,
  },
  {
    title: 'Database Schema',
    description: 'Simple entity-relationship diagram with users, posts, and comments.',
    data: JSON.stringify({
      version: '5.3.0',
      objects: [
        { type: 'rect', left: 40, top: 40, width: 130, height: 100, rx: 8, fill: 'rgba(99,102,241,0.1)', stroke: '#6366f1', strokeWidth: 2 },
        { type: 'text', left: 70, top: 50, text: 'Users', fontSize: 14, fill: '#818cf8', fontFamily: 'Inter', fontWeight: 'bold' },
        { type: 'text', left: 55, top: 75, text: 'id, name,\nemail, avatar', fontSize: 11, fill: '#818cf8', fontFamily: 'Inter' },
        { type: 'line', x1: 170, y1: 90, x2: 230, y2: 90, stroke: '#a78bfa', strokeWidth: 2 },
        { type: 'rect', left: 230, top: 40, width: 130, height: 100, rx: 8, fill: 'rgba(167,139,250,0.1)', stroke: '#a78bfa', strokeWidth: 2 },
        { type: 'text', left: 265, top: 50, text: 'Posts', fontSize: 14, fill: '#a78bfa', fontFamily: 'Inter', fontWeight: 'bold' },
        { type: 'text', left: 245, top: 75, text: 'id, title,\nbody, userId', fontSize: 11, fill: '#a78bfa', fontFamily: 'Inter' },
        { type: 'line', x1: 295, y1: 140, x2: 295, y2: 190, stroke: '#f472b6', strokeWidth: 2 },
        { type: 'rect', left: 230, top: 190, width: 130, height: 100, rx: 8, fill: 'rgba(244,114,182,0.1)', stroke: '#f472b6', strokeWidth: 2 },
        { type: 'text', left: 245, top: 200, text: 'Comments', fontSize: 14, fill: '#f472b6', fontFamily: 'Inter', fontWeight: 'bold' },
        { type: 'text', left: 245, top: 225, text: 'id, text,\npostId, userId', fontSize: 11, fill: '#f472b6', fontFamily: 'Inter' },
      ],
      background: '#1e2128',
    }),
    isPublic: true,
  },
];

function esc(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function objectToSvg(obj: any) {
  const fill = esc(obj.fill ?? 'transparent');
  const stroke = esc(obj.stroke ?? 'none');
  const strokeWidth = obj.strokeWidth ?? 0;
  const opacity = obj.opacity ?? 1;
  const common = `fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"`;

  if (obj.type === 'rect') {
    return `<rect x="${obj.left ?? 0}" y="${obj.top ?? 0}" width="${obj.width ?? 0}" height="${obj.height ?? 0}" rx="${obj.rx ?? 0}" ${common}/>`;
  }
  if (obj.type === 'circle') {
    const radius = obj.radius ?? 0;
    return `<circle cx="${(obj.left ?? 0) + radius}" cy="${(obj.top ?? 0) + radius}" r="${radius}" ${common}/>`;
  }
  if (obj.type === 'polygon') {
    const left = obj.left ?? 0;
    const top = obj.top ?? 0;
    const points = (obj.points ?? [])
      .map((p: any) => `${left + (p.x ?? 0)},${top + (p.y ?? 0)}`)
      .join(' ');
    return `<polygon points="${points}" ${common}/>`;
  }
  if (obj.type === 'line') {
    return `<line x1="${obj.x1 ?? 0}" y1="${obj.y1 ?? 0}" x2="${obj.x2 ?? 0}" y2="${obj.y2 ?? 0}" stroke="${stroke}" stroke-width="${strokeWidth || 2}" opacity="${opacity}"/>`;
  }
  if (obj.type === 'path') {
    const d = Array.isArray(obj.path)
      ? obj.path.map((cmd: any[]) => cmd.join(' ')).join(' ')
      : obj.path;
    return `<path d="${esc(d)}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth || 2}" opacity="${opacity}" stroke-linecap="${esc(obj.strokeLineCap ?? 'round')}"/>`;
  }
  if (obj.type === 'text' || obj.type === 'i-text' || obj.type === 'textbox') {
    const lines = String(obj.text ?? '').split('\n');
    const fontSize = obj.fontSize ?? 14;
    return `<text x="${obj.left ?? 0}" y="${(obj.top ?? 0) + fontSize}" fill="${esc(obj.fill ?? '#fff')}" font-size="${fontSize}" font-family="${esc(obj.fontFamily ?? 'Inter, Arial')}" font-weight="${esc(obj.fontWeight ?? 'normal')}">${lines.map((line, idx) => `<tspan x="${obj.left ?? 0}" dy="${idx === 0 ? 0 : fontSize * 1.2}">${esc(line)}</tspan>`).join('')}</text>`;
  }
  return '';
}

function thumbnailFromCanvasData(data: string) {
  const parsed = JSON.parse(data);
  const objects = parsed.objects ?? [];
  const body = objects.map(objectToSvg).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 560 430"><rect width="560" height="430" fill="${esc(parsed.background ?? '#1e2128')}"/><defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.08)"/></pattern></defs><rect width="560" height="430" fill="url(#grid)"/>${body}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// Seed users with distinct names and avatars
const SEED_USERS = [
  { name: 'Alice Chen', username: 'alicechen', email: 'alice@example.com', bio: 'UX designer who thinks in diagrams. Always sketching workflows.', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alice' },
  { name: 'Bob Martinez', username: 'bobmartinez', email: 'bob@example.com', bio: 'Full-stack dev. I use Pixora for architecture diagrams and brainstorming.', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Bob' },
  { name: 'Clara Johansson', username: 'claraj', email: 'clara@example.com', bio: 'Product manager. Visual thinker. Building better user flows.', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Clara' },
  { name: 'David Kimura', username: 'davidk', email: 'david@example.com', bio: 'Backend engineer passionate about clean system design and documentation.', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=David' },
  { name: 'Ella Nguyen', username: 'ellan', email: 'ella@example.com', bio: 'Data scientist turned educator. I draw everything before I code it.', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Ella' },
  { name: 'Frank Osei', username: 'frankosei', email: 'frank@example.com', bio: 'Cloud architect. Diagrams are my second language.', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Frank' },
  { name: 'Grace Liu', username: 'graceliu', email: 'grace@example.com', bio: 'Startup founder. Pixora helps me communicate ideas to my team.', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Grace' },
  { name: 'Hana Benali', username: 'hanabenali', email: 'hana@example.com', bio: 'Design ops lead collecting crisp examples for her team.', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Hana' },
  { name: 'Ibrahim Saleh', username: 'ibrahims', email: 'ibrahim@example.com', bio: 'Student learning systems design one diagram at a time.', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Ibrahim' },
  { name: 'Julia Novak', username: 'julianovak', email: 'julia@example.com', bio: 'QA engineer who comments on every edge case she spots.', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Julia' },
  { name: 'Karim Haddad', username: 'karimh', email: 'karim@example.com', bio: 'Founder browsing the gallery for onboarding ideas.', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Karim' },
  { name: 'Leah Wilson', username: 'leahw', email: 'leah@example.com', bio: 'Community member who likes clear diagrams and helpful notes.', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Leah' },
  { name: 'Maya Rossi', username: 'mayarossi', email: 'maya@example.com', bio: 'Product designer studying how people explain flows visually.', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Maya' },
  { name: 'Noah Singh', username: 'noahsingh', email: 'noah@example.com', bio: 'Developer advocate leaving thoughtful feedback on gallery posts.', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Noah' },
];

async function main() {
  console.log('🌱 Seeding database...\n');

  // Clean existing seed data
  await prisma.canvasRevision.deleteMany({});
  await prisma.canvasShare.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.$runCommandRaw({
    delete: 'Follow',
    deletes: [{ q: {}, limit: 0 }],
  });
  await prisma.canvas.deleteMany({});
  await prisma.user.deleteMany({});

  // Create users
  const users = [];
  for (const u of SEED_USERS) {
    const user = await prisma.user.create({ data: u });
    users.push(user);
    console.log(`  👤 Created user: ${user.name} (@${user.username})`);
  }

  // Create canvases — distribute them across users, giving some users more
  const canvasRecords = [];
  const canvasOwners: number[] = [];
  const assignments = [
    // [userIndex, canvasTemplateIndex]
    [0, 0], [0, 1], [0, 2], // Alice gets 3 canvases
    [1, 3], [1, 4],          // Bob gets 2
    [2, 0], [2, 3],          // Clara gets 2
    [3, 1],                   // David gets 1
    [4, 2], [4, 4], [4, 0],  // Ella gets 3
    [5, 3],                   // Frank gets 1
    [6, 1], [6, 2],          // Grace gets 2
  ];

  for (const [userIdx, templateIdx] of assignments) {
    const user = users[userIdx];
    const template = CANVAS_TEMPLATES[templateIdx];
    const canvas = await prisma.canvas.create({
      data: {
        title: template.title,
        description: template.description,
        data: template.data,
        thumbnail: thumbnailFromCanvasData(template.data),
        isPublic: template.isPublic,
        userId: user.id,
      },
    });
    canvasRecords.push(canvas);
    canvasOwners.push(userIdx);

    // Create initial revision
    await prisma.canvasRevision.create({
      data: {
        canvasId: canvas.id,
        data: template.data,
        note: 'Initial save',
      },
    });
  }
  console.log(`\n  🎨 Created ${canvasRecords.length} canvases\n`);

  const followPairs = [
    [0, 1], [0, 2], [0, 6],
    [1, 0], [1, 4], [1, 6],
    [2, 0], [2, 4], [2, 5],
    [3, 0], [3, 1],
    [4, 0], [4, 6], [4, 5],
    [5, 0], [5, 2], [5, 6],
    [6, 0], [6, 4], [6, 1],
    [7, 0], [7, 6],
    [8, 2], [8, 4],
    [9, 0], [9, 1], [9, 6],
    [10, 4], [10, 5],
    [11, 0], [11, 6],
    [12, 1], [12, 4],
    [13, 0], [13, 2], [13, 6],
  ];
  let followCount = 0;
  for (const [followerIdx, followingIdx] of followPairs) {
    if (followerIdx >= users.length || followingIdx >= users.length || followerIdx === followingIdx) continue;
    try {
      await followUser(prisma, users[followerIdx].id, users[followingIdx].id);
      followCount++;
    } catch {}
  }
  console.log(`  👥 Created ${followCount} follow relationships`);

  // Add likes, including from users who do not have their own canvases
  const manualLikePairs = [
    [1, 0], [2, 0], [3, 0], [4, 0], [5, 0],  // Canvas 0 gets 5 likes
    [0, 3], [2, 3], [4, 3],                    // Canvas 3 gets 3 likes
    [0, 7], [1, 7], [3, 7], [5, 7], [6, 7],   // Canvas 7 gets 5 likes
    [1, 1], [3, 1],                             // Canvas 1 gets 2 likes
    [0, 9], [2, 9], [5, 9],                    // Canvas 9 gets 3 likes
    [4, 5],                                     // Canvas 5 gets 1 like
    [0, 11], [1, 11], [2, 11], [3, 11],        // Canvas 11 gets 4 likes
  ];
  const likePairs = [...manualLikePairs];
  for (let canvasIdx = 0; canvasIdx < canvasRecords.length; canvasIdx++) {
    for (let userIdx = 0; userIdx < users.length; userIdx++) {
      if (canvasOwners[canvasIdx] === userIdx) continue;
      if ((canvasIdx + userIdx) % 4 === 0 || (canvasIdx * (userIdx + 1)) % 9 === 0) {
        likePairs.push([userIdx, canvasIdx]);
      }
    }
  }

  let likeCount = 0;
  const seenLikes = new Set<string>();
  for (const [userIdx, canvasIdx] of likePairs) {
    if (canvasIdx < canvasRecords.length && userIdx < users.length) {
      const key = `${userIdx}:${canvasIdx}`;
      if (seenLikes.has(key)) continue;
      seenLikes.add(key);
      try {
        await prisma.like.create({
          data: {
            userId: users[userIdx].id,
            canvasId: canvasRecords[canvasIdx].id,
          },
        });
        likeCount++;
      } catch {} // skip duplicates
    }
  }
  console.log(`  ❤️  Created ${likeCount} likes`);

  // Add some comments
  const comments = [
    { userIdx: 1, canvasIdx: 0, text: 'Love the clean layout on this flowchart!' },
    { userIdx: 2, canvasIdx: 0, text: 'Great use of color to separate concerns.' },
    { userIdx: 3, canvasIdx: 1, text: 'This is exactly how our checkout works. Nice work!' },
    { userIdx: 0, canvasIdx: 3, text: 'Would be cool to add a rollback step here.' },
    { userIdx: 4, canvasIdx: 7, text: 'Super helpful for onboarding new devs.' },
    { userIdx: 6, canvasIdx: 0, text: 'Bookmarking this for reference.' },
    { userIdx: 5, canvasIdx: 9, text: 'Clean diagram. The color coding is perfect.' },
    { userIdx: 1, canvasIdx: 11, text: 'This is really professional looking!' },
    { userIdx: 7, canvasIdx: 2, text: 'The gateway and server split is really easy to scan.' },
    { userIdx: 8, canvasIdx: 4, text: 'This would make a great teaching example for schema design.' },
    { userIdx: 9, canvasIdx: 6, text: 'Nice pipeline. I would add a manual approval lane before deploy.' },
    { userIdx: 10, canvasIdx: 8, text: 'The request lifecycle here is clear enough for a product review.' },
    { userIdx: 11, canvasIdx: 12, text: 'I like how compact this checkout flow is.' },
    { userIdx: 12, canvasIdx: 10, text: 'Good candidate for the Try this button. I want to remix it.' },
    { userIdx: 13, canvasIdx: 3, text: 'The stage colors make it easy to understand at a glance.' },
    { userIdx: 8, canvasIdx: 0, text: 'The spacing is tidy. Great gallery example.' },
    { userIdx: 10, canvasIdx: 11, text: 'Could use this as a starting point for our release docs.' },
  ];

  let commentCount = 0;
  const commentRecords = [];
  for (const c of comments) {
    if (c.canvasIdx < canvasRecords.length && c.userIdx < users.length) {
      const comment = await prisma.comment.create({
        data: {
          text: c.text,
          userId: users[c.userIdx].id,
          canvasId: canvasRecords[c.canvasIdx].id,
        },
      });
      commentRecords.push(comment);
      commentCount++;
    }
  }

  const replies = [
    { userIdx: 0, parentIdx: 0, text: 'Thank you! I kept the flow intentionally simple so it can be remixed.' },
    { userIdx: 7, parentIdx: 1, text: 'Agree, the color separation makes the error path much clearer.' },
    { userIdx: 2, parentIdx: 3, text: 'Good idea. A rollback lane would fit right under deploy.' },
    { userIdx: 9, parentIdx: 8, text: 'Manual approval before deploy is exactly what I was thinking too.' },
    { userIdx: 5, parentIdx: 12, text: 'Try this works nicely for remixing these examples.' },
    { userIdx: 11, parentIdx: 13, text: 'Yes, the release docs use case is a strong one.' },
    { userIdx: 3, parentIdx: 5, text: 'Same. I want a gallery folder for reference diagrams next.' },
  ];

  for (const reply of replies) {
    const parent = commentRecords[reply.parentIdx];
    if (!parent || reply.userIdx >= users.length) continue;
    await prisma.comment.create({
      data: {
        text: reply.text,
        userId: users[reply.userIdx].id,
        canvasId: parent.canvasId,
        parentId: parent.id,
      },
    });
    commentCount++;
  }
  console.log(`  💬 Created ${commentCount} comments`);

  // Add some shares (private sharing)
  const shares = [
    { ownerIdx: 0, canvasIdx: 0, sharedWithIdx: 1 },
    { ownerIdx: 0, canvasIdx: 0, sharedWithIdx: 2 },
    { ownerIdx: 4, canvasIdx: 9, sharedWithIdx: 0 },
    { ownerIdx: 6, canvasIdx: 12, sharedWithIdx: 3 },
  ];

  let shareCount = 0;
  for (const s of shares) {
    if (s.canvasIdx < canvasRecords.length) {
      try {
        await prisma.canvasShare.create({
          data: {
            canvasId: canvasRecords[s.canvasIdx].id,
            userId: users[s.sharedWithIdx].id,
          },
        });
        shareCount++;
      } catch {} // skip duplicates
    }
  }
  console.log(`  🔗 Created ${shareCount} shares`);

  console.log('\n✅ Seed complete!\n');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
