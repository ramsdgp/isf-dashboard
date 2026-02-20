import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zinc ISF Control",
  description: "ISF Operations Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
