import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";

import { RootProviders } from "@/components/providers/root-providers";
import "./globals.css";
import "react-image-crop/dist/ReactCrop.css";
export const metadata: Metadata = {
  title: "雪笠微光",
  description: "雪笠微光",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN" className={GeistSans.variable}>
      <body className="min-h-screen text-foreground">
        <RootProviders>
          <main>{children}</main>
        </RootProviders>
      </body>
    </html>
  );
}
