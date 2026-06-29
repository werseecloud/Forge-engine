import { create } from "zustand";

interface LogState {
  outputLogs: string[];
  consoleEntries: string[];
  pushLog: (message: string) => void;
  setOutputLogs: (outputLogs: string[]) => void;
  clearLogs: () => void;
}

export const useLogStore = create<LogState>((set) => ({
  outputLogs: [],
  consoleEntries: [],
  pushLog: (message) =>
    set((state) => ({
      outputLogs: [...state.outputLogs, message],
      consoleEntries: [...state.consoleEntries, message]
    })),
  setOutputLogs: (outputLogs) => set({ outputLogs }),
  clearLogs: () => set({ outputLogs: [], consoleEntries: [] })
}));

