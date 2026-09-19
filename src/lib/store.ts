import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppState,
  BepInput,
  BusinessPlanState,
  ManualEntry,
  Override,
  Periodo,
  RawAccount,
  ScenarioKey,
  VarFix,
} from "./types";

export const LS_KEY = "bilancio_app_state_v1";

const initialState: AppState = {
  periods: [],
  overrides: {},
  varFixOverrides: {},
  bepInputs: {},
  manualEntries: {},
  businessPlan: null,
};

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

interface Store extends AppState {
  hydrated: boolean;
  setHydrated: () => void;
  addPeriod: (input: {
    label: string;
    date: string;
    fyStart: string;
    type: "annuale" | "infrannuale";
    filename: string;
    accounts: RawAccount[];
  }) => void;
  deletePeriod: (id: string) => void;
  setOverride: (code: string, value: Override) => void;
  setVarFixOverride: (code: string, value: VarFix) => void;
  setBepInput: (periodId: string, input: BepInput) => void;
  addManualEntry: (periodId: string, entry: Omit<ManualEntry, "id">) => void;
  deleteManualEntry: (periodId: string, entryId: string) => void;
  setBusinessPlan: (bp: BusinessPlanState) => void;
  updateScenarioAssumption: (scenario: ScenarioKey, field: string, value: number) => void;
  resetAll: () => void;
  importState: (data: Partial<AppState>) => void;
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      ...initialState,
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),

      addPeriod: (input) =>
        set((state) => {
          const period: Periodo = {
            id: genId("p"),
            label: input.label,
            date: input.date,
            fyStart: input.fyStart,
            type: input.type,
            filename: input.filename,
            accounts: input.accounts,
          };
          return { periods: [...state.periods, period] };
        }),

      deletePeriod: (id) =>
        set((state) => ({ periods: state.periods.filter((p) => p.id !== id) })),

      setOverride: (code, value) =>
        set((state) => ({ overrides: { ...state.overrides, [code]: value } })),

      setVarFixOverride: (code, value) =>
        set((state) => ({ varFixOverrides: { ...state.varFixOverrides, [code]: value } })),

      setBepInput: (periodId, input) =>
        set((state) => ({ bepInputs: { ...state.bepInputs, [periodId]: input } })),

      addManualEntry: (periodId, entry) =>
        set((state) => {
          const list = state.manualEntries[periodId] || [];
          const newEntry: ManualEntry = { ...entry, id: genId("man") };
          return {
            manualEntries: { ...state.manualEntries, [periodId]: [...list, newEntry] },
          };
        }),

      deleteManualEntry: (periodId, entryId) =>
        set((state) => {
          const list = state.manualEntries[periodId] || [];
          return {
            manualEntries: {
              ...state.manualEntries,
              [periodId]: list.filter((e) => e.id !== entryId),
            },
          };
        }),

      setBusinessPlan: (bp) => set({ businessPlan: bp }),

      updateScenarioAssumption: (scenario, field, value) =>
        set((state) => {
          if (!state.businessPlan) return {};
          return {
            businessPlan: {
              ...state.businessPlan,
              scenarios: {
                ...state.businessPlan.scenarios,
                [scenario]: {
                  ...state.businessPlan.scenarios[scenario],
                  [field]: value,
                },
              },
            },
          };
        }),

      resetAll: () => set({ ...initialState }),

      importState: (data) =>
        set(() => ({
          periods: data.periods ?? [],
          overrides: data.overrides ?? {},
          varFixOverrides: data.varFixOverrides ?? {},
          bepInputs: data.bepInputs ?? {},
          manualEntries: data.manualEntries ?? {},
          businessPlan: data.businessPlan ?? null,
        })),
    }),
    {
      name: LS_KEY,
      partialize: (state) => ({
        periods: state.periods,
        overrides: state.overrides,
        varFixOverrides: state.varFixOverrides,
        bepInputs: state.bepInputs,
        manualEntries: state.manualEntries,
        businessPlan: state.businessPlan,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
