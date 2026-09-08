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
  Zap,
} from "lucide-react";
import type { Panel } from "../../context/AppContext";

let template02CaptureElement: HTMLDivElement | null = null;

interface SpecificationTemplate02Props {
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
  {
    label: "Voltage",
    value: panel?.technicalSpecs?.voltage || "-",
    icon: Zap,
  },
  {
    label: "Current",
    value: panel?.technicalSpecs?.current || "-",
    icon: Activity,
  },
  {
    label: "Frequency",
    value: panel?.technicalSpecs?.frequency || "-",
    icon: Gauge,
  },
  {
    label: "Phase",
    value: panel?.technicalSpecs?.phase || "-",
    icon: Settings2,
  },
  {
    label: "Power Rating",
    value: panel?.technicalSpecs?.powerRating || "-",
    icon: CircleGauge,
  },
  {
    label: "Power Factor",
    value: panel?.technicalSpecs?.powerFactor || "-",
    icon: Activity,
  },
  {
    label: "Control Voltage",
    value: panel?.technicalSpecs?.controlVoltage || "-",
    icon: Settings2,
  },
  {
    label: "IP Rating",
    value: panel?.technicalSpecs?.ipRating || "-",
    icon: ShieldCheck,
  },
  {
    label: "Enclosure Material",
    value: panel?.technicalSpecs?.enclosureMaterial || "-",
    icon: Box,
  },
  {
    label: "Panel Color",
    value: panel?.technicalSpecs?.panelColor || "-",
    icon: Palette,
  },
  {
    label: "Dimensions",
    value: panel?.technicalSpecs?.dimensions || "-",
    icon: Ruler,
  },
  {
    label: "Weight",
    value: panel?.technicalSpecs?.weight || "-",
    icon: Scale,
  },
  {
    label: "Mounting Type",
    value: panel?.technicalSpecs?.mountingType || "-",
    icon: Anchor,
  },
  {
    label: "Cable Size",
    value: panel?.technicalSpecs?.cableSize || "-",
    icon: Cable,
  },
  {
    label: "Motor Quantity",
    value: `${panel?.motorConfiguration?.length || 0}`,
    icon: Cable,
  },
];

/**
 * Wait until all images inside the template are ready.
 */
async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));

  await Promise.all(
    images.map((image) => {
      if (image.complete && image.naturalWidth > 0) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        const finish = () => resolve();

        image.addEventListener("load", finish, { once: true });
        image.addEventListener("error", finish, { once: true });
      });
    }),
  );
}

/**
 * Replace unsupported modern CSS color functions that can make
 * html2canvas fail while cloning the document.
 */
