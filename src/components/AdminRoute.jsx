import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ADMIN_PIN = "1234";

export default function AdminRoute({ children }) {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("admin_unlocked") === "true");
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem("admin_unlocked", "true");
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setPin("");
    }
  };

  if (unlocked) return children;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
      <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm shadow-xl space-y-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Admin Access</h1>
          <p className="text-sm text-muted-foreground">Enter the admin PIN to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="password"
            inputMode="numeric"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false); }}
            className={`text-center text-xl tracking-widest ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
            maxLength={8}
            autoFocus
          />
          {error && <p className="text-xs text-destructive">Sayop ang PIN. Try again.</p>}
          <Button type="submit" className="w-full">Unlock</Button>
        </form>
      </div>
    </div>
  );
}