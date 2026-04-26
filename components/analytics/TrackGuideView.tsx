"use client";

import { useEffect } from "react";

export default function TrackGuideView({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  useEffect(() => {
    fetch("/api/analytics/event", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "guide_view",
        path: window.location.pathname,
        query: slug,
        metadata: {
          slug,
          title,
        },
      }),
    }).catch(() => {});
  }, [slug, title]);

  return null;
}