function sanitizeCssInClone(clonedDocument: Document): void {
  const replaceUnsupportedColors = (text: string): string => {
    return text
      .replace(/oklch\([^)]*\)/gi, "#000000")
      .replace(/oklab\([^)]*\)/gi, "#000000");
  };

  clonedDocument.querySelectorAll("style").forEach((styleElement) => {
    styleElement.textContent = replaceUnsupportedColors(
      styleElement.textContent || "",
    );
  });

  Array.from(clonedDocument.styleSheets).forEach((styleSheet) => {
    try {
      const cssRules = Array.from(styleSheet.cssRules);

      const cssText = cssRules
        .map((rule) => rule.cssText)
        .join("\n");

      if (!/oklch\(|oklab\(/i.test(cssText)) {
        return;
      }

      const sanitizedStyle = clonedDocument.createElement("style");

      sanitizedStyle.textContent = replaceUnsupportedColors(cssText);

      clonedDocument.head.appendChild(sanitizedStyle);

      const ownerNode = styleSheet.ownerNode as
        | HTMLStyleElement
        | HTMLLinkElement
        | null;

      if (ownerNode && ownerNode.parentNode) {
        ownerNode.parentNode.removeChild(ownerNode);
      }
    } catch {
      // Ignore inaccessible third-party stylesheets.
    }
  });
}

/**
 * Export Template 02 to a PDF.
 *
 * Important:
 * The live preview is NOT modified.
 * html2canvas receives a cloned version of the template where
 * the specification cells are explicitly sized and made visible.
 */
export async function createSpecificationTemplate02Pdf(
  _panel: Panel | undefined,
  _qrImageSrc: string | null,
  _companyLogoSrc: string | undefined,
  _companyName: string,
  _isFree: boolean = false,
): Promise<jsPDF> {
  if (!template02CaptureElement) {
    throw new Error("Template 2 preview is not mounted");
  }

  const sourceElement = template02CaptureElement;

  await document.fonts?.ready;
  await waitForImages(sourceElement);

  const rect = sourceElement.getBoundingClientRect();

  const captureWidth = Math.max(1, Math.round(rect.width));
  const captureHeight = Math.max(
    1,
    Math.round(captureWidth * 0.4),
  );

  const canvas = await html2canvas(sourceElement, {
    scale: 3,
    backgroundColor: "#ffffff",
    useCORS: true,
    allowTaint: false,
    logging: false,
    imageTimeout: 15000,

    /**
     * These options make the capture more deterministic.
     */
    width: captureWidth,
    height: captureHeight,
    windowWidth: captureWidth,
    windowHeight: captureHeight,

    onclone: (clonedDocument) => {
      sanitizeCssInClone(clonedDocument);

      /**
       * Remove dark mode from the clone.
       */
      clonedDocument.querySelectorAll(".dark").forEach((element) => {
        element.classList.remove("dark");
      });

      /**
       * Force predictable light-theme colors.
       */
      const lightTheme: Record<string, string> = {
        "--background": "#F8FAFC",
        "--foreground": "#0F172A",
        "--card": "#FFFFFF",
        "--card-foreground": "#0F172A",
        "--border": "#E5E7EB",
        "--input": "transparent",
        "--ring": "#0EA5E9",
      };

      Object.entries(lightTheme).forEach(([property, value]) => {
        clonedDocument.documentElement.style.setProperty(
          property,
          value,
        );

        clonedDocument.body.style.setProperty(
          property,
          value,
        );
      });

      /**
       * Find the cloned template.
       */
      const clonedTarget =
        clonedDocument.querySelector<HTMLElement>(
          "[data-template02-capture]",
        );

      if (!clonedTarget) {
        return;
      }

      /**
       * Make the template an explicit fixed-size canvas.
       */
      clonedTarget.style.width = `${captureWidth}px`;
      clonedTarget.style.height = `${captureHeight}px`;
      clonedTarget.style.minWidth = `${captureWidth}px`;
      clonedTarget.style.minHeight = `${captureHeight}px`;
      clonedTarget.style.maxWidth = "none";
      clonedTarget.style.maxHeight = "none";
      clonedTarget.style.aspectRatio = "auto";
      clonedTarget.style.overflow = "visible";
      clonedTarget.style.transform = "none";
      clonedTarget.style.position = "relative";
      clonedTarget.style.backgroundColor = "#ffffff";
      clonedTarget.style.color = "#0F172A";

      /**
       * Disable all clipping on direct children.
       */
      clonedTarget.querySelectorAll<HTMLElement>("*").forEach((element) => {
        const computed = clonedDocument.defaultView?.getComputedStyle(
          element,
        );

        if (!computed) {
          return;
        }

        /**
         * We don't want the export to inherit problematic transforms.
         */
        if (
          computed.transform &&
          computed.transform !== "none"
        ) {
          element.style.transform = "none";
        }

        /**
         * Critical for the specification values:
         * do not let parent containers clip them.
         */
        if (
          element.classList.contains("overflow-hidden") ||
          computed.overflow === "hidden"
        ) {
          element.style.overflow = "visible";
        }

        if (computed.textOverflow === "ellipsis") {
          element.style.textOverflow = "clip";
        }
      });

      /**
       * ------------------------------------------------------------
       * SPECIFICATION GRID EXPORT FIX
       * ------------------------------------------------------------
       */
      const clonedGrid =
        clonedTarget.querySelector<HTMLElement>(".grid");

      if (clonedGrid) {
        clonedGrid.style.display = "grid";
        clonedGrid.style.overflow = "hidden";
        clonedGrid.style.height = "84%";
        clonedGrid.style.minHeight = "0";
        clonedGrid.style.gridTemplateRows = "repeat(3, minmax(0, 1fr))";

        const cells = Array.from(
          clonedGrid.children,
        ) as HTMLElement[];

        cells.forEach((cell) => {
          cell.style.minWidth = "0";
          cell.style.minHeight = "0";
          cell.style.height = "100%";
          cell.style.overflow = "hidden";

          cell.style.display = "flex";
          cell.style.flexDirection = "row";
          cell.style.alignItems = "flex-start";
          cell.style.justifyContent = "flex-start";

          cell.style.padding = "2px 5px 1px";
          cell.style.gap = "5px";

          cell.style.boxSizing = "border-box";

          /**
           * Remove any inherited clipping.
           */
          cell.style.textOverflow = "clip";
          cell.style.whiteSpace = "normal";
        });

        /**
         * Every icon gets a stable size.
         */
        cells.forEach((cell) => {
          const svg = cell.querySelector<SVGElement>("svg");

          if (svg) {
            svg.style.width = "13px";
            svg.style.height = "13px";
            svg.style.minWidth = "13px";
            svg.style.minHeight = "13px";
            svg.style.flexShrink = "0";
            svg.style.display = "block";
            svg.style.color = "#065F46";
            svg.style.overflow = "visible";
          }
        });

        /**
         * Explicitly style label/value text.
         *
         * This is the most important part of the fix.
         * Values are no longer dependent on clamp(), flex height,
         * overflow-hidden or responsive viewport units.
         */
        cells.forEach((cell) => {
          const textBlock =
            cell.querySelector<HTMLElement>("div");

          if (textBlock) {
            textBlock.style.minWidth = "0";
            textBlock.style.minHeight = "0";
            textBlock.style.height = "auto";
            textBlock.style.maxHeight = "none";
            textBlock.style.flex = "1 1 auto";
            textBlock.style.display = "flex";
            textBlock.style.flexDirection = "column";
            textBlock.style.justifyContent = "flex-start";
            textBlock.style.alignItems = "flex-start";
            textBlock.style.overflow = "visible";
            textBlock.style.lineHeight = "1.05";
          }

          const paragraphs = Array.from(
            cell.querySelectorAll<HTMLParagraphElement>("p"),
          );

          const label = paragraphs[0];
          const value = paragraphs[1];

          /**
           * Label
           */
          if (label) {
            label.style.display = "block";
            label.style.visibility = "visible";
            label.style.opacity = "1";

            label.style.width = "100%";
            label.style.height = "auto";
            label.style.minHeight = "0";
            label.style.maxHeight = "none";

            label.style.margin = "0";
            label.style.padding = "0";

            label.style.overflow = "visible";
            label.style.textOverflow = "clip";
            label.style.whiteSpace = "nowrap";
            label.style.wordBreak = "normal";

            label.style.fontFamily =
              "Arial, Helvetica, sans-serif";

            label.style.fontSize = "8px";
            label.style.fontWeight = "700";
            label.style.lineHeight = "1.15";

            label.style.color = "#475569";

            label.style.transform = "none";
          }

          /**
           * VALUE
           */
          if (value) {
            value.style.display = "block";
            value.style.visibility = "visible";
            value.style.opacity = "1";

            value.style.width = "100%";
            value.style.height = "10px";
            value.style.minHeight = "0";
            value.style.maxHeight = "none";

            value.style.margin = "2px 0 0";
            value.style.padding = "0";

            value.style.overflow = "visible";
            value.style.textOverflow = "clip";
            value.style.whiteSpace = "nowrap";
            value.style.wordBreak = "normal";

            value.style.fontFamily =
              "Arial, Helvetica, sans-serif";

            value.style.fontSize = "9px";
            value.style.fontWeight = "700";
            value.style.lineHeight = "1";

            value.style.color = "#065F46";

            value.style.transform = "none";
          }
        });
      }

      /**
       * ------------------------------------------------------------
       * HEADER FIX
       * ------------------------------------------------------------
       */
      const header =
        clonedTarget.firstElementChild as HTMLElement | null;

      if (header) {
        header.style.overflow = "visible";

        const headerParagraphs =
          header.querySelectorAll<HTMLParagraphElement>("p");

        headerParagraphs.forEach((paragraph, index) => {
          paragraph.style.display = "block";
          paragraph.style.visibility = "visible";
          paragraph.style.opacity = "1";

          paragraph.style.height = "auto";
          paragraph.style.maxHeight = "none";

          paragraph.style.overflow = "visible";
          paragraph.style.textOverflow = "clip";

          paragraph.style.whiteSpace =
            index === 0 ? "nowrap" : "normal";

          paragraph.style.lineHeight =
            index === 0 ? "1.05" : "1.1";

          paragraph.style.fontFamily =
            "Arial, Helvetica, sans-serif";
          paragraph.style.fontSize = index === 0 ? "20px" : "9px";
          paragraph.style.fontWeight = index === 0 ? "800" : "500";
          paragraph.style.letterSpacing = index === 0 ? "0.01em" : "0.02em";

          paragraph.style.transform = "none";
        });
      }

      /**
       * ------------------------------------------------------------
       * TECHNICAL SPECIFICATION HEADING FIX
       * ------------------------------------------------------------
       */
      const heading =
        clonedTarget.querySelector<HTMLElement>(
          "[data-template02-heading]",
        );

      if (heading) {
        heading.style.overflow = "visible";
        heading.style.transform = "translateY(-6px)";
        heading.style.display = "flex";
        heading.style.alignItems = "center";
        heading.style.justifyContent = "center";
        heading.style.lineHeight = "1";
        heading.style.fontSize = "16px";
        heading.style.fontWeight = "800";
        heading.style.letterSpacing = "0.02em";

        heading.querySelectorAll<HTMLElement>("span").forEach(
          (span, index) => {
            span.style.overflow = "visible";
            span.style.whiteSpace = "nowrap";
            span.style.display = "block";
            span.style.lineHeight = "1";
            span.style.verticalAlign = "middle";

            if (index === 0 || index === 4) {
              span.style.transform = "translateY(4px)";
            } else if (index === 2) {
              span.style.transform = "translateY(-1px)";
            } else {
              span.style.transform = "translateY(0)";
            }
          },
        );
      }

      /**
       * ------------------------------------------------------------
       * QR SECTION FIX
       * ------------------------------------------------------------
       */
      const qrSection =
        clonedTarget.querySelector<HTMLElement>(
          'div[class*="right-"]',
        );

      if (qrSection) {
        qrSection.style.overflow = "visible";
      }

      clonedTarget.querySelectorAll<HTMLImageElement>("img").forEach(
        (image) => {
          image.style.opacity = "1";
          image.style.visibility = "visible";
        },
      );

      /**
       * Footer should stay visible.
       */
      const footer =
        clonedTarget.querySelector<HTMLElement>(
          '[class*="bottom-"][class*="bg-[#065f46]"]',
        );

      if (footer) {
        footer.style.overflow = "visible";
      }
    },
  });

  if (!canvas.width || !canvas.height) {
    throw new Error(
      "Template 2 preview produced an empty canvas",
    );
  }

  /**
   * Final PDF size.
   *
   * 254 x 101.6 mm = 10 x 4 inch landscape label.
   */
  const pdfWidth = 254;
  const pdfHeight = 101.6;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [pdfWidth, pdfHeight],
    compress: true,
  });

  const imageData = canvas.toDataURL(
    "image/png",
    1.0,
  );

  pdf.addImage(
    imageData,
    "PNG",
    0,
    0,
    pdfWidth,
    pdfHeight,
    undefined,
    "FAST",
  );

  return pdf;
}

