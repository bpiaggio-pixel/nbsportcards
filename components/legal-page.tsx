import React from "react";

type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type LegalPageProps = {
  title: string;
  lastUpdated: string;
  intro?: string;
  sections: LegalSection[];
};

export default function LegalPage({
  title,
  lastUpdated,
  intro,
  sections,
}: LegalPageProps) {
  return (
    <div className="min-h-screen bg-[#f6f7f8] text-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gradient-to-r from-sky-50 via-white to-sky-50 px-6 py-8 sm:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
              NB Cards &amp; Collectibles
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              Last updated / Última actualización: {lastUpdated}
            </p>

            {intro ? (
              <p className="mt-5 max-w-3xl text-base leading-7 text-gray-600">
                {intro}
              </p>
            ) : null}
          </div>

          <div className="px-6 py-8 sm:px-8 sm:py-10">
            <div className="space-y-10">
              {sections.map((section) => (
                <section key={section.title}>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {section.title}
                  </h2>

                  {section.paragraphs?.length ? (
                    <div className="mt-4 space-y-4">
                      {section.paragraphs.map((p, idx) => (
                        <p key={idx} className="text-sm leading-7 text-gray-600 sm:text-base">
                          {p}
                        </p>
                      ))}
                    </div>
                  ) : null}

                  {section.bullets?.length ? (
                    <ul className="mt-4 space-y-3">
                      {section.bullets.map((item, idx) => (
                        <li key={idx} className="flex gap-3 text-sm leading-7 text-gray-600 sm:text-base">
                          <span className="mt-[10px] h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}