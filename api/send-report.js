// This code runs on Vercel's servers. Sends the finished report by email
// using Resend (https://resend.com). Requires RESEND_API_KEY and NOTIFY_EMAIL
// as environment variables in Vercel.

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

const TIPS = {
  es: {
    entryway: ["Una zapatera o canasta justo en la entrada evita que los zapatos se dispersen.", "Un perchero bajo para abrigos y mochilas, a la altura de quien más lo use.", "Revisa la canasta de zapatos una vez a la semana y regresa a su lugar lo que no vive ahí."],
    laundry: ["Dos cestas desde el inicio (oscuros y claros) ahorra un paso después.", "Cuelga la ropa limpia en un gancho o tendedero apenas sale de la secadora, para que no toque el piso ni se acumule.", "Un bote específico para calcetines sin par — revísalo una vez al mes."],
    bathroom: ["Ten un cesto de ropa sucia dentro del baño, para que no se acumule en otra parte de la casa.", "Revisa caducidades cada 3 meses y tira lo vencido sin culpa.", "Una canasta pequeña para toallas de repuesto evita el amontonamiento."],
    kitchen: ["Fregadero vacío antes de dormir cambia cómo se siente la mañana siguiente.", "Agrupa por zonas de uso (café, hornear, cocinar), no por tipo de objeto.", "Usa separadores dentro del cajón de cubiertos y utensilios, para que cada cosa tenga su espacio fijo."],
    living: ["Nada que no sea de la sala se queda ahí más de un día.", "Una canasta bonita para mantas resuelve el desorden visual sin perder comodidad.", "Menos cojines de los que crees necesitar facilita acomodar el sillón."],
    dining: ["Zona \u201csin correo ni papeles\u201d en la mesa; usa una bandeja en otro lugar.", "Guarda manteles y servilletas cerca del comedor — así se usan más.", "Un centro de mesa simple invita a usarla como comedor, no bodega."],
    wardrobe: ["Organiza por color o tipo — lo que te ayude a decidir más rápido.", "Revisa cada 6 meses lo que no usaste en la temporada.", "Asigna un cajón o una canasta para ropa de medio uso — revísala y vacíala máximo cada dos semanas."],
    office: ["Un organizador de cables bajo el escritorio cambia la sensación de orden.", "Termina el día con el escritorio despejado.", "Una bandeja de pendientes — todo lo demás con lugar fijo."],
    bedroom: ["Máximo 3 objetos visibles en buró y cómoda.", "Guarda ropa de otra temporada fuera del clóset principal.", "Elige ropa de cama que te guste ver — inversión pequeña, gran impacto."],
    garden: ["Agrupa plantas por necesidad de agua.", "Un gancho o repisa para herramientas evita que \u201cde paso\u201d lleguen a la cocina.", "Limpia hojas y macetas rotas una vez al mes."],
  },
  en: {
    entryway: ["A shoe rack or basket right at the entry stops shoes from scattering.", "A low hook for coats and bags, at the height of whoever uses it most.", "Check the shoe basket once a week and return anything that doesn't live there."],
    laundry: ["Two baskets from the start (darks/lights) saves a step later.", "Hang clean laundry up straight out of the dryer, so it never touches the floor or piles up.", "A dedicated spot for odd socks — check it once a month."],
    bathroom: ["Keep a laundry hamper inside the bathroom so it doesn't pile up elsewhere.", "Check expiry dates every 3 months and toss what's expired, no guilt.", "A small basket for spare hand towels stops the pile-up."],
    kitchen: ["An empty sink before bed changes how the next morning feels.", "Group by zone of use (coffee, baking, cooking), not by object type.", "Use drawer dividers for cutlery and utensils so everything has a fixed spot."],
    living: ["Nothing that isn't the living room's stays there more than a day.", "A nice basket for blankets solves the visual clutter without losing comfort.", "Fewer cushions than you think you need makes the couch easier to tidy."],
    dining: ["Keep the table a 'no mail, no paperwork' zone — use a tray elsewhere for that.", "Store tablecloths and napkins near the dining area — they'll get used more.", "A simple centrepiece invites you to use it as a dining table, not storage."],
    wardrobe: ["Organise by colour or type — whatever helps you decide faster.", "Every 6 months, check what you didn't wear that season.", "Assign a drawer or basket for in-between clothes — check and clear it every two weeks max."],
    office: ["A cable organiser under the desk changes how tidy it feels.", "End the day with a clear desk.", "A tray for pending items — everything else gets a fixed spot."],
    bedroom: ["Max 3 visible objects on the nightstand and dresser.", "Store off-season clothes outside the main wardrobe.", "Choose bedding you love looking at — small investment, big daily impact."],
    garden: ["Group plants by watering needs.", "A hook or shelf for outdoor tools stops them drifting into the kitchen 'just for now'.", "Clear leaves and broken pots once a month."],
  },
};

const ROOM_KEYS = ["entryway", "laundry", "bathroom", "kitchen", "living", "dining", "wardrobe", "office", "bedroom", "garden"];

