import type { Metadata } from "next";
import "@/styles/globals.css";
import { PermissionsProvider } from "@/lib/auth/permissions";
import { AdminShell } from "@/components/layout/AdminShell";

export const metadata: Metadata = {
  title: "Lumera CMS | Operations Control Center",
  description: "Administrative operational interface for Lumera E-Commerce Platform.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <PermissionsProvider>
          <AdminShell>{children}</AdminShell>
        </PermissionsProvider>
      </body>
    </html>
  );
}
