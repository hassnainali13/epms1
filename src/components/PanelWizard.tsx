import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Building2,
  MapPin,
  User,
  Calendar,
  FileText,
  Cpu,
  Zap,
  ClipboardList,
  Camera,
  Eye,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Info,
  Factory,
  Package,
  ShieldCheck,
} from "lucide-react";
import api from "../lib/api";
import { useApp } from "../context/AppContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  // Step 1 — Basic Info
  panelName: string;
  panelType: string;
  customerCompany: string;
  projectName: string;
  installationLocation: string;
  manufacturerName: string;
  installerName: string;
  installationDate: string;
  panelStatus: string;
  description: string;
  manufacturingDate: string;

  // Step 2 — Technical Specs
  voltage: string;
  current: string;
  frequency: string;
  phase: string;
  instrumentCategoryQuantities: Record<string, string>;
  motorConfiguration: Array<{
    connectionType: string;
    minHp: string;
    maxHp: string;
  }>;
  powerRating: string;
  powerFactor: string;
  tpBreaker: string;
  spBreaker: string;
  mccb: string;
  mcb: string;
  fuseRating: string;
  plc: string;
  hmi: string;
  relay: string;
  contactor: string;
  vfd: string;
  softStarter: string;
  timer: string;
  overloadRelay: string;
  digitalMeter: string;
  cableDuct: string;
  terminalBlock: string;
  autoManualSelectorSwitch: string;
  smps: string;
  controlTransformer: string;
  startPushButton: string;
  stopPushButton: string;
  emergencyStop: string;
  selectorSwitch: string;
  indicatorLamps: string;
  busbarRating: string;
  busbarMaterial: string;
  cableSize: string;
  controlCableSize: string;
  overCurrentProtection: boolean;
  shortCircuitProtection: boolean;
  earthFaultProtection: boolean;
  phaseFailureProtection: boolean;
  overVoltageProtection: boolean;
  underVoltageProtection: boolean;
  dryRunProtection: boolean;
  overloadProtection: boolean;
  controlVoltage: string;
  protectionType: string;
  ipRating: string;
  enclosureMaterial: string;
  panelColor: string;
  dimensions: string;
  weight: string;
  mountingType: string;
  drawingNumber: string;
  revision: string;

  // Step 3 — Images
  frontImage: File | null;
  insideImage: File | null;
  namePlateImage: File | null;
  sideImage: File | null;
}

const INITIAL: FormData = {
  panelName: "",
  panelType: "",
  customerCompany: "",
  projectName: "",
  installationLocation: "",
  manufacturerName: "",
  installerName: "",
  installationDate: "",
  panelStatus: "Draft",
  description: "",
  manufacturingDate: new Date().toISOString().split("T")[0],

  voltage: "",
  current: "",
  phase: "",
  frequency: "50",
  instrumentCategoryQuantities: {},
  motorConfiguration: [],
  powerRating: "",
  powerFactor: "",
  tpBreaker: "",
  spBreaker: "",
  mccb: "",
  mcb: "",
  fuseRating: "",
  plc: "",
  hmi: "",
  relay: "",
  contactor: "",
  vfd: "",
  softStarter: "",
  timer: "",
  overloadRelay: "",
  digitalMeter: "0",
  cableDuct: "0",
  terminalBlock: "0",
  autoManualSelectorSwitch: "0",
  smps: "",
  controlTransformer: "",
  startPushButton: "",
  stopPushButton: "",
  emergencyStop: "",
  selectorSwitch: "",
  indicatorLamps: "",
  busbarRating: "",
  busbarMaterial: "",
  cableSize: "",
  controlCableSize: "",
  overCurrentProtection: false,
  shortCircuitProtection: false,
  earthFaultProtection: false,
  phaseFailureProtection: false,
  overVoltageProtection: false,
  underVoltageProtection: false,
  dryRunProtection: false,
  overloadProtection: false,
  controlVoltage: "",
  protectionType: "",
  ipRating: "",
  enclosureMaterial: "",
  panelColor: "",
  dimensions: "",
  weight: "",
  mountingType: "",
  drawingNumber: "",
  revision: "",

  frontImage: null,
  insideImage: null,
  namePlateImage: null,
  sideImage: null,
};

const PANEL_TYPES = [
  "MCC (Motor Control Center)",
  "Distribution Board",
  "PLC Control Panel",
  "HV Switchgear",
  "LV Switchgear",
  "Power Factor Correction",
  "Bus Duct Panel",
  "Transfer Switch Panel",
  "Lighting Control Panel",
  "Feeder Pillar",
];

const PANEL_STATUSES = [
  "Draft",
  "In Production",
  "QC Review",
  "Ready",
  "Installed",
  "Maintenance Due",
];
const IP_RATINGS = [
  "IP20",
  "IP30",
  "IP40",
  "IP44",
  "IP54",
  "IP55",
  "IP65",
  "IP66",
  "IP67",
];
const PHASES = ["Single Phase", "Three Phase"];
const MOUNTING_TYPES = [
  "Wall Mounted",
  "Floor Standing",
  "Flush Mount",
  "Pole Mount",
  "Rack Mount",
  "Surface Mount",
  "DIN Rail",
];
const PANEL_COLORS = ["Blue", "Grey", "Black", "White", "Custom"];
const ENCLOSURE_MATERIALS = [
  "CRCA",
  "Stainless Steel",
  "Aluminium",
  "Mild Steel",
  "Polycarbonate",
];
const MOTOR_CONNECTION_TYPES = [
  "DOL",
  "Star-Delta",
  "Soft Starter",
  "VFD",
  "Reversing Starter",
  "Auto Transformer",
  "Rotor Resistance Starter",
  "PLC Controlled",
  "Manual",
  "Custom",
];

