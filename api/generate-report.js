// This code runs on Vercel's servers, NEVER in the client's browser.
// Your API key stays secret here — it's read from an environment variable.

function buildPrompt(lang, payload) {
  const { name, household, homeScores, lifeScores, peaceRoom, peaceWhy, houseVoice, roomRaw } = payload;

  if (lang === "en") {
    return `You are the copywriter for Home Wellness Organisers, a holistic home-organising brand (Wellness Integration Method™) based in Brisbane, Australia. Your tone: warm, direct, plain Australian English — NEVER use words like "energy", "nervous system", "chakra" or esoteric language. Use Australian spelling (organise, colour, favourite, centre). No filler, no empty phrases.

Using this client's data, write TWO things and return them as pure JSON (no markdown, no backticks, no text before or after):

1. "houseMessage": A short message (3-4 sentences) in first person, as if the HOME were speaking to the client. Use the StoryBrand structure: name the VILLAIN (the real pattern/problem shown by her answers and lowest scores — be specific, not generic), then a turn where the home acknowledges she's not alone (briefly mention there's guidance/support available, without sounding like an ad), and close on an aspirational but believable note, not corny. Base it on her own words when she gave them, but IMPROVED — don't repeat them verbatim or copy grammar mistakes.

2. "roomSymptoms": an object with one entry per room key: entryway, laundry, bathroom, kitchen, living, dining, wardrobe, office, bedroom, garden. For each, if the client wrote an observation, turn it into ONE clean, well-written descriptive sentence, correcting grammar and lifting the tone without inventing details she didn't mention. If she left it blank, generate a short, plausible sentence based on the room name and its friction score (low score = more friction).

Client data:
Name: ${name}
Household type: ${household}
Home Wellness Wheel scores (1-10, lower = more friction): ${JSON.stringify(homeScores)}
Wheel of Life scores (1-10): ${JSON.stringify(lifeScores)}
Her chosen place of peace: ${peaceRoom} — reason given: "${peaceWhy}"
What she wrote if her home could talk: "${houseVoice}"
Her room-by-room observations (some may be blank): ${JSON.stringify(roomRaw)}

Respond with ONLY this JSON, nothing else:
{"houseMessage": "...", "roomSymptoms": {"entryway":"...", "laundry":"...", "bathroom":"...", "kitchen":"...", "living":"...", "dining":"...", "wardrobe":"...", "office":"...", "bedroom":"...", "garden":"..."}}`;
  }

  return `Eres el redactor de Home Wellness Organisers, una marca de organización holística del hogar (Wellness Integration Method™). Tu tono: cálido, directo, en español neutro/mexicano sencillo — NUNCA uses palabras como "energía", "sistema nervioso", "chakra" o lenguaje esotérico. Nada de relleno ni frases vacías.

Con los datos de esta clienta, redacta DOS cosas y devuélvelas en JSON puro (sin markdown, sin backticks, sin texto antes o después):

1. "houseMessage": Un mensaje corto (3-4 oraciones) en primera persona, como si la CASA le hablara a la clienta. Usa la estructura StoryBrand: nombra el VILLANO (el patrón/problema real que describen sus respuestas y sus puntajes más bajos — sé específico, no genérico), luego un giro donde la casa reconoce que la clienta no está sola (menciona brevemente que hay una guía/apoyo disponible, sin sonar a anuncio), y cierra con una nota aspiracional pero creíble, no cursi. Basado en sus propias palabras cuando las dio, pero MEJORADO — no las repitas literalmente ni copies errores de gramática.

2. "roomSymptoms": un objeto con una entrada por cada una de estas claves de cuarto: entryway, laundry, bathroom, kitchen, living, dining, wardrobe, office, bedroom, garden. Para cada una, si la clienta escribió una observación, conviértela en UNA oración limpia, bien escrita, en tercera persona descriptiva, corrigiendo gramática y elevando el tono sin inventar detalles que no dijo. Si no escribió nada para ese cuarto, genera una oración breve y plausible basada en el nombre del cuarto y su puntaje de fricción (puntaje bajo = más fricción).

Datos de la clienta:
Nombre: ${name}
Tipo de hogar: ${household}
Puntajes Rueda del Hogar (1-10, más bajo = más fricción): ${JSON.stringify(homeScores)}
Puntajes Rueda de Vida (1-10): ${JSON.stringify(lifeScores)}
Su zona de paz elegida: ${peaceRoom} — razón que dio: "${peaceWhy}"
Lo que ella escribió si su casa le hablara: "${houseVoice}"
Sus observaciones por cuarto (puede haber vacíos): ${JSON.stringify(roomRaw)}

Responde ÚNICAMENTE con este JSON, nada más:
{"houseMessage": "...", "roomSymptoms": {"entryway":"...", "laundry":"...", "bathroom":"...", "kitchen":"...", "living":"...", "dining":"...", "wardrobe":"...", "office":"...", "bedroom":"...", "garden":"..."}}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests are accepted." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured in Vercel." });
  }

  const body = req.body || {};
  const lang = body.lang === "en" ? "en" : "es";

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1400,
        messages: [{ role: "user", content: buildPrompt(lang, body) }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: "Error calling the Claude API.", detail: errText });
    }

    const data = await response.json();
    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: "AI synthesis failed.", detail: String(e) });
  }
}
