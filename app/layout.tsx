import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Game Comparison",
  description: "Compare browser game generations across models."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
