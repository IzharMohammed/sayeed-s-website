import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Karigar — Workshop orders",
  description: "Simple order and workshop tracking for small shops",
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
        {children}
      </body>
    </html>
  );
}
