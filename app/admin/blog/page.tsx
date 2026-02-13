"use client";

import React from "react";

function Badge({ published }: { published: boolean }) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border";
  if (published) return <span className={`${base} border-emerald-200 bg-emerald-50 text-emerald-700`}>PUBLISHED</span>;
  return <span className={`${base} border-amber-200 bg-amber-50 text-amber-700`}>DRAFT</span>;
}

export default function AdminBlogPage() {
  const [secret, setSecret] = React.useState("");
  const [posts, setPosts] = React.useState<any[]>([]);
  const [msg, setMsg] = React.useState("");

  async function load() {
    setMsg("Cargando posts...");
    const res = await fetch("/api/admin/posts", {
      headers: { "x-admin-secret": secret },
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg("❌ " + (data?.error ?? "Error"));
      return;
    }

    setPosts(Array.isArray(data.posts) ? data.posts : []);
    setMsg("");
  }

  async function togglePublish(id: string, next: boolean) {
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

    setMsg("✅ Guardado");
    await load();
    setTimeout(() => setMsg(""), 1200);
  }

  async function remove(id: string) {
    if (!confirm("Delete this post?")) return;

    setMsg("Eliminando...");
    const res = await fetch(`/api/admin/posts/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "x-admin-secret": secret },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg("❌ " + (data?.error ?? "Error"));
      return;
    }

    setMsg("✅ Eliminado");
    await load();
    setTimeout(() => setMsg(""), 1200);
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] text-gray-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">📝 Admin Blog</h1>
          <div className="flex items-center gap-2">
            <a
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
              href="/admin/orders"
            >
              Orders
            </a>
            <a
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
              href="/"
            >
              ← Volver
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
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
              Cargar
            </button>
            <a
              className="rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-semibold hover:bg-gray-50"
              href="/admin/blog/new"
            >
              + New post
            </a>
          </div>

          {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}
        </div>

        <div className="mt-6 space-y-3">
          {posts.map((p) => (
            <div key={p.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    <span className="text-lg">{p.title}</span>
                    <Badge published={!!p.published} />
                  </div>

                  <div className="mt-1 text-sm text-gray-600">
                    Slug: <span className="font-mono text-gray-900">{p.slug}</span>
                  </div>

                  {p.updatedAt && (
                    <div className="mt-1 text-xs text-gray-500">
                      Updated: {new Date(p.updatedAt).toLocaleString()}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <a
                      className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                      href={`/admin/blog/${p.id}?secret=${encodeURIComponent(secret)}`}
                    >
                      Edit
                    </a>
                    <a
                      className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                      href={`/blog/${p.slug}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View
                    </a>
                  </div>
                </div>

                <div className="flex flex-col gap-2 items-end">
                  <button
                    type="button"
                    onClick={() => togglePublish(p.id, !p.published)}
                    className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-gray-900"
                  >
                    {p.published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    className="rounded-full border border-red-200 bg-white px-5 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {p.excerpt ? <p className="mt-4 text-sm text-gray-700">{p.excerpt}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
