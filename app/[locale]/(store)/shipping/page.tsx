import LegalPage from "@/components/legal-page";

export default async function ShippingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEs = locale === "es";

  return (
    <LegalPage
      title={isEs ? "Política de Envíos y Devoluciones" : "Shipping & Returns Policy"}
      lastUpdated="March 2026"
      intro={
        isEs
          ? "Gracias por comprar en NB Cards & Collectibles. Esta página explica cómo procesamos envíos, cómo protegemos los productos y en qué casos aceptamos devoluciones."
          : "Thank you for shopping at NB Cards & Collectibles. This page explains how we handle shipping, how we protect items, and when returns may be accepted."
      }
      sections={
        isEs
          ? [
              {
                title: "Procesamiento de pedidos",
                paragraphs: [
                  "Los pedidos suelen procesarse dentro de 1 a 3 días hábiles después de la confirmación del pago.",
                ],
              },
              {
                title: "Envíos",
                paragraphs: [
                  "Realizamos envíos nacionales e internacionales.",
                  "Los tiempos de entrega pueden variar según el destino, el transportista y la situación aduanera de cada país.",
                ],
              },
              {
                title: "Protección de cartas y coleccionables",
                paragraphs: [
                  "Empaquetamos cuidadosamente todas las cartas y coleccionables para protegerlos durante el transporte.",
                ],
                bullets: [
                  "Fundas protectoras (sleeves)",
                  "Toploaders o protectores semirrígidos cuando corresponde",
                  "Material de embalaje protector",
                ],
              },
              {
                title: "Envíos internacionales",
                paragraphs: [
                  "El cliente es responsable de cualquier impuesto, arancel o cargo de importación exigido por su país.",
                  "NB Cards & Collectibles no es responsable por retrasos ocasionados por procesos aduaneros.",
                ],
              },
              {
                title: "Paquetes perdidos o demorados",
                paragraphs: [
                  "Una vez despachado el pedido, la entrega depende del transportista.",
                  "Si tu paquete se retrasa, te recomendamos contactar primero al transportista. Si necesitas ayuda adicional, puedes escribirnos a info@nbcards.com.",
                ],
              },
              {
                title: "Devoluciones",
                paragraphs: [
                  "Debido a la naturaleza coleccionable de nuestros productos, las devoluciones son limitadas.",
                  "Aceptamos devoluciones únicamente si el artículo enviado es incorrecto, llega dañado o difiere significativamente de la descripción.",
                ],
              },
              {
                title: "Plazo para solicitar devolución",
                paragraphs: [
                  "Las solicitudes deben realizarse dentro de los 7 días posteriores a la entrega.",
                ],
              },
              {
                title: "Condición del artículo devuelto",
                paragraphs: [
                  "El artículo debe devolverse en la misma condición en que fue recibido.",
                  "Los artículos con señales de uso, alteración o daño posterior a la entrega pueden no ser elegibles para reembolso.",
                ],
              },
              {
                title: "Reembolsos",
                paragraphs: [
                  "Si una devolución es aprobada, el reembolso se realizará al mismo método de pago utilizado en la compra.",
                  "Los costos de envío generalmente no son reembolsables, salvo en casos de error por nuestra parte.",
                ],
              },
              {
                title: "Contacto",
                paragraphs: [
                  "Para consultas sobre envíos o devoluciones, escríbenos a info@nbcards.com.",
                ],
              },
            ]
          : [
              {
                title: "Order Processing",
                paragraphs: [
                  "Orders are typically processed within 1–3 business days after payment is confirmed.",
                ],
              },
              {
                title: "Shipping",
                paragraphs: [
                  "We ship both domestically and internationally.",
                  "Delivery times may vary depending on destination, carrier, and customs procedures.",
                ],
              },
              {
                title: "Protection of Cards and Collectibles",
                paragraphs: [
                  "We carefully package all cards and collectibles to help protect them during transit.",
                ],
                bullets: [
                  "Protective sleeves",
                  "Toploaders or semi-rigid holders when appropriate",
                  "Protective packaging materials",
                ],
              },
              {
                title: "International Shipping",
                paragraphs: [
                  "Customers are responsible for any customs duties, taxes, or import fees required by their country.",
                  "NB Cards & Collectibles is not responsible for delays caused by customs procedures.",
                ],
              },
              {
                title: "Lost or Delayed Packages",
                paragraphs: [
                  "Once shipped, delivery is handled by the shipping carrier.",
                  "If your package is delayed, we recommend contacting the carrier first. If you need further assistance, email us at info@nbcards.com.",
                ],
              },
              {
                title: "Returns",
                paragraphs: [
                  "Due to the collectible nature of our products, returns are limited.",
                  "We only accept returns if the wrong item was shipped, the item arrives damaged, or the item significantly differs from the description.",
                ],
              },
              {
                title: "Return Request Window",
                paragraphs: [
                  "Return requests must be made within 7 days of delivery.",
                ],
              },
              {
                title: "Condition of Returned Items",
                paragraphs: [
                  "Returned items must be in the same condition in which they were received.",
                  "Items showing signs of use, alteration, or post-delivery damage may not be eligible for a refund.",
                ],
              },
              {
                title: "Refunds",
                paragraphs: [
                  "If a return is approved, refunds will be issued to the original payment method.",
                  "Shipping costs are generally non-refundable unless the return is due to our error.",
                ],
              },
              {
                title: "Contact",
                paragraphs: [
                  "For shipping or return questions, contact us at info@nbcards.com.",
                ],
              },
            ]
      }
    />
  );
}