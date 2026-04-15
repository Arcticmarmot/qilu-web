export function PageLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="flex items-center gap-3 text-sm text-muted">
        <span className="h-2 w-2 rounded-full bg-accent" />
        正在确认路径
      </div>
    </main>
  );
}
