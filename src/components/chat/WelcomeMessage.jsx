import { ShieldCheck } from "lucide-react";

export default function WelcomeMessage() {
  return (
    <div className="text-center space-y-3 py-4">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
        <ShieldCheck className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          BisayaSafe
        </h2>
        <p className="text-xs font-medium text-muted-foreground">Localized Cebuano–English DRRM Chatbot</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
          Ako ang DRRM Chatbot. Makatabang ko nimo bahin sa disaster preparedness ug emergency guidance 
          gamit ang Cebuano-English. Pangutana lang!
        </p>
      </div>
    </div>
  );
}