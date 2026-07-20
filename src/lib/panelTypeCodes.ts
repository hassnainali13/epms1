export const PANEL_TYPE_CODES: Record<string, string> = {
  "MCC (Motor Control Center)": "MCC",
  "Distribution Board": "DB",
  "PLC Control Panel": "PLC",
  "HV Switchgear": "HV",
  "LV Switchgear": "LV",
  "Power Factor Correction": "PFC",
  "Bus Duct Panel": "BDP",
  "Transfer Switch Panel": "TSP",
  "Lighting Control Panel": "LCP",
  "Feeder Pillar": "FP",
};

function normalizeKey(v: unknown) {
  if (!v) return "";
  return String(v).trim().toLowerCase();
}

export function getPanelTypeCode(panelType: unknown): string | null {
  const key = normalizeKey(panelType);
  for (const name of Object.keys(PANEL_TYPE_CODES)) {
    if (normalizeKey(name) === key) return PANEL_TYPE_CODES[name];
  }
  return null;
}

export default { getPanelTypeCode, PANEL_TYPE_CODES };
