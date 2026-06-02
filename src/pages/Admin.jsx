import { useState, useMemo } from "react";
import * as adminApi from "@/lib/adminApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { Plus, Database, FileText, Download, ArrowLeft, Upload, FileSpreadsheet, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { jsPDF } from "jspdf";
import ChunkTable from "@/components/admin/ChunkTable";
import ChunkForm from "@/components/admin/ChunkForm";
import LogsTable from "@/components/admin/LogsTable";
import ImportChunks from "@/components/admin/ImportChunks";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Admin() {
  const [showForm, setShowForm] = useState(false);
  const [editChunk, setEditChunk] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [clearLogsOpen, setClearLogsOpen] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [chunkSearch, setChunkSearch] = useState("");
  const [logSearch, setLogSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: chunks = [], isLoading: chunksLoading } = useQuery({
    queryKey: ["drrm-chunks"],
    queryFn: () => adminApi.listChunks(),
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["chat-logs"],
    queryFn: () => adminApi.listChatLogs(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => adminApi.createChunk(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drrm-chunks"] });
      setShowForm(false);
      setEditChunk(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateChunk(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drrm-chunks"] });
      setShowForm(false);
      setEditChunk(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteChunk(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drrm-chunks"] });
      setDeleteTarget(null);
    },
  });

  const clearLogsMutation = useMutation({
    mutationFn: () => adminApi.clearChatLogs(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-logs"] });
      setClearLogsOpen(false);
    },
  });

  const handleSave = (data) => {
    if (editChunk?.id) {
      updateMutation.mutate({ id: editChunk.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (chunk) => {
    setEditChunk(chunk);
    setShowForm(true);
  };

  const exportLogsCSV = () => {
    const headers = ["timestamp", "session_id", "user_query", "retrieved_chunk_ids", "retrieved_topics", "bot_response", "is_fallback"];
    const rows = logs.map((l) =>
      headers.map((h) => {
        let val = h === "timestamp" ? l.created_date : l[h];
        if (typeof val === "string") val = `"${val.replace(/"/g, '""')}"`;
        return val ?? "";
      }).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `drrm_chat_logs_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const approvedCount = chunks.filter((c) => c.validation_status === "Approved").length;
  const pendingCount = chunks.filter((c) => c.validation_status === "Pending").length;

  const filteredChunks = useMemo(() => {
    const q = chunkSearch.trim().toLowerCase();
    if (!q) return chunks;
    return chunks.filter((c) => {
      const id = c.chunk_id?.toLowerCase() || "";
      if (id.includes(q)) return true;
      return (
        c.hazard_type?.toLowerCase().includes(q) ||
        c.phase?.toLowerCase().includes(q) ||
        c.doc_title?.toLowerCase().includes(q) ||
        c.localized_text?.toLowerCase().includes(q)
      );
    });
  }, [chunks, chunkSearch]);

  const filteredLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) =>
      l.retrieved_chunk_ids?.toLowerCase().includes(q) ||
      l.user_query?.toLowerCase().includes(q) ||
      l.bot_response?.toLowerCase().includes(q) ||
      l.retrieved_topics?.toLowerCase().includes(q) ||
      l.session_id?.toLowerCase().includes(q)
    );
  }, [logs, logSearch]);

  const exportChunksCSV = () => {
    const headers = ["chunk_id", "hazard_type", "phase", "source_type", "agency_office", "doc_title", "doc_year", "format_type", "priority", "validation_status", "original_text", "localized_text", "notes"];
    const rows = chunks.map((c) =>
      headers.map((h) => {
        const val = c[h] ?? "";
        return typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `drrm_knowledge_base_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportChunksPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("BisayaSafe - DRRM Knowledge Repository", 14, 15);
    doc.setFontSize(9);
    doc.text(`Exported: ${new Date().toLocaleDateString()} | Total: ${chunks.length} entries`, 14, 22);

    let y = 30;
    const colWidths = [38, 22, 20, 22, 130];
    const headers2 = ["Chunk ID", "Hazard", "Phase", "Status", "Localized Text"];

    // Header row
    doc.setFillColor(30, 64, 100);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    let x = 14;
    colWidths.forEach((w, i) => {
      doc.rect(x, y - 5, w, 8, "F");
      doc.text(headers2[i], x + 2, y);
      x += w;
    });
    doc.setTextColor(0, 0, 0);
    y += 6;

    chunks.forEach((c) => {
      if (y > 185) { doc.addPage(); y = 15; }
      const row = [
        c.chunk_id || "",
        (c.hazard_type || "").replace("_", " "),
        (c.phase || "").replace("_", "/"),
        (c.validation_status || "").replace("_", " "),
        (c.localized_text || "").substring(0, 120),
      ];
      x = 14;
      doc.setFontSize(7);
      colWidths.forEach((w, i) => {
        const lines = doc.splitTextToSize(row[i], w - 3);
        doc.text(lines[0], x + 2, y);
        x += w;
      });
      doc.setDrawColor(220, 220, 220);
      doc.line(14, y + 2, 282, y + 2);
      y += 7;
    });

    doc.save(`drrm_knowledge_base_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-sm font-semibold">DRRM Admin Panel</h1>
            <p className="text-[11px] opacity-75">Manage Knowledge Base & Logs</p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Total Chunks</p>
            <p className="text-2xl font-bold mt-1">{chunks.length}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold mt-1 text-green-600">{approvedCount}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold mt-1 text-yellow-600">{pendingCount}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Chat Sessions</p>
            <p className="text-2xl font-bold mt-1">{logs.length}</p>
          </div>
        </div>

        <Tabs defaultValue="knowledge">
          <TabsList className="mb-4">
            <TabsTrigger value="knowledge" className="gap-2">
              <Database className="w-3.5 h-3.5" />
              Knowledge Base
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <FileText className="w-3.5 h-3.5" />
              Chat Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="knowledge" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <p className="text-sm text-muted-foreground">
                {filteredChunks.length === chunks.length
                  ? `${chunks.length} DRRM knowledge entries`
                  : `${filteredChunks.length} of ${chunks.length} entries`}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportChunksCSV} className="gap-2" disabled={chunks.length === 0}>
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={exportChunksPDF} className="gap-2" disabled={chunks.length === 0}>
                  <Download className="w-3.5 h-3.5" />
                  Export PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowImport(true)} className="gap-2">
                  <Upload className="w-3.5 h-3.5" />
                  Import CSV/JSON
                </Button>
                <Button size="sm" onClick={() => { setEditChunk(null); setShowForm(true); }} className="gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                  <Plus className="w-3.5 h-3.5" />
                  Add Chunk
                </Button>
              </div>
            </div>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={chunkSearch}
                onChange={(e) => setChunkSearch(e.target.value)}
                placeholder="Search by Chunk ID..."
                className="pl-9"
              />
            </div>
            <ChunkTable
              chunks={filteredChunks}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
            />
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <p className="text-sm text-muted-foreground">
                {filteredLogs.length === logs.length
                  ? `${logs.length} interaction logs`
                  : `${filteredLogs.length} of ${logs.length} logs`}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportLogsCSV} className="gap-2" disabled={logs.length === 0}>
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setClearLogsOpen(true)}
                  className="gap-2 text-destructive hover:text-destructive"
                  disabled={logs.length === 0}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Logs
                </Button>
              </div>
            </div>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Search by Chunk ID, query, or session..."
                className="pl-9"
              />
            </div>
            <LogsTable logs={filteredLogs} />
          </TabsContent>
        </Tabs>
      </div>

      <ChunkForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditChunk(null); }}
        onSave={handleSave}
        editChunk={editChunk}
      />

      <ImportChunks
        open={showImport}
        onClose={() => setShowImport(false)}
      />

      <AlertDialog open={clearLogsOpen} onOpenChange={setClearLogsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all chat logs?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {logs.length} interaction logs. Export first if you need a backup.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clearLogsMutation.mutate()}
              className="bg-destructive text-destructive-foreground"
            >
              Clear Logs
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chunk?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{deleteTarget?.chunk_id}" from the knowledge base.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}