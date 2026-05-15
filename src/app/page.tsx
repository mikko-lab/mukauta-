"use client";

import { useRef, useState } from "react";

const LEVELS = [
  { value: "A1.1", label: "A1.1 · Kielen alkeiden hallinta" },
  { value: "A1.2", label: "A1.2 · Kehittyvä alkeiskielitaito" },
  { value: "A1.3", label: "A1.3 · Toimiva alkeiskielitaito" },
  { value: "A2.1", label: "A2.1 · Peruskielitaidon alkuvaihe" },
  { value: "A2.2", label: "A2.2 · Kehittyvä peruskielitaito" },
  { value: "B1.1", label: "B1.1 · Toimiva peruskielitaito" },
  { value: "B1.2", label: "B1.2 · Sujuva peruskielitaito" },
  { value: "B2.1", label: "B2.1 · Itsenäisen kielitaidon perustaso" },
  { value: "B2.2", label: "B2.2 · Toimiva itsenäinen kielitaito" },
  { value: "C1.1", label: "C1.1 · Taitavan kielitaidon perustaso" },
];

const TYPES = [
  { value: "s2", label: "S2-mukautus (taitotason mukaan)" },
  { value: "selko", label: "Selkokieli" },
  { value: "dyslexia", label: "Lukivaikeustypografia" },
  { value: "contrast", label: "Korkea kontrasti" },
];

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function countSentences(text: string) {
  return text.trim() ? text.split(/[.!?]+/).filter((s) => s.trim()).length : 0;
}

