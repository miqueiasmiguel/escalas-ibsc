import { Member, ScaleEntry, ScaleTemplate } from "./types";

export interface IMemberRepository {
  findAll(): Promise<Member[]>;
  findById(id: string): Promise<Member | null>;
  create(member: Omit<Member, "id">): Promise<Member>;
  update(id: string, member: Partial<Member>): Promise<Member>;
  delete(id: string): Promise<void>;
}

export interface IScaleRepository {
  findAll(): Promise<ScaleEntry[]>;
  findById(id: string): Promise<ScaleEntry | null>;
  save(scale: ScaleEntry): Promise<ScaleEntry>; // Handles both create and update
  delete(id: string): Promise<void>;
  findByMonth(month: string): Promise<ScaleEntry[]>; // month format: "YYYY-MM"
}

export interface IScaleTemplateRepository {
  findAll(): Promise<ScaleTemplate[]>;
  findById(id: string): Promise<ScaleTemplate | null>;
  save(template: ScaleTemplate): Promise<ScaleTemplate>;
  delete(id: string): Promise<void>;
}
