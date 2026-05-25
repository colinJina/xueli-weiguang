import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen text-foreground">
        <main>{children}</main>
      </body>
    </html>
  );
}
