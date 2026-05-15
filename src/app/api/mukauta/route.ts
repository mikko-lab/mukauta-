import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  "A1.1":
    "Kielen alkeiden hallinta. Käytä vain kaikkein yleisimpiä sanoja (alle 500 sanan perusvocabulary). Lyhyitä 3-5 sanan virkkeitä. Vain preesens. Ei sivulauseita.",
  "A1.2":
    "Kehittyvä alkeiskielitaito. Hyvin yleisiä sanoja. 4-6 sanan virkkeitä. Preesens ja imperfekti. Ei monimutkaisia rakenteita.",
  "A1.3":
    "Toimiva alkeiskielitaito. Arkinen sanasto. 5-7 sanan virkkeitä. Perusaikamuodot. Yksinkertaiset päälauseet.",
  "A2.1":
    "Peruskielitaidon alkuvaihe. Yleinen sanasto. 6-8 sanan virkkeitä. Muutama yhdistävä konjunktio (ja, mutta, koska).",
  "A2.2":
    "Kehittyvä peruskielitaito. Kohtalaisen yleinen sanasto. 7-10 sanan virkkeitä. Sivulauseet sallittu. Selkeä rakenne.",
  "B1.1":
    "Toimiva peruskielitaito. Laajempi sanasto. Vaihtelevat lauserakenteet. Teksti saa olla lähes alkuperäisen tasolla.",
  "B1.2":
    "Sujuva peruskielitaito. Monipuolinen sanasto. Vivahteikkaammat rakenteet. Selkeä, mutta rikas teksti.",
  "B2.1":
    "Itsenäisen kielitaidon perustaso. Laaja sanasto, abstraktit käsitteet sallittu. Monimutkaisemmat lauserakenteet.",
  "B2.2":
    "Toimiva itsenäinen kielitaito. Idiomaattinen kieli sallittu. Vivahteikkaat ilmaukset. Lähes natiivitasoinen.",
  "C1.1":
    "Taitavan kielitaidon perustaso. Täysi sanasto. Kompleksiset rakenteet. Tyylillinen vaihtelu sallittu.",
};

const SELKO_DESCRIPTION =
  "Selkokieli-perustaso. Hyvin lyhyet virkkeet (max 8 sanaa). Yksi asia per virke. Tutut arkiset sanat. Ei vaikeita sivulauseita. Aktiivimuoto aina kun mahdollista.";

function buildSystemPrompt(
  type: string,
  level: string,
  keepKeywords: boolean,
  addGlossary: boolean
): string {
  const levelDesc =
    type === "selko"
      ? SELKO_DESCRIPTION
      : LEVEL_DESCRIPTIONS[level] ?? LEVEL_DESCRIPTIONS["B1.1"];

  const typeLabel =
    type === "selko"
      ? "selkokielelle"
      : `OPH:n taitotasolle ${level} (S2-opetus)`;

  return `Olet kokenut S2-opettaja ja selkokielen asiantuntija Suomessa. Tehtäväsi on mukauttaa suomenkielinen teksti ${typeLabel}.

Taitotasokuvaus: ${levelDesc}

Säännöt:
- Säilytä tekstin asiasisältö ja pääviesti
- Mukauta rakenne ja sanasto täsmälleen taitotasoon sopivaksi
- Älä lisää uutta tietoa jota alkuperäisessä ei ole
- Kirjoita luonnollista suomea, ei robottikieltä
${keepKeywords ? "- Säilytä keskeiset avainkäsitteet (voit selittää ne lyhyesti)" : "- Korvaa vaikeat termit helpommilla synonyymeillä"}
${addGlossary ? "- Lisää loppuun 'Sanasto:'-osio, jossa selitetään 3-5 vaikeinta sanaa lyhyesti" : ""}

Palauta VAIN mukautettu teksti. Ei selityksiä, ei kommentteja, ei alkuperäistä tekstiä.`;
}

export async function POST(req: Request) {
  try {
    const { text, type, level, keepKeywords, addGlossary } = await req.json();

    if (!text?.trim()) {
      return new Response("Teksti puuttuu", { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(type, level, keepKeywords, addGlossary);

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Mukauta seuraava teksti:\n\n${text}`,
        },
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
        } catch (e) {
          controller.error(e);
        } finally {
          controller.close();
        }
      },
      cancel() {
        stream.controller.abort();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Tuntematon virhe";
    return new Response(message, { status: 500 });
  }
}
