import { isStraord } from "../classify";
import type { CE, ClassifiedAccount, CM } from "../types";
import { bucket } from "./bucket";

const isCEB = (a: ClassifiedAccount) => a.cls.s === "CE" && a.cls.l1 === "B";

export function computeCM(accounts: ClassifiedAccount[], ce: CE): CM {
  const valoreProduzioneCaratt = ce.valoreProduzione - ce.altriRicavi.total;

  const cmAcquisto = bucket(accounts, (a) => isCEB(a) && a.cls.n === 6 && a.varFix === "V");
  const cmRimIniziale = bucket(
    accounts,
    (a) => isCEB(a) && a.cls.n === 11 && a.varFix === "V" && a.saldo >= 0
  );
  const cmRimFinale = bucket(
    accounts,
    (a) => isCEB(a) && a.cls.n === 11 && a.varFix === "V" && a.saldo < 0
  );
  const cvMerce = cmAcquisto.total + cmRimIniziale.total + cmRimFinale.total;

  const cvAltro = bucket(
    accounts,
    (a) =>
      isCEB(a) &&
      ![6, 11].includes(a.cls.n) &&
      [7, 8, 9, 10, 12, 13, 14].includes(a.cls.n) &&
      !(a.cls.n === 14 && isStraord(a.desc)) &&
      a.varFix === "V"
  );
  const totaleCV = cvMerce + cvAltro.total;
  const margineContribuzione = valoreProduzioneCaratt - totaleCV;

  const cfMerce = bucket(
    accounts,
    (a) => isCEB(a) && [6, 11].includes(a.cls.n) && a.varFix === "F"
  );
  const cfServizi = bucket(accounts, (a) => isCEB(a) && a.cls.n === 7 && a.varFix === "F");
  const cfGodimento = bucket(accounts, (a) => isCEB(a) && a.cls.n === 8 && a.varFix === "F");
  const cfPersonale = bucket(accounts, (a) => isCEB(a) && a.cls.n === 9 && a.varFix === "F");
  const cfAmmortamenti = bucket(accounts, (a) => isCEB(a) && a.cls.n === 10 && a.varFix === "F");
  const cfAccantonamenti = bucket(
    accounts,
    (a) => isCEB(a) && [12, 13].includes(a.cls.n) && a.varFix === "F"
  );
  const cfOneriDiversi = bucket(
    accounts,
    (a) => isCEB(a) && a.cls.n === 14 && !isStraord(a.desc) && a.varFix === "F"
  );
  const totaleCF =
    cfMerce.total +
    cfServizi.total +
    cfGodimento.total +
    cfPersonale.total +
    cfAmmortamenti.total +
    cfAccantonamenti.total +
    cfOneriDiversi.total;

  const ebitOperativo = margineContribuzione - totaleCF;
  const ebitCM = ebitOperativo + ce.altriRicavi.total - ce.altroCostiProd.total;

  const incidenzaMerce = ce.ricaviVendite.total ? cvMerce / ce.ricaviVendite.total : NaN;
  const ricarico = cvMerce ? ce.ricaviVendite.total / cvMerce : NaN;

  return {
    valoreProduzioneCaratt,
    cmAcquisto,
    cmRimIniziale,
    cmRimFinale,
    cvMerce,
    cvAltro,
    totaleCV,
    margineContribuzione,
    cfMerce,
    cfServizi,
    cfGodimento,
    cfPersonale,
    cfAmmortamenti,
    cfAccantonamenti,
    cfOneriDiversi,
    totaleCF,
    ebitOperativo,
    ebitCM,
    incidenzaMerce,
    ricarico,
  };
}
