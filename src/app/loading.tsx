export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-lumera-primary/20 border-t-lumera-primary" />
      <span className="text-xs text-lumera-text-muted uppercase tracking-wider font-medium">
        Loading CMS...
      </span>
    </div>
  );
}
