import fs from "fs/promises";
import path from "path";
import { IMemberRepository, IScaleRepository } from "../domain/interfaces";
import { Member, ScaleEntry } from "../domain/types";

const DATA_DIR = path.join(process.cwd(), "data");

/**
 * Base class for JSON file storage operations
 */
abstract class BaseJsonRepository<T> {
  protected abstract readonly filePath: string;

  private async ensureDir() {
    try {
      await fs.access(DATA_DIR);
    } catch {
      await fs.mkdir(DATA_DIR, { recursive: true });
    }
  }

  protected async readAll(defaultValue: T[] = []): Promise<T[]> {
    try {
      await this.ensureDir();
      const data = await fs.readFile(this.filePath, "utf-8");
      return JSON.parse(data);
    } catch {
      return defaultValue;
    }
  }

  protected async writeAll(data: T[]): Promise<void> {
    await this.ensureDir();
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), "utf-8");
  }
}

/**
 * JSON Implementation for Member Repository
 */
export class JsonMemberRepository
  extends BaseJsonRepository<Member>
  implements IMemberRepository
{
  protected readonly filePath = path.join(DATA_DIR, "members.json");

  async findAll(): Promise<Member[]> {
    return this.readAll();
  }

  async findById(id: string): Promise<Member | null> {
    const list = await this.readAll();
    return list.find((m) => m.id === id) || null;
  }

  async create(member: Omit<Member, "id">): Promise<Member> {
    const list = await this.readAll();
    const newMember = {
      ...member,
      id: Math.random().toString(36).substring(2, 9),
    };
    list.push(newMember);
    await this.writeAll(list);
    return newMember;
  }

  async update(id: string, member: Partial<Member>): Promise<Member> {
    const list = await this.readAll();
    const index = list.findIndex((m) => m.id === id);
    if (index === -1) throw new Error("Member not found");
    list[index] = { ...list[index], ...member };
    await this.writeAll(list);
    return list[index];
  }

  async delete(id: string): Promise<void> {
    const list = await this.readAll();
    const filtered = list.filter((m) => m.id !== id);
    await this.writeAll(filtered);
  }
}

/**
 * JSON Implementation for Scale Repository
 */
export class JsonScaleRepository
  extends BaseJsonRepository<ScaleEntry>
  implements IScaleRepository
{
  protected readonly filePath = path.join(DATA_DIR, "scales.json");

  async findAll(): Promise<ScaleEntry[]> {
    return this.readAll();
  }

  async findById(id: string): Promise<ScaleEntry | null> {
    const list = await this.readAll();
    return list.find((s) => s.id === id) || null;
  }

  async save(scale: ScaleEntry): Promise<ScaleEntry> {
    const list = await this.readAll();
    const index = list.findIndex((s) => s.id === scale.id);
    if (index !== -1) {
      list[index] = scale;
    } else {
      list.push(scale);
    }
    await this.writeAll(list);
    return scale;
  }

  async delete(id: string): Promise<void> {
    const list = await this.readAll();
    const filtered = list.filter((s) => s.id !== id);
    await this.writeAll(filtered);
  }

  async findByMonth(month: string): Promise<ScaleEntry[]> {
    const list = await this.readAll();
    return list.filter((s) => s.date.startsWith(month));
  }
}
