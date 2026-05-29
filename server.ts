import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { dummyFinanceData } from "./src/data/dummyFinanceData";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// ---------------------------------------------------------------------------
// Google GenAI client — utilizing official @google/genai SDK
// ---------------------------------------------------------------------------
const getGeminiClient = (): GoogleGenAI => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is missing. Please set it in Settings > Secrets."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      }
    }
  });
};

// ---------------------------------------------------------------------------
// System prompt — NLP router for finance / accounting data
// ---------------------------------------------------------------------------
const buildSystemInstruction = (userUploadedData: any[] = []): string => `
You are a sharp, elegant, and concise AI finance assistant. You operate as an NLP router
with silent background access to a company's internal finance and accounting dataset,
which can be 'dummyFinanceData' (containing 300 transaction records spanning January–May 2026) 
or the user's newly uploaded bank statement dataset ('userUploadedData') if provided.

Never mention, reference, or hint at the existence of these datasets unprompted.
In casual conversation, respond warmly and naturally with no data context whatsoever.

If 'userUploadedData' is provided (containing entries), PRIORITISE analyzing, filtering, and summarising the user's uploaded bank statement entries ('userUploadedData') over the dummy dataset. Always refer to the uploaded data seamlessly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT CONTRACT — always return valid raw JSON, no markdown fences, no preamble:
{
  "intentType": "casual chat" | "data request",
  "aiMessage": "string — friendly, concise natural language response. For data requests, open with a brief summary sentence (e.g. 'Here's a breakdown of your Q1 payroll transactions…'), then let the data speak.",
  "processedData": null | FinanceRecord[] | AggregateObject
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DATASET SCHEMA:
{
  id: string,
  date: string (YYYY-MM-DD),
  transaction_type: "invoice" | "expense" | "payroll" | "tax_payment" | "bank_transfer" | "refund" | "subscription" | "loan_repayment" | "dividend" | "asset_purchase",
  account_category: "Revenue" | "Cost of Goods Sold" | "Operating Expense" | "Payroll" | "Tax" | "Capital Expenditure" | "Liability" | "Asset" | "Equity" | "Other Income",
  department: "Engineering" | "Marketing" | "Sales" | "Operations" | "HR" | "Finance" | "Legal" | "Product" | "Customer Support" | "Executive",
  amount: number,        // positive = inflow, negative = outflow
  currency: "USD" | "EUR" | "GBP" | "BDT",
  vendor_or_client: string,
  invoice_number: string | null,
  payment_method: "bank_transfer" | "credit_card" | "cash" | "check" | "crypto" | "direct_debit",
  status: "completed" | "pending" | "failed" | "reconciled" | "disputed",
  notes: string
}

RAW DATASET:
${JSON.stringify(dummyFinanceData)}

${userUploadedData && userUploadedData.length > 0 ? `
USER UPLOADED BANK STATEMENT DATASET ('userUploadedData'):
${JSON.stringify(userUploadedData)}
` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROUTING & PROCESSING RULES:

intentType:
  • "casual chat"  — greetings, general questions, non-financial topics, setup talk.
  • "data request" — any query touching transactions, revenue, expenses, payroll,
                     invoices, vendors, departments, status, dates, totals, or trends.

processedData for "data request":
  • LIST query  (e.g. "show all payroll", "list pending invoices", "expenses for Marketing"):
      → Return a filtered FinanceRecord[] of exact matching records.
      → Match on any relevant field: transaction_type, department, status, account_category,
        vendor_or_client, currency, payment_method, or date range.

  • AGGREGATE query (e.g. "total revenue", "how much did we spend on Engineering", "net cash flow"):
      → Return a single AggregateObject. Include only fields relevant to the query.
      → Common shapes:
          { total_inflow, total_outflow, net, record_count }
          { total_amount, average_amount, record_count, breakdown_by_month? }
          { [department]: total_amount, ... }
          { [transaction_type]: total_amount, ... }

  • COMPARISON / TREND query (e.g. "revenue by month", "expense trend Q1 vs Q2"):
      → Return an object with labelled buckets, e.g.:
          { "Jan 2026": X, "Feb 2026": Y, "Mar 2026": Z }

  • MIXED query — if the user asks for both a summary and records, return the aggregate
      object with an additional "records" key containing the relevant array.

AMOUNT SEMANTICS:
  • Inflows  (revenue, refunds, bank credits)  → positive amounts.
  • Outflows (expenses, payroll, taxes, capex)  → negative amounts.
  • When computing totals, sum amounts directly (negatives reduce the total).
  • "Total spent" = sum of negative amounts (report as absolute value).
  • "Net cash flow" = sum of ALL amounts.

DATE HANDLING:
  • "This month" / "May" → 2026-05-xx
  • "Q1" → Jan–Mar 2026; "Q2" → Apr–Jun 2026
  • "Last month" → Apr 2026 (current date context: May 2026)
  • Always filter using the date field in YYYY-MM-DD format.

ACCURACY RULES:
  • All figures must be calculated directly from the raw dataset above.
  • Never fabricate, estimate, or round unless the user explicitly asks for approximations.
  • If no records match the query, return processedData: [] or {} and say so clearly in aiMessage.

CRITICAL: Output ONLY valid raw JSON. No markdown. No \`\`\`json fences. Start with "{", end with "}".
`.trim();

