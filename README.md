# Analisi di Bilancio

Riclassificazione di situazioni contabili (CSV/Excel), indici, rendiconto finanziario, break-even,
KPI, business plan e relazione descrittiva. Tutti i dati restano nel browser.

## Usare l'app

Aprire **`Analisi-di-Bilancio.html`** (collegamento) oppure **`dist/index.html`** con un doppio clic
(funziona anche senza server e offline). **Non** aprire `index.html` nella cartella principale: è il
file di sviluppo e funziona solo con `npm run dev`.
La cartella `dist/` può essere copiata o spostata dove si vuole: contiene

```
dist/
├── index.html
└── assets/
    ├── app.js      (applicazione + librerie)
    └── style.css
```

I dati salvati nel browser sono gli stessi della vecchia versione a file unico
(chiave `bilancio_app_state_v1`): aprendo la nuova versione con lo stesso browser si ritrovano i
periodi già importati. Per spostarli su un altro computer usare **Salva JSON / Carica JSON**.

Se il browser non consente `localStorage` (per esempio quando l'app è pubblicata in un iframe
sandbox, come nell'area riservata di giovannigor.vercel.app) l'app parte comunque e tiene i dati in
memoria finché la pagina resta aperta: per conservarli usare **Salva JSON / Carica JSON**.

## Sviluppo

```bash
npm install
npm run dev        # server di sviluppo con ricarica automatica
npm run build      # controllo dei tipi + build in dist/
```

## Struttura del sorgente

```
src/
├── main.tsx                 avvio React
├── globals.css              tema e stili comuni (Tailwind)
├── components/
│   ├── AppShell.tsx         layout e scelta della scheda
│   ├── Header.tsx           intestazione, pulsanti Stampa/Excel/JSON
│   ├── NavBar.tsx           barra schede + menu Impostazioni
│   ├── CompanyName.tsx      nome azienda (intestazione e stampa)
│   ├── FinTable.tsx         tabella SP/CE con dettaglio conti e selettore V/F
│   ├── PeriodModal.tsx      configurazione del periodo importato
│   └── tabs/                una scheda per file (Importazione, SP, CE, BEP, Indici,
│                            Rendiconto, Scostamenti, KPI, Mappatura, Rettifiche,
│                            Business Plan, Relazione)
├── lib/
│   ├── parseFiles.ts        lettura CSV/Excel → conti
│   ├── numberFormat.ts      parsing importi (formato italiano e anglosassone) e formattazione
│   ├── classify.ts          classificazione dei conti sul piano standard
│   ├── compute/             calcoli: SP, CE, margine di contribuzione, indici, rendiconto,
│   │                        BEP, scostamenti, business plan
│   ├── report/              generazione ed esportazione della Relazione
│   ├── store.ts             stato persistente (zustand + localStorage)
│   └── ...
└── data/piano-standard.json piano dei conti di riferimento
```

`legacy/` contiene le vecchie versioni a file unico, conservate solo come riferimento.

## Importazione degli importi

- **Excel**: per la colonna Saldo/Importo viene letto il valore numerico della cella, non il testo
  formattato. In precedenza un file con formato anglosassone (`27,621.50`) veniva letto come
  27,62 € invece di 27.621,50 €.
- **CSV**: sono accettati sia `1.234,56` sia `1,234.56`; il separatore decimale viene rilevato
  sull'intera colonna, così anche i valori ambigui (`25.000`) sono interpretati correttamente.
  Gestiti anche segno tra parentesi o in coda (`1.234,56-`), simbolo €, campi tra virgolette.
