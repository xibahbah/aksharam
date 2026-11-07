import type { Metadata, Viewport } from "next";
import { Shell } from "@/components/shell";
import "./globals.css";
import { appearanceScript } from "@/lib/appearance";
import { BASE_PATH } from "@/lib/paths";
import localFont from "next/font/local";

// Rounded display face with Latin and Malayalam (SIL OFL, see src/fonts).
const baloo = localFont({
  src: "../fonts/BalooChettan-Regular.woff2",
  variable: "--font-baloo",
  display: "swap",
});
export const metadata: Metadata = {
  title: {
    default: "Aksharam · Read Malayalam",
    template: "%s · Aksharam",
  },
  description:
    "Learn to read the Malayalam script in five minutes a day: short lessons, syllables from day one, and spaced review.",
  manifest: `${BASE_PATH}/manifest.webmanifest`,
  icons: { icon: `${BASE_PATH}/icon.svg` },
  appleWebApp: { capable: true, title: "Aksharam" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f8e2" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={baloo.variable} suppressHydrationWarning>
      <head>
        <script
          id="appearance-init"
          dangerouslySetInnerHTML={{ __html: appearanceScript }}
        />
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
