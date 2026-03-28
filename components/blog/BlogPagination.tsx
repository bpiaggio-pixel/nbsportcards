import { Link } from "@/navigation";

type Props = {
  locale: string;
  basePath: string;
  currentPage: number;
  totalPages: number;
  query?: string;
};

function buildHref(basePath: string, page: number, query?: string) {
  const params = new URLSearchParams();

  if (page > 1) params.set("page", String(page));
  if (query) params.set("q", query);

  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export default function BlogPagination({
  locale,
  basePath,
  currentPage,
  totalPages,
  query,
}: Props) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {currentPage > 1 ? (
        <Link
          href={buildHref(basePath, currentPage - 1, query)}
          locale={locale}
          className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-sky-400 hover:bg-sky-100"
        >
          {locale === "es" ? "Anterior" : "Previous"}
        </Link>
      ) : null}

      {pages.map((page) => {
        const active = page === currentPage;

        return (
          <Link
            key={page}
            href={buildHref(basePath, page, query)}
            locale={locale}
            className={`rounded-full px-4 py-2 text-sm font-medium transition border ${
              active
                ? "bg-sky-500 text-white border-sky-500"
                : "border-gray-300 text-gray-700 hover:border-sky-400 hover:bg-sky-100"
            }`}
          >
            {page}
          </Link>
        );
      })}

      {currentPage < totalPages ? (
        <Link
          href={buildHref(basePath, currentPage + 1, query)}
          locale={locale}
          className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-sky-400 hover:bg-sky-100"
        >
          {locale === "es" ? "Siguiente" : "Next"}
        </Link>
      ) : null}
    </div>
  );
}