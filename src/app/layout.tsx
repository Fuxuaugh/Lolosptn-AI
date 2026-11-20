import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { THEME } from "@/config/theme";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
      className={`${spaceGrotesk.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-canvas font-sans text-fg">
        {children}
      </body>
    </html>
  );
}
