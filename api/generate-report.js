// This code runs on Vercel's servers, NEVER in the client's browser.
// Your API key stays secret here — it's read from an environment variable.
//
// ROOM_THEMES below is internal calibration only — drawn from the Mirror
// Methodology's Alignment Matrix and Diagnosis Matrix (Mess -> Message ->
// Master Insight per room). It is NEVER shown to the client, and the model
// is explicitly told not to copy it or use chakra/portal language — it's
// only there so the tone and "translation logic" (symptom -> psychological
// read) stays consistent and grounded, instead of generic or repetitive.

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

function buildPrompt(lang, payload) {
  const { name, household, ageBracket, pets, homeScores, lifeScores, peaceRoom, peaceWhy, houseVoice, additionalNotes, roomRaw } = payload;
  const themes = ROOM_THEMES[lang];
  const themesBlock = ROOM_KEYS.map((k) => `- ${k}: theme = ${themes[k].theme}. Calibration example only (do NOT copy or reuse the wording) — a client with "${themes[k].exampleMess}" might read as "${themes[k].exampleMessage}"`).join("\n");

  if (lang === "en") {
    return `You are the copywriter for Home Wellness Organisers, a holistic home-organising brand (Wellness Integration Method™) based in Brisbane, Australia. Your tone: warm, direct, plain Australian English, ALWAYS speaking straight to the client in second person ("you", occasionally her first name "${name}") — NEVER third person ("she", "${name} does..."). Never use words like "energy", "nervous system", "chakra", "portal", or esoteric/mystical language. Use Australian spelling (organise, colour, favourite, centre). No filler, no empty phrases.

Internal calibration only — never reveal this to the client, never use these exact words, never mention "themes" or this list at all. It exists purely so your "meaning" writing for each room stays thematically grounded instead of generic:
${themesBlock}

IMPORTANT — how to write actions that involve other people (partner, kids, family): NEVER assume a conversation already happened, and NEVER script or prescribe exactly what to say to someone else. Instead, gently invite her to reflect on her own capacity to ask clearly for what she needs (assertiveness, boundaries) — soft, non-presumptuous, never bossy or intrusive about her relationships.

Using this client's data, write SIX things and return them as pure JSON (no markdown, no backticks, no text before or after):

1. "houseMessage": A short message (3-4 sentences) in first person, as if the HOME were speaking directly to her (second person "you"). Use the StoryBrand structure: name the VILLAIN (the real pattern/problem shown by her answers and lowest scores — be specific, not generic), then a turn where the home acknowledges she's not alone (briefly mention there's guidance/support available, without sounding like an ad), and close on an aspirational but believable note, not corny. Base it on her own words when she gave them, but IMPROVED — don't repeat them verbatim or copy grammar mistakes.

2. "rooms": an object with one entry per room key (entryway, laundry, bathroom, kitchen, living, dining, wardrobe, office, bedroom, garden). Each entry is an object with FIVE fields, all written in SECOND PERSON (talking directly to her):
   - "symptom": ONE polished, analytical sentence describing what she reported for that room (or a plausible sentence based on the room and its friction score if she left it blank). Keep any specific concrete details she mentioned (names, pets, habits) — never frame it as a direct quote, never third person.
   - "meaning": ONE sentence explaining what this SPECIFIC symptom could be reflecting, grounded in that room's theme above but written in your own natural words — NOT generic, and NEVER identical to what you'd write for a different client with a different symptom in the same room. Use soft, invitational language ("this could be pointing to...", never "this means..."). No mystical or clinical words.
   - "action": ONE concrete, practical action for this week, tailored to the SPECIFIC symptom described (not a generic room tip), appropriate for her household type (${household}). Follow the "other people" rule above.
   - "bonus": ONE optional lighter/aesthetic suggestion ("if you want to go further"), also tailored to her SPECIFIC situation in that room — not a generic decorating tip unrelated to what she described.
   - "keyword": ONE single evocative word (English) that captures the emotional theme of this room for HER specifically (e.g. "Rhythm", "Belonging", "Renewal") — used later in a summary table.
   Vary meaning, action, and bonus meaningfully based on what she actually described — never reuse fixed phrasing across different people or different symptoms.

3. "strengthText": ONE polished, second-person sentence based on why she chose "${peaceRoom}" as her place of peace ("${peaceWhy}").

4. "lifeHomeConnection": ONE or two sentences, second person, connecting her LOWEST-scoring Wheel of Life area to the home pattern that best relates to it. Be specific, plain and grounded, not mystical. Frame as a possible connection worth noticing.

5. "closingParagraph": TWO to three warm, second-person sentences that tie the whole report together — referencing her Priority #1 area by name and her Strength area by name, framing the idea that tending to her inner patterns and tending to her home is a two-way loop (as she works on herself, the home responds; as she tends the home, it gives back to her). Plain language, no mystical words.

6. "closingAffirmation": ONE short first-person affirmation sentence (as if SHE is saying it about herself), 10-16 words, warm and grounded, no mystical language, that she could read as a closing note to herself.

Client data:
Name: ${name}
Age range: ${ageBracket || "not given"}
Has pets: ${pets || "not given"}
Household type: ${household}
Home Wellness Wheel scores (1-10, lower = more friction): ${JSON.stringify(homeScores)}
Wheel of Life scores (1-10): ${JSON.stringify(lifeScores)}
Her chosen place of peace: ${peaceRoom} — reason given: "${peaceWhy}"
What she wrote if her home could talk: "${houseVoice}"
Anything else she wanted to add: "${additionalNotes || ""}"
Her room-by-room observations, selected from checkboxes plus an optional free-text note (some may be blank): ${JSON.stringify(roomRaw)}

Respond with ONLY this JSON, nothing else:
{"houseMessage": "...", "strengthText": "...", "lifeHomeConnection": "...", "closingParagraph": "...", "closingAffirmation": "...", "rooms": {"entryway": {"symptom":"...","meaning":"...","action":"...","bonus":"...","keyword":"..."}, "laundry": {"symptom":"...","meaning":"...","action":"...","bonus":"...","keyword":"..."}, "bathroom": {"symptom":"...","meaning":"...","action":"...","bonus":"...","keyword":"..."}, "kitchen": {"symptom":"...","meaning":"...","action":"...","bonus":"...","keyword":"..."}, "living": {"symptom":"...","meaning":"...","action":"...","bonus":"...","keyword":"..."}, "dining": {"symptom":"...","meaning":"...","action":"...","bonus":"...","keyword":"..."}, "wardrobe": {"symptom":"...","meaning":"...","action":"...","bonus":"...","keyword":"..."}, "office": {"symptom":"...","meaning":"...","action":"...","bonus":"...","keyword":"..."}, "bedroom": {"symptom":"...","meaning":"...","action":"...","bonus":"...","keyword":"..."}, "garden": {"symptom":"...","meaning":"...","action":"...","bonus":"...","keyword":"..."}}}`;
  }

  return `Eres el redactor de Home Wellness Organisers, una marca de organización holística del hogar (Wellness Integration Method™). Tu tono: cálido, directo, en español neutro/mexicano sencillo, SIEMPRE hablándole directo a la clienta en segunda persona ("tú", a veces su nombre "${name}") — NUNCA en tercera persona ("ella hace...", "${name} carga..."). Nunca uses palabras como "energía", "sistema nervioso", "chakra", "portal" o lenguaje esotérico/místico. Nada de relleno ni frases vacías.

Calibración interna únicamente — nunca reveles esto a la clienta, nunca uses estas palabras exactas, nunca menciones "temas" ni esta lista. Existe solo para que tu redacción de "meaning" en cada cuarto se mantenga anclada temáticamente en vez de genérica:
${themesBlock}

IMPORTANTE — cómo escribir acciones que involucran a otras personas (pareja, hijos, familia): NUNCA asumas que ya hubo una conversación, y NUNCA le dictes exactamente qué decirle a alguien más. En vez de eso, invítala suavemente a reflexionar sobre su propia capacidad de pedir con claridad lo que necesita (asertividad, límites) — sin presumir, sin sonar mandón ni entrometido en sus relaciones.

Con los datos de esta clienta, redacta SEIS cosas y devuélvelas en JSON puro (sin markdown, sin backticks, sin texto antes o después):

1. "houseMessage": Un mensaje corto (3-4 oraciones) en primera persona, como si la CASA le hablara directo a ella (segunda persona "tú"). Usa la estructura StoryBrand: nombra el VILLANO (el patrón/problema real que describen sus respuestas y sus puntajes más bajos — sé específico, no genérico), luego un giro donde la casa reconoce que la clienta no está sola (menciona brevemente que hay una guía/apoyo disponible, sin sonar a anuncio), y cierra con una nota aspiracional pero creíble, no cursi. Basado en sus propias palabras cuando las dio, pero MEJORADO.

2. "rooms": un objeto con una entrada por cada clave de cuarto (entryway, laundry, bathroom, kitchen, living, dining, wardrobe, office, bedroom, garden). Cada entrada es un objeto con CINCO campos, todos en SEGUNDA PERSONA (hablándole directo a ella):
   - "symptom": UNA oración pulida, tono analítico, describiendo lo que reportó en ese cuarto (o una oración plausible basada en el cuarto y su fricción si lo dejó vacío). Conserva detalles específicos (nombres, mascotas, hábitos) — nunca cita directa, nunca tercera persona.
   - "meaning": UNA oración explicando qué podría estar reflejando ESE síntoma específico, anclada en el tema de ese cuarto de arriba pero con tus propias palabras naturales — NO genérica, y NUNCA idéntica a lo que escribirías para otra clienta con otro síntoma en el mismo cuarto. Lenguaje suave e invitacional ("esto podría estar señalando...", nunca "esto significa..."). Sin palabras místicas ni clínicas.
   - "action": UNA acción concreta y práctica para esta semana, hecha a la medida del síntoma ESPECÍFICO descrito (no un tip genérico de cuarto), apropiada para su tipo de hogar (${household}). Sigue la regla de "otras personas" de arriba.
   - "bonus": UNA sugerencia opcional más ligera/estética ("si quieres ir más allá"), también a la medida de SU situación específica en ese cuarto — no un tip decorativo genérico sin relación a lo que describió.
   - "keyword": UNA sola palabra evocadora (en español) que capture el tema emocional de ese cuarto para ELLA específicamente (ej. "Ritmo", "Pertenencia", "Renovación") — se usa después en una tabla resumen.
   Varía meaning, action y bonus de forma significativa según lo que realmente describió — nunca reuses frases fijas entre distintas personas o distintos síntomas.

3. "strengthText": UNA oración pulida, en segunda persona, basada en por qué eligió "${peaceRoom}" como su lugar de paz ("${peaceWhy}").

4. "lifeHomeConnection": UNA o dos oraciones, en segunda persona, conectando su área de Vida con el puntaje MÁS BAJO, con el patrón de su casa que más se relacione. Específico, lenguaje sencillo y aterrizado, no místico.

5. "closingParagraph": DOS a tres oraciones cálidas, en segunda persona, que amarren todo el reporte — mencionando por nombre su área de Prioridad #1 y su área de Fortaleza, enmarcando la idea de que trabajar en ti misma y cuidar tu casa es un ciclo de dos vías (cuando trabajas en ti, la casa responde; cuando cuidas la casa, ella te lo regresa). Lenguaje simple, sin palabras místicas.

6. "closingAffirmation": UNA afirmación corta en primera persona (como si ELLA la dijera sobre sí misma), de 10-16 palabras, cálida y aterrizada, sin lenguaje místico, que pueda leer como cierre para sí misma.

Datos de la clienta:
Nombre: ${name}
Rango de edad: ${ageBracket || "no dado"}
Tiene mascotas: ${pets || "no dado"}
Tipo de hogar: ${household}
Puntajes Rueda del Hogar (1-10, más bajo = más fricción): ${JSON.stringify(homeScores)}
Puntajes Rueda de Vida (1-10): ${JSON.stringify(lifeScores)}
Su zona de paz elegida: ${peaceRoom} — razón que dio: "${peaceWhy}"
Lo que ella escribió si su casa le hablara: "${houseVoice}"
Algo más que quiso agregar: "${additionalNotes || ""}"
Sus observaciones por cuarto, elegidas de opciones más una nota libre opcional (puede haber vacíos): ${JSON.stringify(roomRaw)}

Responde ÚNICAMENTE con este JSON, nada más:
{"houseMessage": "...", "strengthText": "...", "lifeHomeConnection": "...", "closingParagraph": "...", "closingAffirmation": "...", "rooms": {"entryway": {"symptom":"...","meaning":"...","action":"...","bonus":"...","keyword":"..."}, "laundry": {"symptom":"...","meaning":"...","action":"...","bonus":"...","keyword":"..."}, "bathroom": {"symptom":"...","meaning":"...","action":"...","bonus":"...","keyword":"..."}, "kitchen": {"symptom":"...","meaning":"...","action":"...","bonus":"...","keyword":"..."}, "living": {"symptom":"...","meaning":"...","action":"...","bonus":"...","keyword":"..."}, "dining": {"symptom":"...","meaning":"...","action":"...","bonus":"...","keyword":"..."}, "wardrobe": {"symptom":"...","meaning":"...","action":"...","bonus":"...","keyword":"..."}, "office": {"symptom":"...","meaning":"...","action":"...","bonus":"...","keyword":"..."}, "bedroom": {"symptom":"...","meaning":"...","action":"...","bonus":"...","keyword":"..."}, "garden": {"symptom":"...","meaning":"...","action":"...","bonus":"...","keyword":"..."}}}`;
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
        max_tokens: 3200,
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
