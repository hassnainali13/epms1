import {
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Copy,
  Trash2,
  Building2,
  UserCheck,
  FolderOpen,
  Zap,
  Hash,
  QrCode,
  Settings,
  Gauge,
  Image as ImageIcon,
  FileText,
  ChevronDown,
  ChevronUp,
  Check,
  Shield,
  Activity,
  BarChart3,
  Layers,
  Cpu,
  Eye,
  ZoomIn,
  X,
  Printer,
  MoreHorizontal,
  CalendarDays,
  Tag,
  Radio,
  Monitor,
  Power,
  MapPin,
  RefreshCw,
  Upload,
  ChevronRight,
  PlugZap,
  SlidersHorizontal,
} from "lucide-react";
import api from "../lib/api";
import { useApp } from "../context/AppContext";
import type { Panel } from "../context/AppContext";
import { groupSavedInstrumentModels } from "../lib/reviewInstrumentMapping";

type Tab =
  | "overview"
  | "electrical"
  | "motors"
  | "instruments"
  | "protection"
  | "images"
  | "documents"
  | "timeline";

type PanelRecord = Panel & {
  _id?: string;
  motorConfiguration?: Array<{
    connectionType?: string;
    minHp?: string;
    maxHp?: string;
  }>;
  companyName?: string;
  updatedAt?: string;
  manufacturingDate?: string;
  installationDate?: string;
  installationLocation?: string;
  projectName?: string;
  customer?: string;
  company?: string;
  documents?: Record<string, unknown> & {
    additionalDocuments?: Array<
      | string
      | {
          url?: string;
          name?: string;
          fileUrl?: string;
          type?: string;
          size?: string;
          uploadedAt?: string;
          category?: string;
        }
    >;
  };
};

type DocumentItem = {
  id: string;
  name: string;
  fileName?: string;
  url: string;
  type?: string;
  size?: string;
  uploadedAt?: string;
  category?: string;
  icon: ElementType;
};

const STATUS_CFG: Record<
  string,
  { bg: string; text: string; border: string; dot: string }
