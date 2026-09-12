// This code runs on Vercel's servers, NEVER in the client's browser.
// Your API key stays secret here — it's read from an environment variable.
//
// ROOM_THEMES below is internal calibration only — drawn from the Mirror
// Methodology's Alignment Matrix and Diagnosis Matrix (Mess -> Message ->
// Master Insight per room). It is NEVER shown to the client, and the model
// is explicitly told not to copy it or use chakra/portal language — it's
// only there so the tone and "translation logic" (symptom -> psychological
// read) stays consistent and grounded, instead of generic or repetitive.
//
// SPEED: the original single mega-prompt took ~2 minutes. This version
// splits the work into 3 parallel calls (rooms 1-5, rooms 6-10, overview
// fields) using Promise.all, which cuts wall-clock time roughly in half to
// a third, since the calls run at the same time instead of one after another.

const ROOM_THEMES = {
  en: {
    entryway: { theme: "boundaries — filtering what gets into your inner world", exampleMess: "blocked door, too many other people's things, poor lighting", exampleMessage: "I struggle to filter who and what enters my inner world." },
    laundry: { theme: "rhythm — invisible mental load", exampleMess: "endless piles, clean clothes left unfolded for days", exampleMessage: "I'm drowning in basic chores; my life isn't flowing." },
    bathroom: { theme: "self-acceptance — letting go of past versions of yourself", exampleMess: "expired products, hoarded free samples, tatty towels", exampleMessage: "My own renewal is at the bottom of my priority list." },
    kitchen: { theme: "self-care — nourishment beyond survival mode", exampleMess: "chipped plates, scratched pans, eating standing up", exampleMessage: "I don't deserve real nourishment, only survival fuel." },
    living: { theme: "self-love — permission to rest without guilt", exampleMess: "furniture you don't love, decor chosen for guests not you", exampleMessage: "I'm living by other people's rules; I don't allow myself any joy." },
    dining: { theme: "self-respect — reclaiming your own place", exampleMess: "table covered in other people's things", exampleMessage: "I don't have a place of my own; everyone else's needs invade my space." },
    wardrobe: { theme: "self-worth — dressing who you are today, not who you were", exampleMess: "clothes in different sizes, conflicting styles", exampleMessage: "I'm scared to show who I am today; I'm hiding in the past." },
    office: { theme: "self-trust — clarity to decide and move", exampleMess: "desk covered in to-do piles, tangled cables", exampleMessage: "I'm terrified of making the next move; I'd rather stay in the fog." },
    bedroom: { theme: "self-surrender — allowing real rest and vulnerability", exampleMess: "unmade bed, old sheets, invisible clutter", exampleMessage: "I'm not worth the effort of creating beauty for myself if no one's watching." },
    garden: { theme: "self-alignment — daring to expand and take up space", exampleMess: "overgrown weeds, dusty outdoor furniture", exampleMessage: "I've stopped tending to my own growth; my vital energy is dormant." },
  },
  es: {
    entryway: { theme: "límites — filtrar qué entra a tu mundo interno", exampleMess: "puerta bloqueada, cosas de otros acumuladas, poca luz", exampleMessage: "Me cuesta filtrar quién y qué entra a mi mundo interno." },
    laundry: { theme: "ritmo — carga mental invisible", exampleMess: "montones interminables, ropa limpia sin doblar por días", exampleMessage: "Me ahogo en tareas básicas; mi vida no fluye." },
    bathroom: { theme: "autoaceptación — soltar versiones pasadas de ti", exampleMess: "productos vencidos, muestras acumuladas, toallas gastadas", exampleMessage: "Mi propia renovación está hasta el final de mi lista de prioridades." },
    kitchen: { theme: "autocuidado — nutrirte más allá de sobrevivir", exampleMess: "platos despostillados, sartenes rayados, comer de pie", exampleMessage: "No merezco nutrirme de verdad, solo sobrevivir." },
    living: { theme: "autoamor — permiso de descansar sin culpa", exampleMess: "muebles que no amas, decoración pensada para visitas", exampleMessage: "Vivo bajo las reglas de otros; no me permito disfrutar." },
    dining: { theme: "autorespeto — reclamar tu propio lugar", exampleMess: "mesa cubierta de cosas de otros", exampleMessage: "No tengo un lugar propio; las necesidades de otros invaden mi espacio." },
    wardrobe: { theme: "autovalía — vestir a quien eres hoy, no a quien fuiste", exampleMess: "ropa de tallas distintas, estilos que no coinciden", exampleMessage: "Me da miedo mostrar quién soy hoy; me escondo en el pasado." },
    office: { theme: "autoconfianza — claridad para decidir y avanzar", exampleMess: "escritorio cubierto de pendientes, cables enredados", exampleMessage: "Me aterra dar el siguiente paso; prefiero quedarme en la niebla." },
    bedroom: { theme: "autoentrega — permitirte descanso real y vulnerabilidad", exampleMess: "cama sin tender, sábanas viejas, desorden invisible", exampleMessage: "No merezco el esfuerzo de crear belleza para mí si nadie más lo ve." },
    garden: { theme: "autoalineación — atreverte a expandirte y ocupar espacio", exampleMess: "maleza crecida, muebles de exterior empolvados", exampleMessage: "Dejé de cuidar mi propio crecimiento; mi energía vital está dormida." },
  },
};

