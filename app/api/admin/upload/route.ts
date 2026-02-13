import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

function isAuthorized(req: Request) {
  const secret = req.headers.get("x-admin-secret") || "";
  return secret && secret === process.env.ADMIN_SECRET;
}

export const runtime = "nodejs";

const MAX_MB = 8;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function POST(req: Request) {
  try {
    if (!process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Missing ADMIN_SECRET in env" }, { status: 500 });
    }

    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buf = Buffer.from(bytes);

    if (buf.byteLength > MAX_MB * 1024 * 1024) {
      return NextResponse.json({ error: `File too large (max ${MAX_MB}MB)` }, { status: 400 });
    }

    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
        ? "gif"
        : "jpg";

    const safeBase =
      String(file.name || "image")
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .slice(0, 40) || "image";

    const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}-${safeBase}.${ext}`;

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    await writeFile(path.join(uploadsDir, filename), buf);

    return NextResponse.json({ ok: true, url: `/uploads/${filename}` });
  } catch (e: any) {
    console.error("ADMIN UPLOAD ERROR:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
