import LegalPage from "@/components/legal-page";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEs = locale === "es";

  return (
    <LegalPage
      title={isEs ? "Términos y Condiciones" : "Terms of Service"}
      lastUpdated="March 2026"
      intro={
        isEs
          ? "Al utilizar nbcards.com aceptas los siguientes términos. Te recomendamos leerlos antes de realizar una compra."
          : "By using nbcards.com, you agree to the following terms. Please read them before making a purchase."
      }
      sections={
        isEs
          ? [
              {
                title: "Productos",
                paragraphs: [
                  "NB Cards & Collectibles vende tarjetas coleccionables y artículos de colección relacionados.",
                  "Las imágenes de producto son representativas y puede haber pequeñas variaciones visuales según impresión, edición, iluminación o presentación.",
                ],
              },
              {
                title: "Condición de los artículos",
                paragraphs: [
                  "Los artículos coleccionables pueden presentar variaciones naturales, diferencias de impresión o diferencias de grading según el fabricante o empresa certificadora.",
                  "Pequeñas imperfecciones de fábrica pueden existir y se consideran normales dentro del mercado de coleccionables.",
                ],
              },
              {
                title: "Precios",
                paragraphs: [
                  "Todos los precios se muestran en dólares estadounidenses (USD), salvo que se indique lo contrario de forma expresa.",
                ],
              },
              {
                title: "Pagos",
                paragraphs: [
                  "Los pagos se procesan mediante proveedores externos seguros como PayPal y MercadoPago.",
                  "No almacenamos datos completos de tarjetas.",
                ],
              },
              {
                title: "Pedidos",
                bullets: [
                  "Nos reservamos el derecho de cancelar o rechazar pedidos si un producto está fuera de stock.",
                  "Nos reservamos el derecho de cancelar pedidos si existe un error de precio.",
                  "Podemos rechazar pedidos si detectamos actividad sospechosa o fraudulenta.",
                ],
              },
              {
                title: "Envíos",
                paragraphs: [
                  "Realizamos envíos nacionales e internacionales.",
                  "Los plazos de entrega pueden variar según destino, transportista y procesos aduaneros.",
                  "El cliente es responsable de cualquier impuesto, arancel o cargo de importación aplicable en su país.",
                ],
              },
              {
                title: "Devoluciones",
                paragraphs: [
                  "Debido a la naturaleza coleccionable de los productos, las devoluciones pueden estar limitadas.",
                  "Si recibes un artículo incorrecto o dañado, contáctanos dentro de los 7 días posteriores a la entrega.",
                ],
              },
              {
                title: "Limitación de responsabilidad",
                paragraphs: [
                  "NB Cards & Collectibles no es responsable por retrasos causados por transportistas, aduanas o circunstancias fuera de nuestro control.",
                ],
              },
              {
                title: "Modificaciones",
                paragraphs: [
                  "Podemos actualizar estos términos en cualquier momento. La versión vigente será publicada en esta página.",
                ],
              },
              {
                title: "Contacto",
                paragraphs: [
                  "Para consultas sobre estos términos puedes escribirnos a info@nbcards.com.",
                ],
              },
            ]
          : [
              {
                title: "Products",
                paragraphs: [
                  "NB Cards & Collectibles sells collectible cards and related collectibles.",
                  "Product images are representative and small visual variations may occur depending on print, edition, lighting, or presentation.",
                ],
              },
              {
                title: "Item Condition",
                paragraphs: [
                  "Collectible items may show natural variations, print differences, or grading differences depending on the manufacturer or grading company.",
                  "Minor factory imperfections may occur and are considered normal in the collectibles market.",
                ],
              },
              {
                title: "Prices",
                paragraphs: [
                  "All prices are displayed in United States Dollars (USD), unless otherwise clearly stated.",
                ],
              },
              {
                title: "Payments",
                paragraphs: [
                  "Payments are processed through secure third-party providers such as PayPal and MercadoPago.",
                  "We do not store full card details.",
                ],
              },
              {
                title: "Orders",
                bullets: [
                  "We reserve the right to cancel or refuse orders if an item is out of stock.",
                  "We reserve the right to cancel orders if a pricing error occurs.",
                  "We may refuse orders if suspicious or fraudulent activity is detected.",
                ],
              },
              {
                title: "Shipping",
                paragraphs: [
                  "We ship both domestically and internationally.",
                  "Delivery times may vary depending on destination, carrier, and customs procedures.",
                  "Customers are responsible for any customs duties, taxes, or import fees required by their country.",
                ],
              },
              {
                title: "Returns",
                paragraphs: [
                  "Due to the collectible nature of our products, returns may be limited.",
                  "If you receive an incorrect or damaged item, please contact us within 7 days of delivery.",
                ],
              },
              {
                title: "Limitation of Liability",
                paragraphs: [
                  "NB Cards & Collectibles is not responsible for delays caused by shipping carriers, customs processing, or events beyond our control.",
                ],
              },
              {
                title: "Changes",
                paragraphs: [
                  "We may update these terms at any time. The latest version will be posted on this page.",
                ],
              },
              {
                title: "Contact",
                paragraphs: [
                  "For questions regarding these terms, contact us at info@nbcards.com.",
                ],
              },
            ]
      }
    />
  );
}