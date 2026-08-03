import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CORE",
  description: "Role-based work management platform for assignments, approvals, blockers, and reporting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
