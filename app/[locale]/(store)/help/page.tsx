// app/[locale]/help/page.tsx
import { Link } from "@/navigation";
import ContactForm from "@/components/contact-form";

export default async function HelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEs = locale === "es";

  const title = isEs ? "Ayuda" : "Help";
  const subtitle = isEs
    ? "Preguntas frecuentes y formulario de contacto."
    : "Frequently asked questions and contact form.";

  const faqs = isEs
    ? [
        {
  q: "¿Cómo creo una cuenta?",
  a: "Solo tienes que hacer clic en el botón 'Crear cuenta' y configurar tu usuario y contraseña. Una vez registrado, podrás guardar tarjetas como favoritas, realizar compras y hacer seguimiento del estado de tus pedidos."
},

{
  q: "¿Cómo compro una tarjeta?",
  a: "Agrega la tarjeta al carrito (puedes elegir la cantidad que desees) y continúa al checkout completando tus datos de envío. Si estás en Argentina, puedes pagar de forma segura con MercadoPago. También aceptamos PayPal."
},

{
  q: "¿Cómo funcionan los favoritos?",
  a: "Puedes guardar cualquier tarjeta en tu lista de Favoritos. Si estás logueado, se almacenarán en tu cuenta de forma segura. Podrás verlas en cualquier momento desde la sección 'Favoritos' y agregarlas al carrito cuando estés listo para comprar."
},

{
  q: "¿Puedo ver mi historial de pedidos?",
  a: "Sí. Puedes acceder a tu historial completo de pedidos en cualquier momento desde la sección 'Pedidos' dentro de tu cuenta."
},

{
  q: "¿Cómo hago el seguimiento de mi pedido?",
  a: "En la sección 'Pedidos' encontrarás el estado de tu orden. Los pedidos pasan por cuatro etapas: 'Generado', 'Pagado', 'Enviado' y 'Entregado'. Una vez que el pedido haya sido enviado, recibirás un número de seguimiento para monitorear la entrega en tiempo real."
},

{
  q: "Tengo un problema con una compra, ¿qué debo hacer?",
  a: "Si tienes algún inconveniente, puedes contactarnos mediante el formulario que se encuentra más abajo. Incluye tu correo electrónico y, si lo tienes, el número de pedido para que podamos ayudarte lo antes posible."
},

{
  q: "¿Puedo cancelar un pedido?",
  a: "Puedes cancelar tu pedido siempre que aún no haya sido enviado. Escríbenos a través del formulario indicando tu correo electrónico y el número de pedido (si lo tienes). Nuestro equipo te ayudará con el proceso de cancelación y reembolso."
},
      ]
    : [
       {
  q: "How do I create an account?",
  a: "Simply click the 'Create Account' button and set up your username and password. Once registered, you'll be able to save favorites, complete purchases, and track the status of your orders."
},

{
  q: "How do I purchase a card?",
  a: "Add the card to your cart (you can select the quantity you’d like) and proceed to checkout by entering your shipping details. Customers in Argentina can pay securely with MercadoPago. PayPal is also available."
},

{
  q: "How do Favorites work?",
  a: "You can save any card to your Favorites list. When you're logged in, your favorites are securely stored in your account. You can view them anytime from the 'Favorites' section and easily add them to your cart when you're ready to purchase."
},

{
  q: "Can I view my order history?",
  a: "Yes. You can access your complete order history at any time from the 'Orders' section in your account."
},

{
  q: "How can I track my order?",
  a: "In the 'Orders' section, you’ll find your order status. Orders move through four stages: 'Generated', 'Paid', 'Shipped', and 'Delivered'. Once your order has been shipped, a tracking number will be provided so you can follow your delivery in real time."
},

{
  q: "I have an issue with my purchase. What should I do?",
  a: "If you experience any issue, please contact us using the form below. Include your email address and, if available, your order number so we can assist you as quickly as possible."
},

{
  q: "Can I cancel my order?",
  a: "Orders can be canceled as long as they have not yet been shipped. Please contact us using the form below with your email address and order number (if available). Our team will assist you with the cancellation and refund process."
},
      ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
          <p className="mt-2 text-gray-600">{subtitle}</p>
        </div>

        <Link
          href="/"
          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          {isEs ? "Volver" : "Back"}
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">{isEs ? "Preguntas frecuentes" : "FAQs"}</h2>

        <div className="mt-4 space-y-3">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="rounded-2xl border border-gray-200 bg-white px-5 py-4"
            >
<summary className="cursor-pointer select-none text-sm font-semibold text-gray-900 marker:text-sky-500">                {item.q}
              </summary>
              <p className="mt-3 text-sm leading-6 text-gray-700">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-gray-900">{isEs ? "Contacto" : "Contact"}</h2>
        <p className="mt-2 text-sm text-gray-600">
          {isEs
            ? "Completa el formulario y te respondemos por email."
            : "Fill out the form and we’ll reply by email."}
        </p>

        <div className="mt-4">
          <ContactForm locale={isEs ? "es" : "en"} />
        </div>
      </section>
    </div>
  );
}