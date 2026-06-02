import { useState, useRef, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldAlert, LayoutDashboard, Settings } from "lucide-react";
import DisclaimerBanner from "@/components/chat/DisclaimerBanner";
import SuggestedQuestions from "@/components/chat/SuggestedQuestions";
import QuickTopics from "@/components/chat/QuickTopics";
import ChatBubble from "@/components/chat/ChatBubble";
import ChatInput from "@/components/chat/ChatInput";
import WelcomeMessage from "@/components/chat/WelcomeMessage";
import { processQuery, loadChatHistory } from "@/lib/ragService";

const SESSION_KEY = "bisayasafe_chat_session";

function generateSessionId() {
  return "sess_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function getOrCreateSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = generateSessionId();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => getOrCreateSessionId());
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    loadChatHistory(sessionId)
      .then((rows) => {
        if (!rows?.length) return;
        const restored = rows.flatMap((row) => [
          { role: "user", content: row.user_query },
          { role: "assistant", content: row.assistant_response },
        ]);
        setMessages(restored);
      })
      .catch(() => {});
  }, [sessionId]);

  const handleSend = async (query) => {
    setMessages((prev) => [...prev, { role: "user", content: query }]);
    setIsLoading(true);

    try {
      const result = await processQuery(query, sessionId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.response },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, local service error: ${err.message}. Siguruha nga naka-run ang Docker, backend (npm start), ug na-set ang GEMINI_API_KEY sa backend/.env.`,
        },
      ]);
    }
    setIsLoading(false);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shadow-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight">BisayaSafe</h1>
            <p className="text-[11px] opacity-75">Localized Cebuano–English DRRM Chatbot</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10" title="MDRRMO Dashboard">
              <LayoutDashboard className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/admin">
            <Button variant="ghost" size="icon" className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10" title="Admin Panel">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
            <DisclaimerBanner />

            {!hasMessages && (
              <div className="space-y-6 py-8">
                <WelcomeMessage />
                <SuggestedQuestions onSelect={handleSend} />
                <div className="border-t border-border pt-4">
                  <QuickTopics onSelect={handleSend} />
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <ChatBubble key={i} role={msg.role} content={msg.content} />
            ))}

            {isLoading && <ChatBubble role="assistant" isLoading />}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </div>

      <div className="border-t border-border bg-background px-4 py-3 flex-shrink-0">
        <div className="max-w-2xl mx-auto space-y-2">
          {hasMessages && <QuickTopics onSelect={handleSend} />}
          <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}
