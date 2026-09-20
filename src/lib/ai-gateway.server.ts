const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-6-astra";

type GatewayErrorBody = {
  message?: string;
  error?: { message?: string } | string;
};

export class AiGatewayError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AiGatewayError";
    this.status = status;
  }
}

function safeGatewayMessage(status: number, body: string) {
  try {
    const parsed = JSON.parse(body) as GatewayErrorBody;
    const message =
      typeof parsed.error === "string" ? parsed.error : (parsed.error?.message ?? parsed.message);
    if (message?.trim()) return message.trim();
  } catch {
    // The gateway may return plain text. Only expose short, non-HTML text.
  }

  const plain = body.trim();
  if (plain && plain.length <= 300 && !plain.includes("<")) return plain;
  if (status === 401) return "AI analysis is not configured for this workspace.";
  if (status === 402) return "AI credits are unavailable. Add workspace credits to continue.";
  if (status === 429) return "AI analysis is busy. Please try again shortly.";
  return "AI symptom analysis is temporarily unavailable.";
}

function retryDelay(response: Response, attempt: number) {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.min(seconds * 1_000, 10_000);
  }
  return Math.min(750 * 2 ** attempt + Math.floor(Math.random() * 250), 5_000);
}

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

function readOutputText(payload: unknown) {
  const value = payload as {
    type?: string;
    delta?: string;
  };
  if (value.type === "response.output_text.delta" && typeof value.delta === "string") {
    return value.delta;
  }
  return "";
}

async function consumeResponseStream(response: Response) {
  if (!response.body) throw new AiGatewayError(502, "AI analysis returned an empty response.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let output = "";

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      for (const line of event.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const text = readOutputText(JSON.parse(data));
          if (text && !output) output = text;
          else if (text) output += text;
        } catch {
          // Ignore non-JSON keepalive events.
        }
      }
    }
  }

  buffer += decoder.decode();
  for (const line of buffer.split("\n")) {
    if (!line.startsWith("data:")) continue;
    const data = line.slice(5).trim();
    if (!data || data === "[DONE]") continue;
    try {
      output += readOutputText(JSON.parse(data));
    } catch {
      // Ignore a trailing non-JSON keepalive event.
    }
  }

  if (!output.trim()) throw new AiGatewayError(502, "AI analysis returned no structured result.");
  return output;
}

export async function requestStructuredSymptomAnalysis(
  apiKey: string,
  input: string,
  instructions: string,
  schema: object,
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: MODEL,
        store: false,
        stream: true,
        reasoning: { effort: "low", summary: "auto" },
        include: ["reasoning.encrypted_content"],
        input: [
          { role: "system", content: instructions },
          { role: "user", content: input },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "symptom_extraction",
            strict: true,
            schema,
          },
        },
      }),
    });

    if (response.ok) return consumeResponseStream(response);

    const body = await response.text();
    const retryable = response.status === 429 || response.status >= 500;
    if (retryable && attempt < 2) {
      await wait(retryDelay(response, attempt));
      continue;
    }
    throw new AiGatewayError(response.status, safeGatewayMessage(response.status, body));
  }

  throw new AiGatewayError(503, "AI symptom analysis is temporarily unavailable.");
}
