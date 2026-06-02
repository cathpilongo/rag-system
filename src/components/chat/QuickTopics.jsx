import { Badge } from "@/components/ui/badge";

const topics = [
  { label: "Flood Preparedness", query: "Unsay angay buhaton aron makapangandam sa baha?" },
  { label: "Typhoon Preparedness", query: "Unsay angay buhaton aron makapangandam sa bagyo?" },
  { label: "During Flood", query: "Unsa akong buhaton kung baha na?" },
  { label: "Emergency Kit / Go-Bag", query: "Unsa ang dapat sulod sa emergency go-bag?" },
  { label: "Emergency Hotlines", query: "Unsa ang mga emergency hotlines?" },
  { label: "Evacuation Centers", query: "Asa ko moadto panahon sa evacuation?" },
  { label: "Weather Alert Explanations", query: "Unsa ang kahulogan sa mga weather signals?" },
];

export default function QuickTopics({ onSelect }) {
  return (
    <div className="flex flex-wrap gap-1.5 justify-center">
      {topics.map((t) => (
        <Badge
          key={t.label}
          variant="secondary"
          className="cursor-pointer hover:bg-secondary hover:text-secondary-foreground transition-colors text-xs px-3 py-1"
          onClick={() => onSelect(t.query)}
        >
          {t.label}
        </Badge>
      ))}
    </div>
  );
}