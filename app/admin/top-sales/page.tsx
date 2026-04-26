import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function AdminTopSalesPage() {
  const { data, error } = await supabase
    .from("top_ebay_sales")
    .select("*")
    .order("price_usd", { ascending: false })
    .limit(100);

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Top Sales</h1>
        <p className="text-red-600">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Top Sales</h1>
        <p className="text-sm text-gray-500">
          Ventas importadas para la sección pública de top ventas.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">Imagen</th>
              <th className="p-3">Título</th>
              <th className="p-3">Precio</th>
              <th className="p-3">Fecha</th>
              <th className="p-3">Grade</th>
              <th className="p-3">Estado</th>
            </tr>
          </thead>

          <tbody>
            {data?.map((item) => (
              <tr key={item.id} className="border-t border-gray-100">
                <td className="p-3">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-16 w-16 rounded-lg object-cover border"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                      Sin imagen
                    </div>
                  )}
                </td>

                <td className="p-3 max-w-md">
                  <div className="font-semibold line-clamp-2">
                    {item.title}
                  </div>

                  {item.source_url && (
                    <a
                      href={item.source_url}
                      target="_blank"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Ver fuente
                    </a>
                  )}
                </td>

                <td className="p-3 font-bold">
                  USD {Number(item.price_usd).toLocaleString("es-AR")}
                </td>

                <td className="p-3 text-gray-600">
                  {item.sold_at
                    ? new Date(item.sold_at).toLocaleDateString("es-AR")
                    : "-"}
                </td>

                <td className="p-3">
                  {item.grade ? (
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                      {item.grade}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>

                <td className="p-3">
                  {item.image_url ? (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                      OK
                    </span>
                  ) : (
                    <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">
                      Falta imagen
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}