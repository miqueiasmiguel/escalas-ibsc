export type Instrument =
  | "Voz"
  | "Violão"
  | "Guitarra"
  | "Baixo"
  | "Teclado"
  | "Bateria"
  | "Cajon"
  | "Ministro";

export interface MemberUnavailability {
  id: string;
  memberId: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
}

export interface Member {
  id: string;
  name: string;
  instruments: Instrument[];
  unavailabilities?: MemberUnavailability[];
}

export interface ScaleMember {
  member?: Member;
  instrument: Instrument;
}

export type ServiceType = "Manhã" | "Noite" | "Especial";

export interface ScaleEntry {
  id: string;
  date: string; // ISO string or YYYY-MM-DD
  service: ServiceType;
  members: ScaleMember[];
}

export interface ScaleTemplate {
  id: string;
  description: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  service: ServiceType;
  requiresConfirmation: boolean;
  instruments: Instrument[];
  active: boolean;
}
