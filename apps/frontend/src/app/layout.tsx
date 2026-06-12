import type { Metadata } from "next";
import "./globals.css";
import { getSiteUrl } from "@/lib/public-url";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl(process.env)),
  title: "MetaMystic",
  description: "AI 命理决策辅助平台"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
