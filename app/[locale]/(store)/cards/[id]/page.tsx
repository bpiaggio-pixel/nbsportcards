import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

type Params = { locale: string; id?: string };
type Props = { params: Params | Promise<Params> };

function parsePercent(greatDeal: any): number {
  const s = String(greatDeal ?? "").trim();
  if (!s) return 0;
  const m = s.match(/-?\d+(\.\d+)?/);
  if (!m) return 0;
  return Math.abs(parseFloat(m[0])) || 0;
}

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export async function generateMetadata({ params }: Props) {
  const { locale, id } = await params;
  if (!id || typeof id !== "string") return {};

  const decodedId = decodeURIComponent(id);
  const card = await prisma.card.findUnique({ where: { id: decodedId } });
  if (!card) return {};

  const title = `${card.title} | NBCards`;
  const description = `${card.player ?? ""} • ${card.sport ?? ""}`.trim();

  return {
    title,
    description,
    alternates: {
      canonical: `https://nbcards.com/${locale}/cards/${encodeURIComponent(id)}`,
    },
  };
}

export default async function CardPage({ params }: Props) {
  const { locale, id } = await params;
  if (!id || typeof id !== "string") return notFound();

  const decodedId = decodeURIComponent(id);
  const card = await prisma.card.findUnique({ where: { id: decodedId } });
  if (!card) return notFound();

  const percent = parsePercent(card.greatDeal);
  const original = card.priceCents ?? 0;
  const discounted =
    percent > 0 ? Math.round(original * (1 - percent / 100)) : original;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition"
        >
          ← Volver a tarjetas
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-4">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-gray-50">
            {card.image ? (
              <Image
                src={card.image}
                alt={card.title}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 90vw, 50vw"
                priority
              />
            ) : null}
          </div>

          {card.image2 ? (
            <div className="mt-4 text-sm text-gray-500">
              (Tiene reverso disponible)
            </div>
          ) : null}
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            {card.title}
          </h1>
          <p className="mt-2 text-gray-600">
            {card.player} • {card.sport}
          </p>

          <div className="mt-6 flex items-center gap-3">
            {percent > 0 ? (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold">
                -{percent}%
              </span>
            ) : null}

            <div className="text-3xl font-extrabold text-gray-900">
              {money(discounted)}
            </div>

            {percent > 0 ? (
              <div className="text-sm text-gray-500 line-through">
                {money(original)}
              </div>
            ) : null}
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Stock: <span className="font-semibold">{card.stock ?? 0}</span>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/${locale}`}
              className="rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold hover:bg-gray-50 transition"
            >
              Abrir en la tienda
            </Link>
          </div>

          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-4 text-xs text-gray-500">
            ID: <span className="font-mono">{card.id}</span>
          </div>
        </div>
      </div>
    </main>
  );
}