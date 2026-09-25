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
 * ChatBot — Earth Observation AI Assistant docked in DeepAnalysisPage.
 * Grounded in the current EuroSAT ConvNeXt analysis and static Knowledge Base.
 * Connects directly to POST /chat on the backend.
 */
export default function ChatBot({ analysis }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [requestError, setRequestError] = useState(null);
  const messagesEndRef = useRef(null);
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

    const displayName = analysis.suggestions?.display_name || analysis.label || 'Scene';
    const confidence = analysis.confidence ?? 'N/A';

    setMessages([
      {
        id: 'initial',
        role: 'assistant',
        content: `Earth Observation AI Assistant online. Grounded in verified **${displayName}** classification (${confidence}% confidence) and domain knowledge base. Ask any follow-up question regarding agronomy, crop planning, or hazard assessment.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [analysis]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        content: `Session refreshed. Active analysis: **${displayName}** (${confidence}% confidence). How can I assist with this scene?`,
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
      const errorText = `Unable to connect to AI assistant (${err.message || 'Network error'}). Ensure the backend server is running at http://127.0.0.1:8000.`;
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
      setTimeout(() => inputRef.current?.focus(), 50);
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
      inputRef.current?.focus();
    }, 50);
  };

  if (!analysis) return null;

  return (
    <div className="border border-gray-800 bg-gray-900/40 rounded-sm overflow-hidden flex flex-col">
      {/* ── Chat Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-800 px-5 py-3.5 bg-gray-950/60 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-sm bg-mission-cyan/10 border border-mission-cyan/30 flex items-center justify-center">
            <Bot size={15} className="text-mission-cyan" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-mono font-bold text-gray-200 tracking-wider uppercase">
                AI ANALYSIS AGENT
              </h4>
              <span className="flex items-center gap-1 text-[9px] font-mono text-mission-cyan bg-mission-cyan/10 px-2 py-0.5 rounded-xs border border-mission-cyan/20">
                <Cpu size={10} />
                <span>CEREBRAS RAG</span>
              </span>
            </div>
            <div className="text-[10px] font-mono text-gray-500">
              Grounded in EuroSAT ConvNeXt &amp; Domain Knowledge Base
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetSession}
            title="Reset conversation context"
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono text-gray-400 hover:text-mission-cyan border border-gray-800 hover:border-mission-cyan/30 rounded-xs transition-colors bg-gray-900/80 cursor-pointer"
          >
            <RotateCcw size={11} />
            <span>RESET SESSION</span>
          </button>
        </div>
      </div>

      {/* ── Messages Container ── */}
      <div className="p-4 flex-1 flex flex-col gap-3 min-h-[220px] max-h-[360px] overflow-y-auto font-sans">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[9px] font-mono uppercase tracking-wider text-gray-500">
                  {isUser ? 'USER OPERATOR' : 'ANALYSIS AGENT'}
                </span>
                {msg.timestamp && (
                  <span className="text-[9px] font-mono text-gray-600">
                    {msg.timestamp}
                  </span>
                )}
              </div>
              <div
                className={`px-4 py-3 rounded-sm text-xs leading-relaxed max-w-[90%] md:max-w-[80%] whitespace-pre-line ${
                  isUser
                    ? 'bg-mission-cyan/15 text-gray-100 border border-mission-cyan/40 shadow-sm'
                    : msg.isError
                    ? 'bg-red-950/30 text-red-300 border border-red-800/60'
                    : 'bg-gray-950/80 text-gray-300 border border-gray-800/90'
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
                ANALYSIS AGENT
              </span>
              <span className="text-[9px] font-mono text-mission-cyan animate-pulse">
                PROCESSING...
              </span>
            </div>
            <div className="px-4 py-3 rounded-sm text-xs bg-gray-950/80 border border-gray-800 flex items-center gap-3 text-gray-400">
              <Loader2 size={14} className="animate-spin text-mission-cyan" />
              <span className="font-mono text-[11px]">
                Querying Cerebras LLaMA-3.1 with grounded telemetry...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick Prompts ── */}
      <div className="px-4 py-2 border-t border-gray-800/80 bg-gray-950/30 flex flex-wrap items-center gap-2">
        <span className="text-[9px] font-mono uppercase text-gray-500 flex items-center gap-1 mr-1">
          <Sparkles size={11} className="text-mission-cyan" />
          SUGGESTED:
        </span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleQuickPrompt(prompt)}
            disabled={isLoading}
            className="text-[10px] font-mono text-gray-400 hover:text-mission-cyan bg-gray-900/60 hover:bg-mission-cyan/10 border border-gray-800 hover:border-mission-cyan/30 px-2.5 py-1 rounded-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
        className="p-3 border-t border-gray-800 bg-gray-950/60 flex items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask about crop viability, soil moisture, hazard vulnerability, or infrastructure..."
            className="w-full bg-gray-900/80 border border-gray-800 focus:border-mission-cyan/50 focus:ring-1 focus:ring-mission-cyan/30 rounded-sm px-3.5 py-2.5 text-xs text-gray-200 placeholder:text-gray-600 font-sans outline-none transition-all disabled:opacity-50"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[9px] font-mono text-gray-600 hidden sm:flex items-center gap-1">
            <span>ENTER</span>
            <CornerDownLeft size={10} />
          </div>
        </div>

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono font-bold tracking-wider uppercase transition-all bg-mission-cyan/15 text-mission-cyan border border-mission-cyan/40 hover:bg-mission-cyan hover:text-black rounded-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-mission-cyan/15 disabled:hover:text-mission-cyan"
        >
          {isLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
          <span className="hidden sm:inline">SEND</span>
        </button>
      </form>
    </div>
  );
}
