import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";

import "./globals.css";
import "react-image-crop/dist/ReactCrop.css";

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN" className={GeistSans.variable}>
      <body className="min-h-screen text-foreground">
        <main>{children}</main>
      </body>
    </html>
  );
}
