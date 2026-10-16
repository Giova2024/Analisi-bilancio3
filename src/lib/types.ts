// Core domain types for the balance-sheet analysis app.

export type Sezione = "AA" | "AP" | "CE";

export interface Cls {
  s: Sezione;
  l1: string;
  l2: number;
  n: number;
  matched: boolean;
  manual: boolean;
}

export type VarFix = "V" | "F";

export interface RawAccount {
  conto: string;
  desc: string;
  saldo: number;
  ref: string;
}

export interface ClassifiedAccount extends RawAccount {
  cls: Cls;
  varFix: VarFix;
  manual?: boolean;
  /** true se il conto è stato escluso manualmente dai conteggi (scheda Mappatura Conti). */
  excluded?: boolean;
}

export type PeriodType = "annuale" | "infrannuale";

export interface Periodo {
  id: string;
  label: string;
  date: string; // YYYY-MM-DD
  fyStart: string; // YYYY-MM-DD
  type: PeriodType;
  filename: string;
  accounts: RawAccount[];
  /** true se la situazione è stata deselezionata nella scheda Importazione (esclusa da tutte le analisi). */
  excluded?: boolean;
}

// [sezione, l1, l2, n, descrizione]
export type PianoEntry = [Sezione, string, number, number, string];
export type Piano = Record<string, PianoEntry>;

// code -> [s, l1, l2, n]
export type Override = [Sezione, string, number, number];

export interface BepInput {
  prezzo: number | null;
  costoVar: number | null;
}

export type ManualTargetGroup = "sp" | "ce";

export interface ManualTarget {
  key: string;
  group: ManualTargetGroup;
  label: string;
  cls: [Sezione, string, number, number];
  sign: 1 | -1;
  breve?: "entro" | "oltre";
}

export interface ManualEntry {
  id: string;
  target: string;
  desc: string;
  importo: number;
}

export const BP_ASSUMPTION_FIELDS = [
  "crescitaRicavi",
  "incidenzaCV",
  "varPersonale",
  "varAltriFissi",
  "varAmmortamenti",
  "varOneriFin",
  "aliquota",
  "capex",
  "dso",
  "dpo",
  "giacenza",
] as const;

export type AssumptionField = (typeof BP_ASSUMPTION_FIELDS)[number];

export type Assumptions = Record<AssumptionField, number>;

export type ScenarioKey = "prudenziale" | "base" | "ottimistico";

export interface BusinessPlanState {
  years: number;
  baselinePeriodId: string | null;
  scenarios: Record<ScenarioKey, Assumptions>;
}

/** Relazione generata (scheda Relazione), modificabile dall'utente. */
export interface ReportState {
  html: string;
  refId: string;
  cmpId: string;
  author: string;
  place: string;
  generatedAt: string;
  edited: boolean;
  editedAt?: string;
}

export interface AppState {
  periods: Periodo[];
  overrides: Record<string, Override>;
  varFixOverrides: Record<string, VarFix>;
  excludedAccounts: Record<string, boolean>;
  bepInputs: Record<string, BepInput>;
  manualEntries: Record<string, ManualEntry[]>;
  businessPlan: BusinessPlanState | null;
  companyName: string;
  report: ReportState | null;
}

// ---- Bucket / computation types ----

export interface Bucket {
  total: number;
  items: ClassifiedAccount[];
}

export interface SP {
  liqImmediate: Bucket;
  attFinNonImmob: Bucket;
  creditiBreve: Bucket;
  creditiOltre: Bucket;
  rimanenze: Bucket;
  rateiRiscAttivi: Bucket;
  liquiditaDifferite: Bucket;
  attivoCircolante: Bucket;
  immatNette: Bucket;
  matNette: Bucket;
  finImmob: Bucket;
  creditiSoci: Bucket;
  altroAttivo: Bucket;
  immobilizzazioni: Bucket;
  totaleImpieghi: number;

  risultatoPeriodo: Bucket;
  patrimonioNettoBase: Bucket;
  patrimonioNetto: Bucket;
  fondiRischi: Bucket;
  tfr: Bucket;
  debitiBreve: Bucket;
  debitiOltre: Bucket;
  debitiFinBreve: Bucket;
  debitiFinOltre: Bucket;
  debitiFinTot: Bucket;
  debitiFornitori: Bucket;
  rateiRiscPassivi: Bucket;
  altroPassivo: Bucket;
  passivitaCorrenti: Bucket;
  passivitaConsolidate: Bucket;
  totaleFonti: number;

  pfn: number;
  quadratura: number;
}

export interface CE {
  ricaviVendite: Bucket;
  varRimProdotti: Bucket;
  incrementiInterni: Bucket;
  altriRicavi: Bucket;
  altroValProd: Bucket;
  valoreProduzione: number;

  materiePrime: Bucket;
  varRimMaterie: Bucket;
  servizi: Bucket;
  godimentoTerzi: Bucket;
  oneriDiversi: Bucket;
  costiEsterni: number;
  valoreAggiunto: number;

  costoLavoro: Bucket;
  ebitda: number;

  ammortamenti: Bucket;
  accantonamenti: Bucket;
  altroCostiProd: Bucket;
  ebit: number;

  bProvStraord: Bucket;
  bOnerStraord: Bucket;
  straordinari: number;
  ebitPostStraord: number;

  gestioneFinanziaria: Bucket;
  risultatoPreRettifiche: number;

  rettificheAttFin: Bucket;
  ebt: number;

  imposte: Bucket;
  altroCE: Bucket;
  utileNetto: number;

  oneriFinanziari: number;
  creditiCommercialiKeyword: number;
  debitiCommercialiKeyword: number;
}

export interface CM {
  valoreProduzioneCaratt: number;

  cmAcquisto: Bucket;
  cmRimIniziale: Bucket;
  cmRimFinale: Bucket;
  cvMerce: number;
  cvAltro: Bucket;
  totaleCV: number;
  margineContribuzione: number;

  cfMerce: Bucket;
  cfServizi: Bucket;
  cfGodimento: Bucket;
  cfPersonale: Bucket;
  cfAmmortamenti: Bucket;
  cfAccantonamenti: Bucket;
  cfOneriDiversi: Bucket;
  totaleCF: number;

  ebitOperativo: number;
  ebitCM: number;

  incidenzaMerce: number;
  ricarico: number;
}

export interface PeriodCalc {
  accounts: ClassifiedAccount[];
  sp: SP;
  ce: CE;
  cm: CM;
  unmatched: number;
}

export interface RatioValue {
  key: string;
  label: string;
  sub?: string;
  value: number;
  dot?: [number, number]; // [red, green]
  higherBetter?: boolean;
  format: "ratio" | "pct" | "eur" | "days" | "x";
  /** Descrizione della formula usata (es. "Attivo Circolante / Passività Correnti"). */
  formula?: string;
  /** Composizione numerica della formula per il periodo corrente (es. "1.200.000 € / 800.000 €"). */
  detail?: string;
}

export type Judgement = "ottimo" | "buono" | "discreto" | "sufficiente" | "insufficiente";

export interface RatioGroup {
  title: string;
  ratios: RatioValue[];
}
