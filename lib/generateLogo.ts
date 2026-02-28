export async function generateLogo({
  brandName,
  primaryColor,
  secondaryColor,
  themeStyle,
}: {
  brandName: string;
  primaryColor: string;
  secondaryColor?: string;
  themeStyle?: string;
}): Promise<string | null> {
  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "anthropic/claude-sonnet-4-5",
          max_tokens: 1500,
          messages: [
            {
              role: "system",
              content: `You are an expert SVG logo designer. Your job is to create a professional, minimal SVG lettermark logo.

CRITICAL RULES:
- Return ONLY the raw SVG code. No explanation. No markdown. No code blocks. No backticks.
- SVG must use viewBox="0 0 48 48" width="48" height="48"
- Use the brand's primaryColor for the main shape
- Create a lettermark using 1-2 letters from the brand name
- The design must be clean, modern, and professional
- No external fonts — use font-family="system-ui, Arial, sans-serif"
- Must look great at small sizes (32px - 64px)
- The SVG must be self-contained — no external references
- Start your response with <svg and nothing else

STYLE GUIDE based on themeStyle:
- minimal: simple geometric shape, thin strokes, lots of whitespace
- bold: thick heavy letterform, strong contrast, filled shapes
- glassmorphism: rounded shapes, gradient fills using primaryColor
- elegant: thin strokes, refined spacing, sophisticated letterform
- corporate: clean rectangle or circle container, professional sans-serif letter

EXAMPLE OUTPUT for brand "Flow", primary "#3b82f6", style "corporate":
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><rect width="48" height="48" rx="10" fill="#3b82f6"/><text x="24" y="32" font-family="system-ui, Arial, sans-serif" font-size="22" font-weight="700" fill="#ffffff" text-anchor="middle">F</text></svg>`,
            },
            {
              role: "user",
              content: `Create a lettermark logo for:
Brand name: "${brandName}"
Primary color: ${primaryColor}
Secondary color: ${secondaryColor ?? "#ffffff"}
Theme style: ${themeStyle ?? "corporate"}

Use 1-2 characters max. Return ONLY the SVG code starting with <svg`,
            },
          ],
          temperature: 0.7,
        }),
      },
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Logo OpenRouter error:", err);
      return null;
    }

    const data = await response.json();
    let svg = data.choices?.[0]?.message?.content?.trim() ?? "";

    // Strip any accidental markdown fences
    svg = svg
      .replace(/^```svg\s*/i, "")
      .replace(/^```xml\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    // Validate it's actually SVG
    if (!svg.startsWith("<svg")) {
      console.error("Invalid SVG output:", svg.slice(0, 100));
      return null;
    }

    return svg;
  } catch (err) {
    console.error("generateLogo error:", err);
    return null;
  }
}
