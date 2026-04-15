type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-md border border-dashed border-line bg-transparent p-8">
      <div className="mb-5 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-accent" />
        <span className="h-px flex-1 bg-line" />
        <span className="h-2 w-2 rounded-full border border-line" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}
