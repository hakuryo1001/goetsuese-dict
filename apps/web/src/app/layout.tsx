import type { ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata = {
  title: "吳語辭林 · Wulam",
  description: "Local Next.js Wu Chinese dictionary with Goetsusioji",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="wuu-Hant">
      <body className="min-h-screen bg-parchment text-ink dark:bg-navy dark:text-stone-100">
        <ThemeProvider>
          <I18nProvider>{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
