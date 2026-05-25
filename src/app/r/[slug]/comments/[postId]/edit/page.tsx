import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { EditPostForm } from "@/components/posts/edit-post-form"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ slug: string; postId: string }>
}

export const metadata: Metadata = { title: "Edit Post" }

export default async function EditPostPage({ params }: PageProps) {
  const { slug, postId } = await params
  const session = await auth()
  if (!session) redirect(`/login?callbackUrl=/r/${slug}/comments/${postId}/edit`)

  const post = await prisma.post.findUnique({
    where: { id: postId, isDeleted: false },
    include: { flair: true, community: { select: { id: true, slug: true, name: true, flairs: true } } },
  })

  if (!post) notFound()
  if (post.authorId !== session.user.id && session.user.role === "USER") redirect(`/r/${slug}/comments/${postId}`)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Post</h1>
        <p className="text-muted-foreground text-sm mt-1">r/{post.community.name}</p>
      </div>
      <EditPostForm post={post} communitySlug={slug} />
    </div>
  )
}
