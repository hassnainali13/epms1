import SpecificationTemplate01, {
  createSpecificationTemplate01Pdf,
} from "./SpecificationTemplate01";
import SpecificationTemplate02, {
  createSpecificationTemplate02Pdf,
} from "./SpecificationTemplate02";

export type TemplateId = "template_01" | "template_02";

export interface TemplateInfo {
  id: TemplateId;
  name: string;
  description: string;
  orientation: "portrait" | "landscape";
  dimensions: {
    width: string; // e.g. "3 inches"
    height: string; // e.g. "12 inches"
  };
  component: typeof SpecificationTemplate01;
  pdfGenerator: typeof createSpecificationTemplate01Pdf;
}

export const TEMPLATES: Record<TemplateId, TemplateInfo> = {
  template_01: {
    id: "template_01",
    name: "Template 1",
    description: "Standard Portrait Specification Sheet",
    orientation: "portrait",
    dimensions: {
      width: "3 inches",
      height: "12 inches",
    },
    component: SpecificationTemplate01,
    pdfGenerator: createSpecificationTemplate01Pdf,
  },
  template_02: {
    id: "template_02",
    name: "Template 2",
    description: "Green Landscape Specification Sheet with Grid Layout",
    orientation: "landscape",
    dimensions: {
      width: "10 inches",
      height: "4 inches",
    },
    component: SpecificationTemplate02,
    pdfGenerator: createSpecificationTemplate02Pdf,
  },
};

export const DEFAULT_TEMPLATE_ID: TemplateId = "template_01";

export const getTemplate = (
  templateId: TemplateId | string,
): TemplateInfo | undefined => {
  return TEMPLATES[templateId as TemplateId];
};

export const getAllTemplates = (): TemplateInfo[] => {
  return Object.values(TEMPLATES);
};
