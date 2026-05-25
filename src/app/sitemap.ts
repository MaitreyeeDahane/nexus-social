import { MetadataRoute } from "next"
import { prisma } from "@/lib/db"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nexus.social"

  const communities = await prisma.community.findMany({
    where: { deletedAt: null, isPrivate: false },
    select: { slug: true, updatedAt: true },
    take: 1000,
  })

  const posts = await prisma.post.findMany({
    where: { isDeleted: false, isDraft: false },
    select: { id: true, communityId: true, updatedAt: true, community: { select: { slug: true } } },
    orderBy: { updatedAt: "desc" },
    take: 5000,
  })

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "always", priority: 1 },
    { url: `${baseUrl}/communities`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/popular`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ]

  const communityRoutes: MetadataRoute.Sitemap = communities.map(c => ({
    url: `${baseUrl}/r/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }))

  const postRoutes: MetadataRoute.Sitemap = posts.map(p => ({
    url: `${baseUrl}/r/${p.community.slug}/comments/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...communityRoutes, ...postRoutes]
}
