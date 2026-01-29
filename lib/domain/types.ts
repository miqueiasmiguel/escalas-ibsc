export type Instrument =
  | "Voz"
  | "Violão"
  | "Guitarra"
  | "Baixo"
  | "Teclado"
  | "Bateria"
  | "Percussão"
  | "Ministro";

export interface Member {
  id: string;
  name: string;
}

export interface ScaleMember {
  member: Member;
  instrument: Instrument;
}

export type ServiceType = "Manhã" | "Noite" | "Especial";

export interface ScaleEntry {
  id: string;
  date: string; // ISO string or YYYY-MM-DD
  service: ServiceType;
  members: ScaleMember[];
}
