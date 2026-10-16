"use client";

import { useEffect, useRef } from "react";

type CollapsedPair = [value: boolean, setValue: (v: boolean) => void];

/**
 * Quando l'utente avvia la stampa/PDF, forza temporaneamente "aperte" tutte le sezioni
 * collassabili passate (cosi' il PDF stampato non omette contenuti che sullo schermo erano
 * nascosti) e ripristina lo stato precedente subito dopo. Va passato un array di coppie
 * [valoreCollassato, setter], stabile per identita' del componente (i valori possono cambiare
 * ad ogni render, i setter no).
 */
export function useAutoExpandOnPrint(pairs: CollapsedPair[]): void {
  const pairsRef = useRef(pairs);
  pairsRef.current = pairs;

  useEffect(() => {
    let saved: boolean[] = [];
    function onBeforePrint() {
      saved = pairsRef.current.map(([v]) => v);
      pairsRef.current.forEach(([v, set]) => {
        if (v) set(false);
      });
    }
    function onAfterPrint() {
      pairsRef.current.forEach(([, set], i) => {
        if (saved[i] !== undefined) set(saved[i]);
      });
    }
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, []);
}
