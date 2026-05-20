import { Resend } from "resend";
import { getRatelimit, getClientIp, isOriginAllowed, escapeHtml } from "@/lib/ratelimit";

const resend = new Resend(process.env.RESEND_API_KEY);

const ROLES: Record<string, string> = {
  s2: "S2-opettaja",
  erityis: "Laaja-alainen erityisopettaja",
  luokka: "Luokanopettaja",
  muu: "Muu",
};

export async function POST(req: Request) {
  if (!isOriginAllowed(req)) {
    return new Response("Forbidden", { status: 403 });
  }

  const rl = getRatelimit();
  if (rl) {
    const { success } = await rl.limit(`feedback:${getClientIp(req)}`);
    if (!success) return new Response("Liian monta pyyntöä", { status: 429 });
  }

  const { role, comment } = await req.json();

  if (!role || !ROLES[role]) {
    return new Response("Virheellinen rooli", { status: 400 });
  }

  if (comment && comment.length > 2000) {
    return new Response("Kommentti liian pitkä", { status: 400 });
  }

  const safeRole = escapeHtml(ROLES[role]);
  const safeComment = comment ? escapeHtml(String(comment)).replace(/\n/g, "<br>") : null;

  try {
    const result = await resend.emails.send({
      from: "Mukauta Palaute <palaute@luukkuai.win>",
      to: "mikko@wpsaavutettavuus.fi",
      subject: `Mukauta-palaute: ${ROLES[role]}`,
      html: `
        <p><strong>Opettajatyyppi:</strong> ${safeRole}</p>
        ${safeComment ? `<p><strong>Kommentti:</strong><br>${safeComment}</p>` : ""}
        <hr>
        <p style="color:#888;font-size:12px">Lähetetty mukauta.vercel.app</p>
      `,
    });

    if (result.error) {
      return new Response(JSON.stringify(result.error), { status: 500 });
    }
    return new Response("ok", { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Tuntematon virhe";
    return new Response(message, { status: 500 });
  }
}
