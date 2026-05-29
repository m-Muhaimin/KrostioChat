import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Sparkles, Trash2, ArrowUp, Loader2, RefreshCw, BarChart2, Plus, Info } from "lucide-react";
import GenerativeViewRenderer from "./components/GenerativeViewRenderer";

const MotionPlus = motion(Plus);

const plusVariants = {
  hover: {
    rotate: 360,
    scale: [1, 1.25, 1],
    transition: {
      rotate: { duration: 1.0, ease: "easeInOut" },
      scale: { repeat: Infinity, duration: 1.2, ease: "easeInOut" }
    }
  }
};

interface Message {
  role: "user" | "model";
  content: string;
  intentType?: "casual chat" | "data request";
  processedData?: any;
  selectedFormat?: "bar" | "table" | "cards" | "text" | null;
}

const determinePreselectedFormat = (
  userQuery: string,
  intentType: string,
  processedData: any
): "bar" | "table" | "cards" | "text" | null => {
  if (intentType !== "data request" || !processedData) {
    return null;
  }

  const query = userQuery.toLowerCase();

  // 1. Explicit request for specific visual formats
  if (
    query.includes("chart") ||
    query.includes("bar") ||
    query.includes("graph") ||
    query.includes("visualise") ||
    query.includes("visualize") ||
    query.includes("trend") ||
    query.includes("comparison") ||
    query.includes("month-over-month") ||
    query.includes("vs") ||
    query.includes("compare") ||
    query.includes("diagram") ||
    query.includes("breakdown by")
  ) {
    return "bar";
  }

  // 2. Request for list, ledger, search tables
  if (
    query.includes("list") ||
    query.includes("table") ||
    query.includes("show all") ||
    query.includes("all transaction") ||
    query.includes("records") ||
    query.includes("spreadsheet") ||
    query.includes("ledger") ||
    query.includes("rows") ||
    query.includes("details")
  ) {
    if (Array.isArray(processedData)) {
      return "table";
    }
  }

  // 3. Request for summary metrics or aggregates
  if (
    query.includes("total") ||
    query.includes("how much") ||
    query.includes("amount") ||
    query.includes("summary") ||
    query.includes("stat") ||
    query.includes("kpi") ||
    query.includes("metrics") ||
    query.includes("cash flow") ||
    query.includes("net") ||
    query.includes("overall") ||
    query.includes("balance") ||
    query.includes("average")
  ) {
    if (typeof processedData === "object" && processedData !== null) {
      return "cards";
    }
  }

  // 4. Fallback heuristics based on structural analysis of processedData
  if (Array.isArray(processedData)) {
    return processedData.length > 5 ? "table" : "cards";
  }

  if (typeof processedData === "object" && processedData !== null) {
    const entries = Object.entries(processedData);
    const isTrend = entries.length > 1 && entries.every(([_, val]) => {
      if (typeof val === "number") return true;
      if (typeof val === "object" && val !== null) {
        return Object.values(val).every(v => typeof v === "number" || !isNaN(Number(v)));
      }
      return !isNaN(Number(val));
    });

    if (isTrend) {
      return "bar";
    }
    return "cards";
  }

  return "text";
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [userUploadedData, setUserUploadedData] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestedQueries = [
    { label: "Show total revenue for this month", query: "Show total revenue for this month" },
    { label: "Analyze recent operating expenses", query: "Analyze recent operating expenses" },
    { label: "Compare gross vs net performance", query: "Compare gross vs net performance" },
    { label: "Generate monthly rollup overview", query: "Generate monthly rollup overview" },
  ];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      // Simulate real background structured parsing delay for animation polish
      setTimeout(() => {
        try {
          const text = event.target?.result as string;
          if (!text) {
            setIsParsing(false);
            return;
          }

          const lines = text.split(/\r?\n/);
          if (lines.length < 2) {
            throw new Error("CSV file must contain a header row and at least one entry.");
          }

          const parseLine = (line: string) => {
            const res = [];
            let current = "";
            let quotes = false;
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') quotes = !quotes;
              else if (char === ',' && !quotes) {
                res.push(current.trim());
                current = "";
              } else {
                current += char;
              }
            }
            res.push(current.trim());
            return res;
          };

          const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/["']/g, "").trim());
          const validatedRows: any[] = [];

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;

            const values = parseLine(line);
            const rawRowData: any = {};
            headers.forEach((h, idx) => {
              if (idx < values.length) {
                rawRowData[h] = values[idx].replace(/^["']|["']$/g, "").trim();
              }
            });

            const date = rawRowData.date || rawRowData["transaction date"] || rawRowData["posted date"] || new Date().toISOString().split("T")[0];
            const rawAmt = rawRowData.amount || rawRowData.value || rawRowData.total || "0";
            const amount = Number(rawAmt.replace(/[^0-9.-]/g, "")) || 0;
            const vendor = rawRowData.vendor || rawRowData.client || rawRowData.payee || rawRowData.description || rawRowData.party || "Unspecified Vendor";
            const category = rawRowData.category || rawRowData["account category"] || (amount >= 0 ? "Revenue" : "Operating Expense");
            const type = rawRowData["transaction type"] || rawRowData.type || (amount >= 0 ? "invoice" : "expense");
            const status = rawRowData.status || "completed";
            const payment_method = rawRowData["payment method"] || rawRowData.method || "bank_transfer";
            const notes = rawRowData.notes || rawRowData.memo || "Imported via Manual CSV statements tool.";

            validatedRows.push({
              id: `usr-${Math.random().toString(36).substr(2, 9)}`,
              date,
              transaction_type: type,
              account_category: category,
              department: rawRowData.department || "Executive",
              amount,
              currency: rawRowData.currency || "USD",
              vendor_or_client: vendor,
              invoice_number: rawRowData["invoice number"] || rawRowData.invoice || null,
              payment_method,
              status,
              notes
            });
          }

          // Populate locally
          setUserUploadedData(prev => [...prev, ...validatedRows]);

          // Sync into dummyFinanceData on the backend of the system
          fetch("/api/append-finance-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ records: validatedRows })
          })
          .then(res => {
            if (!res.ok) console.error("Could not sync manual CSV transactions to server memory.");
          })
          .catch(err => console.error("Network error syncing CSV data:", err));

          // INVISIBLE REQUIREMENT: Normalises and generates a highly detailed JSON array named userUploadedData in the background. 
          // DO NOT render or mention this data in the initial UI.
        } catch (err: any) {
          console.error(err);
          setErrorHeader(`Failure decoding CSV statements file: ${err.message || "Check column layout."}`);
        } finally {
          setIsParsing(false);
        }
      }, 1200);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input automatically on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading || isParsing) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setErrorHeader(null);

    // Create new message state
    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
          userUploadedData: userUploadedData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to contact chat server.");
      }

      const data = await response.json();
      const resolvedIntent = data.intentType || data["Intent type"] || data.intent_type || "casual chat";
      const resolvedData = data.processedData || data["Processed data"] || data.processed_data || null;
      const preselected = determinePreselectedFormat(userMessage, resolvedIntent, resolvedData);

      setMessages((prev) => [
        ...prev, 
        { 
          role: "model", 
          content: data.aiMessage || data["AI message"] || data.ai_message || "", 
          intentType: resolvedIntent,
          processedData: resolvedData,
          selectedFormat: preselected
        }
      ]);
    } catch (err: any) {
      console.error(err);
      setErrorHeader(err.message || "Something went wrong. Please check your API configuration.");
    } finally {
      setIsLoading(false);
      // Keep input focused
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isParsing) {
        handleSendMessage();
      }
    }
  };

  const handleFormatChange = (msgIdx: number, format: "bar" | "table" | "cards" | "text") => {
    setMessages((prev) =>
      prev.map((msg, idx) => {
        if (idx === msgIdx) {
          return {
            ...msg,
            selectedFormat: msg.selectedFormat === format ? null : format,
          };
        }
        return msg;
      })
    );
  };

  const handleClearChat = () => {
    setMessages([]);
    setErrorHeader(null);
    setInputValue("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Sleek, robust custom markdown parser to convert raw AI responses into gorgeous styled JSX elements.
  // This avoids package version conflicts in React 19 and produces highly curated typography.
  const renderMarkdown = (text: string) => {
    if (!text) return null;

    // First, split into blocks
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let currentTable: { headers: string[]; rows: string[][] } | null = null;
    let currentList: { type: "ul" | "ol"; items: string[] } | null = null;
    let currentCodeBlock: { language: string; content: string[] } | null = null;

    const flushTable = (key: string | number) => {
      if (currentTable) {
        elements.push(
          <div key={`table-${key}`} className="my-6 overflow-x-auto rounded-xl border border-neutral-200/60 bg-white/50 backdrop-blur-sm shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-neutral-100/80 border-b border-neutral-200/80 text-neutral-800 font-medium">
                  {currentTable.headers.map((h, i) => (
                    <th key={i} className="px-4 py-3 font-semibold text-xs uppercase tracking-wider font-display">
                      {h.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentTable.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-4 py-3 text-neutral-600 font-sans font-normal leading-relaxed">
                        {renderInlineFormatting(cell.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        currentTable = null;
      }
    };

    const flushList = (key: string | number) => {
      if (currentList) {
        const ListTag = currentList.type === "ul" ? "ul" : "ol";
        elements.push(
          <ListTag
            key={`list-${key}`}
            className={`my-4 pl-6 text-neutral-700 space-y-2 ${
              currentList.type === "ul" ? "list-disc" : "list-decimal"
            }`}
          >
            {currentList.items.map((item, idx) => (
              <li key={idx} className="font-sans leading-relaxed text-sm md:text-base">
                {renderInlineFormatting(item)}
              </li>
            ))}
          </ListTag>
        );
        currentList = null;
      }
    };

    const flushCodeBlock = (key: string | number) => {
      if (currentCodeBlock) {
        elements.push(
          <div key={`code-${key}`} className="my-5 rounded-xl overflow-hidden border border-neutral-200/80 bg-neutral-900 shadow-md">
            {currentCodeBlock.language && (
              <div className="bg-neutral-850 px-4 py-1.5 border-b border-neutral-800 flex justify-between items-center">
                <span className="text-xs font-mono text-neutral-400 font-semibold uppercase tracking-wider">
                  {currentCodeBlock.language}
                </span>
                <span className="text-[10px] font-mono text-neutral-500">Source</span>
              </div>
            )}
            <pre className="p-4 overflow-x-auto text-xs font-mono text-neutral-100 bg-neutral-950/80 leading-relaxed leading-6">
              <code>{currentCodeBlock.content.join("\n")}</code>
            </pre>
          </div>
        );
        currentCodeBlock = null;
      }
    };

    const renderInlineFormatting = (inlineText: string): React.ReactNode[] => {
      // Bold syntax: **text**
      // Code syntax: `text`
      // Italic syntax: *text*
      const parts: React.ReactNode[] = [];
      let i = 0;
      let lastIndex = 0;

      while (i < inlineText.length) {
        // Look for Bold (** or __)
        if (inlineText.substring(i, i + 2) === "**") {
          if (lastIndex < i) parts.push(inlineText.substring(lastIndex, i));
          const endBold = inlineText.indexOf("**", i + 2);
          if (endBold !== -1) {
            parts.push(
              <strong key={i} className="font-semibold text-neutral-900 border-b border-neutral-200/50">
                {inlineText.substring(i + 2, endBold)}
              </strong>
            );
            i = endBold + 2;
            lastIndex = i;
          } else {
            i++;
          }
        }
        // Look for Inline Code (`)
        else if (inlineText[i] === "`") {
          if (lastIndex < i) parts.push(inlineText.substring(lastIndex, i));
          const endCode = inlineText.indexOf("`", i + 1);
          if (endCode !== -1) {
            parts.push(
              <code key={i} className="bg-neutral-100 text-neutral-800 text-xs px-1.5 py-0.5 rounded font-mono font-medium border border-neutral-200/35">
                {inlineText.substring(i + 1, endCode)}
              </code>
            );
            i = endCode + 1;
            lastIndex = i;
          } else {
            i++;
          }
        }
        // Look for Italic (*)
        else if (inlineText[i] === "*") {
          if (lastIndex < i) parts.push(inlineText.substring(lastIndex, i));
          const endItalic = inlineText.indexOf("*", i + 1);
          if (endItalic !== -1) {
            parts.push(
              <em key={i} className="text-neutral-800 italic">
                {inlineText.substring(i + 1, endItalic)}
              </em>
            );
            i = endItalic + 1;
            lastIndex = i;
          } else {
            i++;
          }
        } else {
          i++;
        }
      }

      if (lastIndex < inlineText.length) {
        parts.push(inlineText.substring(lastIndex));
      }

      return parts.length > 0 ? parts : [inlineText];
    };

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      const trimmed = line.trim();

      // Inside a code block?
      if (currentCodeBlock) {
        if (trimmed.startsWith("```")) {
          flushCodeBlock(index);
        } else {
          currentCodeBlock.content.push(line);
        }
        continue;
      }

      // Check for code block start
      if (trimmed.startsWith("```")) {
        flushTable(index);
        flushList(index);
        const language = trimmed.slice(3).trim();
        currentCodeBlock = { language, content: [] };
        continue;
      }

      // Table line (starts and ends with |)
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        flushList(index);
        const parts = trimmed.split("|").slice(1, -1);
        
        // Skip separator line e.g. |---|---|
        if (parts.every(p => p.trim().startsWith("-") && p.trim().replace(/-/g, "") === "")) {
          continue;
        }

        if (!currentTable) {
          currentTable = { headers: parts, rows: [] };
        } else {
          currentTable.rows.push(parts);
        }
        continue;
      } else {
        flushTable(index);
      }

      // Unordered lists (- or *)
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        flushTable(index);
        const listText = trimmed.slice(2);
        if (!currentList || currentList.type !== "ul") {
          flushList(index);
          currentList = { type: "ul", items: [listText] };
        } else {
          currentList.items.push(listText);
        }
        continue;
      }

      // Ordered lists (numbers like 1. )
      const orderedMatch = trimmed.match(/^(\d+)\.\s(.*)/);
      if (orderedMatch) {
        flushTable(index);
        const listText = orderedMatch[2];
        if (!currentList || currentList.type !== "ol") {
          flushList(index);
          currentList = { type: "ol", items: [listText] };
        } else {
          currentList.items.push(listText);
        }
        continue;
      }

      // If we got here and there was a list active, but the line doesn't match list style, flush list
      flushList(index);

      // Headers
      if (trimmed.startsWith("### ")) {
        elements.push(
          <h3 key={index} className="text-sm md:text-base font-bold font-display text-neutral-900 mt-6 mb-2 tracking-tight">
            {renderInlineFormatting(trimmed.slice(4))}
          </h3>
        );
        continue;
      }
      if (trimmed.startsWith("## ")) {
        elements.push(
          <h2 key={index} className="text-base md:text-lg font-bold font-display text-neutral-900 mt-8 mb-3 tracking-tight border-b border-neutral-100/80 pb-1">
            {renderInlineFormatting(trimmed.slice(3))}
          </h2>
        );
        continue;
      }
      if (trimmed.startsWith("# ")) {
        elements.push(
          <h1 key={index} className="text-lg md:text-xl font-bold font-display text-neutral-900 mt-10 mb-4 tracking-tight">
            {renderInlineFormatting(trimmed.slice(2))}
          </h1>
        );
        continue;
      }

      // Horizontal Rule
      if (trimmed === "---") {
        elements.push(<hr key={index} className="my-6 border-neutral-200/65" />);
        continue;
      }

      // Empty line / spacer
      if (!trimmed) {
        elements.push(<div key={index} className="h-2" />);
        continue;
      }

      // Plain paragraph
      elements.push(
        <p key={index} className="my-3 leading-relaxed text-sm md:text-base text-neutral-600 font-sans font-normal antialiased">
          {renderInlineFormatting(line)}
        </p>
      );
    }

    // Flush any remaining structured content
    flushTable("final");
    flushList("final");
    flushCodeBlock("final");

    return elements;
  };

  return (
    <div className="relative min-h-screen bg-[#FBFBFA] flex flex-col justify-between text-neutral-900 overflow-hidden font-sans select-none selection:bg-neutral-100 selection:text-neutral-900">
      
      {/* Premium background mesh for a beautiful workspace feel */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e5e3_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#F5F5F3]/30 to-transparent"></div>
      </div>

      <header className="fixed top-0 left-0 right-0 h-16 z-20 flex justify-between items-center px-6 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {messages.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1.5 px-3 py-1 bg-white/70 border border-neutral-200/50 rounded-full shadow-xs text-xs font-medium text-neutral-500 select-none cursor-default backdrop-blur-xs"
            >
              <Sparkles className="w-3 h-3 text-neutral-400" />
              <span>Compass Mode</span>
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {messages.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClearChat}
              className="p-2 text-neutral-500 hover:text-neutral-900 bg-white/75 hover:bg-neutral-100/70 border border-neutral-200/60 rounded-full shadow-xs transition-colors backdrop-blur-xs flex items-center justify-center cursor-pointer"
              title="Clear entire thread"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 pt-24 pb-32 overflow-y-auto flex flex-col relative z-10 select-text">
        <AnimatePresence mode="wait">
          {messages.length === 0 ? (
            /* COMPLETELY EMPTY FIRST SCREEN STATE. No sidebars, no dashboard, no headers. Just sterile space. */
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col justify-center items-center h-full select-none my-auto"
            >
              {/* Optional ultra-faded glyph in the exact center that stays extremely minimalist */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.05 }}
                transition={{ delay: 0.3, duration: 1 }}
                className="p-8"
              >
                <Sparkles className="w-16 h-16 text-neutral-900" />
              </motion.div>
            </motion.div>
          ) : (
            /* RENDER MESSAGES LOG */
            <motion.div
              key="chat-log"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8 flex-1"
            >
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex leading-relaxed ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-xs ${
                    msg.role === "user" 
                      ? "bg-neutral-900 text-white selection:bg-neutral-700 selection:text-white" 
                      : "bg-white border border-neutral-200/50 text-neutral-800"
                  }`}>
                    {/* Role Signifier */}
                    <div className={`text-[10px] font-mono tracking-wider uppercase opacity-45 mb-1 ${
                      msg.role === "user" ? "text-neutral-300 text-right" : "text-neutral-500"
                    }`}>
                      {msg.role === "user" ? "Client" : "Assistant"}
                    </div>
                    
                    {/* Content Display */}
                    <div className="font-sans leading-relaxed break-words">
                      {msg.role === "user" ? (
                        <p className="text-sm md:text-base font-normal whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <>
                          {renderMarkdown(msg.content)}
                          {(msg.intentType === "data request" || (msg.processedData && msg.intentType !== "casual chat")) && msg.processedData && (
                            <GenerativeViewRenderer 
                              data={msg.processedData}
                              activeFormat={msg.selectedFormat || null}
                              onFormatChange={(format) => handleFormatChange(idx, format)}
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Waiting Indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white border border-neutral-200/50 rounded-2xl px-5 py-4 max-w-[85%] flex items-center gap-3 shadow-xs">
                    <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
                    <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">
                      Processing query...
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Error Callout */}
              {errorHeader && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50/70 border border-red-200/50 rounded-xl flex items-start gap-3 shadow-sm select-none"
                >
                  <Info className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <div className="text-xs md:text-sm text-red-700 font-sans">
                    <span className="font-semibold block mb-0.5 font-display">Communication Interrupted</span>
                    {errorHeader}
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Sleek prompt box static placement at the bottom center of the screen */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#FBFBFA] via-[#FBFBFA]/90 to-transparent z-20">
        <div className="max-w-2xl mx-auto relative">

          {/* Subtle Floating Query Suggestions Panel */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                className="absolute bottom-full mb-3 left-0 right-0 bg-white border border-neutral-200/90 rounded-[24px] p-4.5 shadow-xl z-30 font-sans"
              >
                <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-neutral-100">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#CF4500] uppercase flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#CF4500]" />
                    Discovery Catalyst
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(false)}
                    className="text-[10px] font-mono text-neutral-400 hover:text-neutral-700 uppercase tracking-widest cursor-pointer px-2.5 py-0.5 rounded-full hover:bg-neutral-100 transition-colors font-semibold"
                  >
                    Dismiss
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestedQueries.map((item, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.01, x: 2 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setInputValue(item.query);
                        setShowSuggestions(false);
                        setTimeout(() => inputRef.current?.focus(), 50);
                      }}
                      className="w-full text-left bg-neutral-50/80 hover:bg-neutral-100 border border-neutral-200/50 hover:border-neutral-300 px-3.5 py-2.5 rounded-xl text-xs font-sans font-medium text-neutral-700 hover:text-neutral-900 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <span className="truncate mr-2">{item.label}</span>
                      <ArrowUp className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-850 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between items-center px-4 mb-2">
            <div></div>
            <button
              type="button"
              onClick={() => setShowSuggestions(prev => !prev)}
              className="text-xs font-mono font-semibold text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-1.5 bg-white border border-neutral-200/60 rounded-full px-3 py-1 shadow-2xs hover:shadow-xs cursor-pointer select-none"
            >
              <Sparkles className="w-3 h-3 text-[#CF4500]" />
              Surprise Me
            </button>
          </div>

          <motion.form 
            onSubmit={handleSendMessage}
            whileHover="hover"
            className="w-full relative flex items-center bg-white border border-neutral-200/80 shadow-md focus-within:shadow-lg focus-within:border-neutral-350 transition-all duration-300 rounded-full pl-6 pr-2.5 py-2.5 backdrop-blur-md"
          >
            {/* Minimal left accessory */}
            <div 
              onClick={() => !isParsing && fileInputRef.current?.click()}
              className={`mr-3 shrink-0 flex items-center justify-center relative transition-colors ${
                isParsing 
                  ? "text-neutral-500 cursor-not-allowed" 
                  : "text-neutral-400 cursor-pointer hover:text-neutral-750"
              }`}
              title={isParsing ? "Decoding statement..." : "Upload Statement CSV"}
            >
              {isParsing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MotionPlus 
                  variants={plusVariants}
                  className="w-4 h-4"
                />
              )}
              <input 
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv"
                onChange={handleCSVUpload}
                disabled={isParsing}
              />
            </div>

            {/* Main Interactive Textarea */}
            <textarea
              ref={inputRef}
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isParsing}
              placeholder={isParsing ? "Decoding bank statements CSV offline..." : "Ask anything or search records..."}
              className={`w-full bg-transparent text-neutral-800 placeholder-neutral-400 text-sm md:text-base font-sans font-normal resize-none outline-none focus:ring-0 max-h-24 leading-relaxed pr-6 select-text ${isParsing ? "opacity-50 pointer-events-none" : ""}`}
              style={{ height: "auto" }}
            />

            {/* Interactive clear state inside prompt box */}
            {inputValue.trim() && !isParsing && (
              <button
                type="button"
                onClick={() => setInputValue("")}
                className="absolute right-14 text-xs font-mono text-neutral-400 hover:text-neutral-700 transition-colors uppercase tracking-wider px-2 py-1 mr-1.5 cursor-pointer"
              >
                Clear
              </button>
            )}

            {/* Elegant Circle Send Action */}
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading || isParsing}
              className={`p-2.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                inputValue.trim() && !isLoading && !isParsing
                  ? "bg-neutral-900 text-white hover:bg-neutral-850 shadow-sm"
                  : "bg-neutral-100 text-neutral-300 pointer-events-none"
              }`}
            >
              <Send className="w-3.5 h-3.5 rotate-0" />
            </button>
          </motion.form>

          {/* Minimal shortcut info overlay only on hover/focus helper */}
          <div className="mt-3 text-center pointer-events-none select-none">
            <span className="text-[10px] font-mono text-neutral-400 tracking-wider">
              ENTER TO TRANSMIT · SHIFT+ENTER FOR NEWLINE
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
