import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export default function LogsTable({ logs }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-36">Timestamp</TableHead>
            <TableHead className="w-28">Session</TableHead>
            <TableHead>User Query</TableHead>
            <TableHead className="max-w-xs">Bot Response</TableHead>
            <TableHead className="w-28">Topics</TableHead>
            <TableHead className="w-28">Chunks</TableHead>
            <TableHead className="w-20">Fallback</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No matching chat logs found.
              </TableCell>
            </TableRow>
          )}
          {logs.map((log) => (
            <TableRow key={log.id} className="hover:bg-muted/30">
              <TableCell className="text-xs text-muted-foreground">
                {log.created_date ? format(new Date(log.created_date), "MMM d, yyyy HH:mm") : "—"}
              </TableCell>
              <TableCell className="font-mono text-xs">{log.session_id?.substring(0, 12)}</TableCell>
              <TableCell className="max-w-xs truncate text-sm">{log.user_query}</TableCell>
              <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                {log.bot_response?.substring(0, 80) || "—"}...
              </TableCell>
              <TableCell className="text-xs">{log.retrieved_topics || "—"}</TableCell>
              <TableCell className="text-xs font-mono">{log.retrieved_chunk_ids || "—"}</TableCell>
              <TableCell>
                {log.is_fallback ? (
                  <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 border text-xs">Yes</Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-700 border-green-200 border text-xs">No</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}