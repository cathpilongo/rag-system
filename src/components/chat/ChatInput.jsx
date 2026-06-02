import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

export default function ChatInput({ onSend, disabled }) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your DRRM question here... (Cebuano, English, or mixed)"
        className="min-h-[44px] max-h-32 resize-none rounded-xl bg-card border-border focus-visible:ring-secondary"
        rows={1}
        disabled={disabled}
      />
      <Button
        type="submit"
        size="icon"
        disabled={disabled || !message.trim()}
        className="h-11 w-11 rounded-xl bg-secondary hover:bg-secondary/90 text-secondary-foreground flex-shrink-0"
      >
        <Send className="w-4 h-4" />
      </Button>
    </form>
  );
}