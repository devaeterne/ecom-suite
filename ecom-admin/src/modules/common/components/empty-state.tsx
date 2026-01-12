export function EmptyState(props: { title: string; body?: string; action?: React.ReactNode }) {
  const { title, body, action } = props;

  return (
    <div className="rounded-xl border p-8 text-center">
      <div className="mx-auto max-w-md">
        <h3 className="text-base font-semibold">{title}</h3>
        {body ? <p className="mt-2 text-sm text-muted-foreground">{body}</p> : null}
        {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}
