import { useEffect, useMemo, useState, useRef } from "react";
import {
  Plus,
  Search,
  FileUp,
  Sparkles,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
  X,
  Image as ImageIcon,
} from "lucide-react";
import api from "../lib/api";
import { useApp } from "../context/AppContext";

interface Instrument {
  _id: string;
  name: string;
  category: string;
  company?: string;
  status: string;
  // imageUrl removed in simplified model
  createdAt?: string;
}

interface InstrumentFormState {
  name: string;
  category: string;
  company: string;
  status: string;
}

interface ImportDuplicateRecord {
  category?: string;
  company?: string;
  name?: string;
  reason?: string;
}

interface ImportProgressState {
  mode: "csv" | "ai";
  processed: number;
  total: number;
  inserted: number;
  duplicates: number;
  invalid: number;
  current: {
    category?: string;
    company?: string;
    name?: string;
  } | null;
  percent: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  isComplete: boolean;
  error: string | null;
}

const emptyForm = (): InstrumentFormState => ({
  name: "",
  category: "",
  company: "",
  status: "Active",
});

export default function InstrumentMaster() {
  const { currentUser } = useApp();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  // status is internal and not user-editable
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewing, setViewing] = useState<Instrument | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<InstrumentFormState>(emptyForm());
  const [message, setMessage] = useState<string | null>(null);
  const [importingCsv, setImportingCsv] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [duplicateRecords, setDuplicateRecords] = useState<
    ImportDuplicateRecord[]
  >([]);
  const [invalidRecords, setInvalidRecords] = useState<ImportDuplicateRecord[]>(
    [],
  );
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [invalidModalOpen, setInvalidModalOpen] = useState(false);
  const [importProgress, setImportProgress] =
    useState<ImportProgressState | null>(null);
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const aiInputRef = useRef<HTMLInputElement | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const progressStartedAtRef = useRef<number | null>(null);

  const canManage = currentUser?.role === "super_admin";

  const categories = useMemo(() => {
    const set = Array.from(
      new Set(instruments.map((item) => item.category).filter(Boolean)),
    ).sort();
    return ["All Categories", ...set];
  }, [instruments]);

  const companies = useMemo(() => {
    const set = Array.from(
      new Set(instruments.map((i) => i.company).filter(Boolean)),
    );
    return ["All Companies", ...set.sort()];
  }, [instruments]);

  const filteredInstruments = useMemo(() => {
    const query = search.toLowerCase();
    return instruments.filter((item) => {
      const matchesSearch =
        !query ||
        [item.name, item.category, item.company]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesCategory =
        !category ||
        category === "All Categories" ||
        item.category === category;
      const matchesCompany =
        !companyFilter ||
        companyFilter === "All Companies" ||
        (item.company || "") === companyFilter;
      return matchesSearch && matchesCategory && matchesCompany;
    });
  }, [category, instruments, search, companyFilter]);

  const [visibleCount, setVisibleCount] = useState(25);
  useEffect(() => {
    // reset visible count when filters change
    setVisibleCount(25);
  }, [category, search, instruments, companyFilter]);

  const visibleInstruments = useMemo(
    () => filteredInstruments.slice(0, visibleCount),
    [filteredInstruments, visibleCount],
  );

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
    };
  }, []);

  function stopImportProgressTimer() {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    progressStartedAtRef.current = null;
  }

  function startImportProgress(mode: "csv" | "ai") {
    stopImportProgressTimer();
    progressStartedAtRef.current = Date.now();
    setImportProgress({
      mode,
      processed: 0,
      total: 0,
      inserted: 0,
      duplicates: 0,
      invalid: 0,
      current: null,
      percent: 0,
      elapsedSeconds: 0,
      remainingSeconds: 0,
      isComplete: false,
      error: null,
    });

    progressTimerRef.current = window.setInterval(() => {
      setImportProgress((prev) => {
        if (!prev) return prev;
        const elapsedSeconds = progressStartedAtRef.current
          ? Math.max(
              0,
              Math.floor((Date.now() - progressStartedAtRef.current) / 1000),
            )
          : prev.elapsedSeconds;
        const remainingSeconds =
          prev.total > 0 && prev.processed > 0 && prev.processed < prev.total
            ? Math.max(
                0,
                Math.round(
                  (elapsedSeconds * prev.total) / Math.max(prev.processed, 1) -
                    elapsedSeconds,
                ),
              )
            : 0;

        return {
          ...prev,
          elapsedSeconds,
          remainingSeconds,
        };
      });
    }, 1000);
  }

  function closeImportProgress() {
    stopImportProgressTimer();
    setImportProgress(null);
  }

  async function loadInstruments() {
    if (!canManage) return;
    setLoading(true);
    try {
      const response = await api.get("/instruments");
      const items = (response.data.instruments || []).map((it: any) => ({
        ...it,
      }));
      setInstruments(items);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to load instruments",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInstruments();
  }, [canManage]);

  function openCreate() {
    setEditingId(null);
    setViewing(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function openEdit(instrument: Instrument) {
    setEditingId(instrument._id);
    setViewing(null);
    setForm({
      name: instrument.name || "",
      category: instrument.category || "",
      company: instrument.company || "",
      status: instrument.status || "Active",
    });
    setModalOpen(true);
  }

  function openView(instrument: Instrument) {
    setViewing(instrument);
    setEditingId(null);
    setModalOpen(false);
  }

  async function saveInstrument(event: React.FormEvent) {
    event.preventDefault();
    try {
      const payload = {
        name: form.name,
        category: form.category,
        company: form.company,
      };
      if (editingId) {
        const response = await api.put(`/instruments/${editingId}`, payload);
        setInstruments((prev) =>
          prev.map((item) =>
            item._id === editingId ? response.data.instrument : item,
          ),
        );
      } else {
        const response = await api.post("/instruments", payload);
        setInstruments((prev) => [response.data.instrument, ...prev]);
      }
      setModalOpen(false);
      setMessage(editingId ? "Instrument updated" : "Instrument created");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not save instrument",
      );
    }
  }

  async function deleteInstrument(id: string) {
    try {
      await api.delete(`/instruments/${id}`);
      // reload instruments to reflect status changes or deletion
      await loadInstruments();
      setMessage("Instrument deleted or marked Inactive if in use");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not delete instrument",
      );
    }
  }

  function buildImportSummary(responseData: any) {
    const inserted = Number(
      responseData?.inserted ?? responseData?.imported ?? 0,
    );
    const processed = Number(responseData?.processed ?? 0);
    const invalidCount = Number(responseData?.invalid ?? 0);
    const duplicateRecordsFromResponse = Array.isArray(
      responseData?.duplicateRecords,
    )
      ? responseData.duplicateRecords.map((record: any) => {
          if (record?.row) {
            return {
              category: record.row.category,
              company: record.row.company,
              name: record.row.name,
              reason: record.reason || "Already Exists",
            };
          }
          return record as ImportDuplicateRecord;
        })
      : [];
    const invalidRecordsFromResponse = Array.isArray(
      responseData?.invalidRecords,
    )
      ? responseData.invalidRecords.map((record: any) => {
          if (record?.row) {
            return {
              category: record.row.category,
              company: record.row.company,
              name: record.row.name,
              reason: record.reason || "Invalid Record",
            };
          }
          return record as ImportDuplicateRecord;
        })
      : [];
    const duplicateCount = Number.isFinite(Number(responseData?.duplicates))
      ? Number(responseData.duplicates)
      : duplicateRecordsFromResponse.length;

    return {
      inserted,
      duplicates: duplicateCount,
      processed: processed || inserted + duplicateCount + invalidCount,
      invalidCount,
      duplicateRecords: duplicateRecordsFromResponse,
      invalidRecords: invalidRecordsFromResponse,
    };
  }

  function buildImportMessage(summary: ReturnType<typeof buildImportSummary>) {
    return [
      "Import Completed Successfully",
      "",
      `Processed: ${summary.processed}`,
      "",
      `Inserted: ${summary.inserted}`,
      "",
      `Duplicates: ${summary.duplicates}`,
      "",
      `Invalid: ${summary.invalidCount}`,
    ].join("\n");
  }

  async function uploadFileToImport(file: File) {
    setImportingCsv(true);
    startImportProgress("csv");

    try {
      const baseUrl = (
        api.defaults.baseURL || "http://localhost:5000/api"
      ).replace(/\/$/, "");
      const token = localStorage.getItem("epms_token");
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      let body: BodyInit;
      let contentTypeHeader: string | undefined;
      if (
        file.type.includes("text") ||
        file.name.toLowerCase().endsWith(".csv")
      ) {
        const text = await file.text();
        body = JSON.stringify({ content: text });
        contentTypeHeader = "application/json";
      } else {
        const fd = new FormData();
        fd.append("file", file);
        body = fd;
      }

      const response = await fetch(`${baseUrl}/instruments/import`, {
        method: "POST",
        headers: {
          ...headers,
          ...(contentTypeHeader ? { "Content-Type": contentTypeHeader } : {}),
          Accept: "text/event-stream",
        },
        body,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Import failed");
      }

      if (!response.body) {
        throw new Error("Import stream not available");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const lines = part.split("\n");
          let eventName = "message";
          let data = "";

          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              data += line.slice(5).trim();
            }
          }

          if (!data) continue;

          const payload = JSON.parse(data);
          if (eventName === "done") {
            const summary = buildImportSummary(payload);
            setDuplicateRecords(summary.duplicateRecords);
            setInvalidRecords(summary.invalidRecords);
            setMessage(buildImportMessage(summary));
            setDuplicateModalOpen(false);
            setInvalidModalOpen(false);
            setImportProgress((prev) =>
              prev
                ? {
                    ...prev,
                    processed: payload.processed || prev.processed,
                    total:
                      payload.total ||
                      prev.total ||
                      payload.processed ||
                      prev.processed,
                    inserted: payload.inserted || prev.inserted,
                    duplicates: payload.duplicates || prev.duplicates,
                    invalid: payload.invalid || prev.invalid,
                    current: payload.current || prev.current,
                    percent: 100,
                    isComplete: true,
                    error: null,
                  }
                : null,
            );
            stopImportProgressTimer();
            await loadInstruments();
          } else if (eventName === "progress") {
            setImportProgress((prev) =>
              prev
                ? {
                    ...prev,
                    processed: payload.processed || prev.processed,
                    total:
                      payload.total ||
                      prev.total ||
                      payload.processed ||
                      prev.processed,
                    inserted: payload.inserted || prev.inserted,
                    duplicates: payload.duplicates || prev.duplicates,
                    invalid: payload.invalid || prev.invalid,
                    current: payload.current || prev.current,
                    percent: payload.total
                      ? Math.min(
                          100,
                          Math.round((payload.processed / payload.total) * 100),
                        )
                      : prev.percent,
                    remainingSeconds:
                      payload.total && payload.processed < payload.total
                        ? Math.max(
                            0,
                            Math.round(
                              (prev.elapsedSeconds * payload.total) /
                                Math.max(payload.processed, 1) -
                                prev.elapsedSeconds,
                            ),
                          )
                        : 0,
                  }
                : null,
            );
          }
        }
      }

      if (buffer.trim()) {
        const lines = buffer.split("\n");
        let eventName = "message";
        let data = "";
        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            data += line.slice(5).trim();
          }
        }
        if (data) {
          const payload = JSON.parse(data);
          if (eventName === "done") {
            const summary = buildImportSummary(payload);
            setDuplicateRecords(summary.duplicateRecords);
            setInvalidRecords(summary.invalidRecords);
            setMessage(buildImportMessage(summary));
            setDuplicateModalOpen(false);
            setInvalidModalOpen(false);
            setImportProgress((prev) =>
              prev
                ? {
                    ...prev,
                    processed: payload.processed || prev.processed,
                    total:
                      payload.total ||
                      prev.total ||
                      payload.processed ||
                      prev.processed,
                    inserted: payload.inserted || prev.inserted,
                    duplicates: payload.duplicates || prev.duplicates,
                    invalid: payload.invalid || prev.invalid,
                    current: payload.current || prev.current,
                    percent: 100,
                    isComplete: true,
                    error: null,
                  }
                : null,
            );
            stopImportProgressTimer();
            await loadInstruments();
          }
        }
      }
    } catch (error) {
      setDuplicateRecords([]);
      setInvalidRecords([]);
      setImportProgress((prev) =>
        prev
          ? {
              ...prev,
              error: error instanceof Error ? error.message : "Import failed",
              isComplete: true,
            }
          : null,
      );
      setMessage(error instanceof Error ? error.message : "Import failed");
    } finally {
      setImportingCsv(false);
    }
  }

  async function uploadFileToAiImport(file: File) {
    setAiProcessing(true);
    startImportProgress("ai");

    try {
      const baseUrl = (
        api.defaults.baseURL || "http://localhost:5000/api"
      ).replace(/\/$/, "");
      const token = localStorage.getItem("epms_token");
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      let body: BodyInit;
      let contentTypeHeader: string | undefined;
      if (
        file.type.includes("text") ||
        file.name.toLowerCase().endsWith(".csv")
      ) {
        const text = await file.text();
        body = JSON.stringify({ content: text });
        contentTypeHeader = "application/json";
      } else {
        const fd = new FormData();
        fd.append("file", file);
        body = fd;
      }

      const response = await fetch(`${baseUrl}/instruments/ai-import`, {
        method: "POST",
        headers: {
          ...headers,
          ...(contentTypeHeader ? { "Content-Type": contentTypeHeader } : {}),
          Accept: "text/event-stream",
        },
        body,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "AI import failed");
      }

      if (!response.body) {
        throw new Error("Import stream not available");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const lines = part.split("\n");
          let eventName = "message";
          let data = "";

          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              data += line.slice(5).trim();
            }
          }

          if (!data) continue;

          const payload = JSON.parse(data);
          if (eventName === "done") {
            const summary = buildImportSummary(payload);
            setDuplicateRecords(summary.duplicateRecords);
            setInvalidRecords(summary.invalidRecords);
            setMessage(buildImportMessage(summary));
            setDuplicateModalOpen(false);
            setInvalidModalOpen(false);
            setImportProgress((prev) =>
              prev
                ? {
                    ...prev,
                    processed: payload.processed || prev.processed,
                    total:
                      payload.total ||
                      prev.total ||
                      payload.processed ||
                      prev.processed,
                    inserted: payload.inserted || prev.inserted,
                    duplicates: payload.duplicates || prev.duplicates,
                    invalid: payload.invalid || prev.invalid,
                    current: payload.current || prev.current,
                    percent: 100,
                    isComplete: true,
                    error: null,
                  }
                : null,
            );
            stopImportProgressTimer();
            await loadInstruments();
          } else if (eventName === "progress") {
            setImportProgress((prev) =>
              prev
                ? {
                    ...prev,
                    processed: payload.processed || prev.processed,
                    total:
                      payload.total ||
                      prev.total ||
                      payload.processed ||
                      prev.processed,
                    inserted: payload.inserted || prev.inserted,
                    duplicates: payload.duplicates || prev.duplicates,
                    invalid: payload.invalid || prev.invalid,
                    current: payload.current || prev.current,
                    percent: payload.total
                      ? Math.min(
                          100,
                          Math.round((payload.processed / payload.total) * 100),
                        )
                      : prev.percent,
                    remainingSeconds:
                      payload.total && payload.processed < payload.total
                        ? Math.max(
                            0,
                            Math.round(
                              (prev.elapsedSeconds * payload.total) /
                                Math.max(payload.processed, 1) -
                                prev.elapsedSeconds,
                            ),
                          )
                        : 0,
                  }
                : null,
            );
          }
        }
      }

      if (buffer.trim()) {
        const lines = buffer.split("\n");
        let eventName = "message";
        let data = "";
        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            data += line.slice(5).trim();
          }
        }
        if (data) {
          const payload = JSON.parse(data);
          if (eventName === "done") {
            const summary = buildImportSummary(payload);
            setDuplicateRecords(summary.duplicateRecords);
            setInvalidRecords(summary.invalidRecords);
            setMessage(buildImportMessage(summary));
            setDuplicateModalOpen(false);
            setInvalidModalOpen(false);
            setImportProgress((prev) =>
              prev
                ? {
                    ...prev,
                    processed: payload.processed || prev.processed,
                    total:
                      payload.total ||
                      prev.total ||
                      payload.processed ||
                      prev.processed,
                    inserted: payload.inserted || prev.inserted,
                    duplicates: payload.duplicates || prev.duplicates,
                    invalid: payload.invalid || prev.invalid,
                    current: payload.current || prev.current,
                    percent: 100,
                    isComplete: true,
                    error: null,
                  }
                : null,
            );
            stopImportProgressTimer();
            await loadInstruments();
          }
        }
      }
    } catch (error) {
      setDuplicateRecords([]);
      setInvalidRecords([]);
      setImportProgress((prev) =>
        prev
          ? {
              ...prev,
              error:
                error instanceof Error ? error.message : "AI import failed",
              isComplete: true,
            }
          : null,
      );
      setMessage(error instanceof Error ? error.message : "AI import failed");
    } finally {
      setAiProcessing(false);
    }
  }

  function onCsvButtonClick() {
    csvInputRef.current?.click();
  }

  function onAiButtonClick() {
    aiInputRef.current?.click();
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFileToImport(file);
    e.currentTarget.value = "";
  }

  function handleAiFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFileToAiImport(file);
    e.currentTarget.value = "";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Instrument Master
          </h2>
          <p className="text-sm text-slate-500">
            Global instrument library for panel creation and admin workflows.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          <Plus size={16} /> Add Instrument
        </button>
      </div>

      {message && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">
          <div className="whitespace-pre-line">{message}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {duplicateRecords.length > 0 && (
              <button
                type="button"
                onClick={() => setDuplicateModalOpen(true)}
                className="inline-flex items-center rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100"
              >
                View Duplicate Records
              </button>
            )}
            {invalidRecords.length > 0 && (
              <button
                type="button"
                onClick={() => setInvalidModalOpen(true)}
                className="inline-flex items-center rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
              >
                View Invalid Records
              </button>
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search instruments"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          >
            {categories.map((item) => (
              <option key={item} value={item === "All Categories" ? "" : item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          >
            {companies.map((item) => (
              <option key={item} value={item === "All Companies" ? "" : item}>
                {item}
              </option>
            ))}
          </select>
          {/* status is internal and not exposed in the simplified UI */}
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">
              Import instruments
            </h3>
            <div className="flex gap-2">
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleCsvFile}
                className="hidden"
              />
              <input
                ref={aiInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleAiFile}
                className="hidden"
              />

              <button
                onClick={onCsvButtonClick}
                disabled={importingCsv || aiProcessing}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-60"
              >
                <FileUp size={14} />{" "}
                {importingCsv ? "Importing..." : "Import CSV"}
              </button>
              <button
                onClick={onAiButtonClick}
                disabled={importingCsv || aiProcessing}
                className="inline-flex items-center gap-2 rounded-lg border border-violet-300 bg-violet-50 px-3 py-2 text-sm text-violet-700 hover:bg-violet-100 disabled:opacity-60"
              >
                <Sparkles size={14} />{" "}
                {aiProcessing ? "AI Processing..." : "AI Import"}
              </button>
              {canManage && (
                <button
                  onClick={async () => {
                    if (
                      !confirm(
                        "Are you sure you want to delete ALL instruments? This action cannot be undone.",
                      )
                    )
                      return;
                    try {
                      await api.post("/instruments/delete-all");
                      await loadInstruments();
                      setMessage("All instruments deleted");
                    } catch (e) {
                      setMessage(
                        e instanceof Error
                          ? e.message
                          : "Failed to delete all instruments",
                      );
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                >
                  <Trash2 size={14} /> Delete All
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.6fr_1fr_120px] gap-3 bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          <span>Instrument</span>
          <span>Category</span>
          <span>Actions</span>
        </div>
        {loading ? (
          <div className="px-4 py-8 text-sm text-slate-500">
            Loading instruments...
          </div>
        ) : filteredInstruments.length === 0 ? (
          <div className="px-4 py-8 text-sm text-slate-500">
            No instruments found.
            <div className="mt-2 text-xs text-slate-400">
              Try changing the category or search keyword.
            </div>
          </div>
        ) : (
          visibleInstruments.map((instrument) => (
            <div
              key={instrument._id}
              className="grid grid-cols-[1.6fr_1fr_120px] gap-3 border-t border-slate-100 px-4 py-3 text-sm items-center"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                    <ImageIcon size={14} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">
                      {instrument.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {instrument.createdAt}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-slate-600">{instrument.category}</div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => openView(instrument)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={() => openEdit(instrument)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => deleteInstrument(instrument._id)}
                  className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-slate-600">
          Total Instruments:{" "}
          <span className="font-medium text-slate-800">
            {instruments.length}
          </span>
          {"  "}
          {filteredInstruments.length !== instruments.length && (
            <span className="ml-2">
              Showing{" "}
              <span className="font-medium">
                {Math.min(visibleCount, filteredInstruments.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium">{filteredInstruments.length}</span>{" "}
              Instruments
            </span>
          )}
          {filteredInstruments.length === instruments.length && (
            <span className="ml-2">
              Showing{" "}
              <span className="font-medium">
                {Math.min(visibleCount, filteredInstruments.length)}
              </span>{" "}
              of <span className="font-medium">{instruments.length}</span>{" "}
              Instruments
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {visibleCount < filteredInstruments.length && (
            <button
              onClick={() =>
                setVisibleCount((v) =>
                  Math.min(v + 25, filteredInstruments.length),
                )
              }
              className="rounded-xl border border-slate-300 px-3 py-1 text-sm"
            >
              Show More
            </button>
          )}
          {visibleCount > 25 && (
            <button
              onClick={() => setVisibleCount(25)}
              className="rounded-xl border border-slate-300 px-3 py-1 text-sm"
            >
              Show Less
            </button>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {editingId ? "Edit instrument" : "Add instrument"}
                </h3>
                <p className="text-sm text-slate-500">
                  Duplicate detection is based on Category + Company + Model.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>
            <form
              onSubmit={saveInstrument}
              className="grid gap-4 md:grid-cols-2"
            >
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Name
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Company
                </label>
                <input
                  required
                  value={form.company}
                  onChange={(e) =>
                    setForm({ ...form, company: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Category
                </label>
                <select
                  required
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Select category</option>
                  {categories
                    .filter((c) => c && c !== "All Categories")
                    .map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                </select>
              </div>
              {/* Removed additional fields: manufacturer, modelNumber, rating, voltage, current, image, datasheet, notes */}
              <div className="md:col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {importProgress && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                {importProgress.isComplete ? (
                  <CheckCircle2 size={24} />
                ) : (
                  <FileUp size={24} />
                )}
              </div>
              <h3 className="text-xl font-semibold text-slate-900">
                {importProgress.isComplete
                  ? "✅ Import Completed Successfully"
                  : "Importing Instruments..."}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {importProgress.isComplete
                  ? "The import has finished. Review the results below."
                  : "Please wait while instruments are being imported. Do not close this window."}
              </p>
            </div>

            {!importProgress.isComplete ? (
              <>
                <div className="mb-4 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-sky-600 transition-all duration-300"
                    style={{ width: `${Math.max(2, importProgress.percent)}%` }}
                  />
                </div>
                <div className="mb-4 flex items-center justify-between text-sm text-slate-600">
                  <span>{importProgress.percent}%</span>
                  <span>
                    {importProgress.processed} of{" "}
                    {importProgress.total || "..."} records processed
                  </span>
                </div>
                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 md:grid-cols-2">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      Processed
                    </div>
                    <div className="mt-1 font-semibold">
                      {importProgress.processed} /{" "}
                      {importProgress.total || "..."}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      Inserted
                    </div>
                    <div className="mt-1 font-semibold">
                      {importProgress.inserted}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      Duplicates
                    </div>
                    <div className="mt-1 font-semibold">
                      {importProgress.duplicates}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      Invalid
                    </div>
                    <div className="mt-1 font-semibold">
                      {importProgress.invalid}
                    </div>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">
                    Current Record
                  </div>
                  <div className="mt-2 space-y-1">
                    <div>
                      <span className="text-slate-500">Category :</span>{" "}
                      {importProgress.current?.category || "—"}
                    </div>
                    <div>
                      <span className="text-slate-500">Company :</span>{" "}
                      {importProgress.current?.company || "—"}
                    </div>
                    <div>
                      <span className="text-slate-500">Model :</span>{" "}
                      {importProgress.current?.name || "—"}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <div>Elapsed Time : {importProgress.elapsedSeconds} sec</div>
                  <div>Remaining : ~{importProgress.remainingSeconds} sec</div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  <div className="font-semibold">Finished</div>
                  <div className="mt-2">
                    Processed : {importProgress.processed}
                  </div>
                  <div>Inserted : {importProgress.inserted}</div>
                  <div>Duplicates : {importProgress.duplicates}</div>
                  <div>Invalid : {importProgress.invalid}</div>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {duplicateRecords.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setDuplicateModalOpen(true);
                        closeImportProgress();
                      }}
                      className="rounded-xl border border-sky-300 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700"
                    >
                      View Duplicate Records
                    </button>
                  )}
                  {invalidRecords.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setInvalidModalOpen(true);
                        closeImportProgress();
                      }}
                      className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700"
                    >
                      View Invalid Records
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={closeImportProgress}
                    className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-medium text-white"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {duplicateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Duplicate Records
                </h3>
                <p className="text-sm text-slate-500">
                  Imported rows that already exist in the instrument master.
                </p>
              </div>
              <button
                onClick={() => setDuplicateModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="grid grid-cols-[1.2fr_1fr_1fr_auto] gap-3 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <span>Category</span>
                <span>Company</span>
                <span>Model</span>
                <span>Reason</span>
              </div>
              <div className="max-h-[60vh] overflow-auto">
                {duplicateRecords.map((record, index) => (
                  <div
                    key={`${record.name || "record"}-${index}`}
                    className="grid grid-cols-[1.2fr_1fr_1fr_auto] gap-3 border-t border-slate-100 px-3 py-3 text-sm text-slate-700"
                  >
                    <span>{record.category || "—"}</span>
                    <span>{record.company || "—"}</span>
                    <span>{record.name || "—"}</span>
                    <span>{record.reason || "Already Exists"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {invalidModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Invalid Records
                </h3>
                <p className="text-sm text-slate-500">
                  Rows that could not be imported because required values were
                  missing.
                </p>
              </div>
              <button
                onClick={() => setInvalidModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="grid grid-cols-[1.2fr_1fr_1fr_auto] gap-3 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <span>Category</span>
                <span>Company</span>
                <span>Model</span>
                <span>Reason</span>
              </div>
              <div className="max-h-[60vh] overflow-auto">
                {invalidRecords.map((record, index) => (
                  <div
                    key={`${record.name || "invalid"}-${index}`}
                    className="grid grid-cols-[1.2fr_1fr_1fr_auto] gap-3 border-t border-slate-100 px-3 py-3 text-sm text-slate-700"
                  >
                    <span>{record.category || "—"}</span>
                    <span>{record.company || "—"}</span>
                    <span>{record.name || "—"}</span>
                    <span>{record.reason || "Invalid Record"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Instrument details
              </h3>
              <button
                onClick={() => setViewing(null)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-800">Name:</span>{" "}
                {viewing.name}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Category:</span>{" "}
                {viewing.category}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Status:</span>{" "}
                {viewing.status}
              </p>
              {viewing.createdAt && (
                <p>
                  <span className="font-semibold text-slate-800">Created:</span>{" "}
                  {viewing.createdAt}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
