export type SignalOutcome = "TP_HIT" | "STOP_LOSS" | "MISSED_ENTRY" | "EXPIRED";
export type SignalRecord = { id:string; pair:string; side:"LONG"|"SHORT"; grade?:string; score?:number; entry?:number; stop?:number; target?:number; outcome:SignalOutcome; outcomePrice?:number; rMultiple?:number; generatedAt:string; closedAt?:string };
export const signalHistory: SignalRecord[] = [];
