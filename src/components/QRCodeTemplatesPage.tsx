import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { useApp } from "../context/AppContext";
import { getAllTemplates, getTemplate } from "./templates";
import type { TemplateId } from "./templates";

export default function QRCodeTemplatesPage() {
  const { selectedTemplate, setSelectedTemplate } = useApp();
  const templates = getAllTemplates();
  const selectedTemplateInfo = getTemplate(selectedTemplate);
  const SelectedTemplate = selectedTemplateInfo?.component;
//   const [isExporting, setIsExporting] = useState(false);
  const handleSelectTemplate = (templateId: TemplateId) => {
    setSelectedTemplate(templateId);
  };

  const handleBack = () => {
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  // Create mock panel data for preview
  const mockPanel = {
    panelId: "DEMO001",
    panelName: "Demo Panel",
    panelType: "Control Panel",
    status: "Ready" as const,
    customer: "Demo Customer",
    projectName: "Demo Project",
    technicalSpecs: {
      voltage: "440V",
      current: "50A",
      frequency: "50Hz",
      phase: "3-Phase",
      powerRating: "25 kW",
      powerFactor: "0.95",
      controlVoltage: "24V DC",
      ipRating: "IP54",
      enclosureMaterial: "Mild Steel",
      panelColor: "Off-White",
      dimensions: "2000 x 1200 x 600 mm",
      weight: "250 kg",
      mountingType: "Wall",
      cableSize: "6 mm²",
      controlCableSize: "1.5 mm²",
    },
  };

  const mockQrImageSrc =
    "https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=" +
    encodeURIComponent("http://example.com/panel/DEMO001");

  const mockCompanyName = "Star Electrical Engineering";
  const mockCompanyLogo = undefined;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A]">
                QR Code Templates
              </h1>
              <p className="text-sm text-[#64748B] mt-1">
                Select a template for your QR code specifications
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6 w-full max-w-[1600px] mx-auto">
          {/* Templates List */}
          <div className="min-w-0">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#F1F5F9]">
                <p className="text-sm font-bold text-[#0F172A]">
                  Available Templates
                </p>
              </div>
              <div className="divide-y divide-[#F1F5F9]">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template.id)}
                    className={`w-full px-6 py-4 text-left transition-all flex items-center justify-between ${
                      selectedTemplate === template.id
                        ? "bg-[#0EA5E9]/10 border-l-4 border-[#0EA5E9]"
                        : "hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <div>
                      <p
                        className={`font-semibold ${
                          selectedTemplate === template.id
                            ? "text-[#0EA5E9]"
                            : "text-[#0F172A]"
                        }`}
                      >
                        {template.name}
                      </p>
                      <p className="text-xs text-[#64748B] mt-1">
                        {template.orientation === "portrait"
                          ? "↕ Portrait"
                          : "↔ Landscape"}{" "}
                        — {template.dimensions.width} × {template.dimensions.height}
                      </p>
                      <p className="text-xs text-[#64748B] mt-1">
                        {template.description}
                      </p>
                    </div>
                    {selectedTemplate === template.id && (
                      <Check size={20} className="text-[#0EA5E9] flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl px-6 py-4">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">💡 Tip:</span> Your selected
                template will be used for all QR code previews and PDF exports.
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="min-w-0">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#F1F5F9]">
                <p className="text-sm font-bold text-[#0F172A]">Preview</p>
                <p className="text-xs text-[#64748B] mt-1">
                  See how your QR code will look with the selected template
                </p>
              </div>
              <div className="p-6 bg-[#F8FAFC] min-h-[600px] flex items-center justify-center">
                {SelectedTemplate && (
                  <div className="w-full">
                    <SelectedTemplate
                      panel={mockPanel}
                      qrImageSrc={mockQrImageSrc}
                      companyLogoSrc={mockCompanyLogo}
                      companyName={mockCompanyName}
                      isFree={false}
                      onExportPdf={() => {
                        alert("PDF export would be triggered here");
                      }}
                      onPrint={() => {
                        alert("Print dialog would open here");
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