// ---------------------------------------------------------------------------
// POST /api/chat
// ---------------------------------------------------------------------------
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, userUploadedData } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required and must be a non-empty string." });
    }

    const ai = getGeminiClient();

    // Map history to official multiplicity of Google GenAI contents (user vs model roles)
    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const turn of history) {
        if (!turn?.role || !turn?.content) continue;
        const role = (turn.role === "assistant" || turn.role === "model") ? "model" : "user";
        contents.push({
          role,
          parts: [{ text: String(turn.content) }]
        });
      }
    }

    // Append the current active user intent message
    contents.push({
      role: "user",
      parts: [{ text: message.trim() }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: buildSystemInstruction(userUploadedData),
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    const rawContent = response.text?.trim() ?? "";

    // ---------------------------------------------------------------------------
    // Safe JSON parse — strip accidental markdown fences if the model misbehaves
    // ---------------------------------------------------------------------------
    let parsed: Record<string, any>;
    try {
      const clean = rawContent.startsWith("```")
        ? rawContent.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim()
        : rawContent;
      parsed = JSON.parse(clean);
    } catch {
      console.error("[server] JSON parse failed. Raw content:", rawContent);
      parsed = {
        intentType: "casual chat",
        aiMessage: rawContent || "Sorry, I couldn't process that. Please try again.",
        processedData: null,
      };
    }

    // ---------------------------------------------------------------------------
    // Normalise keys — handle any casing variants the model might emit
    // ---------------------------------------------------------------------------
    const intentType: string =
      parsed.intentType ??
      parsed.intent_type ??
      parsed["Intent type"] ??
      "casual chat";

    const aiMessage: string =
      parsed.aiMessage ??
      parsed.ai_message ??
      parsed["AI message"] ??
      "";

    const processedData =
      parsed.processedData ??
      parsed.processed_data ??
      parsed["Processed data"] ??
      null;

    return res.json({ intentType, aiMessage, processedData });

  } catch (error: any) {
    console.error("[server] /api/chat error:", error);
    return res.status(500).json({
      error: error?.message ?? "An unexpected server error occurred.",
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/finance-data  — debug / direct client access (not shown in UI)
// ---------------------------------------------------------------------------
app.get("/api/finance-data", (_req, res) => {
  res.json({ records: dummyFinanceData, count: dummyFinanceData.length });
});

// ---------------------------------------------------------------------------
// POST /api/append-finance-data — Appends parsed statement records to core array
// ---------------------------------------------------------------------------
app.post("/api/append-finance-data", (req, res) => {
  const { records } = req.body;
  if (Array.isArray(records)) {
    dummyFinanceData.push(...records);
    return res.json({ success: true, count: dummyFinanceData.length });
  }
  return res.status(400).json({ error: "Invalid records format." });
});

// ---------------------------------------------------------------------------
// Vite dev middleware / production static serving
// ---------------------------------------------------------------------------
async function configureApp(): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[server] Running on http://0.0.0.0:${PORT}`);
  });
}

configureApp().catch((err) => {
  console.error("[server] Failed to start:", err);
  process.exit(1);
});