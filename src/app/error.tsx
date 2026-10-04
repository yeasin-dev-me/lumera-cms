"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AlertCircle } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("CMS application error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-3 max-w-sm mx-auto">
      <div className="p-2.5 rounded-full bg-lumera-danger/10 text-lumera-danger">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-lumera-text">CMS Error Encountered</h3>
      <p className="text-xs text-lumera-text-muted">
        An unexpected error occurred in the operational interface. Please retry.
      </p>
      <Button variant="primary" size="sm" onClick={() => reset()}>
        Retry
      </Button>
    </div>
  );
}
