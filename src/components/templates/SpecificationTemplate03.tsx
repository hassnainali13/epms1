import {
  Activity,
  Anchor,
  Box,
  Cable,
  CircleGauge,
  Download,
  Gauge,
  Image as ImageIcon,
  Palette,
  Printer,
  QrCode,
  Ruler,
  Scale,
  Settings2,
  ShieldCheck,
  Waves,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import type { Panel } from "../../context/AppContext";

let template03CaptureElement: HTMLDivElement | null = null;

interface SpecificationTemplate03Props {
  panel?: Panel;
  qrImageSrc: string | null;
  companyLogoSrc: string | undefined;
  companyName: string;
  isFree?: boolean;
  onBack?: () => void;
  onExportPdf?: () => void;
  onPrint?: () => void;
}

type SpecItem = {
  label: string;
  value: string;
  icon: LucideIcon;
};

const getSpecItems = (panel?: Panel): SpecItem[] => [
  { label: "Voltage", value: panel?.technicalSpecs?.voltage || "-", icon: Zap },
  { label: "Current", value: panel?.technicalSpecs?.current || "-", icon: Activity },
  { label: "Frequency", value: panel?.technicalSpecs?.frequency || "-", icon: Waves },
  { label: "Phase", value: panel?.technicalSpecs?.phase || "-", icon: Settings2 },
  { label: "Power Rating", value: panel?.technicalSpecs?.powerRating || "-", icon: CircleGauge },
  { label: "Power Factor", value: panel?.technicalSpecs?.powerFactor || "-", icon: Gauge },
  { label: "Control Voltage", value: panel?.technicalSpecs?.controlVoltage || "-", icon: Settings2 },
  { label: "IP Rating", value: panel?.technicalSpecs?.ipRating || "-", icon: ShieldCheck },
  { label: "Enclosure Material", value: panel?.technicalSpecs?.enclosureMaterial || "-", icon: Box },
  { label: "Panel Color", value: panel?.technicalSpecs?.panelColor || "-", icon: Palette },
  { label: "Dimensions", value: panel?.technicalSpecs?.dimensions || "-", icon: Ruler },
  { label: "Weight", value: panel?.technicalSpecs?.weight || "-", icon: Scale },
  { label: "Mounting Type", value: panel?.technicalSpecs?.mountingType || "-", icon: Anchor },
  { label: "Cable Size", value: panel?.technicalSpecs?.cableSize || "-", icon: Cable },
  { label: "Control Cable Size", value: panel?.technicalSpecs?.controlCableSize || "-", icon: Cable },
];

async function waitForImages(root: HTMLElement): Promise<void> {
  await Promise.all(
    Array.from(root.querySelectorAll("img")).map(
      (image) =>
        image.complete && image.naturalWidth > 0
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              image.addEventListener("load", () => resolve(), { once: true });
              image.addEventListener("error", () => resolve(), { once: true });
            }),
    ),
  );
}

export async function createSpecificationTemplate03Pdf(
  _panel: Panel | undefined,
  _qrImageSrc: string | null,
  _companyLogoSrc: string | undefined,
  _companyName: string,
  _isFree: boolean = false,
): Promise<jsPDF> {
  if (!template03CaptureElement) {
    throw new Error("Template 3 preview is not mounted");
  }

  const sourceElement = template03CaptureElement;
  await document.fonts?.ready;
  await waitForImages(sourceElement);

  const rect = sourceElement.getBoundingClientRect();
  const captureWidth = Math.max(1, Math.round(rect.width));
  const captureHeight = Math.max(1, Math.round(rect.height));

  const canvas = await html2canvas(sourceElement, {
    scale: 3,
    backgroundColor: "#ffffff",
    useCORS: true,
    allowTaint: false,
    logging: false,
    imageTimeout: 15000,
    width: captureWidth,
    height: captureHeight,
    windowWidth: captureWidth,
    windowHeight: captureHeight,
    onclone: (clonedDocument) => {
      clonedDocument.querySelectorAll(".dark").forEach((element) => {
        element.classList.remove("dark");
      });

      clonedDocument.querySelectorAll("style").forEach((styleElement) => {
        styleElement.textContent = (styleElement.textContent || "")
          .replace(/oklch\([^)]*\)/gi, "#000000")
          .replace(/oklab\([^)]*\)/gi, "#000000");
      });

      const clonedTarget = clonedDocument.querySelector<HTMLElement>(
        "[data-template03-capture]",
      );
      if (!clonedTarget) return;

      clonedTarget.style.width = `${captureWidth}px`;
      clonedTarget.style.height = `${captureHeight}px`;
      clonedTarget.style.minWidth = `${captureWidth}px`;
      clonedTarget.style.minHeight = `${captureHeight}px`;
      clonedTarget.style.maxWidth = "none";
      clonedTarget.style.maxHeight = "none";
      clonedTarget.style.aspectRatio = "auto";
      clonedTarget.style.transform = "none";
      clonedTarget.style.overflow = "hidden";

      clonedTarget.querySelectorAll<HTMLElement>("*").forEach((element) => {
        const computed = clonedDocument.defaultView?.getComputedStyle(element);
        if (computed?.transform && computed.transform !== "none") {
          element.style.transform = "none";
        }
        if (computed?.textOverflow === "ellipsis") {
          element.style.textOverflow = "clip";
        }
      });
    },
  });

  if (!canvas.width || !canvas.height) {
    throw new Error("Template 3 preview produced an empty canvas");
  }

  const pdfWidth = 203.2;
  const pdfHeight = 114.3;
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [pdfWidth, pdfHeight],
    compress: true,
  });

  pdf.addImage(canvas.toDataURL("image/png", 1), "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
  return pdf;
}