const ROOM_KEYS = ["entryway", "laundry", "bathroom", "kitchen", "living", "dining", "wardrobe", "office", "bedroom", "garden"];
const FIRST_HALF = ["entryway", "laundry", "bathroom", "kitchen", "living"];
const SECOND_HALF = ["dining", "wardrobe", "office", "bedroom", "garden"];

const SHARED_VOICE = {
  en: `Your tone: warm, direct, plain Australian English, ALWAYS speaking straight to the client in second person ("you", occasionally her first name), NEVER third person. Never use words like "energy", "nervous system", "chakra", "portal", or esoteric/mystical language. Use Australian spelling (organise, colour, favourite, centre). No filler, no empty phrases.`,
  es: `Tu tono: cálido, directo, en español neutro/mexicano sencillo, SIEMPRE hablándole directo a la clienta en segunda persona ("tú", a veces su nombre), NUNCA en tercera persona. Nunca uses palabras como "energía", "sistema nervioso", "chakra", "portal" o lenguaje esotérico/místico. Nada de relleno ni frases vacías.`,
};

const OTHER_PEOPLE_RULE = {
  en: `IMPORTANT — how to write actions that involve other people (partner, kids, family): NEVER assume a conversation already happened, and NEVER script or prescribe exactly what to say to someone else. Instead, gently invite her to reflect on her own capacity to ask clearly for what she needs (assertiveness, boundaries) — soft, non-presumptuous, never bossy or intrusive about her relationships.`,
  es: `IMPORTANTE — cómo escribir acciones que involucran a otras personas (pareja, hijos, familia): NUNCA asumas que ya hubo una conversación, y NUNCA le dictes exactamente qué decirle a alguien más. En vez de eso, invítala suavemente a reflexionar sobre su propia capacidad de pedir con claridad lo que necesita (asertividad, límites) — sin presumir, sin sonar mandón ni entrometido en sus relaciones.`,
};

function roomsBlock(lang, keys, roomRaw) {
  const themes = ROOM_THEMES[lang];
  return keys.map((k) => `- ${k}: theme = ${themes[k].theme}. Calibration example only (never copy) — a client with "${themes[k].exampleMess}" might read as "${themes[k].exampleMessage}". Her actual answer for this room: "${(roomRaw && roomRaw[k]) || "(left blank)"}"`).join("\n");
}