export default function SpecificationTemplate02({
  panel,
  qrImageSrc,
  companyLogoSrc,
  companyName,
  onBack,
  onExportPdf,
  onPrint,
}: SpecificationTemplate02Props) {
  const specs = getSpecItems(panel);

  return (
    <div className="space-y-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#065f46]"
        >
          <QrCode size={15} />
          Back
        </button>
      )}

      <div
        ref={(element) => {
          template02CaptureElement = element;
        }}
        data-template02-capture="true"
        className="relative mx-auto aspect-[5/2] w-full overflow-hidden rounded-[1.2%] border border-[#065f46] bg-white shadow-sm"
      >
        {/* =========================================================
            HEADER
        ========================================================== */}
        <div className="absolute inset-x-0 top-0 h-[28%] border-b-[0.25%] border-[#065f46] px-[2%] py-[1.8%]">
          <div className="flex h-full w-[78%] items-start gap-[2%]">
            <div className="flex aspect-square h-full shrink-0 items-center justify-center rounded-[10%] border border-[#065f46] text-[10px] font-bold text-[#065f46]">
              {companyLogoSrc ? (
                <img
                  src={companyLogoSrc}
                  alt="Company logo"
                  className="h-full w-full rounded-md object-contain"
                />
              ) : (
                <>
                  <ImageIcon size={15} />
                  <span className="sr-only">
                    Logo
                  </span>
                </>
              )}
            </div>

            <div className="min-w-0 pt-[1%]">
              <p className="truncate text-[clamp(12px,1.3vw,20px)] font-extrabold uppercase leading-tight tracking-[0.01em] text-[#065f46]">
                {companyName || "Company Name"}
              </p>

              <p className="mt-[2%] text-[clamp(8px,0.65vw,11px)] font-medium tracking-[0.02em] text-[#065f46]">
                Electrical Solutions
              </p>
            </div>
          </div>
        </div>

        {/* =========================================================
            SPECIFICATIONS SECTION
        ========================================================== */}
        <div className="absolute bottom-[8%] left-[1.5%] right-[21%] top-[28%] px-[0.5%] py-[1.5%]">
          <div
            data-template02-heading="true"
            className="flex h-[16%] items-center justify-center gap-[2%] text-[clamp(9px,1vw,16px)] font-extrabold uppercase tracking-[0.02em] text-[#065f46]"
          >
            <span className="h-px w-[14%] bg-[#059669]" />

            <span className="text-[0.7em]">
              ◆
            </span>

            <span className="whitespace-nowrap">
              Technical Specifications
            </span>

            <span className="text-[0.7em]">
              ◆
            </span>

            <span className="h-px w-[14%] bg-[#059669]" />
          </div>

          <div className="grid h-[84%] grid-cols-5 grid-rows-3 overflow-hidden rounded-[1%] border border-slate-300">
            {specs.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex min-w-0 items-center gap-[4%] overflow-hidden border-b border-r border-slate-200 px-[3%] py-[2%]"
              >
                <Icon
                  size={24}
                  strokeWidth={1.8}
                  className="h-[38%] w-[13%] shrink-0 self-center text-[#065f46]"
                />

                <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center overflow-hidden leading-[1.05]">
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(6px,0.68vw,11px)] font-bold text-slate-600">
                    {label}
                  </p>

                  <p className="mt-[4%] overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(7px,0.72vw,12px)] font-bold text-[#065f46]">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* =========================================================
            QR SECTION
        ========================================================== */}
        <div className="absolute right-[2%] top-[25%] flex h-[70%] w-[18%] flex-col items-center justify-center rounded-[5%] border border-[#065f46] bg-white p-[1.2%]">
          {qrImageSrc ? (
            <img
              src={qrImageSrc}
              alt="Panel QR Code"
              className="aspect-square w-[88%] object-contain"
            />
          ) : (
            <QrCode className="h-[65%] w-[65%] text-[#065f46]" />
          )}

          <span className="mt-[3%] text-center text-[clamp(7px,0.75vw,13px)] font-bold text-[#065f46]">
            More details
          </span>
        </div>

        {/* =========================================================
            FOOTER
        ========================================================== */}
        <div className="absolute inset-x-0 bottom-0 flex h-[8%] items-center justify-center bg-[#065f46] text-[clamp(7px,0.7vw,12px)] font-medium text-white">
          Reliable Power. Smart Control.
        </div>
      </div>

      {/* =========================================================
          ACTION BUTTONS
      ========================================================== */}
      {(onExportPdf || onPrint) && (
        <div className="flex justify-center gap-3 print:hidden">
          {onExportPdf && (
            <button
              type="button"
              onClick={onExportPdf}
              className="inline-flex items-center gap-2 rounded-lg border border-[#059669] px-4 py-2 text-xs font-semibold text-[#059669] hover:bg-[#ecfdf5]"
            >
              <Download size={14} />
              Download PDF
            </button>
          )}

          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <Printer size={14} />
              Print
            </button>
          )}
        </div>
      )}
    </div>
  );
}