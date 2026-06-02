import { Clock, CheckCircle, XCircle, MapPin, Database } from "lucide-react";

export default function DashboardStats({ total, pending, approved, rejected, forLocal }) {
  const stats = [
    { label: "Total Chunks", value: total, icon: Database, color: "text-primary", bg: "bg-primary/10" },
    { label: "Pending Review", value: pending, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "For Local Validation", value: forLocal, icon: MapPin, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Approved", value: approved, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "Rejected", value: rejected, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
          <div className={`${s.bg} rounded-xl p-2.5 flex-shrink-0`}>
            <s.icon className={`w-5 h-5 ${s.color}`} />
          </div>
          <div>
            <p className="text-2xl font-extrabold leading-tight tracking-tight">{s.value}</p>
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 font-medium uppercase tracking-wide">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}