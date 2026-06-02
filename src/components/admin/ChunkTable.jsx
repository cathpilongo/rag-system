import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, CheckCircle, XCircle, Clock } from "lucide-react";

const statusConfig = {
  Approved: { icon: CheckCircle, class: "bg-green-100 text-green-700 border-green-200" },
  Rejected: { icon: XCircle, class: "bg-red-100 text-red-700 border-red-200" },
  Pending: { icon: Clock, class: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  For_Local_Validation: { icon: Clock, class: "bg-blue-100 text-blue-700 border-blue-200" },
};

export default function ChunkTable({ chunks, onEdit, onDelete }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-36">Chunk ID</TableHead>
            <TableHead className="w-36">Doc Title</TableHead>
            <TableHead className="w-28">Hazard</TableHead>
            <TableHead className="w-24">Phase</TableHead>
            <TableHead>Localized Text</TableHead>
            <TableHead className="w-28">Status</TableHead>
            <TableHead className="w-24">Priority</TableHead>
            <TableHead className="w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chunks.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No matching chunks found.
              </TableCell>
            </TableRow>
          )}
          {chunks.map((chunk) => {
            const st = statusConfig[chunk.validation_status] || statusConfig.Pending;
            const Icon = st.icon;
            return (
              <TableRow key={chunk.id} className="hover:bg-muted/30">
                <TableCell className="font-mono text-xs">{chunk.chunk_id}</TableCell>
                <TableCell className="text-xs">{chunk.doc_title || "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {chunk.hazard_type?.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {chunk.phase?.replace("_", "/")}
                </TableCell>
                <TableCell className="max-w-xs truncate text-sm">
                  {chunk.localized_text?.substring(0, 100)}...
                </TableCell>
                <TableCell>
                  <Badge className={`${st.class} border text-xs gap-1`}>
                    <Icon className="w-3 h-3" />
                    {chunk.validation_status?.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {chunk.priority}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(chunk)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(chunk)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}