> = {
  Installed: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  Pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  "In Production": {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  "QC Review": {
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
    dot: "bg-violet-500",
  },
  "Maintenance Due": {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
};

const MOTOR_COLOR = [
  "#0EA5E9",
  "#8B5CF6",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
];

function getDisplayValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

function formatDateValue(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getPanelBadge(panel?: PanelRecord) {
  const raw = panel?.panelType || panel?.type || "Panel";
  const shortened = raw
    .replace(/[^A-Z]/g, "")
    .slice(0, 3)
    .toUpperCase();
  return shortened || "PANEL";
}

function buildPanelRating(panel?: PanelRecord) {
  const voltage = panel?.technicalSpecs?.voltage;
  const current = panel?.technicalSpecs?.current;
  const phase = panel?.technicalSpecs?.phase;
  const powerRating = panel?.technicalSpecs?.powerRating;

  const parts = [
    powerRating ? `${powerRating} kW` : null,
    current ? `${current} A` : null,
    voltage ? `${voltage} V` : null,
    phase ? phase : null,
  ].filter(Boolean);

  return parts.length ? parts.join(" / ") : "—";
}

function buildImageList(panel?: PanelRecord) {
  if (!panel?.images)
    return [] as Array<{
      id: string;
      label: string;
      url: string;
      thumb: string;
    }>;

  const imageEntries = [
    { key: "frontImage", label: "Front Panel" },
    { key: "insideImage", label: "Inside View" },
    { key: "namePlateImage", label: "Name Plate" },
    { key: "sideImage", label: "Side View" },
  ]
    .map(({ key, label }) => {
      const value = panel.images?.[key as keyof typeof panel.images];
      if (!value) return null;
      return {
        id: `${key}-${String(value)}`,
        label,
        url: String(value),
        thumb: String(value),
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    label: string;
    url: string;
    thumb: string;
  }>;

  return imageEntries;
}

function normalizeDocumentList(
  panel?: PanelRecord,
  fallback: DocumentItem[] = [],
): DocumentItem[] {
  const fromPanel = panel?.documents?.additionalDocuments || [];
  if (Array.isArray(fromPanel) && fromPanel.length) {
    return fromPanel.map((item, index) => {
      const url =
        typeof item === "string" ? item : item?.url || item?.fileUrl || "";
      return {
        id: `${index}-${url}`,
        name:
          typeof item === "string"
            ? url.split("/").pop() || `Document ${index + 1}`
            : item?.name || `Document ${index + 1}`,
        url,
        type: typeof item === "string" ? "File" : item?.type || "File",
        size: typeof item === "string" ? "—" : item?.size || "—",
        uploadedAt: typeof item === "string" ? "—" : item?.uploadedAt || "—",
        category:
          typeof item === "string"
            ? "Uploaded Document"
            : item?.category || "Uploaded Document",
        icon: FileText,
      };
    });
  }

  return fallback;
}

function SectionCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_8px_rgba(0,0,0,0.04)] overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  right,
  accent = "#0EA5E9",
}: {
  icon: ElementType;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  accent?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-[#F1F5F9]">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: accent + "15" }}
        >
          <Icon size={16} style={{ color: accent }} />
        </div>
        <div>
          <p className="text-sm font-bold text-[#0F172A]">{title}</p>
          {subtitle && (
            <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {right}
    </div>
  );
}

function StatusBadge({
  status,
  size = "md",
}: {
  status: string;
  size?: "sm" | "md";
}) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG["Pending"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border} ${size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs"}`}
    >
      <span
        className={`rounded-full ${cfg.dot} ${size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2"}`}
      />
      {status}
    </span>
  );
}

function InfoGrid({
  rows,
}: {
  rows: { label: string; value: string; span?: boolean }[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#F1F5F9]">
      {rows.map(({ label, value, span }) => (
        <div
          key={label}
          className={`bg-white px-5 py-4 ${span ? "sm:col-span-2 lg:col-span-3" : ""}`}
        >
          <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-1">
            {label}
          </p>
          <p className="text-sm font-semibold text-[#0F172A] leading-snug">
            {value || "—"}
          </p>
        </div>
      ))}
    </div>
  );
}

const TABS: { id: Tab; label: string; icon: ElementType }[] = [
  { id: "overview", label: "Overview", icon: Layers },
  { id: "electrical", label: "Electrical", icon: Zap },
  { id: "motors", label: "Motors", icon: Settings },
  { id: "instruments", label: "Instruments", icon: SlidersHorizontal },
  { id: "protection", label: "Protection", icon: Shield },
  { id: "images", label: "Images", icon: ImageIcon },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "timeline", label: "Timeline", icon: Activity },
];

function OverviewSection({
  panel,
  currentUser,
}: {
  panel?: PanelRecord;
  currentUser?: any;
}) {
  const cards = [
    {
      icon: Building2,
      label: "Company",
      value:
        panel?.companyName ||
        (typeof panel?.company === "string" ? panel.company : undefined) ||
        currentUser?.companyName ||
        "—",
      color: "#0EA5E9",
    },
    {
      icon: UserCheck,
      label: "Customer",
      value: panel?.customer || "—",
      color: "#8B5CF6",
    },
    {
      icon: FolderOpen,
      label: "Project",
      value: panel?.projectName || "—",
      color: "#22C55E",
    },
    {
      icon: Zap,
      label: "Panel Name",
      value: panel?.panelName || panel?.name || "—",
      color: "#F59E0B",
    },
    {
      icon: Tag,
      label: "Panel Type",
      value: panel?.panelType || panel?.type || "—",
      color: "#06B6D4",
    },
    {
      icon: Gauge,
      label: "Panel Rating",
      value: buildPanelRating(panel),
      color: "#EF4444",
    },
    {
      icon: Hash,
      label: "Serial Number",
      value: panel?.panelId || panel?.id || "—",
      color: "#64748B",
    },
    {
      icon: QrCode,
      label: "QR Code",
      value: panel?.qrGenerated ? "Generated" : "Pending",
      color: "#0EA5E9",
    },
    {
      icon: Settings,
      label: "Motor Count",
      value: `${(panel?.motorConfiguration || []).length} Motors`,
      color: "#8B5CF6",
    },
    {
      icon: Cpu,
      label: "Instrument Count",
      value: `${Object.keys(panel?.technicalSpecs?.instrumentQuantities || {}).length} Items`,
      color: "#22C55E",
    },
    {
      icon: ImageIcon,
      label: "Images",
      value: `${buildImageList(panel).length} Photos`,
      color: "#F59E0B",
    },
    { icon: FileText, label: "Documents", value: `0 Files`, color: "#06B6D4" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {cards.map(({ icon: Icon, label, value, color }) => (
        <div
          key={label}
          className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow group"
        >
          <div className="flex items-start justify-between mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: color + "15" }}
            >
              <Icon size={17} style={{ color }} />
            </div>
            <ChevronRight
              size={13}
              className="text-[#CBD5E1] group-hover:text-[#94A3B8] transition-colors mt-1"
            />
          </div>
          <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className="text-sm font-bold text-[#0F172A] leading-snug">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

function ElectricalSection({ panel }: { panel?: PanelRecord }) {
  const rows = [
    {
      label: "Rated Voltage",
      value: getDisplayValue(panel?.technicalSpecs?.voltage),
    },
    {
      label: "Rated Current",
      value: getDisplayValue(panel?.technicalSpecs?.current),
    },
    { label: "Phases", value: getDisplayValue(panel?.technicalSpecs?.phase) },
    {
      label: "Frequency",
      value: getDisplayValue(panel?.technicalSpecs?.frequency),
    },
    {
      label: "Breaker Rating",
      value:
        [panel?.technicalSpecs?.mccb, panel?.technicalSpecs?.mcb]
          .filter(Boolean)
          .join(" / ") || "—",
    },
    {
      label: "Busbar Rating",
      value: getDisplayValue(panel?.technicalSpecs?.busbarRating),
    },
    {
      label: "Power Factor",
      value: getDisplayValue(panel?.technicalSpecs?.powerFactor),
    },
    {
      label: "Control Voltage",
      value: getDisplayValue(panel?.technicalSpecs?.controlVoltage),
    },
    {
      label: "IP Rating",
      value: getDisplayValue(panel?.technicalSpecs?.ipRating),
    },
    {
      label: "Enclosure Type",
      value: getDisplayValue(panel?.technicalSpecs?.enclosureMaterial),
    },
    {
      label: "Dimensions",
      value: getDisplayValue(panel?.technicalSpecs?.dimensions),
    },
    { label: "Weight", value: getDisplayValue(panel?.technicalSpecs?.weight) },
    {
      label: "Mounting Type",
      value: getDisplayValue(panel?.technicalSpecs?.mountingType),
    },
    { label: "Manufacturer", value: getDisplayValue(panel?.manufacturer) },
  ];

  return (
    <SectionCard>
      <SectionHeader
        icon={Zap}
        title="Electrical Specifications"
        subtitle="Full technical parameters of this panel"
        accent="#0EA5E9"
      />
      <InfoGrid rows={rows} />
    </SectionCard>
  );
}

function InfoCard({
  icon: Icon,
  title,
  value,
  color,
}: {
  icon: ElementType;
  title: string;
  value?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow group h-full">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: color + "15" }}
        >
          <Icon size={17} style={{ color }} />
        </div>
        <ChevronRight
          size={13}
          className="text-[#CBD5E1] group-hover:text-[#94A3B8] transition-colors mt-1"
        />
      </div>
      <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">
        {title}
      </p>
      <p className="text-sm font-bold text-[#0F172A] leading-snug">
        {value || "—"}
      </p>
    </div>
  );
}

function MotorsSection({ panel }: { panel?: PanelRecord }) {
  const motors = panel?.motorConfiguration || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#0F172A]">
            Motor Configuration
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            {motors.length} motors configured for this panel
          </p>
        </div>
        <span className="text-xs font-semibold text-[#64748B] bg-[#F1F5F9] px-3 py-1.5 rounded-lg">
          {motors.length} Total
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {motors.map((motor, i) => (
          <div
            key={`${motor.connectionType || "motor"}-${i}`}
            className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_6px_rgba(0,0,0,0.04)] overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow"
          >
            <div
              className="h-1"
              style={{ backgroundColor: MOTOR_COLOR[i % MOTOR_COLOR.length] }}
            />
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                    style={{
                      backgroundColor: MOTOR_COLOR[i % MOTOR_COLOR.length],
                    }}
                  >
                    M{String(i + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0F172A]">
                      Motor {i + 1}
                    </p>
                    <p className="text-[11px] text-[#64748B]">
                      {motor.connectionType || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { label: "Connection", value: motor.connectionType || "—" },
                  { label: "Starter", value: motor.connectionType || "—" },
                  { label: "Min HP", value: `${motor.minHp || "0"} HP` },
                  { label: "Max HP", value: `${motor.maxHp || "0"} HP` },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="bg-[#F8FAFC] rounded-xl px-3 py-2.5"
                  >
                    <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                      {label}
                    </p>
                    <p className="text-xs font-bold text-[#0F172A] mt-0.5">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InstrumentsSection({ panel }: { panel?: PanelRecord }) {
  const [showModels, setShowModels] = useState(true);
  const qtyRows = Object.entries(
    panel?.technicalSpecs?.instrumentQuantities || {},
  ).map(([category, qty]) => ({
    category,
    qty: Number(qty) || 0,
  }));

  // Use the same grouping/mapping logic the Review page relies on
  // to preserve the exact company/model mapping saved at creation time.
  // This avoids additional lookups or normalization and reuses the
  // saved data shape (company::model strings or objects).
  const modelGroups = groupSavedInstrumentModels(panel?.instrumentModels || {});

  const iconMap: Record<string, ElementType> = {
    PLC: Cpu,
    HMI: Monitor,
    Contactor: PlugZap,
    Relay: Radio,
    Ammeter: Gauge,
    Meter: BarChart3,
    Breaker: Power,
  };

  return (
    <div className="space-y-5">
      <SectionCard>
        <SectionHeader
          icon={Gauge}
          title="Instrument Quantities"
          subtitle="Total count per instrument category"
          accent="#8B5CF6"
        />
        <div className="divide-y divide-[#F8FAFC]">
          {qtyRows.map((row) => (
            <div
              key={row.category}
              className="flex items-center justify-between px-6 py-3 hover:bg-[#F8FAFC] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
                <span className="text-sm text-[#0F172A] font-medium">
                  {row.category}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-1.5 rounded-full bg-[#E5E7EB] w-24 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#8B5CF6] transition-all"
                    style={{ width: `${Math.min((row.qty / 16) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-[#0F172A] w-6 text-right">
                  {row.qty}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-6 py-3 border-t border-[#F1F5F9] bg-[#F8FAFC]">
          <span className="text-xs font-semibold text-[#64748B]">
            Total Instruments
          </span>
          <span className="text-sm font-bold text-[#8B5CF6]">
            {qtyRows.reduce((sum, row) => sum + row.qty, 0)}
          </span>
        </div>
      </SectionCard>

      <SectionCard>
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9] cursor-pointer hover:bg-[#F8FAFC] transition-colors"
          onClick={() => setShowModels(!showModels)}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#F0F9FF] flex items-center justify-center">
              <Cpu size={16} className="text-[#0EA5E9]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0F172A]">
                Instrument Models
              </p>
              <p className="text-xs text-[#64748B] mt-0.5">
                Grouped by category with company and model details
              </p>
            </div>
          </div>
          {showModels ? (
            <ChevronUp size={16} className="text-[#94A3B8]" />
          ) : (
            <ChevronDown size={16} className="text-[#94A3B8]" />
          )}
        </div>

        {showModels && (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {modelGroups.map((group) => {
              const Icon = iconMap[group.category] || Cpu;

              return (
                <div
                  key={group.category}
                  className="rounded-xl border border-[#E5E7EB] overflow-hidden"
                >
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-[#F8FAFC] border-b border-[#E5E7EB]">
                    <div className="w-6 h-6 rounded-lg bg-[#EFF6FF] flex items-center justify-center">
                      <Icon size={13} className="text-[#0EA5E9]" />
                    </div>
                    <span className="text-xs font-bold text-[#0F172A]">
                      {group.category}
                    </span>
                    <span className="ml-auto text-[10px] font-semibold text-[#64748B] bg-[#E5E7EB] px-2 py-0.5 rounded-full">
                      {group.totalCount} pcs
                    </span>
                  </div>

                  <div className="divide-y divide-[#F8FAFC]">
                    {group.items.map((item) => (
                      <div
                        key={`${group.category}-${item.company}-${item.model}`}
                        className="px-4 py-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                            {item.company}
                          </span>
                          <span className="text-[10px] font-bold text-[#0EA5E9] bg-[#E0F2FE] px-1.5 py-0.5 rounded-md whitespace-nowrap">
                            {item.count} ×
                          </span>
                        </div>
                        <div className="mt-1.5">
                          <span className="text-xs text-[#475569] leading-snug font-mono">
                            {item.model}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function ProtectionSection({ panel }: { panel?: PanelRecord }) {
  const protectionLabels: Record<string, string> = {
    overCurrentProtection: "Overcurrent Protection",
    shortCircuitProtection: "Short Circuit Protection",
    earthFaultProtection: "Earth Fault Protection",
    phaseFailureProtection: "Phase Failure Protection",
    overVoltageProtection: "Over-voltage Protection",
    underVoltageProtection: "Under-voltage Protection",
    dryRunProtection: "Dry Run Protection",
    overloadProtection: "Overload Protection",
  };

  const protections = Object.entries(panel?.technicalSpecs || {})
    .filter(([key, value]) => Boolean(value) && protectionLabels[key])
    .map(([key]) => protectionLabels[key]);

  return (
    <SectionCard>
      <SectionHeader
        icon={Shield}
        title="Protection Features"
        subtitle={`${protections.length} protection features enabled`}
        accent="#22C55E"
      />
      <div className="p-6">
        <div className="flex flex-wrap gap-2.5">
          {protections.map((p) => (
            <div
              key={p}
              className="flex items-center gap-2 bg-[#F0FDF4] border border-[#BBF7D0] text-emerald-800 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-[#DCFCE7] transition-colors"
            >
              <Check size={12} className="text-emerald-600 flex-shrink-0" />
              {p}
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function ImagesSection({
  panel,
  onDownloadAll,
}: {
  panel?: PanelRecord;
  onDownloadAll?: () => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const images = buildImageList(panel);
  const active = images[activeIdx];

  useEffect(() => {
    setActiveIdx(0);
  }, [panel?.panelId]);

  return (
    <SectionCard>
      <SectionHeader
        icon={ImageIcon}
        title="Panel Images"
        subtitle={`${images.length} high-resolution photos`}
        accent="#F59E0B"
        right={
          <button
            onClick={onDownloadAll}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#64748B] border border-[#E5E7EB] rounded-xl hover:bg-[#F8FAFC] transition-colors"
          >
            <Download size={12} /> Download All
          </button>
        }
      />
      <div className="p-6 space-y-4">
        {images.length ? (
          <>
            <div
              className="relative rounded-2xl overflow-hidden bg-[#0F172A] group"
              style={{ aspectRatio: "16/9" }}
            >
              <img
                src={active.url}
                alt={active.label}
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between w-full px-5 pb-4">
                  <div>
                    <p className="text-white text-sm font-bold">
                      {active.label}
                    </p>
                    <p className="text-white/60 text-xs">
                      {activeIdx + 1} of {images.length}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setZoom(true)}
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                    >
                      <ZoomIn size={14} />
                    </button>
                    <button
                      onClick={() =>
                        window.open(active.url, "_blank", "noopener,noreferrer")
                      }
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveIdx(i)}
                  className={`flex-shrink-0 relative rounded-xl overflow-hidden transition-all ${i === activeIdx ? "ring-2 ring-[#F59E0B] ring-offset-2" : "opacity-60 hover:opacity-90"}`}
                  style={{ width: 100, height: 70 }}
                >
                  <img
                    src={img.thumb}
                    alt={img.label}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-[#F8FAFC] p-8 text-center text-sm text-[#64748B]">
            No images have been uploaded for this panel yet.
          </div>
        )}
      </div>

      {zoom && active && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6"
          onClick={() => setZoom(false)}
        >
          <button className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <X size={18} />
          </button>
          <img
            src={active.url}
            alt={active.label}
            className="max-w-full max-h-full rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </SectionCard>
  );
}

function DocumentsSection({
  documents,
  onUpload,
}: {
  documents: DocumentItem[];
  onUpload: () => void;
}) {
  return (
    <SectionCard>
      <SectionHeader
        icon={FileText}
        title="Documents"
        subtitle={`${documents.length} files attached to this panel`}
        accent="#06B6D4"
        right={
          <button
            onClick={onUpload}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] rounded-xl transition-colors shadow-sm"
          >
            <Upload size={12} /> Upload
          </button>
        }
      />
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-[#F8FAFC] hover:bg-[#F1F5F9] rounded-2xl border border-[#E5E7EB] px-5 py-4 group transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center flex-shrink-0 shadow-sm">
              <doc.icon size={18} className="text-[#64748B]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#0F172A] break-words">
                {doc.name}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
                  {doc.category || "Uploaded Document"}
                </span>
                <span className="text-[11px] text-[#94A3B8]">
                  {doc.size || "—"}
                </span>
                <span className="text-[11px] text-[#94A3B8]">
                  · {doc.uploadedAt || "—"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() =>
                  window.open(doc.url, "_blank", "noopener,noreferrer")
                }
                className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-[#94A3B8] hover:text-[#0F172A] transition-colors"
              >
                <Eye size={13} />
              </button>
              <button
                onClick={() => {
                  const anchor = document.createElement("a");
                  anchor.href = doc.url;
                  anchor.download = doc.name;
                  anchor.click();
                }}
                className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-[#94A3B8] hover:text-[#0EA5E9] transition-colors"
              >
                <Download size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function TimelineSection() {
  return (
    <SectionCard>
      <SectionHeader
        icon={Activity}
        title="Activity Timeline"
        subtitle="Full history of changes and events"
        accent="#64748B"
      />
      <div className="p-8 text-center text-sm text-[#64748B]">
        Timeline activity is not available for this panel yet.
      </div>
    </SectionCard>
  );
}

export default function PanelDetails({ panelId }: { panelId: string }) {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [panel, setPanel] = useState<PanelRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    async function loadPanel() {
      try {
        setLoading(true);
        setError(null);
        const endpoint = currentUser
          ? `/panels/lookup/${panelId}`
          : `/panels/public/${panelId}`;
        const res = await api.get(endpoint);
        if (!mounted) return;
        const nextPanel = res.data.panel as PanelRecord;
        setPanel(nextPanel);
        setDocuments(normalizeDocumentList(nextPanel));
      } catch (err) {
        if (!mounted) return;
        setError(
          err instanceof Error ? err.message : "Unable to load panel details.",
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (panelId) loadPanel();
    return () => {
      mounted = false;
    };
  }, [panelId, currentUser]);

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.history.pushState({}, "", "/");
      window.location.reload();
    }
  };

  const handleDelete = async () => {
    if (!panel?._id && !panel?.id) return;
    try {
      await api.delete(`/panels/${panel?._id || panel?.id}`);
      window.history.pushState({}, "", "/");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete panel.");
    }
  };

  const handleDuplicate = async () => {
    if (!panel) return;
    try {
      const payload = {
        panelName: `${panel.panelName || panel.name || "Panel"} Copy`,
        panelType: panel.panelType || panel.type || "MCC",
        manufacturingDate: panel.manufacturingDate || panel.createdAt || "",
        installationDate: panel.installationDate || "",
        customer: panel.customer || "",
        installer: panel.installer || "",
        manufacturer: panel.manufacturer || "",
        installationLocation: panel.installationLocation || "",
        projectName: panel.projectName || "",
        description: panel.description || "",
        status: "Draft",
        motorConfiguration: panel.motorConfiguration || [],
        technicalSpecs: panel.technicalSpecs || {},
        images: panel.images || {},
        instrumentModels: panel.instrumentModels || {},
        documents: panel.documents || {},
      };
      const res = await api.post("/panels", payload);
      const createdId = res.data.panel?.panelId || res.data.panel?._id;
      if (createdId) {
        window.history.pushState({}, "", `/panels/${createdId}`);
        window.location.reload();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to duplicate panel.",
      );
    }
  };

  const handleUploadDocument = async (file: File | null) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/uploads/document", formData);
      const url = response.data.url as string;
      setDocuments((prev) => [
        {
          id: `${file.name}-${Date.now()}`,
          name: file.name,
          url,
          type: file.type || "File",
          size: `${(file.size / 1024).toFixed(1)} KB`,
          uploadedAt: new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          category: "Uploaded Document",
          icon: FileText,
        },
        ...prev,
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to upload document.",
      );
    }
  };

  const handleDownloadImages = () => {
    const images = buildImageList(panel || undefined);
    images.forEach((image) => {
      const anchor = document.createElement("a");
      anchor.href = image.url;
      anchor.download = `${panel?.panelId || panel?.id || "panel"}-${image.label}.jpg`;
      anchor.click();
    });
  };

  const content: Record<Tab, ReactNode> = {
    overview: (
      <>
        <OverviewSection panel={panel || undefined} currentUser={currentUser} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <InfoCard
            icon={CalendarDays}
            title="Manufactured Date"
            value={formatDateValue(panel?.manufacturingDate)}
            color="#0EA5E9"
          />
          <InfoCard
            icon={UserCheck}
            title="Manufactured By"
            value={panel?.manufacturer || "—"}
            color="#8B5CF6"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
          <InfoCard
            icon={UserCheck}
            title="Installer Name"
            value={panel?.installer || "—"}
            color="#22C55E"
          />
          <InfoCard
            icon={CalendarDays}
            title="Installation Date"
            value={formatDateValue(panel?.installationDate)}
            color="#F59E0B"
          />
          <InfoCard
            icon={MapPin}
            title="Installation Location"
            value={panel?.installationLocation || "—"}
            color="#06B6D4"
          />
        </div>
      </>
    ),
    electrical: <ElectricalSection panel={panel || undefined} />,
    motors: <MotorsSection panel={panel || undefined} />,
    instruments: <InstrumentsSection panel={panel || undefined} />,
    protection: <ProtectionSection panel={panel || undefined} />,
    images: (
      <ImagesSection
        panel={panel || undefined}
        onDownloadAll={handleDownloadImages}
      />
    ),
    documents: (
      <DocumentsSection
        documents={documents}
        onUpload={() => uploadRef.current?.click()}
      />
    ),
    timeline: <TimelineSection />,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_1px_8px_rgba(0,0,0,0.04)] px-10 py-8 text-center">
          <p className="text-sm font-semibold text-[#0F172A]">
            Loading panel details…
          </p>
          <p className="text-xs text-[#64748B] mt-2">
            Fetching the latest saved record from the backend.
          </p>
        </div>
      </div>
    );
  }

  if (error || !panel) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_1px_8px_rgba(0,0,0,0.04)] px-10 py-8 text-center max-w-md">
          <p className="text-sm font-semibold text-[#0F172A]">
            Unable to load panel details.
          </p>
          <p className="text-xs text-[#64748B] mt-2">
            {error || "The requested panel could not be located."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-[Inter,sans-serif]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="space-y-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] transition-colors group"
          >
            <ArrowLeft
              size={15}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            Back to Panels
          </button>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_8px_rgba(0,0,0,0.04)] p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap mb-3">
                  <span className="text-[11px] font-bold text-[#0EA5E9] bg-[#E0F2FE] border border-[#BAE6FD] px-2.5 py-1 rounded-lg uppercase tracking-wide">
                    {getPanelBadge(panel)}
                  </span>
                  <StatusBadge status={panel.status || "Pending"} />
                  <span className="text-[11px] font-mono font-semibold text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-lg break-words">
                    {panel.panelId || panel.id || "—"}
                  </span>
                </div>

                <h1 className="text-xl lg:text-2xl font-bold text-[#0F172A] tracking-tight leading-tight mb-2">
                  {panel.panelName || panel.name || "Untitled Panel"}
                </h1>

                <div className="flex items-center gap-5 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                    <CalendarDays size={12} className="text-[#94A3B8]" />{" "}
                    Created {formatDateValue(panel.createdAt)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                    <RefreshCw size={11} className="text-[#94A3B8]" /> Updated{" "}
                    {formatDateValue(panel.updatedAt || panel.createdAt)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                    <MapPin size={11} className="text-[#94A3B8]" />{" "}
                    {getDisplayValue(panel.installationLocation)}
                  </div>
                </div>
              </div>

              <div className="hidden sm:flex flex-wrap items-center gap-2 justify-end lg:justify-end">
                <button
                  onClick={() => {
                    const rows = [
                      ["Panel ID", panel.panelId || panel.id || ""],
                      ["Panel Name", panel.panelName || panel.name || ""],
                      ["Panel Type", panel.panelType || panel.type || ""],
                      ["Status", panel.status || ""],
                      ["Customer", panel.customer || ""],
                      ["Project", panel.projectName || ""],
                      ["Location", panel.installationLocation || ""],
                    ];
                    const csv = rows.map((row) => row.join(",")).join("\n");
                    const blob = new Blob([csv], {
                      type: "text/csv;charset=utf-8;",
                    });
                    const anchor = document.createElement("a");
                    anchor.href = URL.createObjectURL(blob);
                    anchor.download = `${panel.panelId || panel.id || "panel"}.csv`;
                    anchor.click();
                    URL.revokeObjectURL(anchor.href);
                  }}
                  className="flex items-center gap-2 h-9 px-4 text-xs font-semibold text-[#475569] bg-white border border-[#E5E7EB] rounded-xl hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all"
                >
                  <FileSpreadsheet size={13} /> Excel
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 h-9 px-4 text-xs font-semibold text-[#475569] bg-white border border-[#E5E7EB] rounded-xl hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all"
                >
                  <Download size={13} /> PDF
                </button>
                <button
                  onClick={handleDuplicate}
                  className="flex items-center gap-2 h-9 px-4 text-xs font-semibold text-[#475569] bg-white border border-[#E5E7EB] rounded-xl hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all"
                >
                  <Copy size={13} /> Duplicate
                </button>
                <div className="relative">
                  <button
                    onClick={() => setMoreOpen(!moreOpen)}
                    className="w-9 h-9 flex items-center justify-center text-[#64748B] border border-[#E5E7EB] bg-white rounded-xl hover:bg-[#F8FAFC] transition-colors"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  {moreOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMoreOpen(false)}
                      />
                      <div className="absolute right-0 top-11 z-50 w-44 bg-white border border-[#E5E7EB] rounded-xl shadow-xl py-1.5">
                        <button
                          onClick={() => window.print()}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
                        >
                          <Printer size={13} className="text-[#64748B]" /> Print
                          Panel
                        </button>
                        <button
                          onClick={() =>
                            panel?.qrUrl &&
                            window.open(
                              panel.qrUrl,
                              "_blank",
                              "noopener,noreferrer",
                            )
                          }
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
                        >
                          <RefreshCw size={13} className="text-[#64748B]" />{" "}
                          Open QR Link
                        </button>
                        <div className="border-t border-[#F1F5F9] my-1" />
                        <button
                          onClick={() => {
                            setMoreOpen(false);
                            setShowDeleteConfirm(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={13} /> Delete Panel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-[#F1F5F9] grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: "Motors",
                  value: (panel.motorConfiguration || []).length,
                  icon: Settings,
                  color: "#0EA5E9",
                },
                {
                  label: "Instruments",
                  value: Object.keys(
                    panel.technicalSpecs?.instrumentQuantities || {},
                  ).length,
                  icon: Cpu,
                  color: "#8B5CF6",
                },
                {
                  label: "Images",
                  value: buildImageList(panel).length,
                  icon: ImageIcon,
                  color: "#F59E0B",
                },
                {
                  label: "Documents",
                  value: documents.length,
                  icon: FileText,
                  color: "#22C55E",
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: color + "15" }}
                  >
                    <Icon size={15} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-base font-bold text-[#0F172A]">
                      {value}
                    </p>
                    <p className="text-[11px] text-[#64748B]">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_6px_rgba(0,0,0,0.04)] p-1.5">
          <div className="flex gap-1 overflow-x-auto px-1 py-1">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${active ? "bg-[#0EA5E9] text-white shadow-sm shadow-[#0EA5E9]/25" : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"}`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div>{content[activeTab]}</div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-[#E5E7EB] p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h2 className="text-base font-bold text-[#0F172A] text-center mb-1">
              Delete Panel?
            </h2>
            <p className="text-xs text-[#64748B] text-center mb-5 leading-relaxed">
              This will permanently delete{" "}
              <span className="font-semibold text-[#0F172A]">
                {panel.panelId || panel.id || "this panel"}
              </span>{" "}
              and all associated documents, images, and QR codes. This action
              cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-10 text-sm font-semibold text-[#475569] border border-[#E5E7EB] rounded-xl hover:bg-[#F8FAFC] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 h-10 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
              >
                Delete Panel
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={uploadRef}
        type="file"
        className="hidden"
        onChange={(event) =>
          handleUploadDocument(event.target.files?.[0] || null)
        }
      />
    </div>
  );
}
