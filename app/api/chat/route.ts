import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const payload = {
      model: "gpt-4o-mini",
      messages: body.messages,
      stream: false,
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // ✅ Retourne la réponse proprement
    return NextResponse.json({
      text: data.choices?.[0]?.message?.content || "Aucune réponse générée.",
      raw: data,
    });
  } catch (error) {
    console.error("Erreur ZenIA:", error);
    return NextResponse.json(
      { error: "Erreur interne ZenIA" },
      { status: 500 }
    );
  }
}

// ✅ Route GET pour test
export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/chat" });
}
