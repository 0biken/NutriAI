"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Send, Bot, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProfile, getChatSession, saveChatSession } from "@/lib/storage";
import { UserProfile, ChatSession, ChatMessage } from "@/lib/types";

export default function ChatPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) return;
    if (isLoaded && isSignedIn) {
      const p = getProfile();
      if (!p) {
        router.push("/onboarding");
        return;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfile(p);
      
      let currentSession = getChatSession();
      if (!currentSession) {
        // Generate proactive greeting based on profile
        let greeting = `Hello ${p.name}! I'm NutriAI, your clinical nutrition assistant. `;
        if (p.conditions && p.conditions.length > 0 && !p.conditions.includes('none')) {
          greeting += `I'm here to help you manage your ${p.conditions.join(' and ')} with Nigerian food. `;
        }
        greeting += `What would you like to discuss today?`;

        currentSession = {
          id: "chat-" + Date.now(),
          user_id: p.id,
          started_at: new Date().toISOString(),
          messages: [{
            id: "msg-" + Date.now(),
            role: "assistant",
            content: greeting,
            timestamp: new Date().toISOString(),
            language: "english"
          }]
        };
        saveChatSession(currentSession);
      }
      setSession(currentSession);
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages]);

  const handleSend = async () => {
    if (!input.trim() || !session || !profile || streaming) return;

    const userMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
      language: "english" // For now, assume english, API handles auto-detection response
    };

    const newMessages = [...session.messages, userMsg];
    
    // Add an empty assistant message to hold the stream
    const assistantMsgId = "msg-" + (Date.now() + 1);
    const updatedSession = { 
      ...session, 
      messages: [...newMessages, {
        id: assistantMsgId,
        role: "assistant" as const,
        content: "",
        timestamp: new Date().toISOString(),
        language: "english" as const
      }] 
    };

    setSession(updatedSession);
    setInput("");
    setStreaming(true);

    try {
      const cyclePhase = profile.gender === 'female' && profile.cycle 
        ? profile.cycle.current_phase 
        : null;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          profile,
          cyclePhase
        })
      });

      if (!res.ok || !res.body) throw new Error("Chat API failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantText += chunk;

        // Update the last message in state with the streamed chunk
        setSession(prev => {
          if (!prev) return prev;
          const msgs = [...prev.messages];
          msgs[msgs.length - 1].content = assistantText;
          return { ...prev, messages: msgs };
        });
      }

      // Save final session to local storage
      setSession(prev => {
        if (prev) saveChatSession(prev);
        return prev;
      });

    } catch (err) {
      console.error(err);
      alert("Error communicating with AI.");
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isLoaded || !session) return <div className="min-h-screen bg-warm-white" />;

  return (
    <div className="min-h-screen bg-warm-white flex flex-col pt-4 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="px-4 py-3 border-b border-forest/10 flex items-center gap-3 bg-white sticky top-0 z-10">
        <div className="w-10 h-10 rounded-full bg-vitality-d/20 flex items-center justify-center">
          <Bot className="text-forest w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-forest">NutriAI Assistant</h1>
          <p className="text-xs text-vitality-d font-medium">Online • Clinical RAG Enabled</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {session.messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div key={msg.id} className={isUser ? "flex justify-end gap-2" : "flex justify-start gap-2"}>
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-forest/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-forest" />
                </div>
              )}
              
              <div className={"px-4 py-2 rounded-2xl max-w-[80%] " + (isUser ? "bg-forest text-warm-white rounded-br-sm" : "bg-white border border-forest/10 text-forest rounded-bl-sm shadow-sm")}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                {streaming && msg.content === "" && !isUser && (
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 bg-forest/40 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-forest/40 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-forest/40 rounded-full animate-bounce delay-150"></span>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-full bg-vitality/20 flex items-center justify-center shrink-0">
                  <UserIcon className="w-4 h-4 text-forest" />
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-forest/10 fixed bottom-16 left-0 right-0 max-w-lg mx-auto">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about local foods, substitutes..."
            className="flex-1 border border-forest/20 rounded-xl p-3 max-h-32 min-h-[48px] resize-none focus:outline-none focus:ring-1 focus:ring-vitality text-sm"
            rows={1}
            disabled={streaming}
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || streaming}
            className="h-12 w-12 rounded-xl shrink-0 p-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
