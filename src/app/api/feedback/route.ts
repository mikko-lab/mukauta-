import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const ROLES: Record<string, string> = {
  s2: "S2-opettaja",
  erityis: "Laaja-alainen erityisopettaja",
  luokka: "Luokanopettaja",
  muu: "Muu",
};

export async function POST(req: Request) {
  const { role, comment } = await req.json();

  if (!role) {
    return new Response("Rooli puuttuu", { status: 400 });
  }

  try {
    await resend.emails.send({
      from: "Mukauta Palaute <onboarding@resend.dev>",
      to: "mikkotark@protonmail.com",
      subject: `Mukauta-palaute: ${ROLES[role] ?? role}`,
      html: `
        <p><strong>Opettajatyyppi:</strong> ${ROLES[role] ?? role}</p>
        ${comment ? `<p><strong>Kommentti:</strong><br>${comment.replace(/\n/g, "<br>")}</p>` : ""}
        <hr>
        <p style="color:#888;font-size:12px">Lähetetty mukauta.vercel.app</p>
      `,
    });

    return new Response("ok", { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Tuntematon virhe";
    return new Response(message, { status: 500 });
  }
}
