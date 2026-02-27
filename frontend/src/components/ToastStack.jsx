export default function ToastStack({ toasts, onClose }) {
  const toneClass = (type) => {
    if (type === "error") {
      return "border-rose-200 bg-rose-50 text-rose-900";
    }
    if (type === "success") {
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    }
    return "border-blue-200 bg-blue-50 text-blue-900";
  };

  return (
    <div className="fixed right-4 top-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`w-[320px] rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${toneClass(
            toast.type
          )}`}
        >
          <div className="flex items-start justify-between gap-2">
            <p>{toast.message}</p>
            <button
              type="button"
              onClick={() => onClose(toast.id)}
              className="rounded px-1 text-xs font-bold opacity-70 hover:opacity-100"
            >
              X
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
