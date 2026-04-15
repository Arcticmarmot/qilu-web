type ErrorNoticeProps = {
  message: string;
};

export function ErrorNotice({ message }: ErrorNoticeProps) {
  return (
    <div className="rounded-md border border-danger/35 bg-danger/10 px-4 py-3 text-sm leading-6 text-danger">
      {message}
    </div>
  );
}
