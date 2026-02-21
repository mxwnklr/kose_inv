import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Local Invoice Studio",
  description: "Local-first invoice generator with PDF + XRechnung export"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
