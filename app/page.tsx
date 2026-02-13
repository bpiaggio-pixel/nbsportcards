import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default function Home() {
  const h = headers();

  const country = (h.get("x-vercel-ip-country") || "").toUpperCase();
  const accept = (h.get("accept-language") || "").toLowerCase();

  const preferEs =
    country === "AR" || accept.startsWith("es") || accept.includes("es-");

  redirect(preferEs ? "/es" : "/en");
}

