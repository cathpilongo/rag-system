import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import * as adminApi from "@/lib/adminApi";

const HAZARD_TYPES = ["Flood", "Typhoon", "Storm_Surge", "Earthquake", "Fire", "Landslide", "Volcanic", "All_Hazards"];
const PHASES = ["Before", "During", "After", "Before_During", "All_Phases"];
const FORMAT_TYPES = ["instruction", "checklist", "step_list", "explanation", "hotline", "warning", "local_info"];
const SOURCE_TYPES = ["PAGASA", "NDRRMC", "DILG", "LGU_MDRRMO", "Barangay_DRRM", "OCD", "Other"];
const PRIORITIES = ["High", "Medium", "Low"];
const STATUSES = ["Pending", "Approved", "Rejected", "For_Local_Validation"];

const emptyChunk = {
  chunk_id: "", source_type: "NDRRMC", agency_office: "", doc_title: "",
  doc_year: "", page_section: "", hazard_type: "Flood", phase: "Before",
  original_text: "", localized_text: "", format_type: "instruction",
  priority: "Medium", validation_status: "Pending", source_url: "",
  date_accessed: "", notes: "",
};

export default function ChunkForm({ open, onClose, onSave, editChunk }) {
  const [form, setForm] = useState(emptyChunk);
  const [idLoading, setIdLoading] = useState(false);

  useEffect(() => {
    setForm(editChunk ? { ...emptyChunk, ...editChunk } : emptyChunk);
  }, [editChunk, open]);

  useEffect(() => {
    if (!open || editChunk) return;

    let cancelled = false;
    setIdLoading(true);
    adminApi
      .getNextChunkId(form.hazard_type, form.phase)
      .then(({ chunk_id }) => {
        if (!cancelled) setForm((f) => ({ ...f, chunk_id }));
      })
      .catch(() => {
        if (!cancelled) setForm((f) => ({ ...f, chunk_id: "" }));
      })
      .finally(() => {
        if (!cancelled) setIdLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, editChunk, form.hazard_type, form.phase]);

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editChunk ? "Edit DRRM Chunk" : "Add New DRRM Chunk"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Hazard Type *</Label>
              <Select value={form.hazard_type} onValueChange={(v) => handleChange("hazard_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {HAZARD_TYPES.map((h) => <SelectItem key={h} value={h}>{h.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Phase *</Label>
              <Select value={form.phase} onValueChange={(v) => handleChange("phase", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PHASES.map((p) => <SelectItem key={p} value={p}>{p.replace("_", "/")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Chunk ID</Label>
              <Input
                value={idLoading && !editChunk ? "Generating..." : form.chunk_id}
                readOnly
                disabled
                className="font-mono bg-muted"
                placeholder="Auto-generated from hazard type and phase"
              />
              <p className="text-[11px] text-muted-foreground">
                {editChunk
                  ? "Chunk ID cannot be changed when editing."
                  : "Auto-incremented based on hazard type and phase (e.g. FLOOD_BEFORE_01)."}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Source Type</Label>
              <Select value={form.source_type} onValueChange={(v) => handleChange("source_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCE_TYPES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", "/")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Format Type</Label>
              <Select value={form.format_type} onValueChange={(v) => handleChange("format_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORMAT_TYPES.map((f) => <SelectItem key={f} value={f}>{f.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => handleChange("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Validation Status</Label>
              <Select value={form.validation_status} onValueChange={(v) => handleChange("validation_status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Doc Year</Label>
              <Input value={form.doc_year} onChange={(e) => handleChange("doc_year", e.target.value)} placeholder="e.g. 2024" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Agency / Office</Label>
            <Input value={form.agency_office} onChange={(e) => handleChange("agency_office", e.target.value)} placeholder="e.g. National Disaster Risk Reduction and Management Council" />
          </div>
          <div className="space-y-1.5">
            <Label>Document Title</Label>
            <Input value={form.doc_title} onChange={(e) => handleChange("doc_title", e.target.value)} placeholder="Title of source document" />
          </div>
          <div className="space-y-1.5">
            <Label>Original Text (English)</Label>
            <Textarea value={form.original_text} onChange={(e) => handleChange("original_text", e.target.value)} placeholder="Source-based English/official text" rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Localized Text (Cebuano-English) *</Label>
            <Textarea value={form.localized_text} onChange={(e) => handleChange("localized_text", e.target.value)} placeholder="Cebuano-English version for the chatbot" rows={4} required />
          </div>
          <div className="space-y-1.5">
            <Label>Source URL</Label>
            <Input value={form.source_url} onChange={(e) => handleChange("source_url", e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => handleChange("notes", e.target.value)} placeholder="Validation notes or instructions" rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              disabled={!editChunk && (idLoading || !form.chunk_id)}
            >
              {editChunk ? "Update Chunk" : "Add Chunk"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
