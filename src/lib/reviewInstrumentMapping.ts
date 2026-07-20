export type ReviewInstrumentItem = {
  company: string;
  model: string;
  count: number;
};

export type ReviewInstrumentGroup = {
  category: string;
  items: ReviewInstrumentItem[];
  totalCount: number;
};

function normalizeString(v: unknown) {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

function parseSavedEntry(entry: unknown) {
  if (typeof entry === "string") {
    const trimmed = entry.trim();
    if (trimmed.includes("::")) {
      const [company, ...modelParts] = trimmed.split("::");
      return {
        company: normalizeString(company) || "Unknown company",
        model: normalizeString(modelParts.join("::")) || "Unknown model",
      };
    }
    return { company: "Unknown company", model: trimmed || "Unknown model" };
  }

  if (entry && typeof entry === "object") {
    const rec = entry as Record<string, unknown>;
    const company =
      normalizeString(rec.company || rec.companyName || rec.manufacturer) ||
      "Unknown company";
    const model =
      normalizeString(rec.model || rec.modelName || rec.name) ||
      "Unknown model";
    return { company, model };
  }

  return { company: "Unknown company", model: "Unknown model" };
}

export function groupSavedInstrumentModels(
  instrumentModels?: Record<string, unknown> | null,
): ReviewInstrumentGroup[] {
  if (!instrumentModels || typeof instrumentModels !== "object") return [];

  return Object.entries(instrumentModels)
    .filter(([cat, values]) => Boolean(cat) && Array.isArray(values))
    .map(([category, values]) => {
      const entries = Array.isArray(values) ? values : [];
      const counts = new Map<string, number>();

      entries.forEach((entry) => {
        const { company, model } = parseSavedEntry(entry);
        const key = `${company}::${model}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      });

      const items: ReviewInstrumentItem[] = Array.from(counts.entries()).map(
        ([key, count]) => {
          const [company, ...modelParts] = key.split("::");
          return {
            company: company || "Unknown company",
            model: modelParts.join("::") || "Unknown model",
            count,
          };
        },
      );

      return {
        category,
        items,
        totalCount: items.reduce((s, it) => s + it.count, 0),
      };
    })
    .filter((g) => g.items.length > 0);
}
