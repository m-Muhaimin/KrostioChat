import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BarChart3, Table, LayoutGrid, FileText, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

interface GenerativeViewRendererProps {
  data: any;
  activeFormat: "bar" | "table" | "cards" | "text" | null;
  onFormatChange: (format: "bar" | "table" | "cards" | "text") => void;
}

export default function GenerativeViewRenderer({
  data,
  activeFormat,
  onFormatChange,
}: GenerativeViewRendererProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  if (!data) return null;

  // ---------------------------------------------------------------------------
  // Standard Currency & Formatting Helpers
  // ---------------------------------------------------------------------------
  const formatCurrency = (amount: number, currency: string = "USD") => {
    const getSymbol = (curr: string) => {
      switch (curr.toUpperCase()) {
        case "EUR": return "€";
        case "GBP": return "£";
        case "BDT": return "৳";
        case "USD":
        default:
          return "$";
      }
    };
    const symbol = getSymbol(currency);
    const isNegative = amount < 0;
    const formatted = Math.abs(amount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${isNegative ? "-" : ""}${symbol}${formatted}`;
  };

  // Helper to format key names into clean text
  const cleanLabel = (str: string) => {
    return str
      .split(/[^a-zA-Z0-9]/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // ---------------------------------------------------------------------------
  // Data Extraction & Normalization
  // ---------------------------------------------------------------------------

  // 1. Check if array of transactional rows
  const isArrayData = Array.isArray(data);
  const transactionRows = isArrayData ? data : [];

  // 2. Extracted flat key-value pairs (KVs) for trends or high-level aggregations
  const extractFlatKVs = (): { key: string; value: any; numericVal: number }[] => {
    if (isArrayData) return [];
    if (typeof data !== "object" || data === null) return [];

    const list: { key: string; value: any; numericVal: number }[] = [];
    Object.entries(data).forEach(([key, val]) => {
      let num = 0;
      if (typeof val === "number") {
        num = val;
      } else if (val && typeof val === "object") {
        // If nested object, try to extract first numeric property or a 'net_cash_flow'/'revenue' key if it exists
        const keys = Object.keys(val);
        const preferredKey = keys.find(k => 
          k.includes("net") || k.includes("revenue") || k.includes("inflow") || k.includes("amount")
        ) || keys.find(k => typeof (val as any)[k] === "number") || keys[0];

        num = preferredKey ? Number((val as any)[preferredKey]) || 0 : 0;
      } else {
        num = Number(val) || 0;
      }
      list.push({ key, value: val, numericVal: num });
    });
    return list;
  };

  const flatKVs = extractFlatKVs();

  // ---------------------------------------------------------------------------
  // Render Formats Implementation
  // ---------------------------------------------------------------------------

  const renderActiveView = () => {
    if (!activeFormat) return null;

    switch (activeFormat) {
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // A. BAR CHART VIEW
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case "bar": {
        let chartItems: { label: string; rawValue: number; formatted: string; positive: boolean }[] = [];

        if (isArrayData) {
          // Group transactions by category, department, or date (fallback)
          const groupings: Record<string, number> = {};
          transactionRows.forEach((row: any) => {
            const grpKey = row.account_category || row.transaction_type || row.department || "Other";
            groupings[grpKey] = (groupings[grpKey] || 0) + (row.amount || 0);
          });
          Object.entries(groupings).forEach(([label, totalVal]) => {
            chartItems.push({
              label,
              rawValue: totalVal,
              formatted: formatCurrency(totalVal),
              positive: totalVal >= 0,
            });
          });
        } else {
          // Flattened trend mapping
          flatKVs.forEach((item) => {
            chartItems.push({
              label: cleanLabel(item.key),
              rawValue: item.numericVal,
              formatted: formatCurrency(item.numericVal),
              positive: item.numericVal >= 0,
            });
          });
        }

        if (chartItems.length === 0) {
          return (
            <div className="text-center py-6 text-neutral-400 font-mono text-xs">
              No chartable numerical metrics found.
            </div>
          );
        }

        // Calculate max value for visual scaling
        const maxAbsValue = Math.max(...chartItems.map((item) => Math.abs(item.rawValue)), 1);

        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-[#FDFDFD] border border-neutral-250/60 rounded-3xl p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">
                Visual Comparison (Bar Chart)
              </span>
              <span className="text-[10px] font-mono text-neutral-400">Scaled relative to performance peak</span>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              {chartItems.map((item, i) => {
                const percentage = Math.min(Math.round((Math.abs(item.rawValue) / maxAbsValue) * 100), 100);
                return (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 font-sans">
                    <span className="text-xs font-semibold text-neutral-600 truncate max-w-[200px] sm:max-w-xs block">
                      {item.label}
                    </span>
                    <div className="flex-1 sm:mx-4 flex items-center h-5 relative bg-neutral-100/50 rounded-full overflow-hidden border border-neutral-200/20">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className={`h-full rounded-full ${
                          item.positive 
                            ? "bg-emerald-500/90 border-r-2 border-emerald-600" 
                            : "bg-rose-500/90 border-r-2 border-rose-600"
                        }`}
                      />
                    </div>
                    <span className={`text-xs font-mono font-bold text-right shrink-0 ${item.positive ? "text-emerald-600" : "text-rose-600"}`}>
                      {item.formatted}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // B. DATA TABLE VIEW
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case "table": {
        if (isArrayData) {
          // Standard transaction table with custom search filter
          const filteredRows = transactionRows.filter((row: any) => {
            if (!searchTerm) return true;
            return JSON.stringify(row).toLowerCase().includes(searchTerm.toLowerCase());
          });

          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-[#FDFDFD] border border-neutral-250/60 rounded-3xl p-4 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">
                  Data Stream ({filteredRows.length} elements found)
                </span>
                <input
                  type="text"
                  placeholder="Filter records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-neutral-200/80 hover:border-neutral-300 text-xs rounded-full px-3.5 py-1.5 outline-none focus:border-neutral-400 text-neutral-800 transition-colors w-full sm:w-48 placeholder-neutral-400 font-sans font-medium"
                />
              </div>

              <div className="overflow-x-auto rounded-2xl border border-neutral-200/60 bg-white">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200/50 text-[9px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5">Type / Cat</th>
                      <th className="px-3 py-2.5">Party</th>
                      <th className="px-3 py-2.5 text-right">Amount</th>
                      <th className="px-3 py-2.5 text-center">Status</th>
                      <th className="px-3 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-sans text-neutral-700">
                    {filteredRows.map((row: any, rIdx) => {
                      const isExpanded = expandedRow === row.id;
                      const amtVal = Number(row.amount) || 0;
                      return (
                        <React.Fragment key={row.id || rIdx}>
                          <tr
                            onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                            className="hover:bg-neutral-50/50 transition-colors cursor-pointer"
                          >
                            <td className="px-3 py-3 text-neutral-500 whitespace-nowrap">{row.date || "N/A"}</td>
                            <td className="px-3 py-3 font-medium">
                              <span className="inline-block px-1.5 py-0.5 rounded-md bg-neutral-100 text-[8px] font-mono uppercase text-neutral-600 border border-neutral-200/30">
                                {row.transaction_type || "N/A"}
                              </span>
                              <span className="block text-[10px] text-neutral-400 truncate max-w-[100px] mt-0.5 font-normal">
                                {row.account_category || "N/A"}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-neutral-900 font-semibold truncate max-w-[120px]">
                              {row.vendor_or_client || "N/A"}
                            </td>
                            <td className={`px-3 py-3 text-right font-mono font-bold ${amtVal >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                              {formatCurrency(amtVal, row.currency)}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-mono uppercase font-bold border ${
                                row.status === "completed" || row.status === "reconciled" 
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                                  : row.status === "pending" 
                                  ? "bg-amber-50 text-amber-800 border-amber-100" 
                                  : "bg-rose-50 text-rose-800 border-rose-100"
                              }`}>
                                {row.status || "pending"}
                              </span>
                            </td>
                            <td className="px-2 py-3 text-right">
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                              )}
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="bg-neutral-50/25">
                              <td colSpan={6} className="px-4 py-3 border-l-2 border-neutral-950 bg-neutral-50/80 rounded-b-2xl">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[11px] font-sans">
                                  <div>
                                    <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 block font-bold">Transaction UID</span>
                                    <span className="font-mono font-semibold text-neutral-600">{row.id || "N/A"}</span>
                                  </div>
                                  <div>
                                    <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 block font-bold">Department</span>
                                    <span className="font-semibold text-neutral-600">{row.department || "Executive"}</span>
                                  </div>
                                  <div>
                                    <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 block font-bold">Payment Method</span>
                                    <span className="font-semibold text-neutral-600 capitalize">{row.payment_method?.replace("_", " ") || "bank_transfer"}</span>
                                  </div>
                                  {row.invoice_number && (
                                    <div>
                                      <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 block font-bold">Invoice Number</span>
                                      <span className="font-mono font-semibold text-neutral-600">{row.invoice_number}</span>
                                    </div>
                                  )}
                                  <div className="col-span-2">
                                    <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 block font-bold">Context Commentary</span>
                                    <span className="font-normal text-neutral-500 italic block mt-0.5">{row.notes || "No standard notes attached."}</span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}

                    {filteredRows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-neutral-400 font-mono text-[10px]">
                          No records match search parameters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          );
        } else {
          // Render Key-Value Object as a clean 2-column table, preventing [object Object] errors by unfolding nested fields!
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-[#FDFDFD] border border-neutral-250/60 rounded-3xl p-4 shadow-sm space-y-2.5"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">
                  Data Structure Ledger
                </span>
                <span className="text-[10px] font-mono text-neutral-400">Metrics Breakdown</span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-neutral-200/60 bg-white text-xs select-text">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200/40 text-[9px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                      <th className="px-4 py-2.5">Metric Dimension</th>
                      <th className="px-4 py-2.5 text-right">Value Specification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-sans text-neutral-700">
                    {flatKVs.map((item, idx) => {
                      const isNestedObject = typeof item.value === "object" && item.value !== null;

                      return (
                        <tr key={idx} className="hover:bg-neutral-50/30 transition-colors">
                          <td className="px-4 py-3 font-semibold text-neutral-855 whitespace-nowrap align-top">
                            {cleanLabel(item.key)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isNestedObject ? (
                              <div className="flex flex-col gap-1 items-end">
                                {Object.entries(item.value).map(([nestedKey, nestedVal]) => {
                                  const renderVal = typeof nestedVal === "number" 
                                    ? formatCurrency(nestedVal) 
                                    : String(nestedVal);
                                  return (
                                    <div key={nestedKey} className="flex gap-2 text-[10px] font-mono">
                                      <span className="text-neutral-400 uppercase tracking-xs">{cleanLabel(nestedKey)}:</span>
                                      <span className="text-neutral-800 font-bold">{renderVal}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="font-mono font-semibold text-neutral-800">
                                {typeof item.value === "number" ? formatCurrency(item.value) : String(item.value)}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          );
        }
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // C. CARDS VIEW
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case "cards": {
        let cards: { title: string; primary: string; subtitle?: string; isNegative?: boolean; subItems?: { label: string; val: string }[] }[] = [];

        if (isArrayData) {
          // Dynamic analytical rollup based on record arrays
          let totalInflow = 0;
          let totalOutflow = 0;
          let netCashFlow = 0;
          const depts = new Set<string>();

          transactionRows.forEach((row: any) => {
            const amt = Number(row.amount) || 0;
            if (amt > 0) totalInflow += amt;
            else totalOutflow += Math.abs(amt);
            netCashFlow += amt;
            if (row.department) depts.add(row.department);
          });

          cards = [
            {
              title: "Verified Income Inflows",
              primary: formatCurrency(totalInflow),
              subtitle: "Gross financial transfers acquired",
              isNegative: false,
            },
            {
              title: "Settled Outflows",
              primary: formatCurrency(-totalOutflow),
              subtitle: "Company operating costs & payables",
              isNegative: true,
            },
            {
              title: "Net Cash Flow Position",
              primary: formatCurrency(netCashFlow),
              subtitle: "Residual cash flow movement after expenses",
              isNegative: netCashFlow < 0,
            },
            {
              title: "Logistical Scope",
              primary: `${transactionRows.length} records`,
              subtitle: `Frictionless audits across ${depts.size || 1} core departments`,
              isNegative: false,
            }
          ];
        } else {
          // Unfold Key-Value metrics as beautiful individual stadium tiles
          flatKVs.forEach((item) => {
            const val = item.value;
            if (typeof val === "object" && val !== null) {
              // Extract sub-items list
              const subItems: { label: string; val: string }[] = [];
              Object.entries(val).forEach(([nKey, nVal]) => {
                subItems.push({
                  label: cleanLabel(nKey),
                  val: typeof nVal === "number" ? formatCurrency(nVal) : String(nVal),
                });
              });

              cards.push({
                title: cleanLabel(item.key),
                primary: "Section Overview",
                subItems,
              });
            } else {
              const numVal = item.numericVal;
              cards.push({
                title: cleanLabel(item.key),
                primary: typeof val === "number" ? formatCurrency(numVal) : String(val),
                isNegative: typeof val === "number" && numVal < 0,
              });
            }
          });
        }

        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {cards.map((card, i) => (
              <div
                key={i}
                className="bg-white border border-neutral-200/70 p-4.5 rounded-[20px] shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between font-sans min-h-[110px]"
              >
                <div>
                  <span className="block text-[9px] font-mono uppercase tracking-wider text-neutral-400 font-bold leading-none mb-2">
                    {card.title}
                  </span>
                  
                  {card.subItems ? (
                    <div className="space-y-1 mt-1 block">
                      {card.subItems.map((s, sIdx) => (
                        <div key={sIdx} className="flex justify-between items-center text-[10px] font-mono leading-tight">
                          <span className="text-neutral-400 text-left font-semibold">{s.label}:</span>
                          <span className="text-neutral-800 font-bold text-right">{s.val}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className={`block text-base md:text-lg font-display font-semibold tracking-tight leading-tight mt-1 ${
                      card.isNegative ? "text-rose-600" : card.primary.startsWith("-") ? "text-rose-600" : "text-neutral-900"
                    }`}>
                      {card.primary}
                    </span>
                  )}
                </div>

                {card.subtitle && (
                  <span className="block text-[10px] font-sans font-normal text-neutral-400 mt-2.5 leading-snug">
                    {card.subtitle}
                  </span>
                )}
              </div>
            ))}
          </motion.div>
        );
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // D. PLAIN TEXT VIEW (Natural Language Report)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case "text": {
        let summaryText = "";

        if (isArrayData) {
          let totalInflow = 0;
          let totalOutflow = 0;
          let netCashFlow = 0;
          transactionRows.forEach((row: any) => {
            const amt = Number(row.amount) || 0;
            if (amt > 0) totalInflow += amt;
            else totalOutflow += Math.abs(amt);
            netCashFlow += amt;
          });

          summaryText = `This accounting dataset contains a filtered stream of ${
            transactionRows.length
          } transactions in total. The gross verified financial inflows aggregate to ${formatCurrency(
            totalInflow
          )}, whilst operating outflows total ${formatCurrency(
            -totalOutflow
          )}. This results in a consolidated net cash flow position of ${formatCurrency(
            netCashFlow
          )}.`;
        } else {
          // Compose key-value summary lines dynamically
          const lines = flatKVs.map((item) => {
            if (item.value && typeof item.value === "object") {
              const details = Object.entries(item.value)
                .map(([k, v]) => `• ${cleanLabel(k)}: ${typeof v === "number" ? formatCurrency(v) : String(v)}`)
                .join(", ");
              return `* ${cleanLabel(item.key)}: (${details})`;
            }
            const printVal = typeof item.value === "number" ? formatCurrency(item.numericVal) : String(item.value);
            return `* ${cleanLabel(item.key)} is recorded at ${printVal}`;
          });
          summaryText = `The structural analysis generated ${lines.length} key metric checkpoints:\n\n${lines.join("\n")}`;
        }

        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-[#FDFDFD] border border-neutral-250/60 rounded-3xl p-5 shadow-sm text-neutral-700 font-sans"
          >
            <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 mb-3 block">
              Automated Plain Text Context Summary
            </span>
            <p className="text-xs md:text-sm font-normal leading-relaxed whitespace-pre-wrap font-sans selection:bg-neutral-100">
              {summaryText}
            </p>
          </motion.div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="mt-4 flex flex-col font-sans">
      {/* 4-way Generative Format Selector buttons */}
      <div className="flex flex-wrap items-center gap-1.5 py-1 z-10 select-none">
        <button
          type="button"
          onClick={() => onFormatChange("bar")}
          className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition-all ${
            activeFormat === "bar"
              ? "bg-neutral-900 border-neutral-900 text-white shadow-xs"
              : "bg-[#FDFDFD]/80 border-neutral-200/50 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-600 hover:text-neutral-900"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-[#CF4500]" />
          <span>Bar Chart</span>
        </button>

        <button
          type="button"
          onClick={() => onFormatChange("table")}
          className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition-all ${
            activeFormat === "table"
              ? "bg-neutral-900 border-neutral-900 text-white shadow-xs"
              : "bg-[#FDFDFD]/80 border-neutral-200/50 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-600 hover:text-neutral-900"
          }`}
        >
          <Table className="w-3.5 h-3.5 text-neutral-400" />
          <span>Data Table</span>
        </button>

        <button
          type="button"
          onClick={() => onFormatChange("cards")}
          className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition-all ${
            activeFormat === "cards"
              ? "bg-neutral-900 border-neutral-900 text-white shadow-xs"
              : "bg-[#FDFDFD]/80 border-neutral-200/50 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-600 hover:text-neutral-900"
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5 text-neutral-400" />
          <span>Cards View</span>
        </button>

        <button
          type="button"
          onClick={() => onFormatChange("text")}
          className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition-all ${
            activeFormat === "text"
              ? "bg-neutral-900 border-neutral-900 text-white shadow-xs"
              : "bg-[#FDFDFD]/80 border-neutral-200/50 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-600 hover:text-neutral-900"
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-neutral-400" />
          <span>Plain Text</span>
        </button>
      </div>

      {/* Render selected Format visual container with entry animation */}
      <AnimatePresence mode="wait">
        {activeFormat && (
          <div className="overflow-hidden select-text text-neutral-800">
            {renderActiveView()}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
