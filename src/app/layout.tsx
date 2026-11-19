import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { THEME } from "@/config/theme";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: THEME.metadata.title,
  description: THEME.metadata.description,
  applicationName: THEME.brandName,
  openGraph: {
    title: THEME.metadata.title,
    description: THEME.metadata.description,
    siteName: THEME.brandName,
    locale: THEME.metadata.locale,
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={THEME.metadata.lang}
      data-theme={THEME.activeTheme}
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-surface font-sans text-fg">
        {children}
      </body>
    </html>
  );
}
