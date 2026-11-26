import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "食来运转 · 今天也要好好吃饭",
  description: "抽一道幸运菜，发现你的美食人格。用一点小运气，找到今天想吃的美味。家常菜谱、朋友帮选和你的饭饭日记。",
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
