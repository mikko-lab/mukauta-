import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mukauta — Opetustekstien mukauttaja S2- ja erityisopettajille",
  description:
    "Mukauta opetusteksti Opetushallituksen taitotasojen mukaan A1.1:stä C1.1:een, selkokielelle tai lukivaikeustypografialle.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..700,0..100,0..1;1,9..144,300..700,0..100,0..1&family=Atkinson+Hyperlegible:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
