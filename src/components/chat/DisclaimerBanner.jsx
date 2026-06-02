import { AlertTriangle } from "lucide-react";

export default function DisclaimerBanner() {
  return (
    <div className="bg-accent/10 border border-accent/30 rounded-lg px-4 py-3 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground leading-relaxed">
        <span className="font-semibold text-foreground">Research Prototype Only.</span>{" "}
        Kini nga chatbot usa ka research tool ug dili puli sa opisyal nga DRRM advisories. 
        Sunda ang opisyal nga pahibalo gikan sa Barangay, MDRRMO, PAGASA, ug NDRRMC. 
        Ayaw i-type ang personal nga impormasyon (pangalan, address, numero).
      </p>
    </div>
  );
}