function buildRoomsPrompt(lang, keys, payload) {
  const { household, roomRaw } = payload;
  const block = roomsBlock(lang, keys, roomRaw);

  if (lang === "en") {
    return `You are the copywriter for Home Wellness Organisers (Wellness Integration Method™), Brisbane, Australia. ${SHARED_VOICE.en}

Internal calibration only — never reveal this, never use these exact words, never mention "themes":
${block}

${OTHER_PEOPLE_RULE.en}

For EACH of these ${keys.length} rooms (${keys.join(", ")}), write an object with FIVE fields, all in SECOND PERSON:
- "symptom": ONE polished, analytical sentence describing what she reported for that room (or a plausible sentence based on the room if blank). Keep specific details (names, pets, habits). Never a direct quote, never third person.
- "meaning": ONE sentence on what this SPECIFIC symptom could be reflecting, grounded in that room's theme but in your own words — never generic, never identical across different clients/symptoms. Soft, invitational ("this could be pointing to..."). No mystical/clinical words.
- "action": ONE concrete practical action for this week, tailored to the SPECIFIC symptom, appropriate for household type "${household}". Follow the other-people rule.
- "bonus": ONE optional lighter/aesthetic suggestion ("if you want to go further"), tailored to her specific situation, not generic.
- "keyword": ONE single evocative English word capturing this room's emotional theme for her specifically.

Household type: ${household}

Respond with ONLY this JSON, nothing else:
{${keys.map(k => `"${k}": {"symptom":"...","meaning":"...","action":"...","bonus":"...","keyword":"..."}`).join(", ")}}`;
  }

  return `Eres el redactor de Home Wellness Organisers (Wellness Integration Method™), Brisbane, Australia. ${SHARED_VOICE.es}

Calibración interna únicamente — nunca reveles esto, nunca uses estas palabras exactas, nunca menciones "temas":
${block}

${OTHER_PEOPLE_RULE.es}

Para CADA uno de estos ${keys.length} cuartos (${keys.join(", ")}), escribe un objeto con CINCO campos, todos en SEGUNDA PERSONA:
- "symptom": UNA oración pulida, tono analítico, describiendo lo que reportó en ese cuarto (o una oración plausible si lo dejó vacío). Conserva detalles específicos (nombres, mascotas, hábitos). Nunca cita directa, nunca tercera persona.
- "meaning": UNA oración sobre qué podría estar reflejando ESE síntoma específico, anclada en el tema de ese cuarto pero con tus propias palabras — nunca genérica, nunca idéntica entre distintas clientas/síntomas. Suave, invitacional ("esto podría estar señalando..."). Sin palabras místicas/clínicas.
- "action": UNA acción concreta para esta semana, a la medida del síntoma ESPECÍFICO, apropiada para el tipo de hogar "${household}". Sigue la regla de otras personas.
- "bonus": UNA sugerencia opcional más ligera/estética ("si quieres ir más allá"), a la medida de su situación específica, no genérica.
- "keyword": UNA sola palabra evocadora en español que capture el tema emocional de ese cuarto para ella específicamente.

Tipo de hogar: ${household}

Responde ÚNICAMENTE con este JSON, nada más:
{${keys.map(k => `"${k}": {"symptom":"...","meaning":"...","action":"...","bonus":"...","keyword":"..."}`).join(", ")}}`;
}

