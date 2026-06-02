import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { importFile } from "@/lib/adminApi";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, CheckCircle } from "lucide-react";

export default function ImportChunks({ open, onClose }) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const queryClient = useQueryClient();

  const handleImport = async () => {
    if (!file) return;
    setIsProcessing(true);
    setResult(null);

    try {
      const res = await importFile(file);
      queryClient.invalidateQueries({ queryKey: ["drrm-chunks"] });
      setResult({ success: true, count: res.count });
    } catch (err) {
      setResult({ success: false, error: err.message });
    }
    setIsProcessing(false);
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import DRRM Chunks (CSV / Excel)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Upload file</Label>
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-muted-foreground">
              Columns: chunk_id, localized_text, hazard_type, source_type, agency_office, etc.
            </p>
          </div>
          {result?.success && (
            <p className="text-sm text-green-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Imported {result.count} chunk(s).
            </p>
          )}
          {result?.error && (
            <p className="text-sm text-destructive">{result.error}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button onClick={handleImport} disabled={!file || isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
