# KrostChat — Intelligently Generative Financial Copilot

**KrostChat** is a state-of-the-art interactive financial assistant built to query, analyze, and render transactional and operational financial data with immediate visual clarity. It processes natural language financial inquiries (like cash flows, expenses, and rolling comparisons) on static dataset arrays and returns structured visual interpretations dynamically.

---

## 🌟 Core Pillars & Key Features

### 1. Unified Intent Recognition & Prompt Intelligence
* **Dynamic Query Assistance**: A dedicated **"Surprise Me"** query suger panel floats subtly near the message entry, presenting helpful analytical directions with clean micro-animations.
* **Semantic Analysis**: Handled server-side by modern Gemini LLM architecture (`gemini-3.5-flash`), classifying intents transparently as either `casual chat` or `data request` with real structured JSON returns.

### 2. Context-Aware Format Preselection
When a `data request` intent occurs, KrostChat analyzes the user's raw prompt structure alongside the response payload properties to **automatically activate** the most proportional visual form factor:
* **Bar Chart**: Activated for MoM comparisons, breakdown trends, and category performance ratings.
* **Data Table**: Prioritized for verbose transactional rows, lists, or spreadsheet audit lists.
* **Cards View**: Chosen for KPI balances, total aggregates, currency net cash flows, and standalone status summaries.
* **Plain Text**: Standardized for natural narrative summaries of records.

### 3. Generative Visual Rendering Engine
Through our sleek custom UI viewport renderer, users can toggle gracefully between multiple format views in real-time inside the conversation:
*   📊 **Visual Bar Chart**: Scaled dynamically relative to individual performance peaks using responsive Tailwind CSS height vectors.
*   📋 **Detail-Rich Data Table**: Complete with expandable sub-rows revealing transactional metadata (invoice values, reference UIDs, and custom notes) plus instant searching.
*   🗂️ **Modern KPI Card Grid**: Mastercard-inspired design system tokens with responsive column scaling and negative/positive color contracts.
*   📝 **Dynamic Narrative Reports**: Detailed textual executive summaries explaining multi-dimensional metrics cleanly.

---

## 🛠️ Technology Stack

* **Front-end**: React 18 / TypeScript, Vite Bundler, Framer Motion (`motion/react`) for spring-driven micro-interactions, Tailwind CSS (`@theme` v4 integration).
* **Back-end API**: Express server proxying secure requests, integrating Node's native type-stripping capabilities.
* **Intelligence Layer**: Google GenAI Node JS SDK (`@google/genai`) utilizing pure JSON schema responses from `gemini-3.5-flash`.
