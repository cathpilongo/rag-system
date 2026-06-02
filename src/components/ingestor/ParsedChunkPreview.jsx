import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Trash2, ChevronDown, ChevronUp, Pencil, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function ParsedChunkPreview({ chunk, isDuplicate, onRemove, onEdit }) {
  const [expanded, setExpanded] = useState(true);
  const [editingLocalized, setEditingLocalized] = useState(false);
  const [tempLocalized, setTempLocalized] = useState(chunk.localized_text);

  const handleSaveLocalized = () => {
    onEdit("localized_text", tempLocalized);
    setEditingLocalized(false);
  };

  return (
    <div className={`bg-card border rounded-xl overflow-hidden ${isDuplicate ? "border-yellow-300" : "border-border"}`}>
      {/* Card Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 cursor-pointer ${isDuplicate ? "bg-yellow-50" : "bg-muted/30"}`}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {isDuplicate && (
            <span className="flex items-center gap-1 text-[10px] bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-full px-2 py-0.5 font-medium">
              <AlertTriangle className="w-2.5 h-2.5" /> Possible Duplicate
            </span>
          )}
          <span className="font-mono text-xs font-semibold text-primary">{chunk.chunk_id}</span>
          <Badge variant="outline" className="text-[10px] h-4">{chunk.hazard_type?.replace("_", " ")}</Badge>
          <Badge variant="outline" className="text-[10px] h-4">{chunk.phase?.replace(/_/g, "/")}</Badge>
          <Badge variant="outline" className="text-[10px] h-4">{chunk.format_type}</Badge>
          {chunk.priority === "High" && (
            <Badge className="text-[10px] h-4 bg-red-100 text-red-700 border border-red-200">High</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:bg-red-50"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Card Body */}
      {expanded && (
        <div className="px-4 py-3 space-y-3">
          {/* Chunk ID editable */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20">Chunk ID</span>
            <Input
              className="h-7 text-xs font-mono flex-1"
              value={chunk.chunk_id}
              onChange={(e) => onEdit("chunk_id", e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Original Text */}
          {chunk.original_text && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Original Text</p>
              <p className="text-xs text-muted-foreground bg-muted/40 rounded p-2 italic">{chunk.original_text}</p>
            </div>
          )}

          {/* Localized Text */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Localized Text (Cebuano-English)</p>
              {!editingLocalized ? (
                <Button variant="ghost" size="sm" className="h-5 text-[10px] gap-1 px-2" onClick={() => { setTempLocalized(chunk.localized_text); setEditingLocalized(true); }}>
                  <Pencil className="w-2.5 h-2.5" /> Edit
                </Button>
              ) : (
                <Button variant="ghost" size="sm" className="h-5 text-[10px] gap-1 px-2 text-green-600" onClick={handleSaveLocalized}>
                  <Check className="w-2.5 h-2.5" /> Done
                </Button>
              )}
            </div>
            {editingLocalized ? (
              <Textarea
                value={tempLocalized}
                onChange={(e) => setTempLocalized(e.target.value)}
                rows={6}
                className="text-xs resize-none"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="prose prose-sm max-w-none text-sm bg-muted/20 rounded-lg p-3 border">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="my-0.5 leading-relaxed text-xs">{children}</p>,
                    ul: ({ children }) => <ul className="my-1 ml-4 list-disc text-xs">{children}</ul>,
                    ol: ({ children }) => <ol className="my-1 ml-4 list-decimal text-xs">{children}</ol>,
                    li: ({ children }) => <li className="my-0">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  }}
                >
                  {chunk.localized_text}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}