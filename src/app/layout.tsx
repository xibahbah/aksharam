import type { Metadata, Viewport } from "next";
import { Shell } from "@/components/shell";
import "./globals.css";
import { appearanceScript } from "@/lib/appearance";
import { BASE_PATH } from "@/lib/paths";
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
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
