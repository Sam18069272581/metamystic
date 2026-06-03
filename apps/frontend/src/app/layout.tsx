import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
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
