const statusConfig: Record<string, { bg: string; text: string; dot: string }> =
  {
    Installed: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    Ready: {
      bg: "bg-cyan-50",
      text: "text-cyan-700",
      dot: "bg-cyan-500",
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
