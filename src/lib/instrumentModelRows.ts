export interface InstrumentModelRow {
  company?: string;
  model?: string;
}

export interface EffectiveInstrumentModelRow extends InstrumentModelRow {
  inherited: boolean;
}

export interface GroupedInstrumentModel {
  company: string;
  model: string;
  quantity: number;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeInstrumentModelEntry(entry: unknown): InstrumentModelRow {
  if (typeof entry === "string") {
    const [company, ...modelParts] = entry.trim().split("::");
    return entry.includes("::")
      ? { company: text(company), model: text(modelParts.join("::")) }
      : { company: "", model: text(entry) };
  }

  if (entry && typeof entry === "object") {
    const record = entry as Record<string, unknown>;
    return {
      company: text(record.company || record.companyName || record.manufacturer),
      model: text(record.model || record.modelName || record.name),
    };
  }

  return {};
}

export function resolveEffectiveInstrumentRows(
  manualRows: InstrumentModelRow[] | undefined,
  quantity: number,
): EffectiveInstrumentModelRow[] {
  const rows: EffectiveInstrumentModelRow[] = [];
  const rowCount = Math.max(0, quantity);
  const manualIndexes = new Set<number>();

  for (let index = 0; index < rowCount; index += 1) {
    const raw = manualRows?.[index] || {};
    if (text(raw.company) && text(raw.model)) manualIndexes.add(index);
  }

  let anchor: InstrumentModelRow | null = null;

  for (let index = 0; index < rowCount; index += 1) {
    const raw = manualRows?.[index] || {};
    const company = text(raw.company);
    const model = text(raw.model);

    if (company && model) {
      anchor = { company, model };
      rows.push({ company, model, inherited: false });
      continue;
    }

    if (company || model) {
      rows.push({ company, model, inherited: false });
      continue;
    }

    const hasLaterManualRow = Array.from(manualIndexes).some(
      (manualIndex) => manualIndex > index,
    );
    if (!anchor || !hasLaterManualRow) {
      rows.push({ company: "", model: "", inherited: false });
      continue;
    }

    rows.push({
      company: anchor.company,
      model: anchor.model,
      inherited: true,
    });
  }

  return rows;
}

export function finalizeInstrumentRows(
  manualRows: InstrumentModelRow[] | undefined,
  quantity: number,
): EffectiveInstrumentModelRow[] {
  const rows = resolveEffectiveInstrumentRows(manualRows, quantity);
  let latestManualIndex = -1;
  let latestAnchor: InstrumentModelRow | null = null;

  for (let index = 0; index < Math.max(0, quantity); index += 1) {
    const raw = manualRows?.[index] || {};
    const company = text(raw.company);
    const model = text(raw.model);
    if (company && model) {
      latestManualIndex = index;
      latestAnchor = { company, model };
    }
  }

  if (!latestAnchor) return rows;

  for (let index = latestManualIndex + 1; index < rows.length; index += 1) {
    const raw = manualRows?.[index] || {};
    if (!text(raw.company) && !text(raw.model)) {
      rows[index] = {
        company: latestAnchor.company,
        model: latestAnchor.model,
        inherited: true,
      };
    }
  }

  return rows;
}

export function groupEffectiveInstrumentRows(
  rows: EffectiveInstrumentModelRow[],
): GroupedInstrumentModel[] {
  const groups = new Map<string, GroupedInstrumentModel>();
  rows.forEach((row) => {
    const company = text(row.company);
    const model = text(row.model);
    if (!company || !model) return;
    const key = `${company}\u0000${model}`;
    const existing = groups.get(key);
    if (existing) existing.quantity += 1;
    else groups.set(key, { company, model, quantity: 1 });
  });
  return Array.from(groups.values());
}

export function expandSavedInstrumentModels(entries: unknown[]): InstrumentModelRow[] {
  return entries.flatMap((entry) => {
    const row = normalizeInstrumentModelEntry(entry);
    const quantity =
      entry && typeof entry === "object" && Number.isFinite(Number((entry as Record<string, unknown>).quantity))
        ? Math.max(1, Number((entry as Record<string, unknown>).quantity))
        : 1;
    return Array.from({ length: quantity }, () => ({ ...row }));
  });
}
