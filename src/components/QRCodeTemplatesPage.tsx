import { useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  Building2,
  Check,
  Crown,
  FileText,
  LayoutDashboard,
  MapPin,
  QrCode,
  Settings,
  UserCheck,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { getAllTemplates, getTemplate } from "./templates";
import type { TemplateId } from "./templates";

export default function QRCodeTemplatesPage() {
  const { selectedTemplate, setSelectedTemplate, currentUser, logout } = useApp();
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

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Panels", icon: Zap, path: "/" },
    { label: "Company", icon: Building2, path: "/" },
    { label: "Employees", icon: Users, path: "/" },
    { label: "Customers", icon: UserCheck, path: "/" },
    { label: "Installations", icon: MapPin, path: "/" },
    { label: "QR Code Templates", icon: QrCode, path: "/qr-code-templates" },
    { label: "QR Codes", icon: QrCode, path: "/" },
    { label: "Diagrams", icon: FileText, path: "/" },
    { label: "Reports", icon: BarChart3, path: "/" },
    { label: "Maintenance", icon: Wrench, path: "/" },
  ];

  const navigateFromMenu = (path: string) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <aside className="w-16 md:w-[230px] flex-shrink-0 min-h-screen bg-white border-r border-[#E5E7EB] flex flex-col">
        <div className="h-16 flex items-center justify-center md:justify-start gap-3 px-3 md:px-5 border-b border-[#E5E7EB]">
          <div className="w-8 h-8 rounded-lg bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center flex-shrink-0">
            <Zap size={16} />
          </div>
          <div className="hidden md:block min-w-0">
            <p className="text-sm font-bold text-[#0F172A] truncate">
              {currentUser?.companyName || currentUser?.name || "EPMS"}
            </p>
            <p className="text-[10px] text-[#64748B]">Management System</p>
          </div>
        </div>
        <nav className="flex-1 py-4 px-2 md:px-3 space-y-1">
          {menuItems.map(({ label, icon: Icon, path }) => {
            const active = label === "QR Code Templates";
            return (
              <button
                key={label}
                type="button"
                title={label}
                onClick={() => navigateFromMenu(path)}
                className={`w-full flex items-center justify-center md:justify-start gap-3 px-2 md:px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#F0F9FF] text-[#0369A1]"
                    : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className="hidden md:block text-left whitespace-nowrap">
                  {label}
                </span>
              </button>
            );
          })}
        </nav>
        <div className="border-t border-[#E5E7EB] p-2 md:p-3 space-y-1">
          <button
            type="button"
            title="Settings"
            className="w-full flex items-center justify-center md:justify-start gap-3 px-2 md:px-3 py-2.5 rounded-xl text-sm text-[#64748B] hover:bg-[#F8FAFC]"
          >
            <Settings size={18} />
            <span className="hidden md:block">Settings</span>
          </button>
          <button
            type="button"
            title="Logout"
            onClick={logout}
            className="w-full flex items-center justify-center md:justify-start gap-3 px-2 md:px-3 py-2.5 rounded-xl text-sm text-[#64748B] hover:bg-red-50 hover:text-red-600"
          >
            <ArrowLeft size={18} />
            <span className="hidden md:block">Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
      {/* Top navigation */}
      <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center px-3 sm:px-6 gap-3 flex-shrink-0">
        <button
          type="button"
          onClick={handleBack}
          className="p-2 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
          title="Back to dashboard"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="hidden sm:flex items-center gap-2 text-sm">
          <span className="text-[#64748B]">EPMS</span>
          <span className="text-[#CBD5E1]">/</span>
          <span className="font-medium text-[#0F172A]">QR Code Templates</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
              currentUser?.plan === "PREMIUM"
                ? "bg-[#0EA5E9] text-white"
                : "bg-[#F1F5F9] text-[#64748B]"
            }`}
          >
            {currentUser?.plan === "PREMIUM" ? (
              <>
                <Crown size={10} /> PREMIUM
              </>
            ) : (
              "FREE"
            )}
          </span>
          <button
            type="button"
            className="p-2 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
            title="Notifications"
          >
            <Bell size={18} />
          </button>
        </div>
      </header>

      <div className="px-3 sm:px-6 pt-4 sm:pt-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A]">
          QR Code Templates
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Select a template for your QR code specifications
        </p>
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
    </div>
  );
}
