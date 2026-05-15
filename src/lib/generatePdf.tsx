import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Font,
} from "@react-pdf/renderer";

Font.register({
  family: "Helvetica",
  fonts: [],
});

const ACCENT = "#1F4D4A";
const INK = "#14110E";
const INK_SOFT = "#5C5550";
const PAPER_DEEP = "#ECE6D9";
const HIGHLIGHT = "#FFF6E0";
const BLACK = "#000000";
const WHITE = "#FFFFFF";

const base = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    color: INK,
    padding: "40 48",
    lineHeight: 1.55,
  },
  header: {
    marginBottom: 24,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#D9D3C9",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  brand: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: INK,
  },
  brandDot: {
    color: ACCENT,
  },
  badge: {
    fontSize: 9,
    backgroundColor: ACCENT,
    color: WHITE,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    fontFamily: "Helvetica-Bold",
  },
  sectionLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: INK,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  cols: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  col: {
    flex: 1,
    padding: 14,
    borderRadius: 2,
  },
  colOriginal: {
    backgroundColor: PAPER_DEEP,
  },
  colAdapted: {
    backgroundColor: HIGHLIGHT,
    borderLeftWidth: 3,
    borderLeftColor: ACCENT,
  },
  colAdaptedContrast: {
    backgroundColor: WHITE,
    borderWidth: 2,
    borderColor: BLACK,
  },
  bodyText: {
    fontSize: 11,
    lineHeight: 1.6,
    color: INK,
  },
  bodyTextContrast: {
    fontSize: 11,
    lineHeight: 1.6,
    color: BLACK,
    fontFamily: "Helvetica-Bold",
  },
  bodyTextDyslexia: {
    fontSize: 12,
    lineHeight: 2.0,
    color: INK,
    letterSpacing: 0.5,
  },
  meta: {
    flexDirection: "row",
    gap: 20,
    backgroundColor: PAPER_DEEP,
    padding: "10 14",
    borderRadius: 2,
    marginBottom: 20,
  },
  metaItem: {
    fontSize: 10,
    color: INK_SOFT,
  },
  metaValue: {
    fontFamily: "Helvetica-Bold",
    color: INK,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: "#D9D3C9",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: INK_SOFT,
  },
});

interface PdfProps {
  sourceText: string;
  adaptedText: string;
  type: string;
  level: string;
  srcWords: number;
  adaptedWords: number;
  srcSentences: number;
  adaptedSentences: number;
}

function badgeLabel(type: string, level: string) {
  if (type === "selko") return "Selkokieli · Perustaso";
  if (type === "dyslexia") return `${level} · Lukivaikeustypografia`;
  if (type === "contrast") return `${level} · Korkea kontrasti`;
  return `${level} · S2-mukautus`;
}

function AdaptedTextDocument({
  sourceText,
  adaptedText,
  type,
  level,
  srcWords,
  adaptedWords,
  srcSentences,
  adaptedSentences,
}: PdfProps) {
  const isContrast = type === "contrast";
  const isDyslexia = type === "dyslexia";
  const adaptedColStyle = isContrast ? base.colAdaptedContrast : base.colAdapted;
  const adaptedTextStyle = isContrast
    ? base.bodyTextContrast
    : isDyslexia
    ? base.bodyTextDyslexia
    : base.bodyText;

  const levelLabel = type === "selko" ? "Selkokieli" : level;
  const date = new Date().toLocaleDateString("fi-FI");

  return (
    <Document title={`Mukauta – ${badgeLabel(type, level)}`} author="Mukauta / WP Saavutettavuus">
      <Page size="A4" style={base.page}>
        {/* Header */}
        <View style={base.header}>
          <Text style={base.brand}>Mukauta.</Text>
          <Text style={base.badge}>{badgeLabel(type, level)}</Text>
        </View>

        {/* Stats */}
        <View style={base.meta}>
          <Text style={base.metaItem}>
            Sanoja: <Text style={base.metaValue}>{srcWords} → {adaptedWords}</Text>
          </Text>
          <Text style={base.metaItem}>
            Virkkeitä: <Text style={base.metaValue}>{srcSentences} → {adaptedSentences}</Text>
          </Text>
          <Text style={base.metaItem}>
            Taitotaso: <Text style={base.metaValue}>{levelLabel}</Text>
          </Text>
        </View>

        {/* Columns */}
        <View style={base.cols}>
          <View style={[base.col, base.colOriginal]}>
            <Text style={base.sectionLabel}>Alkuperäinen</Text>
            <Text style={base.bodyText}>{sourceText}</Text>
          </View>
          <View style={[base.col, adaptedColStyle]}>
            <Text style={base.sectionLabel}>Mukautettu · {levelLabel}</Text>
            <Text style={adaptedTextStyle}>{adaptedText}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={base.footer} fixed>
          <Text style={base.footerText}>Mukauta · wpsaavutettavuus.fi</Text>
          <Text style={base.footerText}>{date}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function downloadPdf(props: PdfProps) {
  const blob = await pdf(<AdaptedTextDocument {...props} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mukauta-${props.type === "selko" ? "selko" : props.level}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