export default function SpecificationTemplate03({
  panel,
  qrImageSrc,
  companyLogoSrc,
  companyName,
  onBack,
  onExportPdf,
  onPrint,
}: SpecificationTemplate03Props) {
  const specs = getSpecItems(panel);

  return (
    <div className="space-y-3">
      {onBack && (
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#003366]">
          <QrCode size={15} />
          Back
        </button>
      )}

      <div
        ref={(element) => {
          template03CaptureElement = element;
        }}
        data-template03-capture="true"
        className="relative mx-auto aspect-[8/4.5] w-full overflow-hidden rounded-[1.2%] border border-[#155E8A] bg-white text-[#0B2948] shadow-sm"
      >
        <header className="absolute inset-x-0 top-0 flex h-[25%] items-center gap-[4%] border-b-[0.25%] border-[#155E8A] px-[3%] py-[2%]">
          <div className="flex aspect-square h-full shrink-0 items-center justify-center rounded-[12%] border border-[#155E8A] text-[clamp(9px,1.5vw,22px)] font-bold text-[#155E8A]">
            {companyLogoSrc ? (
              <img src={companyLogoSrc} alt="Company logo" className="h-full w-full rounded-[10%] object-contain" />
            ) : (
              <>
                <ImageIcon className="mr-[4%] h-[1em] w-[1em]" />
                <span>LOGO</span>
              </>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="break-words text-3xl font-extrabold uppercase leading-tight text-[#0B2948]">
              {companyName || "COMPANY NAME"}
            </p>
            <p className="mt-[2%] text-lg font-medium leading-tight text-[#0B2948]">
              Electrical Solutions
            </p>
          </div>
        </header>

        <div className="absolute inset-x-[3%] top-[23%] z-10 my-2 flex h-[10%] w-[94%] items-center">
          <div className="h-[2px] flex-grow bg-[#0B2948]" />
          <div className="flex items-center justify-center bg-[#075A99] px-8 py-1 text-sm font-bold uppercase text-white [clip-path:polygon(10%_0,90%_0,100%_100%,0%_100%)]">
            Technical Specifications
          </div>
          <div className="h-[2px] flex-grow bg-[#0B2948]" />
        </div>

        <main className="absolute bottom-[8%] left-[3%] right-[25%] top-[34%] flex flex-col justify-center py-[1%]">
          <div className="grid grid-cols-[auto_140px_1fr] items-center gap-x-4 gap-y-1 text-sm">
            {specs.map(({ label, value, icon: Icon }) => (
              <div key={label} className="contents">
                <Icon className="h-4 w-4 text-[#075A99]" strokeWidth={2} />
                <span className="truncate font-medium leading-tight text-gray-700">{label}</span>
                <span className="min-w-0 truncate font-bold leading-tight text-[#0B2948]">{value}</span>
              </div>
            ))}
          </div>
        </main>

        <aside className="absolute right-[3%] top-[37%] flex h-[54%] w-[19%] flex-col items-center justify-center rounded-xl border-2 border-blue-100 bg-white p-4 shadow-sm">
          {qrImageSrc ? (
            <img src={qrImageSrc} alt="Panel QR Code" className="aspect-square w-[88%] object-contain" />
          ) : (
            <QrCode className="h-[70%] w-[70%] text-[#075A99]" />
          )}
          <span className="mt-[3%] text-center text-[clamp(8px,1.1vw,17px)] font-bold leading-none text-[#2C5272]">More details</span>
        </aside>

        <footer className="absolute inset-x-0 bottom-0 flex h-[8%] items-center justify-center bg-[#075A99] text-[clamp(9px,1.25vw,19px)] font-bold leading-none text-white">
          Reliable Power. Smart Control.
        </footer>
      </div>

      {(onExportPdf || onPrint) && (
        <div className="flex justify-center gap-3 print:hidden">
          {onExportPdf && (
            <button type="button" onClick={onExportPdf} className="inline-flex items-center gap-2 rounded-lg border border-[#155E8A] px-4 py-2 text-xs font-semibold text-[#155E8A] hover:bg-blue-50">
              <Download size={14} /> Download PDF
            </button>
          )}
          {onPrint && (
            <button type="button" onClick={onPrint} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              <Printer size={14} /> Print
            </button>
          )}
        </div>
      )}
    </div>
  );
}