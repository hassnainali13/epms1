const statusConfig: Record<string, { bg: string; text: string; dot: string }> =
  {
    Installed: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    Pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    "In Production": {
      bg: "bg-blue-50",
      text: "text-blue-700",
      dot: "bg-blue-500",
    },
    "QC Review": {
      bg: "bg-violet-50",
      text: "text-violet-700",
      dot: "bg-violet-500",
    },
    "Maintenance Due": {
      bg: "bg-red-50",
      text: "text-red-700",
      dot: "bg-red-500",
    },
  };

export function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? {
    bg: "bg-slate-50",
    text: "text-slate-600",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}
