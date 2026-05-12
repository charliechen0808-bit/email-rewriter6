export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, tone } = req.body;

  if (!email || !tone) {
    return res.status(400).json({ error: "Missing email or tone" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: "You are an expert business writing assistant. Rewrite emails to be clear, polished, and effective. Return ONLY the rewritten email — no explanations, no subject line prefix, no extra commentary.",
        messages: [
          {
            role: "user",
            content: `Rewrite the following email in a ${tone} tone:\n\n${email}`,
          },
        ],
      }),
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return res.status(500).json({ error: "Anthropic returned invalid response", raw: text.slice(0, 200) });
    }

    if (!response.ok) {
      return res.status(500).json({ error: data?.error?.message || "Anthropic API error" });
    }

    const result = data.content?.map((c) => c.text || "").join("") || "";
    return res.status(200).json({ result });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Unknown error" });
  }
}
