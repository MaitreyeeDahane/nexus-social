import { PrismaClient, PostType, VoteType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create achievements
  const achievements = await Promise.all([
    prisma.achievement.upsert({
      where: { name: "First Post" },
      update: {},
      create: {
        name: "First Post",
        description: "Created your first post",
        icon: "📝",
        type: "POST",
        threshold: 1,
        points: 10,
      },
    }),
    prisma.achievement.upsert({
      where: { name: "Popular Post" },
      update: {},
      create: {
        name: "Popular Post",
        description: "Got 100 upvotes on a single post",
        icon: "🔥",
        type: "VOTES",
        threshold: 100,
        points: 50,
      },
    }),
    prisma.achievement.upsert({
      where: { name: "Community Builder" },
      update: {},
      create: {
        name: "Community Builder",
        description: "Created your first community",
        icon: "🏗️",
        type: "COMMUNITY",
        threshold: 1,
        points: 25,
      },
    }),
    prisma.achievement.upsert({
      where: { name: "Karma King" },
      update: {},
      create: {
        name: "Karma King",
        description: "Reached 1000 karma points",
        icon: "👑",
        type: "KARMA",
        threshold: 1000,
        points: 100,
      },
    }),
    prisma.achievement.upsert({
      where: { name: "Conversationalist" },
      update: {},
      create: {
        name: "Conversationalist",
        description: "Posted 50 comments",
        icon: "💬",
        type: "COMMENT",
        threshold: 50,
        points: 30,
      },
    }),
  ]);

  // Create demo users
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@nexus.social" },
    update: {},
    create: {
      email: "admin@nexus.social",
      name: "Nexus Admin",
      username: "nexus_admin",
      role: "ADMIN",
      karma: 9999,
      isVerified: true,
      bio: "The official Nexus Social admin account",
    },
  });

  const demoUser1 = await prisma.user.upsert({
    where: { email: "alice@demo.com" },
    update: {},
    create: {
      email: "alice@demo.com",
      name: "Alice Chen",
      username: "alice_chen",
      karma: 1250,
      bio: "Full-stack developer | Open source enthusiast | Coffee addict ☕",
    },
  });

  const demoUser2 = await prisma.user.upsert({
    where: { email: "bob@demo.com" },
    update: {},
    create: {
      email: "bob@demo.com",
      name: "Bob Martinez",
      username: "bob_dev",
      karma: 876,
      bio: "Backend engineer | Rust & Go | Building things that scale",
    },
  });

  // Create communities
  const techCommunity = await prisma.community.upsert({
    where: { slug: "programming" },
    update: {},
    create: {
      name: "programming",
      slug: "programming",
      description: "The heart of the developer community on Nexus",
      longDescription:
        "A place for all things programming: tutorials, discussions, job postings, and more. Whether you're a beginner or a seasoned pro, you're welcome here.",
      creatorId: adminUser.id,
      memberCount: 0,
      isNSFW: false,
      rules: {
        create: [
          {
            title: "Be respectful",
            description: "Treat everyone with respect. No harassment.",
            order: 0,
          },
          {
            title: "Stay on topic",
            description: "Posts must be related to programming.",
            order: 1,
          },
          {
            title: "No spam",
            description: "No promotional content without community approval.",
            order: 2,
          },
        ],
      },
    },
  });

  const webdevCommunity = await prisma.community.upsert({
    where: { slug: "webdev" },
    update: {},
    create: {
      name: "webdev",
      slug: "webdev",
      description: "Web development discussions, projects, and resources",
      creatorId: adminUser.id,
      memberCount: 0,
      rules: {
        create: [
          {
            title: "Show your work",
            description: "Share your projects and get feedback!",
            order: 0,
          },
        ],
      },
    },
  });

  const aiCommunity = await prisma.community.upsert({
    where: { slug: "artificial" },
    update: {},
    create: {
      name: "artificial",
      slug: "artificial",
      description: "Artificial Intelligence news, research, and discussion",
      creatorId: adminUser.id,
      memberCount: 0,
    },
  });

  // Add members
  await prisma.communityMember.createMany({
    skipDuplicates: true,
    data: [
      { userId: adminUser.id, communityId: techCommunity.id },
      { userId: demoUser1.id, communityId: techCommunity.id },
      { userId: demoUser2.id, communityId: techCommunity.id },
      { userId: demoUser1.id, communityId: webdevCommunity.id },
      { userId: adminUser.id, communityId: aiCommunity.id },
      { userId: demoUser1.id, communityId: aiCommunity.id },
    ],
  });

  // Update member counts
  await prisma.community.update({
    where: { id: techCommunity.id },
    data: { memberCount: 3 },
  });
  await prisma.community.update({
    where: { id: webdevCommunity.id },
    data: { memberCount: 1 },
  });
  await prisma.community.update({
    where: { id: aiCommunity.id },
    data: { memberCount: 2 },
  });

  // Create flairs
  await prisma.postFlair.createMany({
    skipDuplicates: true,
    data: [
      { communityId: techCommunity.id, name: "Discussion", color: "#6366f1", textColor: "#fff" },
      { communityId: techCommunity.id, name: "Help", color: "#f59e0b", textColor: "#fff" },
      { communityId: techCommunity.id, name: "Tutorial", color: "#10b981", textColor: "#fff" },
      { communityId: techCommunity.id, name: "News", color: "#3b82f6", textColor: "#fff" },
      { communityId: webdevCommunity.id, name: "Showcase", color: "#8b5cf6", textColor: "#fff" },
      { communityId: webdevCommunity.id, name: "Question", color: "#ef4444", textColor: "#fff" },
    ],
  });

  // Create demo posts
  const post1 = await prisma.post.create({
    data: {
      title: "Welcome to Nexus Social – A modern Reddit-style platform built with Next.js 15",
      content: `## Welcome to Nexus! 🎉

This is a production-grade social platform built with the latest web technologies. Here's what makes Nexus special:

### Tech Stack
- **Next.js 15** with App Router for lightning-fast performance
- **PostgreSQL** with Prisma ORM for robust data management  
- **NextAuth v5** for secure authentication with OAuth support
- **TanStack Query** for intelligent caching and synchronization
- **Zustand** for lightweight state management

### Features
- 🏘️ **Communities** – Create and join topic-specific communities
- 📝 **Rich Posts** – Text, images, links, and polls
- 🗳️ **Smart Voting** – Upvote/downvote with optimistic updates
- 💬 **Nested Comments** – Threaded discussions with infinite nesting
- 🔔 **Notifications** – Real-time activity alerts
- 📊 **Analytics** – Community and post performance metrics
- 🛡️ **Moderation** – Full mod tools and reporting system

Feel free to explore and enjoy the platform!`,
      type: PostType.TEXT,
      authorId: adminUser.id,
      communityId: techCommunity.id,
      score: 542,
      upvotes: 567,
      downvotes: 25,
      commentCount: 3,
      isPinned: true,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: "I built a full-stack app in 48 hours using Next.js 15 + Supabase – Here's what I learned",
      content: `## The Challenge

I gave myself 48 hours to build a production-ready web app from scratch. No templates, no boilerplate beyond \`create-next-app\`.

### What I Built
A collaborative task management tool with real-time updates, authentication, and a clean UI.

### Key Learnings

**1. Next.js 15 Server Actions are incredible**
Instead of building separate API routes for every mutation, Server Actions let you call server-side functions directly from client components. The DX is phenomenal.

**2. Supabase real-time subscriptions are magic**
Setting up WebSocket-based real-time updates used to require significant backend infrastructure. With Supabase, it's just a few lines.

**3. Prisma + PostgreSQL remains the gold standard**
After trying Drizzle and other ORMs, I keep coming back to Prisma. The type safety and migration story are unmatched.

### Performance Results
- Lighthouse score: 98/100
- First Contentful Paint: 0.8s
- Time to Interactive: 1.2s

Would love to hear what stack you're using for rapid development!`,
      type: PostType.TEXT,
      authorId: demoUser1.id,
      communityId: techCommunity.id,
      score: 234,
      upvotes: 251,
      downvotes: 17,
      commentCount: 2,
    },
  });

  const post3 = await prisma.post.create({
    data: {
      title: "The State of CSS in 2025 – What every frontend dev needs to know",
      url: "https://css-tricks.com/state-of-css-2025",
      content: "CSS has evolved dramatically. From Container Queries to @layer, the language is more powerful than ever. This article breaks down everything you need to know as a modern frontend developer.",
      type: PostType.LINK,
      authorId: demoUser2.id,
      communityId: webdevCommunity.id,
      score: 189,
      upvotes: 201,
      downvotes: 12,
      commentCount: 1,
    },
  });

  // Create votes
  await prisma.vote.createMany({
    skipDuplicates: true,
    data: [
      { userId: demoUser1.id, postId: post1.id, type: VoteType.UP },
      { userId: demoUser2.id, postId: post1.id, type: VoteType.UP },
      { userId: adminUser.id, postId: post2.id, type: VoteType.UP },
      { userId: demoUser2.id, postId: post2.id, type: VoteType.UP },
      { userId: adminUser.id, postId: post3.id, type: VoteType.UP },
    ],
  });

  // Create comments
  const comment1 = await prisma.comment.create({
    data: {
      content: "This platform looks incredible! Love the tech stack choices, especially TanStack Query for data fetching. The developer experience with these tools is 10/10.",
      authorId: demoUser1.id,
      postId: post1.id,
      score: 45,
      upvotes: 47,
      downvotes: 2,
    },
  });

  await prisma.comment.create({
    data: {
      content: "Agreed! The combination of Next.js App Router + Server Actions + Prisma is my go-to stack now. Excited to see this community grow.",
      authorId: demoUser2.id,
      postId: post1.id,
      parentId: comment1.id,
      depth: 1,
      score: 23,
      upvotes: 24,
      downvotes: 1,
    },
  });

  await prisma.comment.create({
    data: {
      content: "What an inspiring project! Server Actions changing the game indeed. I recently migrated a project from tRPC to Server Actions and the simplicity is remarkable.",
      authorId: adminUser.id,
      postId: post2.id,
      score: 31,
      upvotes: 33,
      downvotes: 2,
    },
  });

  // Follow relationships
  await prisma.follow.createMany({
    skipDuplicates: true,
    data: [
      { followerId: demoUser1.id, followingId: adminUser.id },
      { followerId: demoUser2.id, followingId: demoUser1.id },
      { followerId: adminUser.id, followingId: demoUser1.id },
    ],
  });

  // Create notifications
  await prisma.notification.createMany({
    data: [
      {
        type: "COMMENT",
        recipientId: adminUser.id,
        senderId: demoUser1.id,
        postId: post1.id,
        commentId: comment1.id,
        message: "alice_chen commented on your post",
      },
      {
        type: "VOTE",
        recipientId: demoUser1.id,
        senderId: adminUser.id,
        postId: post2.id,
        message: "nexus_admin upvoted your post",
      },
      {
        type: "FOLLOW",
        recipientId: adminUser.id,
        senderId: demoUser1.id,
        message: "alice_chen started following you",
      },
    ],
  });

  // Assign achievements
  await prisma.userAchievement.createMany({
    skipDuplicates: true,
    data: [
      { userId: adminUser.id, achievementId: achievements[0].id },
      { userId: adminUser.id, achievementId: achievements[2].id },
      { userId: adminUser.id, achievementId: achievements[3].id },
      { userId: demoUser1.id, achievementId: achievements[0].id },
      { userId: demoUser2.id, achievementId: achievements[0].id },
    ],
  });

  console.log("✅ Database seeded successfully!");
  console.log(`
  📊 Seed Summary:
  - Users: 3 (admin, alice, bob)
  - Communities: 3 (programming, webdev, artificial)
  - Posts: 3
  - Comments: 3
  - Achievements: 5
  `);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
