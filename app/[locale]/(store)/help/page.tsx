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
          q: "¿Cómo me registro?",
          a: "Puedes registrarte desde el botón -crear cuenta- completando usuario y contraseña. De ese modo podrás guardar favoritas, hacer compras y realizar seguimientos de los estados de tus ordenes.",
        },

        {
          q: "¿Cómo compro una tarjeta?",
          a: "Agregá la tarjeta al carrito, (puedes agregar la cantidad que quieras) y terminá el checkout completando los datos para el envio. Si estás en Argentina, podés pagar con MercadoPago.También puedes elegir Paypal.",
        },
        {
          q: "¿Cómo funcionan los favoritos?",
          a: "Podés guardar tarjetas como favoritas. Si estás logueado se guardan en tu cuenta, y luego puedes verlas todas juntas desde el link -favoritos- y también agregarlas al carrito para hacer la compra.",
        },
        {
          q: "¿Puedo ver mis pedidos?",
          a: "Sí, en la sección “Pedidos” vas a encontrar tu historial.",
        },
        {
          q: "¿Cómo hago el seguimiento de mis pedidos?",
          a: "En la sección “Pedidos” vas a encontrar el estado de tu orden, hay 4 etapas, -generado-, -pagado-, -enviado- y -entregado-. Una vez que el nevió haya sido hecho podrás ver el tracking number para hacerle seguimiento.",
        },
        {
          q: "Tengo un problema con una compra, ¿qué hago?",
          a: "Escribinos desde el formulario de abajo con tu email y (si tenés) el número de pedido.",
        },
        {
          q: "¿Puedo cancelar un pedido?",
          a: "Siempre y cuando el pedido no haya sido enviado, puedes escribirnos desde el formulario de abajo con tu email y (si tenés) el número de pedido solicitando la cancelación de tu orden y nos pondremos en contacto contigo para hacer un reembolso y cancelarlo.",
        },
      ]
    : [
        {
          q: "How do I buy a card?",
          a: "Add the card to your cart and complete checkout. If you are in Argentina, you can pay with MercadoPago.",
        },
        {
          q: "How do favorites work?",
          a: "You can save cards as favorites. If you’re logged in, they’re stored in your account; otherwise they stay in your browser.",
        },
        {
          q: "Can I see my orders?",
          a: "Yes, go to “Orders” to view your order history.",
        },
        {
          q: "I have an issue with a purchase—what should I do?",
          a: "Use the contact form below and include your email and (if you have it) the order number.",
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