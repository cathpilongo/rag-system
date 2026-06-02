import { useState } from "react";
import * as adminApi from "@/lib/adminApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ShieldCheck, Clock, XCircle, CheckCircle, MapPin, Loader2, Sparkles } from "lucide-react";
import ValidationCard from "@/components/dashboard/ValidationCard";
import DashboardStats from "@/components/dashboard/DashboardStats";
import ChunkDetailModal from "@/components/dashboard/ChunkDetailModal";

export default function Dashboard() {
  const [selectedChunk, setSelectedChunk] = useState(null);
  const queryClient = useQueryClient();

  const { data: chunks = [], isLoading } = useQuery({
    queryKey: ["drrm-chunks"],
    queryFn: () => adminApi.listChunks(),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, notes }) =>
      adminApi.updateChunk(id, { validation_status: status, ...(notes ? { notes } : {}) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drrm-chunks"] });
    },
  });

  const pending = chunks.filter((c) => c.validation_status === "Pending");
  const approved = chunks.filter((c) => c.validation_status === "Approved");
  const rejected = chunks.filter((c) => c.validation_status === "Rejected");
  const forLocal = chunks.filter((c) => c.validation_status === "For_Local_Validation");

  const handleQuickAction = (chunk, status) => {
    updateStatus.mutate({ id: chunk.id, status });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-white/10 rounded-lg">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-base leading-tight tracking-tight">MDRRMO Staff Dashboard</h1>
                <p className="text-[11px] opacity-60 font-medium">Knowledge Base Validation & Review</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/ingestor">
              <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-1.5 text-xs font-semibold shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                Ingest Advisory
              </Button>
            </Link>
            <Link to="/admin">
              <Button variant="ghost" size="sm" className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 text-xs">
                Admin Panel
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Stats Overview */}
        <DashboardStats
          total={chunks.length}
          pending={pending.length}
          approved={approved.length}
          rejected={rejected.length}
          forLocal={forLocal.length}
        />

        {/* Validation Tabs */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-5">
            <Tabs defaultValue="pending">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                <h2 className="font-bold text-base text-foreground">Content Review Queue</h2>
                <TabsList className="h-9 bg-muted/60 p-1 rounded-lg">
                  <TabsTrigger value="pending" className="gap-1.5 text-xs rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <Clock className="w-3 h-3 text-yellow-500" />
                    Pending
                    {pending.length > 0 && (
                      <span className="bg-yellow-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {pending.length > 9 ? "9+" : pending.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="local" className="gap-1.5 text-xs rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <MapPin className="w-3 h-3 text-blue-500" />
                    For Local
                    {forLocal.length > 0 && (
                      <span className="bg-blue-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {forLocal.length > 9 ? "9+" : forLocal.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="approved" className="gap-1.5 text-xs rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Approved
                  </TabsTrigger>
                  <TabsTrigger value="rejected" className="gap-1.5 text-xs rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <XCircle className="w-3 h-3 text-red-500" />
                    Rejected
                  </TabsTrigger>
                </TabsList>
              </div>

              {isLoading && (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}

              <TabsContent value="pending" className="pb-5">
                <ChunkList chunks={pending} status="pending" onView={setSelectedChunk} onAction={handleQuickAction} isPending={updateStatus.isPending} emptyMsg="Wala nay Pending nga chunks. Tanan na na-review!" />
              </TabsContent>
              <TabsContent value="local" className="pb-5">
                <ChunkList chunks={forLocal} status="local" onView={setSelectedChunk} onAction={handleQuickAction} isPending={updateStatus.isPending} emptyMsg="Wala nay For Local Validation nga chunks." />
              </TabsContent>
              <TabsContent value="approved" className="pb-5">
                <ChunkList chunks={approved} status="approved" onView={setSelectedChunk} onAction={handleQuickAction} isPending={updateStatus.isPending} emptyMsg="Wala pa'y Approved nga chunks." />
              </TabsContent>
              <TabsContent value="rejected" className="pb-5">
                <ChunkList chunks={rejected} status="rejected" onView={setSelectedChunk} onAction={handleQuickAction} isPending={updateStatus.isPending} emptyMsg="Wala pay Rejected nga chunks." />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <ChunkDetailModal
        chunk={selectedChunk}
        onClose={() => setSelectedChunk(null)}
        onAction={(chunk, status) => {
          handleQuickAction(chunk, status);
          setSelectedChunk(null);
        }}
      />
    </div>
  );
}

function ChunkList({ chunks, status, onView, onAction, isPending, emptyMsg }) {
  if (chunks.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm bg-card border rounded-lg">
        {emptyMsg}
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {chunks.map((chunk) => (
        <ValidationCard
          key={chunk.id}
          chunk={chunk}
          status={status}
          onView={() => onView(chunk)}
          onAction={onAction}
          isPending={isPending}
        />
      ))}
    </div>
  );
}