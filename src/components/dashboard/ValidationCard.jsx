import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, RotateCcw, Eye, MapPin } from "lucide-react";

const hazardColors = {
  Flood: "bg-blue-100 text-blue-700",
  Typhoon: "bg-indigo-100 text-indigo-700",
  Storm_Surge: "bg-purple-100 text-purple-700",
  Earthquake: "bg-orange-100 text-orange-700",
  Fire: "bg-red-100 text-red-700",
  Landslide: "bg-amber-100 text-amber-700",
  Volcanic: "bg-rose-100 text-rose-700",
  All_Hazards: "bg-gray-100 text-gray-700",
};

export default function ValidationCard({ chunk, status, onView, onAction, isPending }) {
  const hazardColor = hazardColors[chunk.hazard_type] || hazardColors.All_Hazards;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 hover:shadow-lg hover:border-primary/20 transition-all duration-200 group">
      {/* Top Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[11px] font-bold text-primary truncate tracking-wide">{chunk.chunk_id}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${hazardColor}`}>
              {chunk.hazard_type?.replace("_", " ")}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {chunk.phase?.replace(/_/g, "/")}
            </span>
            {chunk.priority === "High" && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
                ⚡ High
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Preview Text */}
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">
        {chunk.localized_text?.replace(/[*#>\-]/g, "").substring(0, 120)}...
      </p>

      {/* Source */}
      {chunk.agency_office && (
        <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />
          {chunk.agency_office}
        </p>
      )}

      {/* Notes if any */}
      {chunk.notes && (
        <p className="text-[10px] bg-yellow-50 border border-yellow-100 rounded-lg px-2.5 py-1.5 text-yellow-700 line-clamp-2">
          ⚠️ {chunk.notes}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-1.5 pt-2 border-t border-border mt-auto">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-7 text-xs gap-1 hover:bg-primary/5 hover:border-primary/30"
          onClick={onView}
        >
          <Eye className="w-3 h-3" />
          View
        </Button>

        {(status === "pending" || status === "local") && (
          <>
            <Button
              size="sm"
              className="flex-1 h-7 text-xs gap-1 bg-green-600 hover:bg-green-700 text-white shadow-sm"
              onClick={() => onAction(chunk, "Approved")}
              disabled={isPending}
            >
              <CheckCircle className="w-3 h-3" />
              Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-xs gap-1 border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => onAction(chunk, "Rejected")}
              disabled={isPending}
            >
              <XCircle className="w-3 h-3" />
              Reject
            </Button>
          </>
        )}

        {status === "approved" && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs gap-1 border-yellow-200 text-yellow-700 hover:bg-yellow-50"
            onClick={() => onAction(chunk, "Pending")}
            disabled={isPending}
          >
            <RotateCcw className="w-3 h-3" />
            Set Pending
          </Button>
        )}

        {status === "rejected" && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs gap-1 border-green-200 text-green-600 hover:bg-green-50"
            onClick={() => onAction(chunk, "Approved")}
            disabled={isPending}
          >
            <CheckCircle className="w-3 h-3" />
            Re-approve
          </Button>
        )}
      </div>
    </div>
  );
}