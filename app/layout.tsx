import type { Metadata, Viewport } from "next";
import { PwaManager } from "@/components/pwa-manager";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Karigar — Workshop orders",
    template: "%s | Karigar",
  },
  description: "Simple order and workshop tracking for small shops",
  applicationName: "Karigar",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Karigar",
  },
  icons: {
    icon: [
      { url: "/icons/192", type: "image/png", sizes: "192x192" },
      { url: "/icons/512", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/icons/192", type: "image/png", sizes: "192x192" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#176b4a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.dataset.theme=localStorage.getItem("theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch{}`,
          }}
        />
        <PwaManager />
        {children}
      </body>
    </html>
  );
}
