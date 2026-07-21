import api from "../lib/api";
import type { Panel } from "../context/AppContext";

export interface PanelListResponse {
  panels: Panel[];
}

export async function fetchPanels(): Promise<Panel[]> {
  const res = await api.get<PanelListResponse>("/panels");
  return (res.data.panels || []).map((panel: any) => ({
    ...panel,
    id: panel.panelId || panel._id,
    panelName: panel.panelName || panel.name,
    panelType: panel.panelType || panel.type,
    installationLocation: panel.installationLocation || panel.location,
    customer: panel.customer,
    status: panel.status,
    createdAt: panel.createdAt
      ? new Date(panel.createdAt).toISOString().split("T")[0]
      : "",
    qrGenerated: Boolean(panel.qrGenerated),
  }));
}

export async function deletePanel(panelId: string) {
  const res = await api.delete(`/panels/${panelId}`);
  return res.data;
}

export async function fetchCompanyProfile() {
  const res = await api.get("/company");
  return res.data.company;
}

export async function saveCompanyProfile(payload: {
  name: string;
  logoUrl: string;
  installerAccessCode?: string;
}) {
  const res = await api.patch("/company", payload);
  return res.data.company;
}

export async function uploadCompanyLogo(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/uploads/image", formData);
  return response.data.url as string;
}
