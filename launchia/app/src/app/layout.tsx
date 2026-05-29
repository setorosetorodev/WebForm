import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Launchia",
  description: "Waitlist platform for upcoming products",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
