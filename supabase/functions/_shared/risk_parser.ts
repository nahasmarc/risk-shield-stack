/**
 * risk_parser.ts
 * Calls Lovable AI Gateway (gemini-3-flash-preview) using tool calling
 * to extract a structured risk signal from arbitrary text.
 */

export interface ParsedRisk {
  riskCategory: "ENERGY" | "TECHNOLOGY" | "GEOPOLITICS" | "POLITICS" | "MACRO" | "UNKNOWN";
  riskLabel: string;
  confidence: number;       // 0–100
  keywords: string[];
  reasoning: string;
  bundleId: string;         // maps to HEDGE_BUNDLES id
}

const CATEGORY_TO_BUNDLE: Record<string, string> = {
  ENERGY:      "oil-shock",
  TECHNOLOGY:  "ai-regulation",
  GEOPOLITICS: "taiwan-conflict",
  POLITICS:    "us-election-volatility",
  MACRO:       "inflation-spike",
};

const BUNDLE_LABELS: Record<string, string> = {
  "oil-shock":              "Energy / Oil Supply Risk",
  "ai-regulation":          "AI Regulation Risk",
  "taiwan-conflict":        "Geopolitical Conflict Risk",
  "us-election-volatility": "Electoral Volatility Risk",
  "inflation-spike":        "Macroeconomic / Inflation Risk",
};

// Lightweight keyword fallback used when AI call fails
const KEYWORD_MAP: Record<string, string> = {
  oil: "ENERGY", crude: "ENERGY", opec: "ENERGY", energy: "ENERGY",
  "middle east": "ENERGY", petroleum: "ENERGY", gas: "ENERGY",
  ai: "TECHNOLOGY", artificial: "TECHNOLOGY", regulation: "TECHNOLOGY",
  tech: "TECHNOLOGY", openai: "TECHNOLOGY", llm: "TECHNOLOGY",
  taiwan: "GEOPOLITICS", china: "GEOPOLITICS", semiconductor: "GEOPOLITICS",
  chip: "GEOPOLITICS", nvidia: "GEOPOLITICS", military: "GEOPOLITICS",
  conflict: "GEOPOLITICS", russia: "GEOPOLITICS", war: "GEOPOLITICS",
  sanctions: "GEOPOLITICS", geopolit: "GEOPOLITICS",
  election: "POLITICS", vote: "POLITICS", political: "POLITICS",
  congress: "POLITICS", democrat: "POLITICS", republican: "POLITICS",
  midterm: "POLITICS",
  inflation: "MACRO", cpi: "MACRO", fed: "MACRO", dollar: "MACRO",
  commodity: "MACRO", rate: "MACRO", recession: "MACRO", gdp: "MACRO",
  yield: "MACRO", treasury: "MACRO", tariff: "MACRO",
};

function keywordFallback(text: string): ParsedRisk {
  const lower = text.toLowerCase();
  const hits: { kw: string; cat: string; count: number }[] = [];

  for (const [kw, cat] of Object.entries(KEYWORD_MAP)) {
    let count = 0;
    let pos = 0;
    while ((pos = lower.indexOf(kw, pos)) !== -1) { count++; pos += kw.length; }
    if (count > 0) hits.push({ kw, cat, count });
  }

  if (hits.length === 0) {
    return {
      riskCategory: "UNKNOWN",
      riskLabel: "Unknown Risk",
      confidence: 0,
      keywords: [],
      reasoning: "No recognisable risk keywords found.",
      bundleId: "",
    };
  }

  hits.sort((a, b) => b.count - a.count || b.kw.length - a.kw.length);
  const top = hits[0];
  const cat = top.cat as ParsedRisk["riskCategory"];
  const bundleId = CATEGORY_TO_BUNDLE[cat] ?? "";
  const rawConf = Math.min(40 + top.count * 18 + Math.min(text.length / 20, 22), 97);

  return {
    riskCategory: cat,
    riskLabel: BUNDLE_LABELS[bundleId] ?? "Geopolitical Risk",
    confidence: Math.round(rawConf),
    keywords: hits.slice(0, 5).map((h) => h.kw),
    reasoning: `Keyword-based analysis detected "${top.kw}" (×${top.count}).`,
    bundleId,
  };
}

export async function parseRisk(text: string): Promise<ParsedRisk> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    console.warn("LOVABLE_API_KEY not set — using keyword fallback");
    return keywordFallback(text);
  }

  const systemPrompt = `You are a financial risk analyst specialising in prediction markets and hedge construction.
Your job is to analyse text and identify the PRIMARY financial/geopolitical risk.
Choose EXACTLY ONE risk category from: ENERGY, TECHNOLOGY, GEOPOLITICS, POLITICS, MACRO.
- ENERGY: oil, gas, OPEC, energy prices, pipeline, LNG
- TECHNOLOGY: AI, semiconductors, Big Tech regulation, cybersecurity
- GEOPOLITICS: Taiwan, China, Russia, war, military, sanctions, territorial disputes
- POLITICS: elections, voting, Congress, legislation, political instability
- MACRO: inflation, CPI, Fed, interest rates, recession, GDP, currency, commodities
If none apply, still pick the closest one. Never output UNKNOWN.`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyse this text and extract the primary risk:\n\n${text.slice(0, 2000)}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_risk",
              description: "Extract the primary risk signal from the input text.",
              parameters: {
                type: "object",
                properties: {
                  riskCategory: {
                    type: "string",
                    enum: ["ENERGY", "TECHNOLOGY", "GEOPOLITICS", "POLITICS", "MACRO"],
                    description: "Primary risk category",
                  },
                  riskLabel: {
                    type: "string",
                    description: "Human-readable risk label, e.g. 'Taiwan Strait Military Escalation Risk'",
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence score 0–100 based on signal strength in the text",
                  },
                  keywords: {
                    type: "array",
                    items: { type: "string" },
                    description: "Key terms that drove this classification",
                  },
                  reasoning: {
                    type: "string",
                    description: "One sentence explaining why this risk category was chosen",
                  },
                },
                required: ["riskCategory", "riskLabel", "confidence", "keywords", "reasoning"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_risk" } },
      }),
    });

    if (response.status === 429) {
      console.warn("AI Gateway rate limited — using keyword fallback");
      return keywordFallback(text);
    }
    if (response.status === 402) {
      console.warn("AI Gateway payment required — using keyword fallback");
      return keywordFallback(text);
    }
    if (!response.ok) {
      console.error("AI Gateway error:", response.status, await response.text());
      return keywordFallback(text);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return keywordFallback(text);

    const parsed = JSON.parse(toolCall.function.arguments);
    const cat = parsed.riskCategory as ParsedRisk["riskCategory"];
    const bundleId = CATEGORY_TO_BUNDLE[cat] ?? "";

    return {
      riskCategory: cat,
      riskLabel: parsed.riskLabel ?? BUNDLE_LABELS[bundleId] ?? "Unknown Risk",
      confidence: Math.min(Math.max(Math.round(parsed.confidence ?? 70), 0), 100),
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 6) : [],
      reasoning: parsed.reasoning ?? "",
      bundleId,
    };
  } catch (err) {
    console.error("parseRisk error:", err);
    return keywordFallback(text);
  }
}