const BASE_STEPS = [
  { id: 1, label: "Basic Information", icon: ClipboardList },
  { id: 2, label: "Technical Specs", icon: Cpu },
  { id: 3, label: "Instrument Models", icon: Zap },
  { id: 4, label: "Images", icon: Camera },
  { id: 5, label: "Review", icon: Eye },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeCategorySelectionKey(category: string) {
  return category
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-semibold text-[#0F172A] mb-1.5 tracking-wide">
      {children}
      {required && <span className="text-[#1DA1F2] ml-0.5">*</span>}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly,
  icon: Icon,
  min,
  step,
  inputMode,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
  icon?: React.ElementType;
  min?: string;
  step?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div className="relative">
      {Icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon size={15} className="text-[#94A3B8]" />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        readOnly={readOnly}
        min={min}
        step={step}
        inputMode={inputMode}
        className={`w-full h-11 text-sm rounded-xl border transition-all outline-none
          ${Icon ? "pl-10" : "pl-4"} pr-4
          ${
            readOnly
              ? "bg-[#F8FAFC] border-[#E5E7EB] text-[#64748B] cursor-not-allowed"
              : "bg-white border-[#E5E7EB] text-[#0F172A] placeholder:text-[#C0CCDA] focus:border-[#1DA1F2] focus:ring-3 focus:ring-[#1DA1F2]/10 hover:border-[#CBD5E1]"
          }`}
      />
      {readOnly && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 rounded-full bg-[#E5E7EB] flex items-center justify-center">
            <Info size={9} className="text-[#94A3B8]" />
          </div>
        </div>
      )}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
  icon: Icon,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="relative">
      {Icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          <Icon size={15} className="text-[#94A3B8]" />
        </div>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-11 text-sm rounded-xl border border-[#E5E7EB] bg-white text-[#0F172A] transition-all outline-none appearance-none
          ${Icon ? "pl-10" : "pl-4"} pr-9
          focus:border-[#1DA1F2] focus:ring-3 focus:ring-[#1DA1F2]/10 hover:border-[#CBD5E1]
          ${!value ? "text-[#C0CCDA]" : ""}`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
        <ChevronDown size={14} className="text-[#94A3B8]" />
      </div>
    </div>
  );
}

function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  icon: Icon,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  icon?: React.ElementType;
  disabled?: boolean;
}) {
  const listId = useRef(`searchable-${Math.random().toString(36).slice(2)}`);

  return (
    <div className="relative">
      {Icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          <Icon size={15} className="text-[#94A3B8]" />
        </div>
      )}
      <input
        list={listId.current}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full h-11 text-sm rounded-xl border transition-all outline-none
          ${Icon ? "pl-10" : "pl-4"} pr-10
          ${
            disabled
              ? "bg-[#F8FAFC] border-[#E5E7EB] text-[#64748B] cursor-not-allowed"
              : "bg-white border-[#E5E7EB] text-[#0F172A] placeholder:text-[#C0CCDA] focus:border-[#1DA1F2] focus:ring-3 focus:ring-[#1DA1F2]/10 hover:border-[#CBD5E1]"
          }`}
      />
      <datalist id={listId.current}>
        {options.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
        <ChevronDown size={14} className="text-[#94A3B8]" />
      </div>
    </div>
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full text-sm rounded-xl border border-[#E5E7EB] bg-white text-[#0F172A] placeholder:text-[#C0CCDA] px-4 py-3 transition-all outline-none resize-none focus:border-[#1DA1F2] focus:ring-3 focus:ring-[#1DA1F2]/10 hover:border-[#CBD5E1]"
    />
  );
}

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-[#1DA1F2]" />
      </div>
      <div>
        <p className="text-sm font-bold text-[#0F172A]">{title}</p>
        {subtitle && (
          <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────

function Step1({
  data,
  set,
}: {
  data: FormData;
  set: (k: keyof FormData, v: any) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Panel Identity */}
      <div>
        <SectionTitle
          icon={Package}
          title="Panel Identity"
          subtitle="Core identification details for this panel"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <Label required>Panel Name</Label>
            <Input
              value={data.panelName}
              onChange={(v) => set("panelName", v)}
              placeholder="e.g. MCC Panel 400A — Building A"
              icon={Zap}
            />
          </div>
          <div>
            <Label required>Panel Type</Label>
            <Select
              value={data.panelType}
              onChange={(v) => set("panelType", v)}
              options={PANEL_TYPES}
              placeholder="Select panel type"
              icon={Cpu}
            />
          </div>
          <div>
            <Label required>Panel Status</Label>
            <Select
              value={data.panelStatus}
              onChange={(v) => set("panelStatus", v)}
              options={PANEL_STATUSES}
              icon={CheckCircle2}
            />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#F1F5F9]" />

      {/* Project & Customer */}
      <div>
        <SectionTitle
          icon={Building2}
          title="Project & Customer"
          subtitle="Assign this panel to a project and customer account"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Label required>Customer Company</Label>
            <Input
              value={data.customerCompany}
              onChange={(v) => set("customerCompany", v)}
              placeholder="e.g. Siemens Gulf LLC"
              icon={Building2}
            />
          </div>
          <div>
            <Label required>Project Name</Label>
            <Input
              value={data.projectName}
              onChange={(v) => set("projectName", v)}
              placeholder="e.g. Dubai Metro Extension"
              icon={FileText}
            />
          </div>
          <div className="md:col-span-2">
            <Label required>Installation Location</Label>
            <Input
              value={data.installationLocation}
              onChange={(v) => set("installationLocation", v)}
              placeholder="e.g. Building A, Electrical Room, Floor 3 — Dubai, UAE"
              icon={MapPin}
            />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#F1F5F9]" />

      {/* Manufacturer & Installation */}
      <div>
        <SectionTitle
          icon={Factory}
          title="Manufacturer & Installation"
          subtitle="Personnel and schedule information"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Label>Manufacturer Name</Label>
            <Input
              value={data.manufacturerName}
              onChange={(v) => set("manufacturerName", v)}
              placeholder="e.g. ElectraPanel Industries"
              icon={Factory}
            />
          </div>
          <div>
            <Label>Installer Name</Label>
            <Input
              value={data.installerName}
              onChange={(v) => set("installerName", v)}
              placeholder="e.g. Ahmed Al-Rashidi"
              icon={User}
            />
          </div>
          <div>
            <Label>Installation Date</Label>
            <Input
              value={data.installationDate}
              onChange={(v) => set("installationDate", v)}
              type="date"
              icon={Calendar}
            />
          </div>
          <div>
            <Label>Manufacturing Date</Label>
            <div className="relative">
              <Input value={data.manufacturingDate} readOnly icon={Calendar} />
              <div className="absolute -top-0.5 right-0">
                <span className="text-[10px] font-medium text-[#94A3B8] bg-[#F1F5F9] px-2 py-0.5 rounded-md">
                  Auto-filled
                </span>
              </div>
            </div>
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={data.description}
              onChange={(v) => set("description", v)}
              placeholder="Optional: Describe this panel's purpose, configuration, or any special notes..."
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────

function Step2({
  data,
  set,
  instrumentCategories,
}: {
  data: FormData;
  set: (k: keyof FormData, v: any) => void;
  instrumentCategories: string[];
}) {
  const toggle = (key: keyof FormData) => {
    set(key, !data[key]);
  };

  const normalizeQuantityValue = (value: string) => {
    const sanitized = value.replace(/[^0-9]/g, "");
    if (!sanitized) return "0";
    return String(Math.max(0, Number.parseInt(sanitized, 10) || 0));
  };

  const setInstrumentCategoryQuantity = (category: string, value: string) => {
    const nextQuantities = {
      ...(data.instrumentCategoryQuantities || {}),
      [category]: normalizeQuantityValue(value),
    };
    set("instrumentCategoryQuantities", nextQuantities);
  };

  const setMotorCount = (value: string) => {
    const count = Math.max(
      0,
      Number.parseInt(normalizeQuantityValue(value), 10) || 0,
    );
    const nextConfiguration = Array.from({ length: count }, (_, index) => {
      const existing = data.motorConfiguration?.[index] || {};
      return {
        connectionType: existing.connectionType || "DOL",
        minHp: existing.minHp || "5",
        maxHp: existing.maxHp || "15",
      };
    });
    set("motorConfiguration", nextConfiguration);
  };

  const updateMotorConfiguration = (
    index: number,
    field: "connectionType" | "minHp" | "maxHp",
    value: string,
  ) => {
    const nextConfiguration = [...(data.motorConfiguration || [])];
    nextConfiguration[index] = {
      ...(nextConfiguration[index] || {}),
      [field]:
        field === "connectionType" ? value : normalizeQuantityValue(value),
    };
    set("motorConfiguration", nextConfiguration);
  };

  return (
    <div className="space-y-8">
      <div>
        <SectionTitle
          icon={Zap}
          title="Electrical Specifications"
          subtitle="Rated electrical parameters for this panel"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Label>Voltage (V)</Label>
            <Input
              value={data.voltage}
              onChange={(v) => set("voltage", v)}
              placeholder="e.g. 415"
              icon={Zap}
            />
          </div>
          <div>
            <Label>Current (A)</Label>
            <Input
              value={data.current}
              onChange={(v) => set("current", v)}
              placeholder="e.g. 400"
              icon={Zap}
            />
          </div>
          <div>
            <Label>Frequency (Hz)</Label>
            <Select
              value={data.frequency}
              onChange={(v) => set("frequency", v)}
              options={["50", "60"]}
            />
          </div>
          <div>
            <Label>Phase</Label>
            <Select
              value={data.phase}
              onChange={(v) => set("phase", v)}
              options={PHASES}
              placeholder="Select phase"
            />
          </div>
          <div>
            <Label>Power Rating (kW)</Label>
            <Input
              value={data.powerRating}
              onChange={(v) => set("powerRating", v)}
              placeholder="e.g. 75"
              icon={Cpu}
            />
          </div>
          <div>
            <Label>Power Factor</Label>
            <Input
              value={data.powerFactor}
              onChange={(v) => set("powerFactor", v)}
              placeholder="e.g. 0.95"
              icon={Cpu}
            />
          </div>
          <div>
            <Label>Control Voltage</Label>
            <Input
              value={data.controlVoltage}
              onChange={(v) => set("controlVoltage", v)}
              placeholder="e.g. 24V DC"
              icon={Zap}
            />
          </div>
          <div>
            <Label>IP Rating</Label>
            <Select
              value={data.ipRating}
              onChange={(v) => set("ipRating", v)}
              options={IP_RATINGS}
              placeholder="Select IP rating"
            />
          </div>
          <div>
            <Label>Enclosure Material</Label>
            <Select
              value={data.enclosureMaterial}
              onChange={(v) => set("enclosureMaterial", v)}
              options={ENCLOSURE_MATERIALS}
              placeholder="Select material"
            />
          </div>
          <div>
            <Label>Panel Color</Label>
            <Select
              value={data.panelColor}
              onChange={(v) => set("panelColor", v)}
              options={PANEL_COLORS}
              placeholder="Select color"
            />
          </div>
          <div>
            <Label>Dimensions (L × W × H mm)</Label>
            <Input
              value={data.dimensions}
              onChange={(v) => set("dimensions", v)}
              placeholder="e.g. 2000 × 800 × 600"
              icon={Package}
            />
          </div>
          <div>
            <Label>Weight (kg)</Label>
            <Input
              value={data.weight}
              onChange={(v) => set("weight", v)}
              placeholder="e.g. 185"
              icon={Package}
            />
          </div>
          <div>
            <Label>Mounting Type</Label>
            <Select
              value={data.mountingType}
              onChange={(v) => set("mountingType", v)}
              options={MOUNTING_TYPES}
              placeholder="Select mounting"
            />
          </div>
          <div>
            <Label>Cable Size</Label>
            <Input
              value={data.cableSize}
              onChange={(v) => set("cableSize", v)}
              placeholder="e.g. 3x70 mm²"
              icon={FileText}
            />
          </div>
          <div>
            <Label>Control Cable Size</Label>
            <Input
              value={data.controlCableSize}
              onChange={(v) => set("controlCableSize", v)}
              placeholder="e.g. 2x2.5 mm²"
              icon={FileText}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-[#F1F5F9]" />

      <div>
        <SectionTitle
          icon={Factory}
          title="Motor Configuration"
          subtitle="Define the starter type and HP range for each motor"
        />
        <div className="space-y-4">
          <div>
            <Label>Number of Motors</Label>
            <Input
              value={String(data.motorConfiguration?.length || 0)}
              onChange={setMotorCount}
              placeholder="0"
              icon={Factory}
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
            />
          </div>
          {data.motorConfiguration?.map((motor, index) => (
            <div
              key={`motor-${index}`}
              className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-full bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center text-xs font-semibold">
                  {index + 1}
                </div>
                <p className="text-sm font-semibold text-[#0F172A]">
                  Motor {index + 1}
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Connection Type</Label>
                  <Select
                    value={motor.connectionType || "DOL"}
                    onChange={(value) =>
                      updateMotorConfiguration(index, "connectionType", value)
                    }
                    options={MOTOR_CONNECTION_TYPES}
                    placeholder="Select connection type"
                  />
                </div>
                <div>
                  <Label>Minimum HP</Label>
                  <Input
                    value={motor.minHp || "0"}
                    onChange={(value) =>
                      updateMotorConfiguration(index, "minHp", value)
                    }
                    placeholder="0"
                    icon={Zap}
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <Label>Maximum HP</Label>
                  <Input
                    value={motor.maxHp || "0"}
                    onChange={(value) =>
                      updateMotorConfiguration(index, "maxHp", value)
                    }
                    placeholder="0"
                    icon={Zap}
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {instrumentCategories.length > 0 && (
        <>
          <div className="border-t border-[#F1F5F9]" />

          <div>
            <SectionTitle
              icon={Package}
              title="Instrument Quantities"
              subtitle="Quantities are pulled from Instrument Master categories"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {instrumentCategories.map((category) => (
                <div key={category}>
                  <Label>{category}</Label>
                  <Input
                    value={data.instrumentCategoryQuantities?.[category] || "0"}
                    onChange={(v) => setInstrumentCategoryQuantity(category, v)}
                    placeholder="0"
                    icon={Package}
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="border-t border-[#F1F5F9]" />

      <div>
        <SectionTitle
          icon={ShieldCheck}
          title="Protection Features"
          subtitle="Select enabled protection functions"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            ["overCurrentProtection", "Over Current Protection"],
            ["shortCircuitProtection", "Short Circuit Protection"],
            ["earthFaultProtection", "Earth Fault Protection"],
            ["phaseFailureProtection", "Phase Failure Protection"],
            ["overVoltageProtection", "Over Voltage Protection"],
            ["underVoltageProtection", "Under Voltage Protection"],
            ["dryRunProtection", "Dry Run Protection"],
            ["overloadProtection", "Overload Protection"],
          ].map(([key, label]) => (
            <label
              key={key}
              className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm text-[#0F172A]"
            >
              <input
                type="checkbox"
                checked={Boolean(data[key as keyof FormData])}
                onChange={() => toggle(key as keyof FormData)}
                className="h-4 w-4 rounded border-[#CBD5E1] text-[#1DA1F2] focus:ring-[#1DA1F2]"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────

function ImageUploadZone({
  label,
  hint,
  file,
  onFile,
  accept,
  icon: Icon,
}: {
  label: string;
  hint: string;
  file: File | null;
  onFile: (f: File | null) => void;
  accept: string;
  icon: React.ElementType;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview =
    file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null;

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {file ? (
        <div className="relative rounded-xl border-2 border-[#1DA1F2]/30 bg-[#F0F9FF] overflow-hidden">
          {preview ? (
            <img
              src={preview}
              alt={label}
              className="w-full h-40 object-cover"
            />
          ) : (
            <div className="h-40 flex flex-col items-center justify-center gap-2">
              <FileText size={28} className="text-[#1DA1F2]" />
              <p className="text-xs font-medium text-[#0369A1]">{file.name}</p>
              <p className="text-[11px] text-[#64748B]">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          )}
          <button
            onClick={() => onFile(null)}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-[#64748B] hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <X size={13} />
          </button>
          <div className="absolute bottom-2 left-2 bg-white/90 rounded-lg px-2 py-1">
            <p className="text-[10px] font-medium text-[#0369A1] truncate max-w-[140px]">
              {file.name}
            </p>
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="h-40 rounded-xl border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#1DA1F2] hover:bg-[#F0F9FF] transition-all flex flex-col items-center justify-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E2E8F0] group-hover:bg-[#DBEAFE] flex items-center justify-center transition-colors">
            <Icon
              size={18}
              className="text-[#94A3B8] group-hover:text-[#1DA1F2] transition-colors"
            />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-[#475569] group-hover:text-[#1DA1F2] transition-colors">
              Click to upload
            </p>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">{hint}</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E5E7EB] text-xs font-medium text-[#64748B] group-hover:border-[#1DA1F2] group-hover:text-[#1DA1F2] transition-colors">
            <Upload size={11} />
            Browse Files
          </div>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

function Step3({
  data,
  set,
}: {
  data: FormData;
  set: (k: keyof FormData, v: any) => void;
}) {
  return (
    <div className="space-y-8">
      <SectionTitle
        icon={Camera}
        title="Panel Images"
        subtitle="Upload photos for this panel"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ImageUploadZone
          label="Front Image"
          hint="JPG, PNG, WEBP · Max 10MB"
          file={data.frontImage}
          onFile={(f) => set("frontImage", f)}
          accept="image/*"
          icon={Camera}
        />
        <ImageUploadZone
          label="Inside Image"
          hint="JPG, PNG, WEBP · Max 10MB"
          file={data.insideImage}
          onFile={(f) => set("insideImage", f)}
          accept="image/*"
          icon={Camera}
        />
        <ImageUploadZone
          label="Name Plate Image"
          hint="JPG, PNG, WEBP · Max 10MB"
          file={data.namePlateImage}
          onFile={(f) => set("namePlateImage", f)}
          accept="image/*"
          icon={FileText}
        />
        <ImageUploadZone
          label="Side Image"
          hint="JPG, PNG, WEBP · Max 10MB"
          file={data.sideImage}
          onFile={(f) => set("sideImage", f)}
          accept="image/*"
          icon={FileText}
        />
      </div>
      <div className="flex items-start gap-3 bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl px-4 py-3.5">
        <Info size={15} className="text-[#1DA1F2] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-[#0369A1]">
            Images are optional but recommended
          </p>
          <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
            These images are uploaded securely and stored with the panel record.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── New Step: Instrument Models (Company Admin) ─────────────────────────────

function PremiumUpgradeCard() {
  return (
    <div className="flex min-h-[420px] items-center justify-center px-2">
      <div className="w-full max-w-2xl rounded-3xl border border-[#E5E7EB] bg-gradient-to-br from-[#F8FAFC] via-white to-[#F0F9FF] p-8 text-center shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DBEAFE]">
          <ShieldCheck size={24} className="text-[#1DA1F2]" />
        </div>
        <h3 className="text-lg font-semibold text-[#0F172A]">
          Instrument Models is a Premium Feature
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#64748B]">
          Upgrade to Premium to select instrument manufacturers and models,
          improve documentation, and generate complete panel specifications.
        </p>
        <button
          type="button"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#1DA1F2] px-6 text-sm font-semibold text-white shadow-sm shadow-[#1DA1F2]/20 transition-all hover:bg-[#1a91da]"
        >
          Upgrade to Premium
        </button>
      </div>
    </div>
  );
}

function StepInstrumentModels({
  data,
  instrumentList,
  instrumentCategories,
  selections,
  setSelections,
}: {
  data: FormData;
  instrumentList: any[];
  instrumentCategories: string[];
  selections: Record<string, { company?: string; model?: string }[]>;
  setSelections: (
    s: Record<string, { company?: string; model?: string }[]>,
  ) => void;
}) {
  // derive categories to show based on technical specs quantities
  const categoriesToShow = instrumentCategories
    .map((category) => ({
      label: category,
      key: normalizeCategorySelectionKey(category),
    }))
    .filter((category) => {
      const qty = Number(
        data.instrumentCategoryQuantities?.[category.label] || "0",
      );
      return qty > 0;
    });

  // ensure selection arrays are initialized to correct lengths
  useEffect(() => {
    const next = { ...selections } as Record<
      string,
      { company?: string; model?: string }[]
    >;
    let changed = false;
    categoriesToShow.forEach((cat) => {
      const qty = Number(data.instrumentCategoryQuantities?.[cat.label] || 0);
      const arr = next[cat.key] || [];
      if (arr.length !== qty) {
        next[cat.key] = Array.from({ length: qty }, (_, i) => arr[i] || {});
        changed = true;
      }
    });
    if (changed) setSelections(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    JSON.stringify(
      categoriesToShow.map(
        (c) =>
          c.key + String(data.instrumentCategoryQuantities?.[c.label] || ""),
      ),
    ),
    selections,
  ]);

  // Use `company` field from the API as the single source of truth.
  const companiesForCategory = (label: string) => {
    const set = new Set<string>();
    instrumentList.forEach((it) => {
      if (!it) return;
      if ((it.status || "").toLowerCase() !== "active") return;
      const cat = String(it.category || "").toLowerCase();
      if (cat !== label.toLowerCase()) return;
      const manu = String(it.company || "").trim();
      if (manu) set.add(manu);
    });
    const companies = Array.from(set).sort((a, b) => a.localeCompare(b));
    if (companies.length === 0) {
      console.warn(
        `No companies found for category ${label}. Check instrument data or category casing.`,
      );
    } else {
      console.log(`Companies for category ${label}:`, companies.slice(0, 50));
    }
    return companies;
  };

  const modelsForCategoryAndCompany = (label: string, company?: string) => {
    const models = instrumentList
      .filter((it) => {
        if (!it) return false;
        if ((it.status || "").toLowerCase() !== "active") return false;
        const cat = String(it.category || "").toLowerCase();
        if (cat !== label.toLowerCase()) return false;
        if (company)
          return (
            String(it.company || "")
              .trim()
              .toLowerCase() ===
            String(company || "")
              .trim()
              .toLowerCase()
          );
        return true;
      })
      .map((it) => String(it.name || "").trim())
      .filter(Boolean) as string[];
    // dedupe and sort models
    const uniqueModels = Array.from(new Set(models)).sort((a, b) =>
      a.localeCompare(b),
    );
    if (uniqueModels.length === 0) {
      console.warn(
        `No models found for company=${company || "<any>"} category=${label}`,
      );
    } else {
      console.log(
        `Models for ${company || "<any>"} ${label}:`,
        uniqueModels.slice(0, 50),
      );
    }
    return uniqueModels;
  };

  // debug: log filtered models when company selection changes
  useEffect(() => {
    try {
      console.log("Total Instruments:", instrumentList.length);
      categoriesToShow.forEach((cat) => {
        console.log("Selected Category:", cat.label);
        const companies = instrumentList
          .filter((i) => (i.status || "").toLowerCase() === "active")
          .filter(
            (i) =>
              String(i.category || "").toLowerCase() ===
              cat.label.toLowerCase(),
          )
          .map((i) => i.company)
          .filter(Boolean);
        console.log("Companies:", companies);

        const selArr = selections[cat.key] || [];
        selArr.forEach((sel) => {
          const selectedCompany = sel?.company || "";
          console.log("Selected Company:", selectedCompany);
          const models = instrumentList
            .filter((i) => (i.status || "").toLowerCase() === "active")
            .filter(
              (i) =>
                String(i.category || "").toLowerCase() ===
                cat.label.toLowerCase(),
            )
            .filter((i) =>
              selectedCompany
                ? String(i.company || "")
                    .trim()
                    .toLowerCase() ===
                  String(selectedCompany).trim().toLowerCase()
                : true,
            )
            .map((i) => i.name)
            .filter(Boolean);
          console.log("Models:", models);
        });
      });
    } catch (e) {
      // ignore
    }
  }, [instrumentList]);

  const onCompanyChange = (
    category: string,
    index: number,
    company: string,
  ) => {
    const key = normalizeCategorySelectionKey(category);
    console.log(`Company changed for ${category}[${index}] ->`, company);
    setSelections({
      ...selections,
      [key]: (
        selections[key] ||
        Array.from(
          {
            length: Number(data.instrumentCategoryQuantities?.[category] || 0),
          },
          () => ({}),
        )
      ).map((s, i) => (i === index ? { ...s, company, model: undefined } : s)),
    });
  };

  const onModelChange = (category: string, index: number, model: string) => {
    const key = normalizeCategorySelectionKey(category);
    console.log(`Model changed for ${category}[${index}] ->`, model);
    setSelections({
      ...selections,
      [key]: (
        selections[key] ||
        Array.from(
          {
            length: Number(data.instrumentCategoryQuantities?.[category] || 0),
          },
          () => ({}),
        )
      ).map((s, i) => (i === index ? { ...s, model } : s)),
    });
  };

  return (
    <div className="space-y-6">
      {categoriesToShow.length === 0 && (
        <div className="px-4 py-6 text-sm text-slate-600">
          No instrument categories require model assignment. Please enter
          quantities in Technical Specs.
        </div>
      )}

      {categoriesToShow.map((cat) => {
        const qty = Number(data.instrumentCategoryQuantities?.[cat.label] || 0);
        const key = cat.key;
        const companies = companiesForCategory(cat.label);
        // debug render-time summary
        console.log(
          `Category ${cat.label} (qty=${qty}) - companies: ${companies.length}`,
          companies.slice(0, 8),
        );
        // selection arrays are initialized in effect

        return (
          <div
            key={key}
            className="rounded-2xl border border-[#E5E7EB] bg-white p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">
                  {cat.label}
                </p>
                <p className="text-xs text-[#64748B]">
                  Assign {qty} model{qty !== 1 ? "s" : ""} for {cat.label}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {Array.from({ length: qty }).map((_, i) => {
                const sel = selections[key]?.[i] || {};
                const companyOptions = companies;
                const modelOptions = modelsForCategoryAndCompany(
                  cat.label,
                  sel.company,
                );
                if (companyOptions.length === 0) {
                  // give a subtle hint in console for debugging
                  console.warn(
                    `No companies available for category ${cat.label}.`,
                  );
                }
                if (sel.company && modelOptions.length === 0) {
                  console.warn(
                    `No models available for selected company='${sel.company}' category='${cat.label}'.`,
                  );
                }

                return (
                  <div
                    key={i}
                    className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center"
                  >
                    <div className="md:col-span-1">
                      <Label>Company</Label>
                      <SearchableSelect
                        value={sel.company || ""}
                        onChange={(v) => onCompanyChange(cat.label, i, v)}
                        options={
                          companyOptions.length
                            ? companyOptions
                            : ["No companies available"]
                        }
                        placeholder="Type or select company"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Model</Label>
                      <SearchableSelect
                        value={sel.model || ""}
                        onChange={(v) => onModelChange(cat.label, i, v)}
                        options={
                          modelOptions.length
                            ? modelOptions
                            : ["No models available"]
                        }
                        placeholder="Type or select model"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 4 ───────────────────────────────────────────────────────────────────

function buildInstrumentSummary(
  data: FormData,
  selections: Record<string, { company?: string; model?: string }[]>,
) {
  const grouped: Array<{
    category: string;
    items: Array<{ company: string; model: string; count: number }>;
  }> = [];

  Object.entries(data.instrumentCategoryQuantities || {}).forEach(
    ([category, quantity]) => {
      const qty = Number(quantity || 0);
      if (!category || qty <= 0) return;

      const normalizedKey = normalizeCategorySelectionKey(category);
      const entries = Array.from({ length: qty }, (_, index) => {
        const selection = selections[normalizedKey]?.[index] || {};
        return selection;
      }).filter((entry) => entry.company?.trim() || entry.model?.trim());

      if (!entries.length) return;

      const counts = new Map<string, number>();
      entries.forEach((entry) => {
        const company =
          (entry.company || "Unknown company").trim() || "Unknown company";
        const model =
          (entry.model || "Unknown model").trim() || "Unknown model";
        const key = `${company}::${model}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      });

      grouped.push({
        category,
        items: Array.from(counts.entries()).map(([key, count]) => {
          const [company, ...modelParts] = key.split("::");
          return {
            company: company || "Unknown company",
            model: modelParts.join("::") || "Unknown model",
            count,
          };
        }),
      });
    },
  );

  return grouped;
}

function getEnabledProtections(data: FormData) {
  const protections = [
    { label: "Over Current Protection", enabled: data.overCurrentProtection },
    { label: "Short Circuit Protection", enabled: data.shortCircuitProtection },
    { label: "Earth Fault Protection", enabled: data.earthFaultProtection },
    { label: "Phase Failure Protection", enabled: data.phaseFailureProtection },
    { label: "Over Voltage Protection", enabled: data.overVoltageProtection },
    { label: "Under Voltage Protection", enabled: data.underVoltageProtection },
    { label: "Dry Run Protection", enabled: data.dryRunProtection },
    { label: "Overload Protection", enabled: data.overloadProtection },
  ];

  return protections.filter(({ enabled }) => enabled).map(({ label }) => label);
}

function ReviewRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[#F1F5F9] last:border-0">
      <span className="text-xs text-[#64748B] flex-shrink-0 w-40">{label}</span>
      <span
        className={`text-xs text-right font-medium ${highlight ? "text-[#1DA1F2]" : "text-[#0F172A]"} flex-1`}
      >
        {value || <span className="text-[#CBD5E1] italic">Not provided</span>}
      </span>
    </div>
  );
}

function ReviewSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#F8FAFC] rounded-2xl border border-[#E5E7EB] overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#E5E7EB] bg-white">
        <div className="w-6 h-6 rounded-md bg-[#EFF6FF] flex items-center justify-center">
          <Icon size={13} className="text-[#1DA1F2]" />
        </div>
        <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wide">
          {title}
        </span>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
}

function Step4({
  data,
  panelId,
  selections,
}: {
  data: FormData;
  panelId: string;
  selections: Record<string, { company?: string; model?: string }[]>;
}) {
  const instrumentGroups = useMemo(
    () => buildInstrumentSummary(data, selections),
    [data, selections],
  );
  const enabledProtections = useMemo(() => getEnabledProtections(data), [data]);

  const imageFields = [
    { label: "Front Image", file: data.frontImage },
    { label: "Inside Image", file: data.insideImage },
    { label: "Name Plate Image", file: data.namePlateImage },
    { label: "Side Image", file: data.sideImage },
  ];

  const technicalRows = [
    { label: "Voltage", value: data.voltage ? `${data.voltage} V` : "" },
    { label: "Current", value: data.current ? `${data.current} A` : "" },
    { label: "Frequency", value: data.frequency ? `${data.frequency} Hz` : "" },
    { label: "Phase", value: data.phase },
    {
      label: "Power Rating",
      value: data.powerRating ? `${data.powerRating} kW` : "",
    },
    { label: "Power Factor", value: data.powerFactor },
    { label: "Control Voltage", value: data.controlVoltage },
    { label: "IP Rating", value: data.ipRating },
    { label: "Enclosure Material", value: data.enclosureMaterial },
    { label: "Panel Color", value: data.panelColor },
    {
      label: "Dimensions",
      value: data.dimensions ? `${data.dimensions} mm` : "",
    },
    { label: "Weight", value: data.weight ? `${data.weight} kg` : "" },
    { label: "Mounting Type", value: data.mountingType },
    { label: "Cable Size", value: data.cableSize },
    { label: "Control Cable Size", value: data.controlCableSize },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 bg-[#F0FFF4] border border-[#BBF7D0] rounded-xl px-4 py-3.5">
        <CheckCircle2
          size={15}
          className="text-[#16A34A] flex-shrink-0 mt-0.5"
        />
        <div>
          <p className="text-xs font-semibold text-[#15803D]">
            Ready to create panel
          </p>
          <p className="text-xs text-[#64748B] mt-0.5">
            Please review all information below before submitting. Click "Create
            Panel" to save.
          </p>
        </div>
      </div>

      {/* Panel ID highlight (render when panelId provided) */}
      {panelId && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">
              Auto-generated Panel ID
            </p>
            <p className="text-xl font-bold text-[#1DA1F2] font-mono tracking-widest">
              {panelId}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
            <Zap size={18} className="text-[#1DA1F2]" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReviewSection title="Basic Information" icon={ClipboardList}>
          <ReviewRow label="Panel ID" value={panelId} highlight />
          <ReviewRow label="Panel Name" value={data.panelName} highlight />
          <ReviewRow label="Panel Type" value={data.panelType} />
          <ReviewRow label="Status" value={data.panelStatus} />
          <ReviewRow label="Customer" value={data.customerCompany} />
          <ReviewRow label="Project" value={data.projectName} />
          <ReviewRow label="Location" value={data.installationLocation} />
        </ReviewSection>

        <ReviewSection title="Personnel & Dates" icon={User}>
          <ReviewRow label="Manufacturer" value={data.manufacturerName} />
          <ReviewRow label="Installer" value={data.installerName} />
          <ReviewRow
            label="Manufacturing Date"
            value={formatDate(data.manufacturingDate)}
          />
          <ReviewRow
            label="Installation Date"
            value={
              data.installationDate ? formatDate(data.installationDate) : ""
            }
          />
          <ReviewRow label="Description" value={data.description} />
        </ReviewSection>

        <ReviewSection title="Technical Specs" icon={Zap}>
          {technicalRows.map(({ label, value }) => (
            <ReviewRow key={label} label={label} value={value} />
          ))}
        </ReviewSection>

        <ReviewSection title="Motors" icon={Package}>
          {data.motorConfiguration?.length ? (
            data.motorConfiguration.map((motor, index) => (
              <div
                key={`${motor.connectionType || "motor"}-${index}`}
                className="border-b border-[#F1F5F9] py-3 last:border-0"
              >
                <p className="text-[11px] font-semibold text-[#0F172A] mb-2">
                  Motor {index + 1}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="rounded-xl bg-[#F8FAFC] px-3 py-2">
                    <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">
                      Connection Type
                    </p>
                    <p className="text-xs font-medium text-[#0F172A] mt-0.5">
                      {motor.connectionType || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#F8FAFC] px-3 py-2">
                    <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">
                      Min HP
                    </p>
                    <p className="text-xs font-medium text-[#0F172A] mt-0.5">
                      {motor.minHp || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#F8FAFC] px-3 py-2">
                    <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">
                      Max HP
                    </p>
                    <p className="text-xs font-medium text-[#0F172A] mt-0.5">
                      {motor.maxHp || "—"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <ReviewRow label="Motor Configuration" value="No motors added" />
          )}
        </ReviewSection>
      </div>

      <ReviewSection title="Instrument Models" icon={Zap}>
        {instrumentGroups.length ? (
          <div className="space-y-4 py-3">
            {instrumentGroups.map(({ category, items }) => (
              <div
                key={category}
                className="rounded-xl border border-[#E5E7EB] bg-white p-3"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#1DA1F2] mb-2">
                  {category}
                </p>
                <div className="space-y-2">
                  {items.map(({ company, model, count }) => (
                    <div
                      key={`${category}-${company}-${model}`}
                      className="rounded-lg bg-[#F8FAFC] px-3 py-2"
                    >
                      <p className="text-[11px] font-medium text-[#0F172A]">
                        {count} × {company} — {model}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-3">
            <p className="text-xs text-[#64748B]">
              No instrument models were added.
            </p>
          </div>
        )}
      </ReviewSection>

      <ReviewSection title="Protection Features" icon={ShieldCheck}>
        {enabledProtections.length ? (
          <div className="space-y-2 py-3">
            {enabledProtections.map((protection) => (
              <div
                key={protection}
                className="rounded-xl border border-[#BBF7D0] bg-[#F0FFF4] px-3 py-2"
              >
                <p className="text-[11px] font-medium text-[#15803D]">
                  {protection}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-3">
            <p className="text-xs text-[#64748B]">
              No protection features selected.
            </p>
          </div>
        )}
      </ReviewSection>

      <ReviewSection title="Images" icon={Camera}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3">
          {imageFields.map(({ label, file }) => {
            const previewUrl = file ? URL.createObjectURL(file) : "";
            return (
              <div
                key={label}
                className={`rounded-xl border p-3 text-center ${file ? "border-[#BBF7D0] bg-[#F0FFF4]" : "border-[#E5E7EB] bg-white"}`}
              >
                <div
                  className={`w-full h-24 rounded-lg flex items-center justify-center mx-auto mb-2 overflow-hidden ${file ? "bg-[#DCFCE7]" : "bg-[#F1F5F9]"}`}
                >
                  {file ? (
                    <img
                      src={previewUrl}
                      alt={label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <X size={14} className="text-[#CBD5E1]" />
                  )}
                </div>
                <p className="text-[11px] font-medium text-[#0F172A]">
                  {label}
                </p>
                <p
                  className={`text-[10px] mt-0.5 ${file ? "text-[#16A34A]" : "text-[#CBD5E1]"}`}
                >
                  {file ? "Uploaded" : "Not uploaded"}
                </p>
              </div>
            );
          })}
        </div>
      </ReviewSection>
    </div>
  );
}

// ─── Progress Stepper ─────────────────────────────────────────────────────────

function Stepper({
  current,
  steps,
}: {
  current: number;
  steps: typeof BASE_STEPS;
}) {
  return (
    <div className="flex items-center justify-between relative">
      {/* Line */}
      <div className="absolute top-4 left-0 right-0 h-px bg-[#E5E7EB] z-0" />
      <div
        className="absolute top-4 left-0 h-px bg-[#1DA1F2] z-0 transition-all duration-500"
        style={{
          width: `${steps.length > 1 ? ((current - 1) / (steps.length - 1)) * 100 : 0}%`,
        }}
      />

      {steps.map((step) => {
        const done = step.id < current;
        const active = step.id === current;
        const Icon = step.icon;

        return (
          <div
            key={step.id}
            className="relative z-10 flex flex-col items-center gap-2.5 flex-1"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                done
                  ? "bg-[#1DA1F2] border-[#1DA1F2]"
                  : active
                    ? "bg-white border-[#1DA1F2] shadow-[0_0_0_4px_rgba(29,161,242,0.12)]"
                    : "bg-white border-[#E5E7EB]"
              }`}
            >
              {done ? (
                <Check size={13} className="text-white" strokeWidth={2.5} />
              ) : (
                <Icon
                  size={13}
                  className={active ? "text-[#1DA1F2]" : "text-[#CBD5E1]"}
                />
              )}
            </div>
            <div className="text-center hidden sm:block">
              <p
                className={`text-[11px] font-semibold leading-tight ${active ? "text-[#1DA1F2]" : done ? "text-[#0F172A]" : "text-[#94A3B8]"}`}
              >
                Step {step.id}
              </p>
              <p
                className={`text-[11px] leading-tight mt-0.5 ${active ? "text-[#0F172A]" : "text-[#94A3B8]"}`}
              >
                {step.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  Draft: "bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]",
  "In Production": "bg-blue-50 text-blue-700 border-blue-200",
  "QC Review": "bg-violet-50 text-violet-700 border-violet-200",
  Ready: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Installed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Maintenance Due": "bg-red-50 text-red-700 border-red-200",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? STATUS_STYLES["Draft"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      {status}
    </span>
  );
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateStep(step: number, data: FormData): string[] {
  if (step === 1) {
    const errors: string[] = [];
    if (!data.panelName.trim()) errors.push("Panel Name is required.");
    if (!data.panelType) errors.push("Panel Type is required.");
    if (!data.customerCompany.trim())
      errors.push("Customer Company is required.");
    return errors;
  }

  // load instrument master once for instrument models step
  // NOTE: instrument list is loaded from the main component via useEffect
  if (step === 2) {
    const errors: string[] = [];
    if (!data.voltage.trim()) errors.push("Rated Voltage is required.");
    if (!data.current.trim()) errors.push("Rated Current is required.");
    return errors;
  }
  return [];
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

interface PanelWizardProps {
  mode?: "create" | "edit";
  panelId?: string;
}

export default function CreatePanelWizard({
  mode = "create",
  panelId: editPanelId,
}: PanelWizardProps = {}) {
  const { currentUser } = useApp();
  const isPremium = currentUser?.plan === "PREMIUM";
  const visibleSteps = BASE_STEPS;
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatedPanelId, setGeneratedPanelId] = useState<string | null>(null);
  const [assignedPanelId, setAssignedPanelId] = useState<string | null>(null);
  const [existingPanelId, setExistingPanelId] = useState<string | null>(null);
  const [existingInternalId, setExistingInternalId] = useState<string | null>(
    null,
  );
  const [existingImages, setExistingImages] = useState<{
    frontImage?: string;
    insideImage?: string;
    namePlateImage?: string;
    sideImage?: string;
  }>({});
  const [loadingPanel, setLoadingPanel] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isEditMode = mode === "edit";
  const panelId = isEditMode
    ? existingPanelId || editPanelId || ""
    : step === visibleSteps.length
      ? generatedPanelId || ""
      : "";
  const [instrumentList, setInstrumentList] = useState<any[]>([]);
  const instrumentCategories = Array.from(
    new Set(
      instrumentList
        .map((instrument: any) => String(instrument.category || "").trim())
        .filter(Boolean),
    ),
  );
  const [selections, setSelections] = useState<
    Record<string, { company?: string; model?: string }[]>
  >({});

  // load existing panel data when in edit mode
  useEffect(() => {
    if (!isEditMode || !editPanelId) return;
    const panelLookupId = editPanelId as string;
    let mounted = true;
    async function loadPanel() {
      setLoadingPanel(true);
      setLoadError(null);
      try {
        const res = await api.get(
          `/panels/lookup/${encodeURIComponent(panelLookupId)}`,
        );
        if (!mounted) return;
        const panel = res.data.panel;
        const nextData: FormData = {
          panelName: panel.panelName || panel.name || "",
          panelType: panel.panelType || panel.type || "",
          customerCompany: panel.customer || "",
          projectName: panel.projectName || "",
          installationLocation: panel.installationLocation || "",
          manufacturerName: panel.manufacturer || "",
          installerName: panel.installer || "",
          installationDate: panel.installationDate || "",
          panelStatus: panel.status || "Draft",
          description: panel.description || "",
          manufacturingDate: panel.manufacturingDate || "",

          voltage: panel.technicalSpecs?.voltage || "",
          current: panel.technicalSpecs?.current || "",
          frequency: panel.technicalSpecs?.frequency || "50",
          phase: panel.technicalSpecs?.phase || "",
          instrumentCategoryQuantities: {},
          motorConfiguration: panel.motorConfiguration || [],
          powerRating: panel.technicalSpecs?.powerRating || "",
          powerFactor: panel.technicalSpecs?.powerFactor || "",
          tpBreaker: panel.technicalSpecs?.tpBreaker || "",
          spBreaker: panel.technicalSpecs?.spBreaker || "",
          mccb: panel.technicalSpecs?.mccb || "",
          mcb: panel.technicalSpecs?.mcb || "",
          fuseRating: panel.technicalSpecs?.fuseRating || "",
          plc: panel.technicalSpecs?.plc || "",
          hmi: panel.technicalSpecs?.hmi || "",
          relay: panel.technicalSpecs?.relay || "",
          contactor: panel.technicalSpecs?.contactor || "",
          vfd: panel.technicalSpecs?.vfd || "",
          softStarter: panel.technicalSpecs?.softStarter || "",
          timer: panel.technicalSpecs?.timer || "",
          overloadRelay: panel.technicalSpecs?.overloadRelay || "",
          digitalMeter: panel.technicalSpecs?.digitalMeter || "",
          cableDuct: panel.technicalSpecs?.cableDuct || "",
          terminalBlock: panel.technicalSpecs?.terminalBlock || "",
          autoManualSelectorSwitch:
            panel.technicalSpecs?.autoManualSelectorSwitch || "",
          smps: panel.technicalSpecs?.smps || "",
          controlTransformer: panel.technicalSpecs?.controlTransformer || "",
          startPushButton: panel.technicalSpecs?.startPushButton || "",
          stopPushButton: panel.technicalSpecs?.stopPushButton || "",
          emergencyStop: panel.technicalSpecs?.emergencyStop || "",
          selectorSwitch: panel.technicalSpecs?.selectorSwitch || "",
          indicatorLamps: panel.technicalSpecs?.indicatorLamps || "",
          busbarRating: panel.technicalSpecs?.busbarRating || "",
          busbarMaterial: panel.technicalSpecs?.busbarMaterial || "",
          cableSize: panel.technicalSpecs?.cableSize || "",
          controlCableSize: panel.technicalSpecs?.controlCableSize || "",
          overCurrentProtection: Boolean(
            panel.technicalSpecs?.overCurrentProtection,
          ),
          shortCircuitProtection: Boolean(
            panel.technicalSpecs?.shortCircuitProtection,
          ),
          earthFaultProtection: Boolean(
            panel.technicalSpecs?.earthFaultProtection,
          ),
          phaseFailureProtection: Boolean(
            panel.technicalSpecs?.phaseFailureProtection,
          ),
          overVoltageProtection: Boolean(
            panel.technicalSpecs?.overVoltageProtection,
          ),
          underVoltageProtection: Boolean(
            panel.technicalSpecs?.underVoltageProtection,
          ),
          dryRunProtection: Boolean(panel.technicalSpecs?.dryRunProtection),
          overloadProtection: Boolean(panel.technicalSpecs?.overloadProtection),
          controlVoltage: panel.technicalSpecs?.controlVoltage || "",
          protectionType: panel.technicalSpecs?.protectionType || "",
          ipRating: panel.technicalSpecs?.ipRating || "",
          enclosureMaterial: panel.technicalSpecs?.enclosureMaterial || "",
          panelColor: panel.technicalSpecs?.panelColor || "",
          dimensions: panel.technicalSpecs?.dimensions || "",
          weight: panel.technicalSpecs?.weight || "",
          mountingType: panel.technicalSpecs?.mountingType || "",
          drawingNumber: panel.technicalSpecs?.drawingNumber || "",
          revision: panel.technicalSpecs?.revision || "",

          frontImage: null,
          insideImage: null,
          namePlateImage: null,
          sideImage: null,
        };

        if (
          isPremium &&
          panel.instrumentModels &&
          typeof panel.instrumentModels === "object"
        ) {
          const quantities: Record<string, string> = {};
          const nextSelections: Record<
            string,
            { company?: string; model?: string }[]
          > = {};
          Object.entries(panel.instrumentModels).forEach(
            ([category, values]) => {
              if (!Array.isArray(values)) return;
              quantities[category] = String(values.length || 0);
              nextSelections[normalizeCategorySelectionKey(category)] =
                values.map((entry) => {
                  const raw = String(entry || "");
                  const [company, ...modelParts] = raw.split("::");
                  return {
                    company: company || "",
                    model: modelParts.join("::") || "",
                  };
                });
            },
          );
          nextData.instrumentCategoryQuantities = quantities;
          setSelections(nextSelections);
        }

        setData(nextData);
        setExistingPanelId(panel.panelId || editPanelId || null);
        setExistingInternalId(panel._id || panel.id || null);
        setExistingImages({
          frontImage: panel.images?.frontImage || "",
          insideImage: panel.images?.insideImage || "",
          namePlateImage: panel.images?.namePlateImage || "",
          sideImage: panel.images?.sideImage || "",
        });
      } catch (error) {
        if (!mounted) return;
        setLoadError(
          error instanceof Error ? error.message : "Unable to load panel data.",
        );
      } finally {
        if (mounted) setLoadingPanel(false);
      }
    }
    loadPanel();
    return () => {
      mounted = false;
    };
  }, [editPanelId, isEditMode, isPremium]);

  // load instrument master once for instrument models step
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const hasToken = !!localStorage.getItem("epms_token");
        console.log("Auth token present:", hasToken);
        const res = await api.get("/instruments/panel-options");
        if (!mounted) return;
        const all = res.data.instruments || [];
        console.log("Total Instruments (API):", all.length);
        console.log("Sample Instruments:", all.slice(0, 5));
        const active = all.filter(
          (it: any) => String(it.status || "").toLowerCase() === "active",
        );
        console.log("Active Instruments (filtered):", active.length);
        setInstrumentList(active);
      } catch (e: any) {
        console.error(
          "Failed loading instruments:",
          e?.response?.status,
          e?.message || e,
        );
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  function set(key: keyof FormData, value: any) {
    setData((prev) => ({ ...prev, [key]: value }));
    if (errors.length) setErrors([]);
  }

  async function generateReviewPanelId() {
    const panelType = data.panelType || "MCC";
    if (!panelType)
      throw new Error("Panel type is required to generate Panel ID.");
    const q = new URLSearchParams();
    q.set("panelType", panelType);
    const url = `/panels/generate-id?${q.toString()}`;
    const res = await api.get(url);
    if (!res?.data?.panelId) {
      throw new Error("Failed to generate Panel ID.");
    }
    setGeneratedPanelId(res.data.panelId);
    return res.data.panelId;
  }

  async function handleContinue() {
    const errs = validateStep(step, data);
    if (errs.length) {
      setErrors(errs);
      return;
    }

    if (step === 3 && isPremium) {
      const modelErrors: string[] = [];
      instrumentCategories.forEach((category) => {
        const qty = Number(data.instrumentCategoryQuantities?.[category] || 0);
        if (qty <= 0) return;
        const sel = Array.from(
          { length: qty },
          (_, i) =>
            selections[normalizeCategorySelectionKey(category)]?.[i] || {},
        );
        sel.forEach((s, i) => {
          const hasCompany = Boolean(s?.company?.trim());
          const hasModel = Boolean(s?.model?.trim());
          if ((hasCompany || hasModel) && !hasCompany) {
            modelErrors.push(
              `${category}: selection ${i + 1} is missing a company.`,
            );
          }
          if ((hasCompany || hasModel) && !hasModel) {
            modelErrors.push(
              `${category}: selection ${i + 1} is missing a model.`,
            );
          }
        });
      });
      if (modelErrors.length) {
        setErrors(modelErrors);
        return;
      }
    }

    if (!isEditMode && step === visibleSteps.length - 1) {
      try {
        await generateReviewPanelId();
      } catch (error) {
        setErrors([
          error instanceof Error
            ? error.message
            : "Unable to generate Panel ID.",
        ]);
        return;
      }
    }

    setErrors([]);
    setStep((s) => Math.min(s + 1, visibleSteps.length));
  }

  function handleBack() {
    setErrors([]);
    setStep((s) => Math.max(s - 1, 1));
  }

  // When entering the final review step, request an authoritative panel ID

  async function handleSubmit() {
    if (!currentUser) return;
    setSubmitting(true);
    setErrors([]);

    try {
      const uploadImage = async (file: File | null) => {
        if (!file) return "";
        const formData = new FormData();
        formData.append("file", file);
        const response = await api.post("/uploads/image", formData);
        return response.data.url as string;
      };

      const [frontImage, insideImage, namePlateImage, sideImage] =
        await Promise.all([
          uploadImage(data.frontImage),
          uploadImage(data.insideImage),
          uploadImage(data.namePlateImage),
          uploadImage(data.sideImage),
        ]);

      const imagePayload: Record<string, string> = {
        ...(existingImages.frontImage
          ? { frontImage: existingImages.frontImage }
          : {}),
        ...(existingImages.insideImage
          ? { insideImage: existingImages.insideImage }
          : {}),
        ...(existingImages.namePlateImage
          ? { namePlateImage: existingImages.namePlateImage }
          : {}),
        ...(existingImages.sideImage
          ? { sideImage: existingImages.sideImage }
          : {}),
        ...(frontImage ? { frontImage } : {}),
        ...(insideImage ? { insideImage } : {}),
        ...(namePlateImage ? { namePlateImage } : {}),
        ...(sideImage ? { sideImage } : {}),
      };

      const buildInstrumentModelPayload = () => {
        const out: Record<string, string[]> = {};
        instrumentCategories.forEach((category) => {
          const qty = Number(
            data.instrumentCategoryQuantities?.[category] || 0,
          );
          if (qty <= 0) return;

          const arr = Array.from(
            { length: qty },
            (_, i) =>
              selections[normalizeCategorySelectionKey(category)]?.[i] || {},
          );
          const firstCompletedModel = arr
            .find((entry) => entry.model?.trim())
            ?.model?.trim();

          const models = arr
            .map((entry) => {
              const company = entry.company?.trim();
              const model = entry.model?.trim();

              if (company && model) {
                return `${company}::${model}`;
              }

              if (model) return model;
              if (!company && !model && firstCompletedModel) {
                return firstCompletedModel;
              }
              return null;
            })
            .filter((value): value is string => Boolean(value));

          if (models.length) out[category] = models;
        });
        return out;
      };

      const payload = {
        panelName: data.panelName,
        panelType: data.panelType,
        manufacturingDate: data.manufacturingDate,
        installationDate: data.installationDate,
        customer: data.customerCompany,
        installer: data.installerName,
        manufacturer: data.manufacturerName,
        installationLocation: data.installationLocation,
        projectName: data.projectName,
        description: data.description,
        status: data.panelStatus,
        motorConfiguration: data.motorConfiguration,
        technicalSpecs: {
          voltage: data.voltage,
          current: data.current,
          frequency: data.frequency,
          phase: data.phase,
          powerRating: data.powerRating,
          powerFactor: data.powerFactor,
          mccb: data.mccb,
          mcb: data.mcb,
          tpBreaker: data.tpBreaker,
          spBreaker: data.spBreaker,
          fuseRating: data.fuseRating,
          plc: data.plc,
          hmi: data.hmi,
          relay: data.relay,
          contactor: data.contactor,
          vfd: data.vfd,
          softStarter: data.softStarter,
          timer: data.timer,
          overloadRelay: data.overloadRelay,
          digitalMeter: data.digitalMeter,
          cableDuct: data.cableDuct,
          terminalBlock: data.terminalBlock,
          autoManualSelectorSwitch: data.autoManualSelectorSwitch,
          smps: data.smps,
          controlTransformer: data.controlTransformer,
          startPushButton: data.startPushButton,
          stopPushButton: data.stopPushButton,
          emergencyStop: data.emergencyStop,
          selectorSwitch: data.selectorSwitch,
          indicatorLamps: data.indicatorLamps,
          busbarRating: data.busbarRating,
          busbarMaterial: data.busbarMaterial,
          cableSize: data.cableSize,
          controlCableSize: data.controlCableSize,
          overCurrentProtection: data.overCurrentProtection,
          shortCircuitProtection: data.shortCircuitProtection,
          earthFaultProtection: data.earthFaultProtection,
          phaseFailureProtection: data.phaseFailureProtection,
          overVoltageProtection: data.overVoltageProtection,
          underVoltageProtection: data.underVoltageProtection,
          dryRunProtection: data.dryRunProtection,
          overloadProtection: data.overloadProtection,
          controlVoltage: data.controlVoltage,
          ipRating: data.ipRating,
          enclosureMaterial: data.enclosureMaterial,
          instrumentQuantities: data.instrumentCategoryQuantities,
          panelColor: data.panelColor,
          dimensions: data.dimensions,
          weight: data.weight,
          mountingType: data.mountingType,
          drawingNumber: data.drawingNumber,
          revision: data.revision,
        },
        images: imagePayload,
        instrumentModels: isPremium ? buildInstrumentModelPayload() : {},
        // include panelId if generated on review to ensure backend uses same id
        ...(generatedPanelId ? { panelId: generatedPanelId } : {}),
      };
      const res =
        isEditMode && existingInternalId
          ? await api.put(`/panels/${existingInternalId}`, payload)
          : await api.post("/panels", payload);
      const createdPanelId =
        res.data.panel?.panelId ||
        res.data.panel?._id ||
        existingPanelId ||
        null;
      if (createdPanelId) setAssignedPanelId(createdPanelId);
      setSubmitted(true);
    } catch (error) {
      setErrors([
        error instanceof Error ? error.message : "Unable to save panel.",
      ]);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="w-full max-w-[1100px] flex items-center justify-center min-h-[70vh]">
        <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-14 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-[#F0FFF4] border-4 border-[#BBF7D0] flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={30} className="text-[#16A34A]" />
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] mb-2">
            {isEditMode ? "Panel Updated!" : "Panel Created!"}
          </h2>
          <p className="text-sm text-[#64748B] mb-4 leading-relaxed">
            {isEditMode
              ? "Your panel has been successfully updated."
              : "Your panel has been successfully created and assigned the following ID:"}
          </p>
          {isEditMode ? null : (
            <div className="bg-[#F8FAFC] rounded-2xl border border-[#E5E7EB] px-6 py-4 mb-6">
              <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">
                Panel ID
              </p>
              <p className="text-2xl font-bold text-[#1DA1F2] font-mono tracking-widest">
                {assignedPanelId || panelId}
              </p>
            </div>
          )}
          <button
            onClick={() => {
              if (isEditMode) {
                window.history.pushState({}, "", "/");
                window.dispatchEvent(new PopStateEvent("popstate"));
                return;
              }
              setSubmitted(false);
              setStep(1);
              setData(INITIAL);
              setErrors([]);
            }}
            className="w-full h-11 bg-[#1DA1F2] hover:bg-[#1a91da] text-white font-semibold text-sm rounded-xl transition-colors"
          >
            {isEditMode ? "Return to Panels" : "Create Another Panel"}
          </button>
        </div>
      </div>
    );
  }

  if (loadingPanel) {
    return (
      <div className="w-full max-w-[1100px] flex items-center justify-center min-h-[70vh] text-sm text-[#64748B]">
        Loading panel details...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full max-w-[1100px] flex items-center justify-center min-h-[70vh]">
        <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-14 text-center max-w-md w-full">
          <h2 className="text-xl font-bold text-[#0F172A] mb-3">
            Unable to load panel
          </h2>
          <p className="text-sm text-[#64748B] mb-6">{loadError}</p>
          <button
            onClick={() => {
              window.history.pushState({}, "", "/");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            className="w-full h-11 bg-[#1DA1F2] hover:bg-[#1a91da] text-white font-semibold text-sm rounded-xl transition-colors"
          >
            Back to Panels
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 flex items-start justify-center">
      <div className="w-full max-w-[1200px]">
        {/* ── Header ── */}
        <div className="mb-7">
          {/* Back link */}
          <button
            onClick={() => {
              window.history.pushState({}, "", "/");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] transition-colors mb-5 group"
          >
            <ArrowLeft
              size={15}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            Back to Panels
          </button>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                {isEditMode ? "Edit Panel" : "Create New Panel"}
              </h1>
              <p className="text-sm text-[#64748B] mt-1.5 leading-relaxed">
                {isEditMode
                  ? "Update the panel details below. The Panel ID will remain unchanged."
                  : "Create a new electrical panel by completing the information below."}
              </p>
            </div>
            {panelId ? (
              <div className="flex items-center gap-3 bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_8px_rgba(0,0,0,0.04)] px-5 py-3.5 flex-shrink-0">
                <div>
                  <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">
                    Panel ID
                  </p>
                  <p className="text-sm font-bold text-[#0F172A] font-mono tracking-widest">
                    {panelId}
                  </p>
                </div>
                <div className="w-px h-8 bg-[#E5E7EB] mx-1" />
                <StatusBadge status={data.panelStatus} />
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-white rounded-2xl border border-transparent shadow-none px-5 py-3.5 flex-shrink-0">
                <StatusBadge status={data.panelStatus} />
              </div>
            )}
          </div>
        </div>

        {/* ── Stepper ── */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_8px_rgba(0,0,0,0.04)] px-8 py-6 mb-5">
          <Stepper current={step} steps={visibleSteps} />
        </div>

        {/* ── Validation errors ── */}
        {errors.length > 0 && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3.5 mb-4">
            <AlertCircle
              size={15}
              className="text-red-500 flex-shrink-0 mt-0.5"
            />
            <div>
              <p className="text-xs font-semibold text-red-800 mb-1">
                Please fix the following before continuing:
              </p>
              <ul className="space-y-0.5">
                {errors.map((e) => (
                  <li
                    key={e}
                    className="text-xs text-red-700 flex items-center gap-1.5"
                  >
                    <span className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── Content Card ── */}
        <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden">
          {/* Step heading */}
          <div className="flex items-center gap-3 px-8 pt-8 pb-6 border-b border-[#F1F5F9]">
            <div className="w-8 h-8 rounded-full bg-[#1DA1F2] flex items-center justify-center text-white text-xs font-bold">
              {step}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">
                {visibleSteps[step - 1]?.label}
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                {step === 1 &&
                  "Enter the core details and assignment information for this panel."}
                {step === 2 &&
                  "Specify the electrical and physical parameters of this panel."}
                {step === 3 &&
                  (isPremium
                    ? "Assign instrument models based on the Technical Specifications."
                    : "Upgrade to Premium to unlock instrument model selection and documentation tools.")}
                {step === 4 &&
                  "Upload photos and technical documents for identification and reference."}
                {step === 5 &&
                  (isEditMode
                    ? "Review all information before saving your changes."
                    : "Review all information before creating the panel in the system.")}
              </p>
            </div>
            <div className="ml-auto text-xs text-[#94A3B8] font-medium">
              Step {step} of {visibleSteps.length}
            </div>
          </div>

          {/* Step content */}
          <div className="p-8">
            {step === 1 && <Step1 data={data} set={set} />}
            {step === 2 && (
              <Step2
                data={data}
                set={set}
                instrumentCategories={instrumentCategories}
              />
            )}
            {step === 3 && isPremium && (
              <StepInstrumentModels
                data={data}
                instrumentList={instrumentList}
                instrumentCategories={instrumentCategories}
                selections={selections}
                setSelections={setSelections}
              />
            )}
            {step === 3 && !isPremium && <PremiumUpgradeCard />}
            {step === 4 && <Step3 data={data} set={set} />}
            {step === 5 && (
              <Step4 data={data} panelId={panelId} selections={selections} />
            )}
          </div>

          {/* ── Action Bar ── */}
          <div className="sticky bottom-0 flex items-center justify-between gap-4 px-8 py-5 border-t border-[#F1F5F9] bg-white/95 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
              <div className="flex gap-1">
                {visibleSteps.map((s) => (
                  <div
                    key={s.id}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      s.id === step
                        ? "w-5 bg-[#1DA1F2]"
                        : s.id < step
                          ? "w-3 bg-[#BAE6FD]"
                          : "w-3 bg-[#E5E7EB]"
                    }`}
                  />
                ))}
              </div>
              <span>
                {step} / {visibleSteps.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 h-11 px-6 text-sm font-semibold text-[#475569] bg-white border border-[#E5E7EB] rounded-xl hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all"
                >
                  <ArrowLeft size={14} />
                  Back
                </button>
              )}
              {step < visibleSteps.length ? (
                <button
                  onClick={handleContinue}
                  className="flex items-center gap-2 h-11 px-7 text-sm font-semibold text-white bg-[#1DA1F2] hover:bg-[#1a91da] rounded-xl transition-all shadow-sm shadow-[#1DA1F2]/20 hover:shadow-md hover:shadow-[#1DA1F2]/25"
                >
                  Continue
                  <ChevronRight size={15} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 h-11 px-8 text-sm font-semibold text-white bg-[#1DA1F2] hover:bg-[#1a91da] rounded-xl transition-all shadow-sm shadow-[#1DA1F2]/20 hover:shadow-md hover:shadow-[#1DA1F2]/25 disabled:opacity-70"
                >
                  <CheckCircle2 size={15} />
                  {submitting
                    ? "Saving..."
                    : isEditMode
                      ? "Save Changes"
                      : "Create Panel"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
