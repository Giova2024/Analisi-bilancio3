import type { Bucket, ClassifiedAccount } from "../types";

export function bucket(
  accounts: ClassifiedAccount[],
  pred: (a: ClassifiedAccount) => boolean,
  sign: 1 | -1 = 1
): Bucket {
  const items = accounts.filter(pred);
  const total = sign * items.reduce((t, a) => t + a.saldo, 0);
  return { total, items };
}

export function mergeBuckets(...bs: Bucket[]): Bucket {
  return {
    total: bs.reduce((t, b) => t + b.total, 0),
    items: ([] as ClassifiedAccount[]).concat(...bs.map((b) => b.items)),
  };
}

export function neg(b: Bucket): Bucket {
  return { total: -b.total, items: b.items };
}

export function emptyBucket(): Bucket {
  return { total: 0, items: [] };
}
