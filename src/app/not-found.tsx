import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-3 max-w-sm mx-auto">
      <h1 className="text-4xl font-bold text-lumera-primary">404</h1>
      <h3 className="text-base font-semibold text-lumera-text">Module Not Found</h3>
      <p className="text-xs text-lumera-text-muted">
        The requested CMS page or resource is not available.
      </p>
      <Link href="/">
        <Button variant="primary" size="sm">Return to Dashboard</Button>
      </Link>
    </div>
  );
}
