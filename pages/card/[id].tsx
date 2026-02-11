import { useRouter } from "next/router";
import Link from "next/link";
import cardsData from "../../data/cards.json";

type Sport = "basketball" | "soccer";

type Card = {
  id: string;
  sport: Sport;
  title: string;
  player: string;
  price: number;
  image?: string;
};

function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function CardDetail() {
  const router = useRouter();
  const { id } = router.query;

  const cards = cardsData as Card[];
  const card = cards.find((c) => c.id === id);

  if (!id) return null;

  if (!card) {
    return (
      <div style={{ padding: 40 }}>
        <Link href="/">← Volver</Link>
        <h1>Tarjeta no encontrada</h1>
        <p>ID: {String(id)}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, maxWidth: 1000, margin: "0 auto" }}>
      <Link href="/">← Volver a la galería</Link>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 24 }}>
        <img
          src={card.image}
          alt={card.title}
          style={{ width: "100%", borderRadius: 12 }}
        />

        <div>
          <h1>{card.title}</h1>
          <p>{card.player}</p>
          <h2>{formatUSD(card.price)}</h2>

          <p>
            Deporte: <b>{card.sport}</b>
          </p>
          <p>
            ID: <b>{card.id}</b>
          </p>
        </div>
      </div>
    </div>
  );
}
