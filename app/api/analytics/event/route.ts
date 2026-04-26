import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { event_type, path, query, product_id, metadata } = body;

    if (!event_type) {
      return Response.json(
        { ok: false, error: "event_type is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("site_events").insert({
      event_type,
      path: path ?? null,
      query: query ?? null,
      product_id: product_id ?? null,
      metadata: metadata ?? {},
    });

    if (error) throw error;

    return Response.json({ ok: true });
  } catch (err: any) {
    return Response.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
export async function GET() {
  return Response.json({ ok: true, message: "analytics endpoint active" });
}