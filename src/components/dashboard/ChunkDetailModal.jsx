import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, MapPin, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";

const statusConfig = {
  Approved: "bg-green-100 text-green-700 border-green-200",
  Rejected: "bg-red-100 text-red-700 border-red-200",
  Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  For_Local_Validation: "bg-blue-100 text-blue-700 border-blue-200",
};

export default function ChunkDetailModal({ chunk, onClose, onAction }) {
  if (!chunk) return null;

  const statusClass = statusConfig[chunk.validation_status] || statusConfig.Pending;

  return (
    <Dialog open={!!chunk} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary text-xs font-bold">#</span>
            </div>
            <div>
              <DialogTitle className="font-mono text-primary text-base">{chunk.chunk_id}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{chunk.source_type || "DRRM"} · {chunk.doc_year || "N/A"}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Metadata Row */}
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-xs">{chunk.hazard_type?.replace("_", " ")}</Badge>
            <Badge variant="outline" className="text-xs">{chunk.phase?.replace(/_/g, "/")}</Badge>
            <Badge variant="outline" className="text-xs">{chunk.format_type}</Badge>
            <Badge className={`border text-xs ${statusClass}`}>{chunk.validation_status?.replace("_", " ")}</Badge>
            {chunk.priority && (
              <Badge variant="secondary" className="text-xs">{chunk.priority} Priority</Badge>
            )}
          </div>

          {/* Source Info */}
          {(chunk.agency_office || chunk.doc_title) && (
            <div className="bg-muted/40 rounded-xl p-3.5 text-sm space-y-1.5 border border-border/50">
              {chunk.agency_office && (
                <p className="text-xs"><span className="font-semibold text-foreground">Agency:</span> <span className="text-muted-foreground">{chunk.agency_office}</span></p>
              )}
              {chunk.doc_title && (
                <p className="text-xs"><span className="font-semibold text-foreground">Document:</span> <span className="text-muted-foreground">{chunk.doc_title} {chunk.doc_year && `(${chunk.doc_year})`}</span></p>
              )}
              {chunk.source_url && (
                <p className="text-xs">
                  <span className="font-semibold text-foreground">Source: </span>
                  <a href={chunk.source_url} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">
                    {chunk.source_url}
                  </a>
                </p>
              )}
            </div>
          )}

          {/* Original Text */}
          {chunk.original_text && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Original Text (English/Official)</p>
              <div className="bg-muted/30 rounded-xl p-3.5 text-sm text-muted-foreground italic border-l-4 border-primary/30">
                {chunk.original_text}
              </div>
            </div>
          )}

          {/* Localized Text */}
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Localized Text (Cebuano-English)</p>
            <div className="bg-card border border-border rounded-xl p-4 prose prose-sm max-w-none text-sm">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="my-0.5">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                }}
              >
                {chunk.localized_text}
              </ReactMarkdown>
            </div>
          </div>

          {/* Notes */}
          {chunk.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3.5">
              <p className="text-[10px] font-bold text-yellow-700 uppercase tracking-widest mb-1">Validation Notes</p>
              <p className="text-sm text-yellow-800 italic">{chunk.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3 border-t border-border">
            {chunk.validation_status !== "Approved" && (
              <Button
                className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white shadow-sm"
                onClick={() => onAction(chunk, "Approved")}
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </Button>
            )}
            {chunk.validation_status !== "For_Local_Validation" && (
              <Button
                variant="outline"
                className="flex-1 gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => onAction(chunk, "For_Local_Validation")}
              >
                <MapPin className="w-4 h-4" />
                For Local
              </Button>
            )}
            {chunk.validation_status !== "Rejected" && (
              <Button
                variant="outline"
                className="flex-1 gap-2 border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => onAction(chunk, "Rejected")}
              >
                <XCircle className="w-4 h-4" />
                Reject
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}