function buildClientEmailHtml(lang, data) {
  const { name, houseMessage, strengthText, strengthRoom, priorityRoom, lifeHomeConnection, closingParagraph, closingAffirmation, homeWheel, lifeWheel, rooms } = data;
  const isEn = lang === "en";

  const labels = isEn
    ? { title: "Your Home Wellness Report", houseMsg: "The Message of Your Home", strength: "Your Strength", priority: "Priority #1", sees: "What we see", means: "What it means", week: "This week", further: "If you want to go further", closing: "With care, Sol · Home Wellness Organisers", lifeWheelH: "Your Wheel of Life", homeWheelH: "Your Home Wellness Wheel", tipsH: "Your Bonus Quick Guide — 3 tips per room" }
    : { title: "Tu Reporte de Bienestar en el Hogar", houseMsg: "El Mensaje de Tu Casa", strength: "Tu Fortaleza", priority: "Prioridad #1", sees: "Lo que vemos", means: "Lo que significa", week: "Esta semana", further: "Si quieres ir más allá", closing: "Con cariño, Sol · Home Wellness Organisers", lifeWheelH: "Tu Rueda de Vida", homeWheelH: "Tu Rueda del Hogar", tipsH: "Tu Guía Rápida de Bono — 3 tips por espacio" };

  const wheelListHtml = (items) => `<ul style="font-family:sans-serif; color:#333; padding-left:18px;">
    ${(items || []).map(i => `<li>${escapeHtml(i.label)}: <b>${i.score}/10</b></li>`).join("")}
  </ul>`;

  const roomsHtml = (rooms || []).map((r) => `
    <div style="border-left:4px solid #96BC78; padding:14px 18px; margin-bottom:16px; background:#fff;">
      <h3 style="margin:0 0 8px; color:#716D71; font-family:sans-serif;">${escapeHtml(r.label)}</h3>
      <p style="font-size:13px; font-weight:bold; color:#96BC78; margin:8px 0 2px; font-family:sans-serif;">${labels.sees.toUpperCase()}</p>
      <p style="margin:0 0 8px; font-family:sans-serif; color:#333;">${escapeHtml(r.symptom)}</p>
      <p style="font-size:13px; font-weight:bold; color:#96BC78; margin:8px 0 2px; font-family:sans-serif;">${labels.means.toUpperCase()}</p>
      <p style="margin:0 0 8px; font-family:sans-serif; color:#333;">${escapeHtml(r.meaning)}</p>
      <p style="font-size:13px; font-weight:bold; color:#96BC78; margin:8px 0 2px; font-family:sans-serif;">${labels.week.toUpperCase()}</p>
      <p style="margin:0 0 4px; font-family:sans-serif; color:#333;">${escapeHtml(r.action)}</p>
      ${r.bonus ? `<p style="margin:0 0 8px; font-family:sans-serif; color:#333; font-style:italic;"><b>${labels.further}:</b> ${escapeHtml(r.bonus)}</p>` : ""}
      <p style="font-family:sans-serif; color:#96BC78; font-style:italic; font-size:14px; margin:8px 0 0;">${escapeHtml(r.selfLine)}</p>
    </div>`).join("");

  const tipsHtml = ROOM_KEYS.map((k) => {
    const room = (rooms || []).find((r) => r.key === k);
    const label = room ? room.label : k;
    return `<div style="margin-bottom:14px;"><h4 style="margin:0 0 4px; font-family:sans-serif; color:#716D71;">${escapeHtml(label)}</h4>
      <ul style="font-family:sans-serif; color:#333; padding-left:18px; margin:0;">
        ${(TIPS[lang][k] || []).map((t) => `<li style="margin-bottom:3px;">${escapeHtml(t)}</li>`).join("")}
      </ul></div>`;
  }).join("");

  return `
  <div style="max-width:600px; margin:0 auto; font-family:sans-serif;">
    <h1 style="color:#716D71;">${labels.title}</h1>
    <p style="color:#716D71;">${isEn ? "Hi" : "Hola"} ${escapeHtml(name)},</p>

    <h2 style="color:#716D71; font-size:18px; border-bottom:2px solid #96BC78; padding-bottom:6px;">${labels.houseMsg}</h2>
    <p style="font-style:italic; border-left:3px solid #96BC78; padding-left:12px; color:#333;">"${escapeHtml(houseMessage)}"</p>

    ${lifeHomeConnection ? `<p style="background:#F6EAD1; padding:12px 16px; border-radius:4px; color:#333;">${escapeHtml(lifeHomeConnection)}</p>` : ""}

    <h2 style="color:#4DB3BC; font-size:16px; margin-top:20px;">${labels.lifeWheelH}</h2>
    ${wheelListHtml(lifeWheel)}

    <h2 style="color:#96BC78; font-size:16px;">${labels.homeWheelH}</h2>
    ${wheelListHtml(homeWheel)}

    <h2 style="color:#96BC78; font-size:16px; margin-top:24px;">${labels.strength} — ${escapeHtml(strengthRoom)}</h2>
    <p style="color:#333;">${escapeHtml(strengthText)}</p>

    <h2 style="color:#96BC78; font-size:16px;">${labels.priority}: ${escapeHtml(priorityRoom)}</h2>

    <h2 style="color:#716D71; font-size:18px; margin-top:24px;">${isEn ? "Your Home, Room by Room" : "Tu Casa, Espacio por Espacio"}</h2>
    ${roomsHtml}

    ${closingParagraph ? `<p style="color:#333;">${escapeHtml(closingParagraph)}</p>` : ""}
    ${closingAffirmation ? `<p style="font-style:italic; text-align:center; color:#96BC78; font-size:16px; margin:16px 0;">"${escapeHtml(closingAffirmation)}"</p>` : ""}

    <h2 style="color:#716D71; font-size:18px; margin-top:28px; border-top:2px solid #F6EAD1; padding-top:16px;">${labels.tipsH}</h2>
    ${tipsHtml}

    <p style="color:#999; font-style:italic; margin-top:24px;">${labels.closing}</p>
  </div>`;
}

