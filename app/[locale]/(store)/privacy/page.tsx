import LegalPage from "@/components/legal-page";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEs = locale === "es";

  return (
    <LegalPage
      title={isEs ? "Política de Privacidad" : "Privacy Policy"}
      lastUpdated="March 2026"
      intro={
        isEs
          ? "En NB Cards & Collectibles valoramos tu privacidad. Esta política explica qué información recopilamos, cómo la utilizamos y cómo la protegemos cuando utilizas nbcards.com."
          : "At NB Cards & Collectibles, we value your privacy. This policy explains what information we collect, how we use it, and how we protect it when you use nbcards.com."
      }
      sections={
        isEs
          ? [
              {
                title: "Información que recopilamos",
                paragraphs: [
                  "Cuando realizas un pedido, creas una cuenta o te suscribes al newsletter, podemos recopilar cierta información personal necesaria para procesar tus compras y brindarte soporte.",
                ],
                bullets: [
                  "Nombre y apellido",
                  "Dirección de email",
                  "Dirección de envío",
                  "Teléfono (opcional)",
                  "Información relacionada con tus pedidos",
                ],
              },
              {
                title: "Información de pago",
                paragraphs: [
                  "No almacenamos información completa de tarjetas de crédito o débito en nuestros servidores.",
                  "Los pagos se procesan a través de proveedores externos como PayPal y MercadoPago, quienes gestionan esos datos según sus propias políticas de privacidad.",
                ],
              },
              {
                title: "Cómo utilizamos tu información",
                bullets: [
                  "Procesar y enviar pedidos",
                  "Brindar soporte al cliente",
                  "Enviar confirmaciones de compra y actualizaciones de envío",
                  "Mejorar nuestro sitio y nuestros servicios",
                  "Enviar novedades y promociones si te suscribes al newsletter",
                ],
              },
              {
                title: "Cookies y tecnologías similares",
                paragraphs: [
                  "Podemos utilizar cookies u otras tecnologías similares para mejorar la navegación, recordar preferencias y entender mejor cómo se utiliza el sitio.",
                ],
              },
              {
                title: "Servicios de terceros",
                paragraphs: [
                  "Podemos utilizar servicios externos como procesadores de pago, herramientas de analítica o plataformas de email marketing. Estos servicios solo reciben la información necesaria para cumplir su función.",
                ],
              },
              {
                title: "Seguridad de los datos",
                paragraphs: [
                  "Tomamos medidas razonables para proteger tu información personal. Sin embargo, ningún sistema en internet puede garantizar una seguridad absoluta.",
                ],
              },
              {
                title: "Tus derechos",
                paragraphs: [
                  "Puedes solicitar acceso, corrección o eliminación de tus datos personales escribiéndonos a info@nbcards.com.",
                ],
              },
              {
                title: "Cambios a esta política",
                paragraphs: [
                  "Podemos actualizar esta Política de Privacidad ocasionalmente. Cualquier cambio será publicado en esta misma página.",
                ],
              },
              {
                title: "Contacto",
                paragraphs: [
                  "Si tienes preguntas sobre esta política, puedes escribirnos a info@nbcards.com.",
                ],
              },
            ]
          : [
              {
                title: "Information We Collect",
                paragraphs: [
                  "When you place an order, create an account, or subscribe to our newsletter, we may collect certain personal information necessary to process purchases and provide support.",
                ],
                bullets: [
                  "Full name",
                  "Email address",
                  "Shipping address",
                  "Phone number (optional)",
                  "Order-related information",
                ],
              },
              {
                title: "Payment Information",
                paragraphs: [
                  "We do not store full credit or debit card information on our servers.",
                  "Payments are processed through third-party providers such as PayPal and MercadoPago, which handle payment data according to their own privacy policies.",
                ],
              },
              {
                title: "How We Use Your Information",
                bullets: [
                  "To process and ship orders",
                  "To provide customer support",
                  "To send order confirmations and shipping updates",
                  "To improve our site and services",
                  "To send updates and promotions if you subscribe to our newsletter",
                ],
              },
              {
                title: "Cookies and Similar Technologies",
                paragraphs: [
                  "We may use cookies and similar technologies to improve browsing, remember preferences, and better understand how our website is used.",
                ],
              },
              {
                title: "Third-Party Services",
                paragraphs: [
                  "We may use third-party services such as payment processors, analytics tools, or email platforms. These providers only receive the information necessary to perform their services.",
                ],
              },
              {
                title: "Data Security",
                paragraphs: [
                  "We take reasonable steps to protect your personal information. However, no online system can guarantee absolute security.",
                ],
              },
              {
                title: "Your Rights",
                paragraphs: [
                  "You may request access to, correction of, or deletion of your personal data by contacting us at info@nbcards.com.",
                ],
              },
              {
                title: "Changes to This Policy",
                paragraphs: [
                  "We may update this Privacy Policy from time to time. Any updates will be posted on this page.",
                ],
              },
              {
                title: "Contact",
                paragraphs: [
                  "If you have any questions about this policy, contact us at info@nbcards.com.",
                ],
              },
            ]
      }
    />
  );
}