# mukauta

Suomenkielisten tekstien mukautustyökalu — S2-opettajille, selkokielen tekijöille ja saavutettavuuden ammattilaisille.

## Mitä se tekee?

Mukauta mukauttaa syötetyn tekstin automaattisesti valitun tarpeen mukaan:

- **S2-mukautus** — OPH:n taitotasoille A1.1–C1.1, S2-opetuksen tueksi
- **Selkokieli** — selkokieliperiaatteita noudattava yksinkertaistettu teksti
- **Lukivaikeus** — lukijaystävällinen typografinen asettelu
- **Korkea kontrasti** — paranneltu kontrastisuhde näkemisen tueksi

Mukautetun tekstin voi ladata **PDF**- tai **DOCX**-muodossa.

## Tekninen toteutus

- [Next.js 16](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Claude AI](https://anthropic.com/) — tekstin mukautus (Anthropic SDK)
- [@react-pdf/renderer](https://react-pdf.org/) — PDF-vienti
- [docx](https://docx.js.org/) — DOCX-vienti
- [Resend](https://resend.com/) — palautelomake

## Paikallinen kehitys

```bash
npm install
```

Luo `.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
```

Käynnistä kehityspalvelin:

```bash
npm run dev
```

Avaa [http://localhost:3000](http://localhost:3000).
