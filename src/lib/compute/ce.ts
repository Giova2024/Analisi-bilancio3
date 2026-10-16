import { isBreve, isStraord } from "../classify";
import type { ClassifiedAccount, CE } from "../types";
import { bucket } from "./bucket";

const isCE = (a: ClassifiedAccount) => a.cls.s === "CE";
const isAA = (a: ClassifiedAccount) => a.cls.s === "AA";
const isAP = (a: ClassifiedAccount) => a.cls.s === "AP";

const isCEA = (a: ClassifiedAccount) => isCE(a) && a.cls.l1 === "A";
const isCEB = (a: ClassifiedAccount) => isCE(a) && a.cls.l1 === "B";

export function computeCE(accounts: ClassifiedAccount[]): CE {
  const ricaviVendite = bucket(accounts, (a) => isCEA(a) && a.cls.n === 1, -1);
  const varRimProdotti = bucket(
    accounts,
    (a) => isCEA(a) && (a.cls.n === 2 || a.cls.n === 3),
    -1
  );
  const incrementiInterni = bucket(accounts, (a) => isCEA(a) && a.cls.n === 4, -1);
  const altriRicavi = bucket(
    accounts,
    (a) => isCEA(a) && a.cls.n === 5 && !isStraord(a.desc),
    -1
  );
  const altroValProd = bucket(
    accounts,
    (a) => isCEA(a) && ![1, 2, 3, 4, 5].includes(a.cls.n),
    -1
  );
  const valoreProduzione =
    ricaviVendite.total +
    varRimProdotti.total +
    incrementiInterni.total +
    altriRicavi.total +
    altroValProd.total;

  const materiePrime = bucket(accounts, (a) => isCEB(a) && a.cls.n === 6);
  const varRimMaterie = bucket(accounts, (a) => isCEB(a) && a.cls.n === 11);
  const servizi = bucket(accounts, (a) => isCEB(a) && a.cls.n === 7);
  const godimentoTerzi = bucket(accounts, (a) => isCEB(a) && a.cls.n === 8);
  const oneriDiversi = bucket(
    accounts,
    (a) => isCEB(a) && a.cls.n === 14 && !isStraord(a.desc)
  );
  const costiEsterni =
    materiePrime.total +
    varRimMaterie.total +
    servizi.total +
    godimentoTerzi.total +
    oneriDiversi.total;
  const valoreAggiunto = valoreProduzione - costiEsterni;

  const costoLavoro = bucket(accounts, (a) => isCEB(a) && a.cls.n === 9);
  const ebitda = valoreAggiunto - costoLavoro.total;

  const ammortamenti = bucket(accounts, (a) => isCEB(a) && a.cls.n === 10);
  const accantonamenti = bucket(
    accounts,
    (a) => isCEB(a) && (a.cls.n === 12 || a.cls.n === 13)
  );
  const altroCostiProd = bucket(
    accounts,
    (a) => isCEB(a) && ![6, 7, 8, 9, 10, 11, 12, 13, 14].includes(a.cls.n)
  );
  const ebit = ebitda - ammortamenti.total - accantonamenti.total - altroCostiProd.total;

  const bProvStraord = bucket(accounts, (a) => isCEA(a) && a.cls.n === 5 && isStraord(a.desc), -1);
  const bOnerStraord = bucket(accounts, (a) => isCEB(a) && a.cls.n === 14 && isStraord(a.desc));
  const straordinari = bProvStraord.total - bOnerStraord.total;
  const ebitPostStraord = ebit + straordinari;

  const gestioneFinanziaria = bucket(
    accounts,
    (a) => isCE(a) && [15, 16, 17].includes(a.cls.n),
    -1
  );
  const risultatoPreRettifiche = ebitPostStraord + gestioneFinanziaria.total;

  const rettificheAttFin = bucket(
    accounts,
    (a) => isCE(a) && [18, 19].includes(a.cls.n),
    -1
  );
  const ebt = risultatoPreRettifiche + rettificheAttFin.total;

  const imposte = bucket(accounts, (a) => isCE(a) && a.cls.n === 20);
  const altroCE = bucket(
    accounts,
    (a) => isCE(a) && (a.cls.n < 1 || a.cls.n > 20),
    -1
  );
  const utileNetto = ebt + altroCE.total - imposte.total;

  const oneriFinanziari = accounts
    .filter((a) => isCE(a) && a.cls.n === 17 && a.saldo > 0)
    .reduce((t, a) => t + a.saldo, 0);

  const creditiCommercialiKeyword = accounts
    .filter(
      (a) =>
        isAA(a) && a.cls.l1 === "C" && a.cls.l2 === 2 && /client/i.test(a.desc) && isBreve(a.desc)
    )
    .reduce((t, a) => t + a.saldo, 0);

  const debitiCommercialiKeyword = -accounts
    .filter((a) => isAP(a) && a.cls.l1 === "D" && /fornitor/i.test(a.desc))
    .reduce((t, a) => t + a.saldo, 0);

  return {
    ricaviVendite,
    varRimProdotti,
    incrementiInterni,
    altriRicavi,
    altroValProd,
    valoreProduzione,

    materiePrime,
    varRimMaterie,
    servizi,
    godimentoTerzi,
    oneriDiversi,
    costiEsterni,
    valoreAggiunto,

    costoLavoro,
    ebitda,

    ammortamenti,
    accantonamenti,
    altroCostiProd,
    ebit,

    bProvStraord,
    bOnerStraord,
    straordinari,
    ebitPostStraord,

    gestioneFinanziaria,
    risultatoPreRettifiche,

    rettificheAttFin,
    ebt,

    imposte,
    altroCE,
    utileNetto,

    oneriFinanziari,
    creditiCommercialiKeyword,
    debitiCommercialiKeyword,
  };
}