function buildAdminEmailHtml(lang, data) {
  const { name, email, ageBracket, pets, household, peaceRoom, peaceWhy, houseVoice, additionalNotes, homeWheel, lifeWheel, roomRaw } = data;
  const isEn = lang === "en";

  const rows = (items) => `<ul style="font-family:sans-serif; color:#333; padding-left:18px;">
    ${(items || []).map(i => `<li>${escapeHtml(i.label)}: <b>${i.score}/10</b></li>`).join("")}
  </ul>`;

  const rawHtml = ROOM_KEYS.map((k) => `<p style="font-family:sans-serif; margin:4px 0;"><b>${escapeHtml(k)}:</b> ${escapeHtml((roomRaw && roomRaw[k]) || "—")}</p>`).join("");

  return `
  <div style="max-width:600px; margin:0 auto; font-family:sans-serif;">
    <h1 style="color:#716D71;">${isEn ? "Raw submission — " : "Respuestas crudas — "}${escapeHtml(name)}</h1>
    <p style="color:#333;"><b>Email:</b> ${escapeHtml(email)}</p>
    <p style="color:#333;"><b>${isEn ? "Age" : "Edad"}:</b> ${escapeHtml(ageBracket)} | <b>${isEn ? "Pets" : "Mascotas"}:</b> ${escapeHtml(pets)} | <b>${isEn ? "Household" : "Hogar"}:</b> ${escapeHtml(household)}</p>

    <h2 style="color:#96BC78; font-size:16px; margin-top:16px;">${isEn ? "Wheel of Life" : "Rueda de Vida"}</h2>
    ${rows(lifeWheel)}
    <h2 style="color:#96BC78; font-size:16px;">${isEn ? "Home Wellness Wheel" : "Rueda del Hogar"}</h2>
    ${rows(homeWheel)}

    <h2 style="color:#96BC78; font-size:16px; margin-top:16px;">${isEn ? "Room-by-room raw answers" : "Respuestas crudas por cuarto"}</h2>
    ${rawHtml}

    <h2 style="color:#96BC78; font-size:16px; margin-top:16px;">${isEn ? "Deep Roots (Phase 4)" : "Raíces Profundas (Fase 4)"}</h2>
    <p style="font-family:sans-serif; color:#333;"><b>${isEn ? "Place of peace" : "Zona de paz"}:</b> ${escapeHtml(peaceRoom)} — ${escapeHtml(peaceWhy)}</p>
    <p style="font-family:sans-serif; color:#333;"><b>${isEn ? "If her home could talk" : "Si su casa le hablara"}:</b> ${escapeHtml(houseVoice)}</p>
    <p style="font-family:sans-serif; color:#333;"><b>${isEn ? "Anything else" : "Algo más"}:</b> ${escapeHtml(additionalNotes)}</p>
  </div>`;
}

async function sendViaResend(apiKey, from, to, subject, html) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText);
  }
  return response;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests are accepted." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;
  if (!apiKey) {
    return res.status(500).json({ error: "RESEND_API_KEY is not configured in Vercel." });
  }

  const body = req.body || {};
  const lang = body.lang === "en" ? "en" : "es";
  const { email } = body;

  if (!email) {
    return res.status(400).json({ error: "No client email provided." });
  }

  const from = "Home Wellness Organisers <onboarding@resend.dev>";
  const clientSubject = lang === "en" ? "Your Home Wellness Report" : "Tu Reporte de Bienestar en el Hogar";
  const adminSubject = `${lang === "en" ? "New submission" : "Nueva respuesta"}: ${body.name || "?"}`;

  try {
    await sendViaResend(apiKey, from, [email], clientSubject, buildClientEmailHtml(lang, body));

    if (notifyEmail) {
      try {
        await sendViaResend(apiKey, from, [notifyEmail], adminSubject, buildAdminEmailHtml(lang, body));
      } catch (e) {
        console.error("Admin email failed (client email still sent):", e);
      }
    }

    return res.status(200).json({ sent: true });
  } catch (e) {
    return res.status(500).json({ error: "Email send failed.", detail: String(e) });
  }
}
