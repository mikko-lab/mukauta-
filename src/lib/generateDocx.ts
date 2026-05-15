import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  AlignmentType,
  convertInchesToTwip,
} from "docx";
import { saveAs } from "file-saver";

interface DocxProps {
  sourceText: string;
  adaptedText: string;
  type: string;
  level: string;
  srcWords: number;
  adaptedWords: number;
  srcSentences: number;
  adaptedSentences: number;
}

function levelLabel(type: string, level: string) {
  if (type === "selko") return "Selkokieli · Perustaso";
  if (type === "dyslexia") return `${level} · Lukivaikeustypografia`;
  if (type === "contrast") return `${level} · Korkea kontrasti`;
  return `${level} · S2-mukautus`;
}

export async function downloadDocx(props: DocxProps) {
  const { sourceText, adaptedText, type, level, srcWords, adaptedWords, srcSentences, adaptedSentences } = props;

  const isDyslexia = type === "dyslexia";
  const isContrast = type === "contrast";

  const adaptedRuns = adaptedText.split("\n").flatMap((line, i, arr) => {
    const run = new TextRun({
      text: line,
      font: isDyslexia ? "Arial" : "Calibri",
      size: isDyslexia ? 28 : 24,
      bold: isContrast,
      characterSpacing: isDyslexia ? 20 : 0,
    });
    return i < arr.length - 1 ? [run, new TextRun({ break: 1 })] : [run];
  });

  const doc = new Document({
    creator: "Mukauta / WP Saavutettavuus",
    title: `Mukauta – ${levelLabel(type, level)}`,
    description: "Mukautettu opetusteksti",
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            text: `Mukauta. — ${levelLabel(type, level)}`,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          }),

          // Stats row
          new Paragraph({
            children: [
              new TextRun({ text: `Sanoja: ${srcWords} → ${adaptedWords}   `, bold: false, size: 20, color: "5C5550" }),
              new TextRun({ text: `Virkkeitä: ${srcSentences} → ${adaptedSentences}   `, bold: false, size: 20, color: "5C5550" }),
              new TextRun({ text: `Taitotaso: ${type === "selko" ? "Selkokieli" : level}`, bold: false, size: 20, color: "5C5550" }),
            ],
            spacing: { after: 300 },
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "D9D3C9" },
            },
          }),

          // Comparison table
          new Table({
            width: { size: 9026, type: WidthType.DXA },
            columnWidths: [4513, 4513],
            rows: [
              // Header row
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 4513, type: WidthType.DXA },
                    shading: { type: ShadingType.SOLID, fill: "ECE6D9" },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: "ALKUPERÄINEN", bold: true, size: 16, color: "5C5550" })],
                        spacing: { before: 80, after: 80 },
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 4513, type: WidthType.DXA },
                    shading: {
                      type: ShadingType.SOLID,
                      fill: isContrast ? "FFFFFF" : "FFF6E0",
                    },
                    borders: {
                      left: { style: BorderStyle.THICK, size: 12, color: "1F4D4A" },
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `MUKAUTETTU · ${type === "selko" ? "SELKOKIELI" : level.toUpperCase()}`,
                            bold: true,
                            size: 16,
                            color: "14110E",
                          }),
                        ],
                        spacing: { before: 80, after: 80 },
                      }),
                    ],
                  }),
                ],
              }),
              // Content row
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 4513, type: WidthType.DXA },
                    shading: { type: ShadingType.SOLID, fill: "F4F0E8" },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: sourceText, font: "Calibri", size: 24 }),
                        ],
                        spacing: { before: 120, after: 120, line: 360 },
                        alignment: AlignmentType.LEFT,
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 4513, type: WidthType.DXA },
                    shading: {
                      type: ShadingType.SOLID,
                      fill: isContrast ? "FFFFFF" : "FFF6E0",
                    },
                    borders: {
                      left: { style: BorderStyle.THICK, size: 12, color: "1F4D4A" },
                    },
                    children: [
                      new Paragraph({
                        children: adaptedRuns,
                        spacing: {
                          before: 120,
                          after: 120,
                          line: isDyslexia ? 480 : 360,
                        },
                        alignment: AlignmentType.LEFT,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Footer note
          new Paragraph({
            children: [
              new TextRun({
                text: `Luotu: ${new Date().toLocaleDateString("fi-FI")} · Mukauta · wpsaavutettavuus.fi`,
                size: 16,
                color: "8C857F",
              }),
            ],
            spacing: { before: 400 },
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, `mukauta-${type === "selko" ? "selko" : level}.docx`);
}
