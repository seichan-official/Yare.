import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yare.",
  description: "プログラミング学習継続支援サービス。達成すれば¥0、やめたときだけ払う。",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
