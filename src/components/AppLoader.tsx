interface AppLoaderProps {
  visible: boolean;
}

export default function AppLoader({ visible }: AppLoaderProps) {
  return (
    <div
      className={[
        "fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-all duration-700 ease-out",
        visible
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0",
      ].join(" ")}
      aria-hidden={!visible}
    >
      <div
        className={[
          "flex flex-col items-center justify-center gap-4 text-center transition-all duration-700 ease-out",
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0",
        ].join(" ")}
      >
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-[6px] border-[#16A34A]/15 bg-white shadow-[0_20px_60px_rgba(37,99,235,0.12)]">
          <div className="absolute inset-0 rounded-full border-[6px] border-transparent border-t-[#16A34A] border-r-[#2563EB] animate-spin" />
          <div className="absolute inset-[10px] rounded-full border border-[#16A34A]/10 bg-white" />
          <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#16A34A] to-[#2563EB] text-[11px] font-bold tracking-[0.22em] text-white shadow-lg">
            EPMS
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            EPMS
          </h1>
          <p className="text-sm font-medium text-slate-600 sm:text-base">
            Electrical Panel Management System
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#16A34A] sm:text-sm">
            Loading...
          </p>
        </div>
      </div>
    </div>
  );
}
