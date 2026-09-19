import { isBreve } from "../classify";
import type { ClassifiedAccount, SP } from "../types";
import { bucket, mergeBuckets } from "./bucket";

const isAA = (a: ClassifiedAccount) => a.cls.s === "AA";
const isAP = (a: ClassifiedAccount) => a.cls.s === "AP";
const isCE = (a: ClassifiedAccount) => a.cls.s === "CE";

export function computeSP(accounts: ClassifiedAccount[]): SP {
  const liqImmediate = bucket(accounts, (a) => isAA(a) && a.cls.l1 === "C" && a.cls.l2 === 4);
  const attFinNonImmob = bucket(accounts, (a) => isAA(a) && a.cls.l1 === "C" && a.cls.l2 === 3);
  const creditiBreve = bucket(
    accounts,
    (a) => isAA(a) && a.cls.l1 === "C" && a.cls.l2 === 2 && isBreve(a.desc)
  );
  const creditiOltre = bucket(
    accounts,
    (a) => isAA(a) && a.cls.l1 === "C" && a.cls.l2 === 2 && !isBreve(a.desc)
  );
  const rimanenze = bucket(accounts, (a) => isAA(a) && a.cls.l1 === "C" && a.cls.l2 === 1);
  const rateiRiscAttivi = bucket(accounts, (a) => isAA(a) && a.cls.l1 === "D");

  const liquiditaDifferite = mergeBuckets(attFinNonImmob, creditiBreve, rateiRiscAttivi);
  const attivoCircolante = mergeBuckets(liqImmediate, liquiditaDifferite, rimanenze);

  const immatNette = bucket(accounts, (a) => isAA(a) && a.cls.l1 === "B" && a.cls.l2 === 1);
  const matNette = bucket(accounts, (a) => isAA(a) && a.cls.l1 === "B" && a.cls.l2 === 2);
  const finImmob = bucket(accounts, (a) => isAA(a) && a.cls.l1 === "B" && a.cls.l2 === 3);
  const creditiSoci = bucket(accounts, (a) => isAA(a) && a.cls.l1 === "A");
  const altroAttivo = bucket(
    accounts,
    (a) => isAA(a) && !["A", "B", "C", "D"].includes(a.cls.l1)
  );
  const immobilizzazioni = mergeBuckets(
    immatNette,
    matNette,
    finImmob,
    creditiOltre,
    creditiSoci,
    altroAttivo
  );

  const totaleImpieghi = attivoCircolante.total + immobilizzazioni.total;

  const risultatoPeriodo = bucket(accounts, isCE, -1);
  const patrimonioNettoBase = bucket(accounts, (a) => isAP(a) && a.cls.l1 === "A", -1);
  const patrimonioNetto = mergeBuckets(patrimonioNettoBase, risultatoPeriodo);
  const fondiRischi = bucket(accounts, (a) => isAP(a) && a.cls.l1 === "B", -1);
  const tfr = bucket(accounts, (a) => isAP(a) && a.cls.l1 === "C", -1);
  const debitiBreve = bucket(
    accounts,
    (a) => isAP(a) && a.cls.l1 === "D" && isBreve(a.desc),
    -1
  );
  const debitiOltre = bucket(
    accounts,
    (a) => isAP(a) && a.cls.l1 === "D" && !isBreve(a.desc),
    -1
  );
  const debitiFinBreve = bucket(
    accounts,
    (a) => isAP(a) && a.cls.l1 === "D" && a.cls.n === 4 && isBreve(a.desc),
    -1
  );
  const debitiFinOltre = bucket(
    accounts,
    (a) => isAP(a) && a.cls.l1 === "D" && a.cls.n === 4 && !isBreve(a.desc),
    -1
  );
  const debitiFinTot = mergeBuckets(debitiFinBreve, debitiFinOltre);
  const debitiFornitori = bucket(accounts, (a) => isAP(a) && a.cls.l1 === "D" && a.cls.n === 7, -1);
  const rateiRiscPassivi = bucket(accounts, (a) => isAP(a) && a.cls.l1 === "E", -1);
  const altroPassivo = bucket(
    accounts,
    (a) => isAP(a) && !["A", "B", "C", "D", "E"].includes(a.cls.l1),
    -1
  );

  const passivitaCorrenti = mergeBuckets(debitiBreve, rateiRiscPassivi, altroPassivo);
  const passivitaConsolidate = mergeBuckets(debitiOltre, fondiRischi, tfr);

  const totaleFonti = patrimonioNetto.total + passivitaConsolidate.total + passivitaCorrenti.total;

  const pfn = debitiFinTot.total - liqImmediate.total - attFinNonImmob.total;
  const quadratura = totaleImpieghi - totaleFonti;

  return {
    liqImmediate,
    attFinNonImmob,
    creditiBreve,
    creditiOltre,
    rimanenze,
    rateiRiscAttivi,
    liquiditaDifferite,
    attivoCircolante,
    immatNette,
    matNette,
    finImmob,
    creditiSoci,
    altroAttivo,
    immobilizzazioni,
    totaleImpieghi,

    risultatoPeriodo,
    patrimonioNettoBase,
    patrimonioNetto,
    fondiRischi,
    tfr,
    debitiBreve,
    debitiOltre,
    debitiFinBreve,
    debitiFinOltre,
    debitiFinTot,
    debitiFornitori,
    rateiRiscPassivi,
    altroPassivo,
    passivitaCorrenti,
    passivitaConsolidate,
    totaleFonti,

    pfn,
    quadratura,
  };
}