export default function Home() {
  const [sourceText, setSourceText] = useState(
    "Suomen ilmasto on muuttunut viime vuosikymmeninä merkittävästi. Keskilämpötila on noussut, ja erityisesti talvet ovat lyhentyneet ja muuttuneet leudommiksi. Tämä vaikuttaa sekä luontoon että ihmisten elinkeinoihin, kuten maatalouteen ja matkailuun. Erityisesti pohjoisen alueilla muutos on ollut nopeaa."
  );
  const [type, setType] = useState("s2");
  const [level, setLevel] = useState("A2.2");
  const [keepKeywords, setKeepKeywords] = useState(true);
  const [addGlossary, setAddGlossary] = useState(false);
  const [adaptedText, setAdaptedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [error, setError] = useState("");
  const resultRef = useRef<HTMLElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function handleMukauta() {
    if (!sourceText.trim()) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");
    setAdaptedText("");

    try {
      const res = await fetch("/api/mukauta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sourceText, type, level, keepKeywords, addGlossary }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        if (value) setAdaptedText((prev) => prev + decoder.decode(value));
      }

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") {
        setError(e.message || "Jokin meni pieleen. Yritä uudelleen.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    if (abortRef.current) abortRef.current.abort();
    setSourceText("");
    setAdaptedText("");
    setError("");
  }

  function handleCopy() {
    navigator.clipboard.writeText(adaptedText);
  }

  async function handleDownloadPdf() {
    setPdfLoading(true);
    try {
      const { downloadPdf } = await import("@/lib/generatePdf");
      await downloadPdf({ sourceText, adaptedText, type, level, srcWords, adaptedWords, srcSentences, adaptedSentences });
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleDownloadDocx() {
    setDocxLoading(true);
    try {
      const { downloadDocx } = await import("@/lib/generateDocx");
      await downloadDocx({ sourceText, adaptedText, type, level, srcWords, adaptedWords, srcSentences, adaptedSentences });
    } finally {
      setDocxLoading(false);
    }
  }

  const srcWords = countWords(sourceText);
  const srcSentences = countSentences(sourceText);
  const adaptedWords = countWords(adaptedText);
  const adaptedSentences = countSentences(adaptedText);

  const badgeLabel =
    type === "selko"
      ? "Selkokieli · Perustaso"
      : type === "dyslexia"
      ? `${level} · Lukivaikeustypografia`
      : type === "contrast"
      ? `${level} · Korkea kontrasti`
      : `${level} · S2-mukautus`;

  const adaptedClassName =
    type === "dyslexia"
      ? "col-text dyslexia-text"
      : type === "contrast"
      ? "col-text high-contrast-text"
      : "col-text";

  return (
    <>
      <a
        href="#main"
        style={{
          position: "absolute",
          top: "-100px",
          left: 0,
          background: "var(--ink)",
          color: "var(--paper)",
          padding: "14px 24px",
          textDecoration: "none",
          fontWeight: 700,
          zIndex: 100,
        }}
        onFocus={(e) => (e.currentTarget.style.top = "0")}
        onBlur={(e) => (e.currentTarget.style.top = "-100px")}
      >
        Siirry pääsisältöön
      </a>

<div className="wrap">
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            paddingBottom: 28,
            borderBottom: "1px solid var(--border)",
            marginBottom: 64,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <a
            href="/"
            style={{
              fontFamily: "Fraunces, serif",
              fontWeight: 500,
              fontSize: 30,
              letterSpacing: "-0.025em",
              color: "var(--ink)",
              textDecoration: "none",
            }}
          >
            Mukauta<span style={{ color: "var(--accent)" }}>.</span>
          </a>
          <div style={{ fontSize: 13, color: "var(--ink-soft)", textAlign: "right" }}>
            Saavutettavan opetusmateriaalin AI-työkalu
            <br />
            <a
              href="https://wpsaavutettavuus.fi"
              style={{ color: "var(--ink)", textDecoration: "none", borderBottom: "1px solid var(--border)" }}
            >
              WP Saavutettavuus
            </a>
          </div>
        </header>

        <main id="main">
          <section style={{ marginBottom: 64, maxWidth: 760 }}>
            <span
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "var(--accent)",
                fontWeight: 700,
                marginBottom: 24,
                display: "inline-block",
                padding: "6px 12px",
                background: "var(--paper-deep)",
                borderRadius: 2,
              }}
            >
              S2 · Selkokieli · Saavutettavuus
            </span>
            <h1
              style={{
                fontFamily: "Fraunces, serif",
                fontWeight: 400,
                fontSize: "clamp(38px, 6.5vw, 64px)",
                lineHeight: 1.02,
                letterSpacing: "-0.025em",
                margin: "0 0 28px",
              }}
            >
              Sama teksti,
              <br />
              <em
                style={{
                  fontStyle: "italic",
                  color: "var(--accent)",
                  fontVariationSettings: '"SOFT" 100, "WONK" 1',
                }}
              >
                jokaisen
              </em>{" "}
              oppilaan tasolla.
            </h1>
            <p style={{ fontSize: 20, lineHeight: 1.5, color: "var(--ink-soft)", margin: 0, maxWidth: 620 }}>
              Mukauta opetusteksti OPH:n taitotasojen mukaan A1.1:stä C1.1:een, selkokielelle tai
              lukivaikeustypografialle — yhdellä klikkauksella.
            </p>
          </section>

          {/* Tool card */}
          <section aria-labelledby="tool-heading" className="tool-card">
            <h2
              id="tool-heading"
              style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}
            >
              Mukautustyökalu
            </h2>

            <div className="tool-grid">
              {/* Left: textarea */}
              <div>
                <label
                  htmlFor="source-text"
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: 10,
                  }}
                >
                  Lähdeteksti
                </label>
                <textarea
                  id="source-text"
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  rows={10}
                  maxLength={5000}
                  aria-describedby="source-help"
                  style={{
                    width: "100%",
                    fontFamily: "inherit",
                    fontSize: 16,
                    padding: "14px 16px",
                    background: "var(--paper)",
                    color: "var(--ink)",
                    border: "1px solid var(--border)",
                    borderRadius: 2,
                    lineHeight: 1.5,
                    resize: "vertical",
                    minHeight: 200,
                  }}
                />
                <p id="source-help" style={{ fontSize: 13, color: "var(--ink-soft)", margin: "6px 0 0" }}>
                  {srcWords} sanaa · {5000 - sourceText.length} merkkiä jäljellä
                </p>
              </div>

              {/* Right: settings */}
              <aside aria-label="Mukautusasetukset">
                <div style={{ marginBottom: 24 }}>
                  <label
                    htmlFor="type-select"
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      marginBottom: 10,
                    }}
                  >
                    Mukautustyyppi
                  </label>
                  <select
                    id="type-select"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    style={{
                      width: "100%",
                      fontFamily: "inherit",
                      fontSize: 16,
                      padding: "14px 16px",
                      background: "var(--paper)",
                      color: "var(--ink)",
                      border: "1px solid var(--border)",
                      borderRadius: 2,
                      appearance: "none",
                    }}
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: 24, opacity: type === "selko" ? 0.4 : 1 }}>
                  <label
                    htmlFor="level-select"
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      marginBottom: 4,
                    }}
                  >
                    Taitotaso
                  </label>
                  <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 8px" }}>
                    OPH:n 10-portainen asteikko
                  </p>
                  <select
                    id="level-select"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    disabled={type === "selko"}
                    style={{
                      width: "100%",
                      fontFamily: "inherit",
                      fontSize: 16,
                      padding: "14px 16px",
                      background: "var(--paper)",
                      color: "var(--ink)",
                      border: "1px solid var(--border)",
                      borderRadius: 2,
                      appearance: "none",
                    }}
                  >
                    {LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      marginBottom: 10,
                    }}
                  >
                    Lisävalinnat
                  </label>
                  <label
                    style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10, cursor: "pointer", fontSize: 15, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}
                  >
                    <input
                      type="checkbox"
                      checked={keepKeywords}
                      onChange={(e) => setKeepKeywords(e.target.checked)}
                      style={{ marginTop: 3, width: 18, height: 18, accentColor: "var(--accent)" }}
                    />
                    Säilytä avainkäsitteet
                  </label>
                  <label
                    style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10, cursor: "pointer", fontSize: 15, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}
                  >
                    <input
                      type="checkbox"
                      checked={addGlossary}
                      onChange={(e) => setAddGlossary(e.target.checked)}
                      style={{ marginTop: 3, width: 18, height: 18, accentColor: "var(--accent)" }}
                    />
                    Lisää sanasto loppuun
                  </label>
                </div>
              </aside>
            </div>

            {/* Actions */}
            <div
              style={{
                marginTop: 28,
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                paddingTop: 24,
                borderTop: "1px solid var(--border)",
              }}
            >
              <button
                onClick={handleMukauta}
                disabled={loading || !sourceText.trim()}
                style={{
                  fontFamily: "inherit",
                  fontSize: 16,
                  fontWeight: 700,
                  padding: "16px 32px",
                  border: "none",
                  borderRadius: 2,
                  cursor: loading || !sourceText.trim() ? "not-allowed" : "pointer",
                  background: "var(--accent)",
                  color: "var(--paper-soft)",
                  opacity: loading || !sourceText.trim() ? 0.6 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {loading ? "Mukautetaan…" : "Mukauta teksti →"}
              </button>
              <button
                onClick={handleClear}
                style={{
                  fontFamily: "inherit",
                  fontSize: 16,
                  fontWeight: 700,
                  padding: "16px 32px",
                  background: "transparent",
                  color: "var(--ink)",
                  border: "1px solid var(--ink)",
                  borderRadius: 2,
                  cursor: "pointer",
                }}
              >
                Tyhjennä
              </button>
            </div>

            {error && (
              <p style={{ marginTop: 16, color: "var(--warn)", fontWeight: 700 }} role="alert">
                ⚠ Virhe: {error}
              </p>
            )}
          </section>

          {/* Result */}
          {(adaptedText || loading) && (
            <section
              ref={resultRef}
              aria-labelledby="result-heading"
              style={{ marginTop: 56 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 24,
                  paddingBottom: 16,
                  borderBottom: "1px solid var(--border)",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <h2
                  id="result-heading"
                  style={{
                    fontFamily: "Fraunces, serif",
                    fontSize: 26,
                    fontWeight: 500,
                    letterSpacing: "-0.015em",
                    margin: 0,
                  }}
                >
                  Mukautettu teksti
                </h2>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    padding: "8px 14px",
                    background: "var(--accent)",
                    color: "var(--paper-soft)",
                    borderRadius: 999,
                    fontWeight: 700,
                  }}
                >
                  {badgeLabel}
                </span>
              </div>

              <div className="compare-grid">
                <div className="col-original" style={{ padding: 28, background: "var(--paper)", borderRight: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink)", marginBottom: 18, fontWeight: 700 }}>
                    Alkuperäinen
                  </div>
                  <p style={{ fontSize: 16, lineHeight: 1.7, margin: 0 }}>{sourceText}</p>
                </div>
                <div className="col-adapted" style={{ padding: 28, background: "var(--highlight)", borderLeft: "4px solid var(--accent)" }}>
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink)", marginBottom: 18, fontWeight: 700 }}>
                    Mukautettu · {type === "selko" ? "Selkokieli" : level}
                  </div>
                  <p
                    className={adaptedClassName}
                    style={{ fontSize: 16, lineHeight: 1.7, margin: 0, minHeight: 40 }}
                  >
                    {loading && !adaptedText ? (
                      <span style={{ color: "var(--ink-faint)" }}>Generoidaan…</span>
                    ) : (
                      adaptedText
                    )}
                  </p>
                </div>
              </div>

              {/* Stats */}
              {adaptedText && (
                <div
                  aria-label="Tekstin tilastot"
                  style={{
                    marginTop: 24,
                    display: "flex",
                    gap: 28,
                    flexWrap: "wrap",
                    fontSize: 14,
                    color: "var(--ink-soft)",
                    padding: "16px 20px",
                    background: "var(--paper-deep)",
                    borderRadius: 2,
                  }}
                >
                  <span>
                    <strong style={{ color: "var(--ink)" }}>Sanoja:</strong>{" "}
                    {srcWords} → {adaptedWords}
                  </span>
                  <span>
                    <strong style={{ color: "var(--ink)" }}>Virkkeitä:</strong>{" "}
                    {srcSentences} → {adaptedSentences}
                  </span>
                </div>
              )}

              {/* Output actions */}
              {adaptedText && (
                <div
                  role="toolbar"
                  aria-label="Tulosteen vientivaihtoehdot"
                  style={{ display: "flex", gap: 10, marginTop: 28, flexWrap: "wrap" }}
                >
                  <button
                    onClick={handleDownloadPdf}
                    disabled={pdfLoading}
                    style={{
                      padding: "11px 18px",
                      background: "var(--paper-soft)",
                      border: "1px solid var(--border)",
                      borderRadius: 999,
                      fontSize: 14,
                      cursor: pdfLoading ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                      color: "var(--ink)",
                      fontWeight: 700,
                      opacity: pdfLoading ? 0.6 : 1,
                    }}
                  >
                    {pdfLoading ? "Luodaan PDF…" : "↓ Lataa PDF"}
                  </button>
                  <button
                    onClick={handleDownloadDocx}
                    disabled={docxLoading}
                    style={{
                      padding: "11px 18px",
                      background: "var(--paper-soft)",
                      border: "1px solid var(--border)",
                      borderRadius: 999,
                      fontSize: 14,
                      cursor: docxLoading ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                      color: "var(--ink)",
                      fontWeight: 700,
                      opacity: docxLoading ? 0.6 : 1,
                    }}
                  >
                    {docxLoading ? "Luodaan…" : "↓ Word (.docx)"}
                  </button>
                  <button
                    onClick={handleCopy}
                    style={{
                      padding: "11px 18px",
                      background: "var(--paper-soft)",
                      border: "1px solid var(--border)",
                      borderRadius: 999,
                      fontSize: 14,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      color: "var(--ink)",
                      fontWeight: 700,
                    }}
                  >
                    Kopioi teksti
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Why this */}
          <section aria-labelledby="why-heading" className="why-card">
            <h2
              id="why-heading"
              style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 500, margin: "0 0 16px" }}
            >
              Miksi tämä työkalu?
            </h2>
            <p style={{ margin: "0 0 12px", color: "var(--ink-soft)", lineHeight: 1.6 }}>
              Microsoft Copilot Teach tekee yleisen "lukutason muokkauksen", mutta se ei tunne{" "}
              <strong style={{ color: "var(--ink)" }}>OPH:n 10-portaista taitotasoasteikkoa</strong> eikä erottele{" "}
              <strong style={{ color: "var(--ink)" }}>selkokielen kolmea tasoa</strong>.
            </p>
            <p style={{ margin: 0, color: "var(--ink-soft)", lineHeight: 1.6 }}>
              Mukauta on tehty yhdelle asialle:{" "}
              <strong style={{ color: "var(--ink)" }}>
                tarkka, mitattu mukautus suomalaisen S2- ja erityisopetuksen viitekehyksessä
              </strong>{" "}
              — plus saavutettava tuloste jota Copilot ei tee.
            </p>
          </section>
        </main>

        <footer
          style={{
            marginTop: 80,
            paddingTop: 24,
            borderTop: "1px solid var(--border)",
            fontSize: 13,
            color: "var(--ink-soft)",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>© 2026 WP Saavutettavuus · Y-tunnus 3404806-1</div>
          <div>
            <a
              href="https://wpsaavutettavuus.fi"
              style={{ color: "var(--ink)", textDecoration: "none", borderBottom: "1px solid var(--border)" }}
            >
              wpsaavutettavuus.fi
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}
