// app/api/chat/route.ts
export const runtime = "edge"; // + stable et + rapide sur Vercel

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  return new Response(JSON.stringify({ ok: true, route: "/api/chat" }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export async function POST(req: Request) {
  try {
    // 1) Entrée utilisateur
    const url = new URL(req.url);
    const noStream = url.searchParams.get("no_stream") === "1";
    const { messages } = await req.json();

    // 2) Payload OpenAI
    const payload = {
      model: "gpt-4o-mini",
      messages,
      stream: !noStream,
    };

    // 3) Appel OpenAI
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    // 4A) MODE STREAMING (SSE) → renvoyer tel quel
    if (!noStream) {
      // OpenAI renvoie déjà du SSE → on “proxy” le flux
      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          ...CORS_HEADERS,
        },
      });
    }

    // 4B) MODE NON-STREAMING pour Bubble
    const data = await upstream.json();
    // extraire le texte (compat completions)
    const text =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.delta?.content ??
      "";

    return new Response(JSON.stringify({ text, raw: data }), {
      status: upstream.ok ? 200 : upstream.status,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Erreur interne", details: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }
}