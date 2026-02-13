"use client";

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Typography from "@tiptap/extension-typography";
import { marked } from "marked";
import DOMPurify from "dompurify";

export default function RichEditor({
  value,
  onChange,
  adminSecret,
}: {
  value: string;
  onChange: (html: string) => void;
  adminSecret: string;
}) {
  // ✅ evita loops cuando sincronizamos value -> editor
  const lastEmittedRef = React.useRef<string>("");

  const editor = useEditor({
    immediatelyRender: false,

    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
      }),
      Underline,
      Typography,
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
    ],

    content: value,

    onUpdate({ editor }) {
      const html = editor.getHTML();
      lastEmittedRef.current = html;
      onChange(html);
    },

    editorProps: {
      attributes: {
        class:
          "min-h-[260px] outline-none " +
          "text-[15px] leading-7 text-gray-900 " +
          "[&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-6 [&>h2]:mb-3 " +
          "[&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mt-5 [&>h3]:mb-2 " +
          "[&>ul]:list-disc [&>ul]:pl-6 [&>ul]:my-3 " +
          "[&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:my-3 " +
          "[&>p]:my-2 " +
          "[&_a]:text-blue-600 [&_a]:underline " +
          "[&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-3",
      },

      handlePaste: (_view, event) => {
        const e = event as ClipboardEvent;

        const text = e.clipboardData?.getData("text/plain") ?? "";
        if (!text.trim()) return false;

        const looksLikeMd =
          /(^|\n)\s{0,3}#{1,6}\s+\S/.test(text) ||
          /(^|\n)\s*[-*]\s+\S/.test(text) ||
          /(^|\n)\s*\d+\.\s+\S/.test(text) ||
          /(\*\*[^*]+\*\*)/.test(text) ||
          /(```)/.test(text);

        if (!looksLikeMd) return false;

        e.preventDefault();

        const rawHtml = marked.parse(text, { breaks: true }) as string;
        const safeHtml = DOMPurify.sanitize(rawHtml);

        editor?.chain().focus().insertContent(safeHtml).run();
        return true;
      },
    },
  });

  // ✅ sincroniza cambios que vienen "desde afuera" (DB/load/reset)
  React.useEffect(() => {
    if (!editor) return;

    const incoming = String(value ?? "");
    const current = editor.getHTML();

    // si el value que llega es el mismo que ya emitimos, no toques nada
    if (incoming === lastEmittedRef.current) return;

    // si ya está igual, no hagas nada
    if (incoming === current) return;

    editor.commands.setContent(incoming, { emitUpdate: false });

  }, [editor, value]);

  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  async function uploadAndInsert(file: File) {
    if (!editor) return;

    if (!adminSecret?.trim()) {
      setMsg("❌ Missing admin secret");
      return;
    }

    setBusy(true);
    setMsg("");

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "x-admin-secret": adminSecret },
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg("❌ " + (data?.error ?? "Upload error"));
        return;
      }

      const url = String(data?.url ?? "").trim();
      if (!url) {
        setMsg("❌ Invalid upload response");
        return;
      }

      editor.chain().focus().setImage({ src: url }).run();
      setMsg("✅ Image added");
      setTimeout(() => setMsg(""), 900);
    } catch (e: any) {
      setMsg("❌ " + String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  function cmd(run: () => void) {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      run();
    };
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 p-3">
        <button
          type="button"
          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
          disabled={!editor}
          onMouseDown={cmd(() => editor?.chain().focus().toggleHeading({ level: 2 }).run())}
        >
          H2
        </button>

        <button
          type="button"
          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
          disabled={!editor}
          onMouseDown={cmd(() => editor?.chain().focus().toggleHeading({ level: 3 }).run())}
        >
          H3
        </button>

        <button
          type="button"
          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
          disabled={!editor}
          onMouseDown={cmd(() => editor?.chain().focus().toggleBold().run())}
        >
          Bold
        </button>

        <button
          type="button"
          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
          disabled={!editor}
          onMouseDown={cmd(() => editor?.chain().focus().toggleItalic().run())}
        >
          Italic
        </button>

        <button
          type="button"
          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
          disabled={!editor}
          onMouseDown={cmd(() => editor?.chain().focus().toggleBulletList().run())}
        >
          • List
        </button>

        <button
          type="button"
          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
          disabled={busy}
          onMouseDown={cmd(() => inputRef.current?.click())}
        >
          {busy ? "Uploading..." : "Image"}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) uploadAndInsert(f);
          }}
        />

        {msg ? <div className="text-sm text-gray-600">{msg}</div> : null}
      </div>

      <div className="p-4">
        <div className="min-h-[320px] rounded-xl border border-gray-200 bg-white p-4 overflow-auto">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
