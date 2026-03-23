type AdminStatusNoticeProps = {
  status?: string;
  message?: string;
};

export function AdminStatusNotice({ status, message }: AdminStatusNoticeProps) {
  if (!message) return null;

  const isSuccess = status === "success";

  return (
    <div
      className={
        isSuccess
          ? "rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          : "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      }
    >
      {message}
    </div>
  );
}

