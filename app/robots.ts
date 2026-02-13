export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://nbcards.com/sitemap.xml",
  };
}
