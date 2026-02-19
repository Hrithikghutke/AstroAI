import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `
You are a professional website architect.

Return ONLY valid JSON.
Do not add explanation.
Do not wrap in markdown.

Also include a branding object with:
- logoText
- primaryColor
- secondaryColor
- fontStyle (modern, bold, elegant, etc.)

Format:
{
  "theme": "light or dark",
  "primaryColor": "color",
  "sections": [
    { "type": "hero", "headline": "text", "subtext": "text" },
    { "type": "features" },
    { "type": "pricing" },
    { "type": "testimonials" },
    { "type": "contact" }
  ]
}
            `,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return NextResponse.json({ error: "OpenRouter failed" }, { status: 500 });
    }

    // const result = data.choices[0].message.content;
    const raw = data.choices[0].message.content;
    const cleaned = raw.replace(/```json|```/g, "").trim();

    return NextResponse.json({
      layout: JSON.parse(cleaned),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