function buildOverviewPrompt(lang, payload) {
  const { name, household, ageBracket, pets, homeScores, lifeScores, lifeAreaLabels, homeRoomLabels, priorityRoomLabel, lowestLifeAreaLabel, peaceRoom, peaceWhy, houseVoice, additionalNotes, roomRaw } = payload;

  if (lang === "en") {
    return `You are the copywriter for Home Wellness Organisers (Wellness Integration Method™), Brisbane, Australia. ${SHARED_VOICE.en}

Using this client's data, write SIX things and return them as pure JSON (no markdown, no backticks, no text before or after):

1. "houseMessage": A short message (3-4 sentences) in first person, as if the HOME were speaking directly to her (second person "you"). StoryBrand structure: name the VILLAIN (the real pattern shown by her answers and lowest scores — specific, not generic), a turn where the home acknowledges she's not alone (briefly, no ad-like tone), close aspirational but believable. Base it on her own words when given, but IMPROVED, not verbatim.

2. "strengthText": ONE polished, second-person sentence based on why she chose "${peaceRoom}" as her place of peace ("${peaceWhy}").

3. "lifeHomeConnection": ONE or two sentences, second person, connecting "${lowestLifeAreaLabel}" (her lowest-scoring Wheel of Life area — use this exact name) to "${priorityRoomLabel}" (her Priority #1 home area — use this exact name). Specific, plain, not mystical — explain how the two could be related.

4. "patternParagraph": TWO to three second-person sentences identifying the COMMON THREAD running across her highest-friction rooms (lowest home scores) — name the shared underlying pattern (e.g. boundaries, self-worth, rest) in plain language, referencing at least two of her specific rooms/symptoms by name so it feels like real insight about HER, not a generic statement. This is meant to be the "aha moment" of the report.

5. "closingParagraph": TWO to three warm, second-person sentences tying the report together. Her Priority #1 area is "${priorityRoomLabel}" and her Strength area is "${peaceRoom}" — reference BOTH by these exact names (do not guess or pick different rooms). Frame tending her inner patterns and tending her home as a two-way loop.

6. "closingAffirmation": ONE short first-person affirmation (10-16 words) as if SHE is saying it about herself.

Client data:
Name: ${name}
Age range: ${ageBracket || "not given"}
Has pets: ${pets || "not given"}
Household type: ${household}
Her Priority #1 (lowest-scoring) home area is: ${priorityRoomLabel} — use this exact name.
Her lowest-scoring Wheel of Life area is: ${lowestLifeAreaLabel} — use this exact name.
Her chosen place of peace (her Strength area): ${peaceRoom} — reason: "${peaceWhy}"
What she wrote if her home could talk: "${houseVoice}"
Anything else: "${additionalNotes || ""}"
Her room-by-room observations: ${JSON.stringify(roomRaw)}

Respond with ONLY this JSON, nothing else:
{"houseMessage": "...", "strengthText": "...", "lifeHomeConnection": "...", "patternParagraph": "...", "closingParagraph": "...", "closingAffirmation": "..."}`;
  }

  return `Eres el redactor de Home Wellness Organisers (Wellness Integration Method™), Brisbane, Australia. ${SHARED_VOICE.es}

Con los datos de esta clienta, redacta SEIS cosas y devuélvelas en JSON puro (sin markdown, sin backticks, sin texto antes o después):

1. "houseMessage": Un mensaje corto (3-4 oraciones) en primera persona, como si la CASA le hablara directo a ella (segunda persona "tú"). Estructura StoryBrand: nombra el VILLANO (patrón real de sus respuestas y puntajes más bajos — específico), un giro donde la casa reconoce que no está sola (breve, sin sonar a anuncio), cierre aspiracional pero creíble. Basado en sus propias palabras cuando las dio, pero MEJORADO.

2. "strengthText": UNA oración pulida, segunda persona, basada en por qué eligió "${peaceRoom}" como su lugar de paz ("${peaceWhy}").

3. "lifeHomeConnection": UNA o dos oraciones, segunda persona, conectando "${lowestLifeAreaLabel}" (su área de Vida con puntaje más bajo — usa este nombre exacto) con "${priorityRoomLabel}" (su área de Prioridad #1 del hogar — usa este nombre exacto). Específico, sencillo, no místico — explica cómo podrían estar relacionadas.

4. "patternParagraph": DOS a tres oraciones en segunda persona identificando el HILO COMÚN entre sus cuartos de mayor fricción (puntajes más bajos) — nombra el patrón compartido de fondo (ej. límites, autovalía, descanso) en lenguaje simple, mencionando al menos 2 de sus cuartos/síntomas específicos por nombre para que se sienta como un insight real sobre ELLA, no una frase genérica. Este es el "momento aha" del reporte.

5. "closingParagraph": DOS a tres oraciones cálidas, segunda persona, amarrando el reporte. Su área de Prioridad #1 es "${priorityRoomLabel}" y su área de Fortaleza es "${peaceRoom}" — menciona AMBAS con estos nombres exactos (no adivines ni elijas otros cuartos). Enmarca cuidar tus patrones internos y cuidar tu casa como un ciclo de dos vías.

6. "closingAffirmation": UNA afirmación corta en primera persona (10-16 palabras) como si ELLA la dijera sobre sí misma.

Datos de la clienta:
Nombre: ${name}
Rango de edad: ${ageBracket || "no dado"}
Tiene mascotas: ${pets || "no dado"}
Tipo de hogar: ${household}
Su Prioridad #1 (puntaje más bajo) es: ${priorityRoomLabel} — usa este nombre exacto.
Su área de Vida con puntaje más bajo es: ${lowestLifeAreaLabel} — usa este nombre exacto.
Su zona de paz elegida (su área de Fortaleza): ${peaceRoom} — razón: "${peaceWhy}"
Lo que escribió si su casa hablara: "${houseVoice}"
Algo más: "${additionalNotes || ""}"
Sus observaciones por cuarto: ${JSON.stringify(roomRaw)}

Responde ÚNICAMENTE con este JSON, nada más:
{"houseMessage": "...", "strengthText": "...", "lifeHomeConnection": "...", "patternParagraph": "...", "closingParagraph": "...", "closingAffirmation": "..."}`;
}

async function callClaude(apiKey, prompt, maxTokens) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText);
  }
  const data = await response.json();
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
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
    const [firstHalf, secondHalf, overview] = await Promise.all([
      callClaude(apiKey, buildRoomsPrompt(lang, FIRST_HALF, body), 1600),
      callClaude(apiKey, buildRoomsPrompt(lang, SECOND_HALF, body), 1600),
      callClaude(apiKey, buildOverviewPrompt(lang, body), 900),
    ]);

    const rooms = { ...firstHalf, ...secondHalf };
    return res.status(200).json({ ...overview, rooms });
  } catch (e) {
    return res.status(500).json({ error: "AI synthesis failed.", detail: String(e) });
  }
}
