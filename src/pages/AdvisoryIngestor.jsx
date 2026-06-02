import { useState } from "react";
import * as adminApi from "@/lib/adminApi";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Sparkles, Loader2, CheckCircle, AlertTriangle, Copy } from "lucide-react";
import ParsedChunkPreview from "@/components/ingestor/ParsedChunkPreview";

const HAZARD_TYPES = ["Flood", "Typhoon", "Storm_Surge", "Earthquake", "Fire", "Landslide", "Volcanic", "All_Hazards"];
const SOURCE_TYPES = ["PAGASA", "NDRRMC", "DILG", "LGU_MDRRMO", "Barangay_DRRM", "OCD", "Other"];

export default function AdvisoryIngestor() {
  const [advisoryText, setAdvisoryText] = useState("");
  const [sourceType, setSourceType] = useState("PAGASA");
  const [hazardHint, setHazardHint] = useState("Flood");
  const [docTitle, setDocTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  const [isParsing, setIsParsing] = useState(false);
  const [parsedChunks, setParsedChunks] = useState([]);
  const [duplicateWarnings, setDuplicateWarnings] = useState([]);
  const [saveStatus, setSaveStatus] = useState(null); // null | "saving" | "done"

  // Fetch existing chunk_ids for duplicate check
  const { data: existingChunks = [] } = useQuery({
    queryKey: ["drrm-chunks-ids"],
    queryFn: () => adminApi.listChunks(),
  });

  const handleParse = async () => {
    if (!advisoryText.trim()) return;
    setIsParsing(true);
    setParsedChunks([]);
    setDuplicateWarnings([]);
    setSaveStatus(null);

    try {
    const chunks = await adminApi.parseAdvisory({
      advisoryText,
      sourceType,
      hazardHint,
      docTitle,
      sourceUrl,
    });

    // Flag duplicates
    const existingIds = new Set(existingChunks.map((c) => c.chunk_id));
    const warnings = chunks
      .filter((c) => c.potential_duplicate || existingIds.has(c.chunk_id))
      .map((c) => c.chunk_id);

    setParsedChunks(chunks);
    setDuplicateWarnings(warnings);
    } catch (err) {
      alert(`Parse failed: ${err.message}`);
    }
    setIsParsing(false);
  };

  const handleSavePending = async () => {
    setSaveStatus("saving");
    const toSave = parsedChunks.map((c) => ({
      chunk_id: c.chunk_id,
      source_type: sourceType,
      agency_office: sourceType,
      doc_title: docTitle || "Advisory",
      hazard_type: c.hazard_type || hazardHint,
      phase: c.phase || "All_Phases",
      format_type: c.format_type || "instruction",
      priority: c.priority || "Medium",
      original_text: c.original_text || "",
      localized_text: c.localized_text || "",
      source_url: sourceUrl || "",
      validation_status: "Pending",
      notes: c.potential_duplicate ? "⚠️ Possible duplicate — please review before approving." : "",
    }));
    await adminApi.bulkCreateChunks(toSave);
    setSaveStatus("done");
    setParsedChunks([]);
    setAdvisoryText("");
  };

  const handleRemoveChunk = (idx) => {
    setParsedChunks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleEditChunk = (idx, field, value) => {
    setParsedChunks((prev) => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-white/10 rounded-lg">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-base leading-tight tracking-tight">Advisory Ingestor</h1>
                <p className="text-[11px] opacity-60 font-medium">Parse advisory → Draft chunks → Pending review</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Data Flow Banner */}
        <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4">
          <p className="font-bold text-xs text-foreground mb-2.5 uppercase tracking-widest">Pipeline</p>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: "1. Paste Text", active: false },
              { label: "2. LLM Parse & Localize", active: false },
              { label: "3. Duplicate Check", active: false },
              { label: "4. Review Drafts", active: false },
              { label: "5. Save as Pending", active: true },
              { label: "6. Dashboard Approval", active: false },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-muted-foreground/40 text-xs">→</span>}
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${step.active ? "bg-yellow-100 text-yellow-700 border border-yellow-200" : "bg-muted text-muted-foreground"}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-muted/30 border-b border-border px-5 py-3.5 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">1</div>
            <h2 className="font-bold text-sm">Paste Advisory Text</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Source Type</Label>
                <Select value={sourceType} onValueChange={setSourceType}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCE_TYPES.map((s) => <SelectItem key={s} value={s} className="text-xs">{s.replace("_", "/")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Primary Hazard</Label>
                <Select value={hazardHint} onValueChange={setHazardHint}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HAZARD_TYPES.map((h) => <SelectItem key={h} value={h} className="text-xs">{h.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Document Title <span className="normal-case font-normal">(optional)</span></Label>
                <Input className="h-9 text-xs" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="e.g. Rainfall Advisory #12 2024" />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-4">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Source URL <span className="normal-case font-normal">(optional)</span></Label>
                <Input className="h-9 text-xs" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://pagasa.dost.gov.ph/..." />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Advisory Text *</Label>
              <Textarea
                value={advisoryText}
                onChange={(e) => setAdvisoryText(e.target.value)}
                placeholder="Paste the full advisory text here (from PAGASA, NDRRMC, MDRRMO, etc.)..."
                rows={8}
                className="text-sm resize-none bg-muted/20 border-border/70 focus:bg-card"
              />
            </div>

            <Button
              onClick={handleParse}
              disabled={!advisoryText.trim() || isParsing}
              className="gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold shadow-sm"
            >
              {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isParsing ? "Parsing & Localizing..." : "Parse Advisory into Chunks"}
            </Button>
          </div>
        </div>

        {/* Parsed Chunks Preview */}
        {parsedChunks.length > 0 && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-muted/30 border-b border-border px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">2</div>
                  <h2 className="font-bold text-sm">
                    Review {parsedChunks.length} Draft Chunk{parsedChunks.length > 1 ? "s" : ""}
                  </h2>
                </div>
                {duplicateWarnings.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1 font-semibold">
                    <AlertTriangle className="w-3 h-3" />
                    {duplicateWarnings.length} possible duplicate{duplicateWarnings.length > 1 ? "s" : ""}
                  </div>
                )}
              </div>
              <div className="p-5 space-y-4">
                {parsedChunks.map((chunk, idx) => (
                  <ParsedChunkPreview
                    key={idx}
                    chunk={chunk}
                    isDuplicate={duplicateWarnings.includes(chunk.chunk_id)}
                    onRemove={() => handleRemoveChunk(idx)}
                    onEdit={(field, value) => handleEditChunk(idx, field, value)}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              {saveStatus === "done" ? (
                <div className="flex items-center gap-2 text-green-600 text-sm font-semibold bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                  <CheckCircle className="w-4 h-4" />
                  Saved as Pending! Go to Dashboard to Approve/Reject.
                </div>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setParsedChunks([])} className="rounded-xl">Discard All</Button>
                  <Button
                    onClick={handleSavePending}
                    disabled={saveStatus === "saving" || parsedChunks.length === 0}
                    className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold shadow-sm rounded-xl"
                  >
                    {saveStatus === "saving" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Save {parsedChunks.length} Chunk{parsedChunks.length > 1 ? "s" : ""} as Pending
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}