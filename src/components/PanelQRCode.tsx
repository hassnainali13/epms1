import { useRef } from "react";
import { useApp } from "../context/AppContext";
import type { Panel } from "../context/AppContext";
import { getTemplate } from "./templates";

export default function PanelQRCode({
  panel,
  onBack,
  isFree = false,
}: {
  panel?: Panel;
  onBack?: () => void;
  isFree?: boolean;
}) {
  const { currentUser, selectedTemplate } = useApp();

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

  const companyLogoSrc =
    panel?.companyLogoUrl ||
    (typeof panel?.company === "object" ? panel.company?.logoUrl : undefined) ||
    currentUser?.companyLogoUrl ||
    undefined;

  const companyName =
    panel?.companyName ||
    (typeof panel?.company === "object" ? panel.company?.name : undefined) ||
    currentUser?.companyName ||
    currentUser?.company ||
    "Company";

  // Get the selected template
  const templateInfo = getTemplate(selectedTemplate);
  if (!templateInfo) {
    return (
      <div className="text-center p-8 text-red-600">
        Invalid template selected
      </div>
    );
  }

  const TemplateComponent = templateInfo.component;
  const pdfGenerator = templateInfo.pdfGenerator;

  const handleExportPdf = async () => {
    try {
      const pdf = await pdfGenerator(
        panel,
        qrImageSrc,
        companyLogoSrc,
        companyName,
        isFree,
      );
      const fileName = `${panel?.panelId || panel?.id || "panel"}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("PDF export failed", error);
    }
  };

  const handlePrint = async () => {
    try {
      const pdf = await pdfGenerator(
        panel,
        qrImageSrc,
        companyLogoSrc,
        companyName,
        isFree,
      );
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
    <TemplateComponent
      panel={panel}
      qrImageSrc={qrImageSrc}
      companyLogoSrc={companyLogoSrc}
      companyName={companyName}
      isFree={isFree}
      onBack={onBack}
      onExportPdf={handleExportPdf}
      onPrint={handlePrint}
    />
  );
}
