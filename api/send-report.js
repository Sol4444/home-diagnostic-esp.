// This code runs on Vercel's servers. Sends the finished report by email
// using Resend (https://resend.com). Requires RESEND_API_KEY and NOTIFY_EMAIL
// as environment variables in Vercel.

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function buildEmailHtml(lang, data) {
  const { name, houseMessage, strengthText, strengthRoom, priorityRoom, lifeHomeConnection, homeWheel, lifeWheel, rooms } = data;
  const isEn = lang === "en";

  const labels = isEn
    ? { title: "Your Home Wellness Report", houseMsg: "The Message of Your Home", strength: "Your Strength", priority: "Priority #1", sees: "What we see", means: "What it means", week: "This week", further: "If you want to go further", closing: "With care, Sol · Home Wellness Organisers", lifeWheelH: "Your Wheel of Life", homeWheelH: "Your Home Wellness Wheel" }
    : { title: "Tu Reporte de Bienestar en el Hogar", houseMsg: "El Mensaje de Tu Casa", strength: "Tu Fortaleza", priority: "Prioridad #1", sees: "Lo que vemos", means: "Lo que significa", week: "Esta semana", further: "Si quieres ir más allá", closing: "Con cariño, Sol · Home Wellness Organisers", lifeWheelH: "Tu Rueda de Vida", homeWheelH: "Tu Rueda del Hogar" };

  const wheelListHtml = (items) => `<ul style="font-family:sans-serif; color:#333; padding-left:18px;">
    ${(items || []).map(i => `<li>${escapeHtml(i.label)}: <b>${i.score}/5</b></li>`).join("")}
  </ul>`;

  const roomsHtml = rooms.map((r) => `
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

    <h2 style="color:#7C9BD6; font-size:16px;">${labels.priority}: ${escapeHtml(priorityRoom)}</h2>

    <h2 style="color:#716D71; font-size:18px; margin-top:24px;">${isEn ? "Your Home, Room by Room" : "Tu Casa, Espacio por Espacio"}</h2>
    ${roomsHtml}

    <p style="color:#999; font-style:italic; margin-top:24px;">${labels.closing}</p>
  </div>`;
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
  const { name, email } = body;

  if (!email) {
    return res.status(400).json({ error: "No client email provided." });
  }

  const html = buildEmailHtml(lang, body);
  const subject = lang === "en" ? "Your Home Wellness Report" : "Tu Reporte de Bienestar en el Hogar";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "Home Wellness Organisers <onboarding@resend.dev>",
        to: [email],
        bcc: notifyEmail ? [notifyEmail] : undefined,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: "Error sending email via Resend.", detail: errText });
    }

    return res.status(200).json({ sent: true });
  } catch (e) {
    return res.status(500).json({ error: "Email send failed.", detail: String(e) });
  }
}
