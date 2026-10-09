import type { ReactNode } from "react";

export const metadata = { title: "next-prisma guestbook" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", color: "#333", maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>{children}</body>
    </html>
  );
}
