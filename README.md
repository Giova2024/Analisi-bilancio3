# Analisi di Bilancio

Applicazione web per l'analisi di bilancio multiperiodo: importa situazioni contabili (CSV/Excel), le riclassifica secondo lo Stato Patrimoniale (criterio finanziario) e il Conto Economico (a Valore Aggiunto / a Margine di Contribuzione), calcola indici di bilancio, Break Even Point, rendiconto finanziario, una dashboard KPI e proiezioni di Business Plan multi-scenario.

Riscritta in Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS a partire da una versione precedente a file HTML singolo, mantenendo l'intera logica di calcolo originale (classificazione dei conti, formule di bilancio, indici, rendiconto finanziario, business plan).

Tutti i dati restano nel browser dell'utente (`localStorage`): non c'è alcun backend, nessun conto o importo lascia mai il dispositivo. Esportazione/importazione dati in formato JSON ed Excel, stampa/PDF.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router, Turbopack)
- React 19 + TypeScript
- Tailwind CSS 4
- [Zustand](https://github.com/pmndrs/zustand) (stato applicativo, persistito in `localStorage`)
- [Chart.js](https://www.chartjs.org/) / react-chartjs-2 (grafici)
- [SheetJS (xlsx)](https://sheetjs.com/) (import/export CSV/Excel)

## Sviluppo locale

```bash
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

## Build di produzione

```bash
npm run build
npm run start
```

## Deploy

Progetto pronto per il deploy su [Vercel](https://vercel.com): è un'app Next.js standard, senza variabili d'ambiente o servizi esterni richiesti (nessun database, nessuna API key).
