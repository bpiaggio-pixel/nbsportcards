"use client";

import React from "react";

function slugify(s: string) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function AdminNewPostPage() {
  const [secret, setSecret] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [excerpt, setExcerpt] = React.useState("");
  const [coverImage, setCoverImage] = React.useState("");
  const [contentHtml, setContentHtml] = React.useState("");
  const [msg, setMsg] = React.useState("");

  React.useEffect(() => {
    if (!slug.trim() && title.trim()) setSlug(slugify(title));
  }, [title]); // intencional: solo auto-sugiere si slug está vacío

  async function create() {
    setMsg("Creando...");
    const res = await fetch("/api/admin/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": secret,
      },
      body: JSON.stringify({ title, slug, excerpt, coverImage, contentHtml }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg("❌ " + (data?.error ?? "Error"));
      return;
    }

    setMsg("✅ Creado!");
    const id = String(data?.id ?? "");
    if (id) window.location.href = `/admin/blog/${encodeURIComponent(id)}?secret=${encodeURIComponent(secret)}`;
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] text-gray-900">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">✍️ New Post</h1>
          <a
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            href="/admin/blog"
          >
            ← Back
          </a>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <div className="text-sm font-semibold mb-2">Clave admin</div>
            <input
              className="w-full border p-3 rounded"
              placeholder="ADMIN_SECRET"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              type="password"
            />
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">Title</div>
            <input className="w-full border p-3 rounded" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">Slug</div>
            <input className="w-full border p-3 rounded" value={slug} onChange={(e) => setSlug(e.target.value)} />
            <div className="mt-1 text-xs text-gray-500">Example: my-first-post</div>
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">Excerpt (optional)</div>
            <textarea className="w-full border p-3 rounded" rows={3} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">Cover image URL (optional)</div>
            <input className="w-full border p-3 rounded" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} />
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">Content HTML</div>
            <textarea
              className="w-full border p-3 rounded font-mono text-sm"
              rows={14}
              value={contentHtml}
              onChange={(e) => setContentHtml(e.target.value)}
              placeholder="<p>Hello world</p>"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-900"
              onClick={create}
              type="button"
            >
              Create
            </button>
          </div>

          {msg && <div className="text-sm text-gray-700">{msg}</div>}
        </div>
      </div>
    </div>
  );
}
