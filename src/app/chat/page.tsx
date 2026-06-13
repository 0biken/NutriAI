"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Send, Sparkles, Languages, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RateLimitBanner } from "@/components/ui/rate-limit-banner";
import { getProfile, getChatSession, saveChatSession } from "@/lib/storage";
import { UserProfile, ChatSession, ChatMessage } from "@/lib/types";

const SUGGESTED_PROMPTS_GENERAL = [
  "What can I eat for breakfast under ₦500?",
  "Is eba safe for diabetes?",
  "Best Nigerian foods for hypertension?",
];

const SUGGESTED_BY_CONDITION: Record<string, string[]> = {
  pcos:           ["What foods balance PCOS?",        "Magnesium-rich Nigerian meals?",      "Iron-rich snacks for luteal phase?"],
  diabetes:       ["Low-GI Nigerian swallows?",       "Can I still eat jollof rice?",         "Snacks that won't spike sugar?"],
  type2_diabetes: ["Low-GI Nigerian swallows?",       "Can I still eat jollof rice?",         "Snacks that won't spike sugar?"],
  hypertension:   ["How do I season without Maggi?",  "Low-sodium soups I can make?",         "What raises BP fast — avoid?"],
  pregnancy:      ["Iron-rich foods for pregnancy?",  "Folate-heavy Nigerian meals?",         "Foods to avoid this trimester?"],
  obesity:        ["Filling low-cal Nigerian meals?", "Healthy swallow alternatives?",        "Snacks under 200 kcal?"],
};

