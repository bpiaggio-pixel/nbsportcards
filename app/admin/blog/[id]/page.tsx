"use client";

import React from "react";
import { useSearchParams, useParams } from "next/navigation";
import RichEditor from "@/components/RichEditor";

function slugify(text: string) {
  return String(text ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminEditPostPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const initialSecret = searchParams?.get("secret") ?? "";


  const id = String(params?.id ?? "");
  const [secret, setSecret] = React.useState(initialSecret);
  const [msg, setMsg] = React.useState("");
  const [loaded, setLoaded] = React.useState(false);

  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [excerpt, setExcerpt] = React.useState("");
  const [coverImage, setCoverImage] = React.useState("");
  const [contentHtml, setContentHtml] = React.useState("");
  const [published, setPublished] = React.useState(false);

  async function load() {
    setMsg("Cargando...");

    const res = await fetch(`/api/admin/posts/${encodeURIComponent(id)}`, {
      headers: { "x-admin-secret": secret },
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg("❌ " + (data?.error ?? "Error"));
      return;
    }

    const p = data?.post;
    if (!p) {
      setMsg("❌ Post not found");
      return;
    }

    setTitle(p.title ?? "");
    setSlug(p.slug ?? "");
    setExcerpt(p.excerpt ?? "");
    setCoverImage(p.coverImage ?? "");
    setContentHtml(p.contentHtml ?? "");
    setPublished(!!p.published);

    setMsg("");
    setLoaded(true);
  }

  async function save() {
    setMsg("Guardando...");
    const res = await fetch(`/api/admin/posts/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-secret": secret },
      body: JSON.stringify({ title, slug, excerpt, coverImage, contentHtml }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg("❌ " + (data?.error ?? "Error"));
      return;
    }

    setMsg("✅ Guardado");
    setTimeout(() => setMsg(""), 1200);
  }

  async function togglePublish() {
    const next = !published;
    setMsg(next ? "Publicando..." : "Pasando a draft...");
    const res = await fetch(`/api/admin/posts/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-secret": secret },
      body: JSON.stringify({ published: next }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg("❌ " + (data?.error ?? "Error"));
      return;
    }

    setPublished(next);
    setMsg("✅ OK");
    setTimeout(() => setMsg(""), 1200);
  }

  React.useEffect(() => {
    if (initialSecret) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f7f8] text-gray-900">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">🛠️ Edit Post</h1>
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
            <div className="flex gap-2">
              <input
                className="flex-1 border p-3 rounded"
                placeholder="ADMIN_SECRET"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                type="password"
              />
              <button
                className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-900"
                onClick={load}
                type="button"
              >
                Load
              </button>
            </div>
          </div>

          {loaded && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Status:{" "}
                <span className="font-semibold text-gray-900">{published ? "PUBLISHED" : "DRAFT"}</span>
              </div>
              <button
                className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-900"
                onClick={togglePublish}
                type="button"
              >
                {published ? "Unpublish" : "Publish"}
              </button>
            </div>
          )}

          <div>
            <div className="text-sm font-semibold mb-2">Title</div>
            <input
              className="w-full border p-3 rounded"
              value={title}
              onChange={(e) => {
                const t = e.target.value;
                setTitle(t);

                if (!slug.trim()) {
                  setSlug(slugify(t));
                }
              }}
            />
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">Slug</div>
            <input className="w-full border p-3 rounded" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">Excerpt</div>
            <textarea
              className="w-full border p-3 rounded"
              rows={3}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
            />
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">Cover image URL</div>
            <input
              className="w-full border p-3 rounded"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
            />
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">Content</div>

            <RichEditor
              value={contentHtml}
              onChange={(html) => setContentHtml(html)}
              adminSecret={secret}
            />

            <div className="mt-1 text-xs text-gray-500">
              Editor visual activo. El HTML se guarda automáticamente.
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-900"
              onClick={save}
              type="button"
            >
              Save
            </button>

            <a
              className="rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-semibold hover:bg-gray-50"
              href={slug ? `/blog/${slug}` : "#"}
              target="_blank"
              rel="noreferrer"
            >
              View
            </a>
          </div>

          {msg && <div className="text-sm text-gray-700">{msg}</div>}
        </div>
      </div>
    </div>
  );
}
