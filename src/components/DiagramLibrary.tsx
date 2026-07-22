import { useEffect, useMemo, useState } from "react";
import { FileText, Plus, Trash2, Upload } from "lucide-react";
import api from "../lib/api";

type DiagramItem = {
  id?: string;
  _id?: string;
  name: string;
  url?: string;
  publicId?: string;
  fileType?: string;
  source?: "upload" | "library";
  createdAt?: string;
};

export default function DiagramLibrary() {
  const [diagrams, setDiagrams] = useState<DiagramItem[]>([]);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadDiagrams = async () => {
    try {
      const response = await api.get("/diagrams");
      setDiagrams(response.data.diagrams || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDiagrams();
  }, []);

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (!file) {
        throw new Error("Please choose a file.");
      }

      const formData = new FormData();
      formData.append("file", file);
      const uploadResponse = await api.post("/uploads/image", formData);

      const payload = {
        name: name.trim() || file.name,
        url: uploadResponse.data.url,
        publicId: uploadResponse.data.publicId || "",
        fileType: file.type || "image",
        source: "library",
      };

      await api.post("/diagrams", payload);
      setName("");
      setFile(null);
      setSuccess("Diagram saved to the library.");
      await loadDiagrams();
    } catch (err: any) {
      setError(err?.message || "Unable to save diagram.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: DiagramItem) => {
    const id = item.id || item._id;
    if (!id) return;
    try {
      await api.delete(`/diagrams/${id}`);
      setSuccess("Diagram removed from the library.");
      await loadDiagrams();
    } catch (err: any) {
      setError(err?.message || "Unable to delete diagram.");
    }
  };

  const summary = useMemo(() => {
    return `${diagrams.length} diagram${diagrams.length === 1 ? "" : "s"} saved`;
  }, [diagrams.length]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A]">
              Diagram Library
            </h2>
            <p className="text-xs text-[#64748B] mt-1">{summary}</p>
          </div>
        </div>

        <form
          onSubmit={handleUpload}
          className="mt-5 grid gap-4 md:grid-cols-[1fr_220px_auto]"
        >
          <div>
            <label className="text-xs font-semibold text-[#0F172A] block mb-1.5">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Main Wiring Diagram"
              className="w-full rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/10"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#0F172A] block mb-1.5">
              File
            </label>
            <label className="flex h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-3 text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9]">
              <Upload size={14} />
              {file ? file.name : "Choose file"}
              <input
                type="file"
                accept="image/*,.pdf,.dwg,.dxf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0EA5E9] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0284C7] disabled:opacity-70"
          >
            <Plus size={14} /> {saving ? "Saving..." : "Save"}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <div className="space-y-3">
          {diagrams.length ? (
            diagrams.map((item) => (
              <div
                key={item.id || item._id || item.name}
                className="flex flex-col gap-3 rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E0F2FE] text-[#0369A1]">
                    <FileText size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">
                      {item.name}
                    </p>
                    <p className="text-xs text-[#64748B] mt-1">
                      {item.fileType || "Saved diagram"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B]">
                  <span className="rounded-full bg-white px-2.5 py-1">
                    Used in panels: 0
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString("en-GB")
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      item.url &&
                      window.open(item.url, "_blank", "noopener,noreferrer")
                    }
                    className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9]"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#64748B]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#64748B]"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="rounded-xl border border-[#E5E7EB] p-2 text-[#64748B] hover:border-red-300 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-8 text-center text-sm text-[#64748B]">
              No saved diagrams yet. Add the first one above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
