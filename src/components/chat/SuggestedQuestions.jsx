import { Button } from "@/components/ui/button";
import { Droplets, Wind, Package, Phone, MapPin, CloudRain } from "lucide-react";

const suggestions = [
  { icon: Droplets, label: "Flood", query: "Unsa akong buhaton kung baha na?" },
  { icon: Wind, label: "Typhoon", query: "What should I prepare before a typhoon?" },
  { icon: Package, label: "Go-Bag", query: "Unsa ang dapat sulod sa go-bag?" },
  { icon: Phone, label: "Emergency Contacts", query: "Kinsa akong tawagan kung emergency?" },
  { icon: MapPin, label: "Evacuation Centers", query: "Asa ang evacuation center?" },
  { icon: CloudRain, label: "Signal Warnings", query: "What does red rainfall warning mean?" },
];

export default function SuggestedQuestions({ onSelect }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground text-center">
        Try asking about:
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {suggestions.map((s) => (
          <Button
            key={s.label}
            variant="outline"
            size="sm"
            onClick={() => onSelect(s.query)}
            className="gap-2 rounded-full border-border hover:bg-secondary/10 hover:text-secondary hover:border-secondary transition-all"
          >
            <s.icon className="w-3.5 h-3.5" />
            {s.label}
          </Button>
        ))}
      </div>
    </div>
  );
}