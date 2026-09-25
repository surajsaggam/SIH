import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot,
  Sparkles,
  RotateCcw,
  Loader2,
  AlertCircle,
  Cpu,
  CornerDownLeft,
} from 'lucide-react';

/**
 * ChatBot — Earth Observation AI Assistant.
 * Grounded in current EuroSAT ConvNeXt analysis and static Knowledge Base.
 * Connects directly to POST /chat on the backend.
 */
export default function ChatBot({ analysis }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [requestError, setRequestError] = useState(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Suggested prompt pills
  const quickPrompts = [
    'What crops are best suited for this tile?',
    'What are the primary disaster and flood risks?',
    'Explain the surface coverage heuristics',
  ];

  // Reset session and conversation whenever analysis changes
  useEffect(() => {
    if (!analysis) return;

    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setSessionId(newSessionId);
    setRequestError(null);
    setInput('');

    const displayName = analysis.suggestions?.display_name || analysis.label || 'Satellite Scene';
    const confidence = analysis.confidence ?? 'N/A';

    setMessages([
      {
        id: 'initial',
        role: 'assistant',
        content: `Grounded Earth Observation Intelligence online. Scene verified as **${displayName}** (${confidence}% confidence). How can I assist with soil health, agronomy, water coverage, or disaster risk assessment?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [analysis]);

  // Scroll internal messages container to bottom only during active conversation (never scroll window)
  useEffect(() => {
    if (messages.length > 1 && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  const handleResetSession = () => {
    if (!analysis) return;
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setSessionId(newSessionId);
    setRequestError(null);
    setInput('');
    const displayName = analysis.suggestions?.display_name || analysis.label || 'Scene';
    const confidence = analysis.confidence ?? 'N/A';

    setMessages([
      {
        id: `reset_${Date.now()}`,
        role: 'assistant',
        content: `Session refreshed. Active analysis: **${displayName}** (${confidence}% confidence). Ready for queries.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const question = input.trim();
    if (!question || isLoading || !analysis) return;

    const userMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setRequestError(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          question: question,
          analysis: analysis,
        }),
      });

      if (!response.ok) {
        let errDetail = `HTTP ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.detail) errDetail = errData.detail;
        } catch (_) {}
        throw new Error(errDetail);
      }

      const data = await response.json();
      const botMessage = {
        id: `bot_${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'No response returned from assistant.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('[ChatBot] Error calling /chat:', err);
      const errorText = `Unable to connect to AI assistant (${err.message || 'Network error'}). Ensure backend is running at http://127.0.0.1:8000.`;
      setRequestError(errorText);
      const errorMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: errorText,
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickPrompt = (promptText) => {
    setInput(promptText);
    setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 50);
  };

  if (!analysis) {
    return (
      <div className="cosmic-panel rounded-xl border border-white/[0.08] bg-[#080D18]/80 p-6 flex flex-col justify-between min-h-[280px]">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center">
              <Bot size={15} className="text-cyan-400" />
            </div>
            <div>
              <h4 className="text-xs font-mono font-bold text-gray-200 tracking-wider uppercase">
                AI ANALYSIS AGENT
              </h4>
              <div className="text-[10px] font-mono text-gray-500">
                Grounded satellite intelligence
              </div>
            </div>
          </div>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-gray-400">
            AWAITING SCENE
          </span>
        </div>

        <div className="py-8 flex flex-col items-center justify-center text-center">
          <Bot size={28} className="text-gray-600 mb-2" />
          <div className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wide">
            INTELLIGENCE AGENT DOCKED
          </div>
          <p className="text-[10px] font-mono text-gray-500 max-w-sm mt-1 leading-relaxed">
            Select a preset satellite scene or upload an image to ground the RAG chat agent with EuroSAT ConvNeXt classifications and telemetry data.
          </p>
        </div>
      </div>
    );
  }

  const currentClass = analysis.suggestions?.display_name || analysis.label || 'Sentinel-2 Scene';

  return (
    <div className="cosmic-panel rounded-xl border border-white/[0.08] bg-[#080D18]/90 overflow-hidden flex flex-col">
      {/* ── Chat Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.06] px-5 py-3.5 bg-black/40 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(0,217,255,0.2)]">
            <Bot size={16} className="text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-mono font-bold text-white tracking-wider uppercase">
                AI ANALYSIS AGENT
              </h4>
              <span className="flex items-center gap-1 text-[9px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-full border border-cyan-500/30">
                <Cpu size={10} />
                <span>CEREBRAS RAG</span>
              </span>
            </div>
            <div className="text-[10px] font-mono text-gray-400">
              Grounded satellite intelligence
            </div>
          </div>
        </div>

        {/* Current scene context badge & Reset button */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-[10px] font-mono text-gray-400">
            <span className="text-gray-500">CONTEXT:</span>
            <span className="text-cyan-400 font-bold">{currentClass}</span>
            <span className="text-gray-600">({analysis.confidence}%)</span>
          </div>

          <button
            onClick={handleResetSession}
            title="Reset conversation session"
            className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-mono text-gray-400 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 rounded-lg transition-colors bg-white/[0.02] cursor-pointer"
          >
            <RotateCcw size={11} />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* ── Messages Container ── */}
      <div 
        ref={messagesContainerRef}
        className="p-4 flex-1 flex flex-col gap-3 min-h-[220px] max-h-[360px] overflow-y-auto font-sans"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[9px] font-mono uppercase tracking-wider text-gray-500">
                  {isUser ? 'OPERATOR' : 'GROUNDED INTELLIGENCE'}
                </span>
                {msg.timestamp && (
                  <span className="text-[9px] font-mono text-gray-600">
                    {msg.timestamp}
                  </span>
                )}
              </div>
              <div
                className={`px-4 py-3 rounded-xl text-xs leading-relaxed max-w-[90%] md:max-w-[80%] whitespace-pre-line ${
                  isUser
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-white border border-cyan-500/40 shadow-sm'
                    : msg.isError
                    ? 'bg-red-950/40 text-red-300 border border-red-800/60'
                    : 'bg-black/60 text-gray-200 border border-white/[0.08]'
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex flex-col items-start max-w-full">
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-[9px] font-mono uppercase tracking-wider text-gray-500">
                GROUNDED INTELLIGENCE
              </span>
              <span className="text-[9px] font-mono text-cyan-400 animate-pulse">
                INFERRING...
              </span>
            </div>
            <div className="px-4 py-3 rounded-xl text-xs bg-black/60 border border-white/10 flex items-center gap-3 text-gray-300">
              <Loader2 size={14} className="animate-spin text-cyan-400" />
              <span className="font-mono text-[11px]">
                Synthesizing response via Cerebras LLaMA-3.1 grounded telemetry...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Quick Prompts ── */}
      <div className="px-4 py-2.5 border-t border-white/[0.06] bg-black/30 flex flex-wrap items-center gap-2">
        <span className="text-[9px] font-mono uppercase text-gray-500 flex items-center gap-1 mr-1">
          <Sparkles size={11} className="text-cyan-400" />
          SUGGESTED:
        </span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleQuickPrompt(prompt)}
            disabled={isLoading}
            className="text-[10px] font-mono text-gray-400 hover:text-cyan-300 bg-white/[0.03] hover:bg-cyan-950/30 border border-white/10 hover:border-cyan-500/30 px-3 py-1 rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* ── Error Banner if any ── */}
      {requestError && (
        <div className="px-4 py-2 bg-red-950/30 border-t border-red-900/40 flex items-center gap-2 text-[11px] font-mono text-red-400">
          <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
          <span className="truncate">{requestError}</span>
        </div>
      )}

      {/* ── Input Bar ── */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-white/[0.06] bg-black/40 flex items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask about crop health, flood vulnerability, land-use zoning, or infrastructure..."
            className="w-full bg-black/50 border border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 rounded-lg px-4 py-2.5 text-xs text-white placeholder:text-gray-500 font-sans outline-none transition-all disabled:opacity-50"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[9px] font-mono text-gray-500 hidden sm:flex items-center gap-1">
            <span>ENTER</span>
            <CornerDownLeft size={10} />
          </div>
        </div>

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono font-bold tracking-wider uppercase transition-all bg-gradient-to-r from-cyan-500 to-blue-600 text-black hover:from-cyan-400 hover:to-blue-500 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-[0_0_12px_rgba(0,217,255,0.2)]"
        >
          {isLoading ? (
            <Loader2 size={14} className="animate-spin text-black" />
          ) : (
            <Send size={14} className="text-black" />
          )}
          <span className="hidden sm:inline">SEND</span>
        </button>
      </form>
    </div>
  );
}