export default function ChatPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Rate-limit / auto-retry state
  const [retryAt, setRetryAt] = useState<number | null>(null);
  const [, setTick] = useState(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const secondsLeft = retryAt ? Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)) : 0;
  const isRateLimited = retryAt !== null && secondsLeft > 0;

  useEffect(() => {
    if (retryAt === null) return;
    const t = setInterval(() => setTick((n) => n + 1), 250);
    return () => clearInterval(t);
  }, [retryAt]);

  useEffect(() => () => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
  }, []);

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
        let greeting = `Hey ${p.name} 👋  I'm NutriAI. I know Nigerian food, I know the science, and I'll keep it short. `;
        const realConds = p.conditions?.filter((c) => c !== "none") ?? [];
        if (realConds.length) {
          greeting += `I've got your ${realConds.join(" + ")} in mind. `;
        }
        greeting += `Ask me anything — Pidgin, Yoruba, Igbo, Hausa, or English.`;

        currentSession = {
          id: "chat-" + Date.now(),
          user_id: p.id,
          started_at: new Date().toISOString(),
          messages: [{
            id: "msg-" + Date.now(),
            role: "assistant",
            content: greeting,
            timestamp: new Date().toISOString(),
            language: "english",
          }],
        };
        saveChatSession(currentSession);
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSession(currentSession);
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages]);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 128) + "px";
  }, [input]);

  const sendMessage = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || !session || !profile || streaming || isRateLimited) return;
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    setRetryAt(null);

    const userMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
      language: "english",
    };
    const newMessages = [...session.messages, userMsg];

    const assistantMsgId = "msg-" + (Date.now() + 1);
    const updatedSession = {
      ...session,
      messages: [...newMessages, {
        id: assistantMsgId,
        role: "assistant" as const,
        content: "",
        timestamp: new Date().toISOString(),
        language: "english" as const,
      }],
    };

    setSession(updatedSession);
    setInput("");
    setStreaming(true);

    try {
      const cyclePhase =
        profile.gender === "female" && profile.cycle ? profile.cycle.current_phase : null;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, profile, cyclePhase }),
      });

      if (res.status === 429) {
        const errBody = await res.json().catch(() => null);
        const sec = Math.max(1, Number(errBody?.retryAfterSec) || 30);
        // Roll back the optimistic user + empty-assistant messages so we can resend cleanly
        setSession((prev) => prev ? { ...prev, messages: prev.messages.slice(0, -2) } : prev);
        setRetryAt(Date.now() + sec * 1000);
        setStreaming(false);
        retryTimerRef.current = setTimeout(() => {
          retryTimerRef.current = null;
          sendMessage(trimmed);
        }, sec * 1000);
        return;
      }

      if (!res.ok || !res.body) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.details || "Chat API failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });

        setSession((prev) => {
          if (!prev) return prev;
          const msgs = [...prev.messages];
          msgs[msgs.length - 1].content = assistantText;
          return { ...prev, messages: msgs };
        });
      }

      setSession((prev) => {
        if (prev) saveChatSession(prev);
        return prev;
      });
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error communicating with AI.");
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (!isLoaded || !session) return <div className="min-h-screen bg-warm-white" />;

  const isFirstAssistantOnly = session.messages.length === 1 && session.messages[0].role === "assistant";
  const realConds = profile?.conditions?.filter((c) => c !== "none") ?? [];
  const prompts =
    realConds.length && SUGGESTED_BY_CONDITION[realConds[0]]
      ? SUGGESTED_BY_CONDITION[realConds[0]]
      : SUGGESTED_PROMPTS_GENERAL;

  return (
    <div className="flex flex-col h-[calc(100dvh-72px)] max-w-2xl mx-auto bg-warm-white">
      {/* ── Chat header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-forest/10 shrink-0">
        <div className="relative">
          <div className="w-10 h-10 rounded-2xl bg-forest grid place-items-center">
            <Heart className="w-5 h-5 text-vitality" strokeWidth={2.4} />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-vitality border-2 border-white" />
        </div>
        <div className="min-w-0">
          <h1 className="font-semibold text-forest leading-tight">NutriAI</h1>
          <p className="text-xs text-muted flex items-center gap-1.5">
            <Languages className="w-3 h-3" />
            5 languages · Clinical RAG
          </p>
        </div>
      </div>

      {/* ── Messages ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
        {session.messages.map((msg) => {
          const isUser = msg.role === "user";
          const isEmptyStreamingAssistant = streaming && msg.content === "" && !isUser;

          return (
            <div key={msg.id} className={isUser ? "flex justify-end gap-2" : "flex justify-start gap-2"}>
              {!isUser && (
                <div className="w-7 h-7 rounded-xl bg-vitality/20 grid place-items-center shrink-0 mt-0.5">
                  <Heart className="w-3.5 h-3.5 text-forest" />
                </div>
              )}

              <div
                className={[
                  "px-4 py-2.5 rounded-2xl max-w-[80%] transition-brand",
                  isUser
                    ? "bg-forest text-warm-white rounded-br-md"
                    : "bg-white border border-forest/10 text-body-text rounded-bl-md shadow-sm",
                ].join(" ")}
              >
                {isEmptyStreamingAssistant ? (
                  <div className="flex gap-1 items-center h-5 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-forest/40 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-forest/40 animate-pulse [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-forest/40 animate-pulse [animation-delay:300ms]" />
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          );
        })}

        {/* Suggested prompts — only when the only message is the greeting */}
        {isFirstAssistantOnly && !streaming && (
          <div className="pt-1 pl-9 flex flex-wrap gap-1.5">
            {prompts.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="text-xs font-medium text-forest bg-white border border-forest/15 rounded-full px-3 py-1.5 hover:border-vitality hover:bg-vitality/10 transition-brand"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Composer ────────────────────────────────────────────── */}
      <div className="shrink-0 bg-white border-t border-forest/10 px-3 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        {isRateLimited && (
          <RateLimitBanner secondsLeft={secondsLeft} className="mb-3" />
        )}
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRateLimited ? `Waiting · retrying in ${secondsLeft}s…` : "Ask in English, Pidgin, Yoruba, Igbo or Hausa…"}
              rows={1}
              disabled={streaming || isRateLimited}
              className="w-full resize-none rounded-2xl border border-forest/15 bg-white px-4 py-3 text-sm leading-snug text-forest placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-vitality focus:border-vitality transition-brand disabled:opacity-60"
            />
          </div>
          <button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming || isRateLimited}
            aria-label="Send"
            className="h-11 w-11 rounded-full grid place-items-center bg-vitality text-forest shadow-sm hover:bg-vitality-d transition-brand disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vitality focus-visible:ring-offset-2 focus-visible:ring-offset-white shrink-0"
          >
            {streaming ? <Sparkles className="w-4 h-4 animate-pulse" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-muted/80 mt-2 px-1 flex items-center gap-1.5">
          <Badge variant="vitality" className="px-1.5 py-0 text-[9px]">RAG</Badge>
          General nutrition guidance only. For diagnosis, see a dietitian.
        </p>
      </div>
    </div>
  );
}
