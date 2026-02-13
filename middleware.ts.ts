import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeDetection: true, // 👈 clave: detecta por Accept-Language
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};



