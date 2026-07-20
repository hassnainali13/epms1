import { ArrowLeft, Download, Info, Printer, QrCode, Zap } from "lucide-react";
import { jsPDF } from "jspdf";
import { useRef } from "react";
import type { Panel } from "../context/AppContext";

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

export default function PanelQRCode({
  panel,
  onBack,
}: {
  panel?: Panel;
  onBack?: () => void;
}) {
  const printRef = useRef<HTMLDivElement | null>(null);
  const qrPayload =
    panel?.qrUrl ||
    (typeof window !== "undefined" && (panel?.panelId || panel?.id)
      ? `${window.location.origin}/panel/${panel.panelId || panel.id}`
      : null);

  const qrImageSrc = qrPayload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
        qrPayload,
      )}`
    : null;

  const loadImageDataUrl = (src: string): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Unable to create canvas context"));
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Failed to load QR image"));
      img.src = src;
    });

  const createStickerPdf = async () => {
    const qrData = qrImageSrc ? await loadImageDataUrl(qrImageSrc) : null;
    const width = 76.2; // 3 inches in mm
    const height = 304.8; // 12 inches in mm
    const margin = 6;
    const contentWidth = width - margin * 2;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [width, height] });

    let y = margin;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor("#0F172A");
    pdf.setFontSize(7.5);
    pdf.text("SCAN TO VIEW PANEL DETAILS", width / 2, y, { align: "center" });

    y += 8;
    pdf.setDrawColor(59, 130, 246);
    pdf.setLineWidth(0.6);
    pdf.line(margin, y, width - margin, y);

    y += 8;
    const qrSize = 52;
    const qrX = (width - qrSize) / 2;
    if (qrData) {
      pdf.addImage(qrData, "PNG", qrX, y, qrSize, qrSize);
    }

    y += qrSize + 6;
    pdf.setFontSize(6.8);
    pdf.setTextColor("#475569");
    pdf.text("Scan to access panel details instantly", width / 2, y, { align: "center" });

    y += 12;
    const sectionPadding = 4;
    const rowHeight = 7;
    const labelWidth = 28;
    const valueWidth = contentWidth - labelWidth - 4;

    const basicRows = [
      { label: "Panel ID", value: panel?.panelId || panel?.id || "—" },
      { label: "Panel Name", value: panel?.panelName || panel?.name || "—" },
      { label: "Panel Type", value: panel?.panelType || panel?.type || "—" },
      { label: "Status", value: panel?.status || "—" },
      { label: "Customer", value: panel?.customer || "—" },
      { label: "Project", value: panel?.projectName || "—" },
      {
        label: "Location",
        value: panel?.installationLocation || panel?.location || "—",
      },
    ];

    pdf.setFillColor(59, 130, 246);
    pdf.setDrawColor(59, 130, 246);
    pdf.roundedRect(margin, y, contentWidth, 8, 2, 2, "F");
    pdf.setTextColor("#ffffff");
    pdf.setFontSize(7.3);
    pdf.text("BASIC INFORMATION", margin + 3, y + 5);

    y += 8;
    const basicHeight = basicRows.length * rowHeight + sectionPadding;
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(margin, y, contentWidth, basicHeight, 2, 2, "S");

    pdf.setTextColor("#0F172A");
    pdf.setFontSize(7.2);
    basicRows.forEach((row, index) => {
      const rowY = y + sectionPadding + rowHeight * index + 2;
      pdf.text(row.label, margin + 2, rowY);
      pdf.text(row.value, width - margin - 2, rowY, { align: "right" });

      if (index < basicRows.length - 1) {
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
        pdf.line(margin + 1, y + sectionPadding + rowHeight * (index + 1) + 1, width - margin - 1, y + sectionPadding + rowHeight * (index + 1) + 1);
      }
    });

    y += basicHeight + 10;
    const techRows = [
      { label: "Voltage", value: panel?.technicalSpecs?.voltage || "—" },
      { label: "Current", value: panel?.technicalSpecs?.current || "—" },
      { label: "Frequency", value: panel?.technicalSpecs?.frequency || "—" },
      { label: "Phase", value: panel?.technicalSpecs?.phase || "—" },
      { label: "Power Rating", value: panel?.technicalSpecs?.powerRating || "—" },
      { label: "Power Factor", value: panel?.technicalSpecs?.powerFactor || "—" },
      { label: "Control Voltage", value: panel?.technicalSpecs?.controlVoltage || "—" },
      { label: "IP Rating", value: panel?.technicalSpecs?.ipRating || "—" },
      { label: "Enclosure Material", value: panel?.technicalSpecs?.enclosureMaterial || "—" },
      { label: "Panel Color", value: panel?.technicalSpecs?.panelColor || "—" },
      { label: "Dimensions", value: panel?.technicalSpecs?.dimensions || "—" },
      { label: "Weight", value: panel?.technicalSpecs?.weight || "—" },
      { label: "Mounting Type", value: panel?.technicalSpecs?.mountingType || "—" },
      { label: "Cable Size", value: panel?.technicalSpecs?.cableSize || "—" },
      { label: "Control Cable Size", value: panel?.technicalSpecs?.controlCableSize || "—" },
    ];

    pdf.setFillColor(59, 130, 246);
    pdf.setDrawColor(59, 130, 246);
    pdf.roundedRect(margin, y, contentWidth, 8, 2, 2, "F");
    pdf.setTextColor("#ffffff");
    pdf.setFontSize(7.3);
    pdf.text("TECHNICAL SPECIFICATIONS", margin + 3, y + 5);

    y += 8;
    const techHeight = techRows.length * rowHeight + sectionPadding;
    pdf.setTextColor("#0F172A");
    pdf.setFontSize(7.2);
    pdf.roundedRect(margin, y, contentWidth, techHeight, 2, 2, "S");

    techRows.forEach((row, index) => {
      const rowY = y + sectionPadding + rowHeight * index + 2;
      pdf.text(row.label, margin + 2, rowY);
      pdf.text(row.value, width - margin - 2, rowY, { align: "right" });

      if (index < techRows.length - 1) {
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
        pdf.line(margin + 1, y + sectionPadding + rowHeight * (index + 1) + 1, width - margin - 1, y + sectionPadding + rowHeight * (index + 1) + 1);
      }
    });

    y += techHeight + 8;
    pdf.setFontSize(6.2);
    pdf.setTextColor("#94A3B8");
    pdf.text("Reliable Power. Smart Control.", width / 2, height - 6, { align: "center" });

    return pdf;
  };

  const exportToPdf = async () => {
    try {
      const pdf = await createStickerPdf();
      const fileName = `${panel?.panelId || panel?.id || "panel"}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("PDF export failed", error);
    }
  };

  const openPrintWindow = async () => {
    try {
      const pdf = await createStickerPdf();
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const w = window.open(url, "_blank");
      if (!w) return;
      w.focus();
      const attemptPrint = () => {
        try {
          w.print();
        } catch {
          // ignore
        }
      };
      const interval = setInterval(attemptPrint, 400);
      setTimeout(() => {
        clearInterval(interval);
        try {
          w.close();
        } catch {
          // ignore
        }
        URL.revokeObjectURL(url);
      }, 5000);
    } catch (error) {
      console.error("Print PDF failed", error);
    }
  };

  return (
    <div
      ref={printRef}
      className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-1 gap-5"
    >
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_8px_rgba(0,0,0,0.04)] overflow-hidden print:shadow-none print:border-black/10">
        <div className="flex flex-col gap-3 px-6 py-4 border-b border-[#F1F5F9] sm:flex-row sm:items-center sm:justify-between">
          {onBack ? (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F172A] hover:text-[#0369A1] transition-colors"
            >
              <ArrowLeft size={14} />
              Back
            </button>
          ) : null}

          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "#0EA5E915" }}
            >
              <QrCode size={16} style={{ color: "#0EA5E9" }} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0F172A]">QR Code</p>
              <p className="text-xs text-[#64748B] mt-0.5">
                Scan to access panel details instantly
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 flex flex-col items-center">
          <div className="relative">
            <div className="w-52 h-52 bg-white border-2 border-[#0F172A] rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex items-center justify-center">
              {qrImageSrc ? (
                <img
                  src={qrImageSrc}
                  alt="Panel QR Code"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center text-xs text-[#64748B]">
                  QR not available
                </div>
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-[#0EA5E9] flex items-center justify-center shadow-lg">
                <Zap size={18} className="text-white" />
              </div>
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="text-base font-bold text-[#0F172A] font-mono tracking-widest">
              {panel?.panelId || panel?.id || "—"}
            </p>
            <p className="text-xs text-[#64748B] mt-1">
              Scan to view full panel details
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 w-full sm:flex-row sm:justify-center print:hidden">
            <button
              type="button"
              onClick={() => void exportToPdf()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#0EA5E9] bg-white px-4 py-3 text-xs font-semibold text-[#0EA5E9] transition-colors hover:bg-[#EFF6FF]"
            >
              <Download size={14} />
              Download PDF
            </button>
            <button
              type="button"
              onClick={openPrintWindow}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-xs font-semibold text-[#475569] transition-colors hover:bg-[#F8FAFC]"
            >
              <Printer size={14} />
              Print
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-5 overflow-y-auto max-h-[calc(100vh-240px)] print:overflow-visible print:max-h-full print:h-auto">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_8px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "#8B5CF615" }}
              >
                <Info size={16} style={{ color: "#8B5CF6" }} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0F172A]">
                  Basic Information
                </p>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Panel core details
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-3">
            {[
              { label: "Panel ID", value: panel?.panelId || panel?.id || "—" },
              {
                label: "Panel Name",
                value: panel?.panelName || panel?.name || "—",
              },
              {
                label: "Panel Type",
                value: panel?.panelType || panel?.type || "—",
              },
              { label: "Status", value: panel?.status || "—" },
              { label: "Customer", value: panel?.customer || "—" },
              { label: "Project", value: panel?.projectName || "—" },
              {
                label: "Location",
                value: panel?.installationLocation || panel?.location || "—",
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-start justify-between gap-3 py-2 border-b border-[#F8FAFC] last:border-0"
              >
                <span className="text-xs text-[#64748B] flex-shrink-0 w-32">
                  {label}
                </span>
                <span className="text-xs font-semibold text-[#0F172A] text-right">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_1px_8px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "#8B5CF615" }}
              >
                <Info size={16} style={{ color: "#8B5CF6" }} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0F172A]">
                  Technical Specs
                </p>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Electrical and panel specifications
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-3">
            {[
              {
                label: "Voltage",
                value: panel?.technicalSpecs?.voltage || "—",
              },
              {
                label: "Current",
                value: panel?.technicalSpecs?.current || "—",
              },
              {
                label: "Frequency",
                value: panel?.technicalSpecs?.frequency || "—",
              },
              {
                label: "Phase",
                value: panel?.technicalSpecs?.phase || "—",
              },
              {
                label: "Power Rating",
                value: panel?.technicalSpecs?.powerRating || "—",
              },
              {
                label: "Power Factor",
                value: panel?.technicalSpecs?.powerFactor || "—",
              },
              {
                label: "Control Voltage",
                value: panel?.technicalSpecs?.controlVoltage || "—",
              },
              {
                label: "IP Rating",
                value: panel?.technicalSpecs?.ipRating || "—",
              },
              {
                label: "Enclosure Material",
                value: panel?.technicalSpecs?.enclosureMaterial || "—",
              },
              {
                label: "Panel Color",
                value: panel?.technicalSpecs?.panelColor || "—",
              },
              {
                label: "Dimensions",
                value: panel?.technicalSpecs?.dimensions || "—",
              },
              {
                label: "Weight",
                value: panel?.technicalSpecs?.weight || "—",
              },
              {
                label: "Mounting Type",
                value: panel?.technicalSpecs?.mountingType || "—",
              },
              {
                label: "Cable Size",
                value: panel?.technicalSpecs?.cableSize || "—",
              },
              {
                label: "Control Cable Size",
                value: panel?.technicalSpecs?.controlCableSize || "—",
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-start justify-between gap-3 py-2 border-b border-[#F8FAFC] last:border-0"
              >
                <span className="text-xs text-[#64748B] flex-shrink-0 w-32">
                  {label}
                </span>
                <span className="text-xs font-semibold text-[#0F172A] text-right">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
