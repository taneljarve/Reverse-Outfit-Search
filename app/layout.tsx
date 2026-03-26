import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dripback",
  description: "Reverse outfit search for secondhand fashion"
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
