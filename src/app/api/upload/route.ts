import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { v2 as cloudinary } from "cloudinary"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"]

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const ip = getClientIp(req)
    const rateCheck = checkRateLimit(ip, "upload")
    if (!rateCheck.success) return NextResponse.json({ error: "Upload limit reached" }, { status: 429 })

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const folder = (formData.get("folder") as string) || "posts"

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Invalid file type" }, { status: 400 })

    // Convert to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: `nexus/${folder}`,
      transformation: [
        { quality: "auto", fetch_format: "auto" },
        ...(folder === "avatars" ? [{ width: 256, height: 256, crop: "fill", gravity: "face" }] : []),
        ...(folder === "banners" ? [{ width: 1920, height: 384, crop: "fill" }] : []),
      ],
      resource_type: "image",
    })

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
