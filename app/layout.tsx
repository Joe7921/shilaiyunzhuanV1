import type { Metadata } from "next";
import "./globals.css";
import "./journal.css";

export const metadata: Metadata = {
  title: "食来运转 · 今天一起好好吃饭",
  description: "从每日星座食签到完整菜谱，发现四季汤水、节日菜单，记录你的一餐。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
