import type { Metadata } from "next";
import "@/styles/globals.css";
import { CMSAuthProvider } from "@/lib/auth/auth-context";
import { PermissionsProvider } from "@/lib/auth/permissions";
import { AdminShell } from "@/components/layout/AdminShell";

export const metadata: Metadata = {
  title: "Penguin Mart CMS | Operations Control Center",
  description: "Administrative operational interface for Penguin Mart E-Commerce Platform.",
  icons: {
    icon: [
      { url: "/penguin-mart-logo.jpg", sizes: "any" },
      { url: "/penguin-mart-logo.jpg", type: "image/jpeg" },
    ],
    shortcut: "/penguin-mart-logo.jpg",
    apple: "/penguin-mart-logo.jpg",
  },
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
        <CMSAuthProvider>
          <PermissionsProvider>
            <AdminShell>{children}</AdminShell>
          </PermissionsProvider>
        </CMSAuthProvider>
      </body>
    </html>
  );
}
