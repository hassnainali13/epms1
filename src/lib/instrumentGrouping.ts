export type InstrumentGroupItem = {
  company: string;
  model: string;
  count: number;
};

export type InstrumentCategoryGroup = {
  category: string;
  items: InstrumentGroupItem[];
  totalCount: number;
};

function normalizeText(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function normalizeForCompare(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function parseInstrumentEntry(
  entry: unknown,
  category?: string,
  instrumentsMaster?: Array<Record<string, unknown>>,
) {
  if (typeof entry === "string") {
    const trimmed = entry.trim();
    if (!trimmed) {
      return { company: "Unknown company", model: "Unknown model" };
    }

    if (trimmed.includes("::")) {
      const [company, ...modelParts] = trimmed.split("::");
      return {
        company: company?.trim() || "Unknown company",
        model: modelParts.join("::").trim() || "Unknown model",
      };
    }

    // If instruments master is provided, try to resolve company for string-only model entries
    if (Array.isArray(instrumentsMaster) && category) {
      const target = normalizeForCompare(trimmed);
      const catTarget = normalizeForCompare(category);
      const found = instrumentsMaster.find((it) => {
        const name = normalizeForCompare(
          (it as Record<string, unknown>).name ||
            (it as Record<string, unknown>).model ||
            "",
        );
        const cat = normalizeForCompare(
          (it as Record<string, unknown>).category ||
            (it as Record<string, unknown>).type ||
            "",
        );
        return name === target && (cat ? cat === catTarget : true);
      });
      if (found) {
        const company = normalizeText(
          (found as Record<string, unknown>).company ||
            (found as Record<string, unknown>).manufacturer ||
            "",
        );
        return {
          company: company || "Unknown company",
          model: trimmed,
        };
      }
    }

    return {
      company: "Unknown company",
      model: trimmed,
    };
  }

  if (entry && typeof entry === "object") {
    const record = entry as Record<string, unknown>;

    const normalizeCompanyValue = (value: unknown): string => {
      if (typeof value === "string") return normalizeText(value);
      if (value && typeof value === "object") {
        const nested = value as Record<string, unknown>;
        const nestedName = normalizeText(
          nested.name || nested.companyName || nested.label,
        );
        if (nestedName) return nestedName;
      }
      return "";
    };

    let company = normalizeCompanyValue(
      record.company ||
        record.companyName ||
        record.manufacturer ||
        record.vendor,
    );
    const model = normalizeText(
      record.model || record.modelName || record.name,
    );

    // If company is missing but we have a model and master list, try to lookup
    if (!company && model && Array.isArray(instrumentsMaster) && category) {
      const target = normalizeForCompare(model);
      const catTarget = normalizeForCompare(category);
      const found = instrumentsMaster.find((it) => {
        const name = normalizeForCompare(
          (it as Record<string, unknown>).name ||
            (it as Record<string, unknown>).model ||
            (it as Record<string, unknown>).modelName ||
            "",
        );
        const cat = normalizeForCompare(
          (it as Record<string, unknown>).category ||
            (it as Record<string, unknown>).type ||
            "",
        );
        return name === target && (cat ? cat === catTarget : true);
      });
      if (found) {
        company = normalizeText(
          (found as Record<string, unknown>).company ||
            (found as Record<string, unknown>).manufacturer ||
            "",
        );
      }
    }

    if (company || model) {
      return {
        company: company || "Unknown company",
        model: model || "Unknown model",
      };
    }
  }

  return { company: "Unknown company", model: "Unknown model" };
}

export function groupInstrumentsByCategoryCompanyModel(
  instrumentModels?: Record<string, unknown> | null,
  instrumentsMaster?: Array<Record<string, unknown>>,
): InstrumentCategoryGroup[] {
  if (!instrumentModels || typeof instrumentModels !== "object") {
    return [];
  }

  return Object.entries(instrumentModels)
    .filter(([category, values]) => Boolean(category) && Array.isArray(values))
    .map(([category, values]) => {
      const entries = Array.isArray(values) ? values : [];
      const counts = new Map<string, number>();

      entries.forEach((entry) => {
        const { company, model } = parseInstrumentEntry(
          entry,
          category,
          instrumentsMaster,
        );
        const key = `${company}::${model}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      });

      const items = Array.from(counts.entries())
        .map(([key, count]) => {
          const [company, ...modelParts] = key.split("::");
          return {
            company: company || "Unknown company",
            model: modelParts.join("::") || "Unknown model",
            count,
          };
        })
        .sort((a, b) => {
          if (a.company === b.company) {
            return a.model.localeCompare(b.model);
          }
          return a.company.localeCompare(b.company);
        });

      return {
        category,
        items,
        totalCount: items.reduce((sum, item) => sum + item.count, 0),
      };
    })
    .filter((group) => group.items.length > 0);
}
