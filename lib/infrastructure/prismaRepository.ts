import {
  IMemberRepository,
  IScaleRepository,
  IScaleTemplateRepository,
  IUnavailabilityRepository,
  IRecurringUnavailabilityRepository,
} from "@/lib/domain/interfaces";
import {
  Member,
  ScaleEntry,
  Instrument,
  ServiceType,
  ScaleTemplate,
} from "@/lib/domain/types";
import { prisma } from "./prisma";

type PrismaClientInstance = typeof prisma;
type TransactionClient = Omit<
  PrismaClientInstance,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

type PrismaScaleWithRelations = {
  id: string;
  date: string;
  service: string;
  members: Array<{
    instrument: string;
    member: {
      id: string;
      name: string;
      instruments: string[];
    } | null;
  }>;
};

type PrismaTemplate = {
  id: string;
  description: string;
  dayOfWeek: number;
  service: string;
  requiresConfirmation: boolean;
  instruments: string[];
  active: boolean;
};

export class PrismaMemberRepository implements IMemberRepository {
  async findAll(): Promise<Member[]> {
    const members = await prisma.member.findMany({
      include: {
        unavailabilities: true,
        recurringUnavailabilities: true,
      },
    });
    return members.map((m) => ({
      ...m,
      instruments: m.instruments as Instrument[],
      unavailabilities: m.unavailabilities.map((u) => ({
        id: u.id,
        memberId: u.memberId,
        start: u.start.toISOString(),
        end: u.end.toISOString(),
      })),
      recurringUnavailabilities: m.recurringUnavailabilities.map((ru) => ({
        id: ru.id,
        memberId: ru.memberId,
        dayOfWeek: ru.dayOfWeek,
      })),
    }));
  }

  async findById(id: string): Promise<Member | null> {
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        unavailabilities: true,
        recurringUnavailabilities: true,
      },
    });
    if (!member) return null;
    return {
      ...member,
      instruments: member.instruments as Instrument[],
      unavailabilities: member.unavailabilities.map((u) => ({
        id: u.id,
        memberId: u.memberId,
        start: u.start.toISOString(),
        end: u.end.toISOString(),
      })),
      recurringUnavailabilities: member.recurringUnavailabilities.map((ru) => ({
        id: ru.id,
        memberId: ru.memberId,
        dayOfWeek: ru.dayOfWeek,
      })),
    };
  }

  async create(member: Omit<Member, "id">): Promise<Member> {
    const newMember = await prisma.member.create({
      data: {
        name: member.name,
        instruments: member.instruments,
      },
      include: {
        unavailabilities: true,
        recurringUnavailabilities: true,
      },
    });
    return {
      ...newMember,
      instruments: newMember.instruments as Instrument[],
      unavailabilities: [],
      recurringUnavailabilities: [],
    };
  }

  async update(id: string, member: Partial<Member>): Promise<Member> {
    const updatedMember = await prisma.member.update({
      where: { id },
      data: {
        name: member.name,
        instruments: {
          set: member.instruments,
        },
      },
      include: {
        unavailabilities: true,
        recurringUnavailabilities: true,
      },
    });
    return {
      ...updatedMember,
      instruments: updatedMember.instruments as Instrument[],
      unavailabilities: updatedMember.unavailabilities.map((u) => ({
        id: u.id,
        memberId: u.memberId,
        start: u.start.toISOString(),
        end: u.end.toISOString(),
      })),
      recurringUnavailabilities: updatedMember.recurringUnavailabilities.map(
        (ru) => ({
          id: ru.id,
          memberId: ru.memberId,
          dayOfWeek: ru.dayOfWeek,
        }),
      ),
    };
  }

  async delete(id: string): Promise<void> {
    await prisma.member.delete({
      where: { id },
    });
  }
}

export class PrismaUnavailabilityRepository implements IUnavailabilityRepository {
  async create(unavailability: {
    memberId: string;
    start: string;
    end: string;
  }): Promise<void> {
    await prisma.memberUnavailability.create({
      data: {
        memberId: unavailability.memberId,
        start: new Date(unavailability.start),
        end: new Date(unavailability.end),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.memberUnavailability.delete({
      where: { id },
    });
  }
}

export class PrismaRecurringUnavailabilityRepository implements IRecurringUnavailabilityRepository {
  async create(unavailability: {
    memberId: string;
    dayOfWeek: number;
  }): Promise<void> {
    await prisma.recurringUnavailability.create({
      data: {
        memberId: unavailability.memberId,
        dayOfWeek: unavailability.dayOfWeek,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.recurringUnavailability.delete({
      where: { id },
    });
  }
}

export class PrismaScaleRepository implements IScaleRepository {
  async findAll(): Promise<ScaleEntry[]> {
    const scales = await prisma.scaleEntry.findMany({
      include: {
        members: {
          include: {
            member: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return scales.map(this.mapToDomain);
  }

  async findById(id: string): Promise<ScaleEntry | null> {
    const scale = await prisma.scaleEntry.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            member: true,
          },
        },
      },
    });

    if (!scale) return null;
    return this.mapToDomain(scale);
  }

  async findByMonth(month: string): Promise<ScaleEntry[]> {
    const scales = await prisma.scaleEntry.findMany({
      where: {
        date: {
          startsWith: month,
        },
      },
      include: {
        members: {
          include: {
            member: true,
          },
        },
      },
    });

    return scales.map(this.mapToDomain);
  }

  async save(scale: ScaleEntry): Promise<ScaleEntry> {
    const existing = await prisma.scaleEntry.findUnique({
      where: { id: scale.id },
    });

    if (existing) {
      const result = await prisma.$transaction(
        async (tx: TransactionClient) => {
          await tx.scaleEntry.update({
            where: { id: scale.id },
            data: {
              date: scale.date,
              service: scale.service,
            },
          });

          await tx.scaleMember.deleteMany({
            where: { scaleId: scale.id },
          });
          if (scale.members.length > 0) {
            await tx.scaleMember.createMany({
              data: scale.members.map((m) => ({
                scaleId: scale.id,
                memberId: m.member?.id ?? null,
                instrument: m.instrument,
              })),
            });
          }

          return tx.scaleEntry.findUnique({
            where: { id: scale.id },
            include: {
              members: {
                include: {
                  member: true,
                },
              },
            },
          });
        },
      );

      if (!result) throw new Error("Failed to update scale");
      return this.mapToDomain(result);
    } else {
      const result = await prisma.scaleEntry.create({
        data: {
          id: scale.id.length > 0 ? scale.id : undefined,
          date: scale.date,
          service: scale.service,
          members: {
            create: scale.members.map((m) => ({
              memberId: m.member?.id ?? null,
              instrument: m.instrument,
            })),
          },
        },
        include: {
          members: {
            include: {
              member: true,
            },
          },
        },
      });
      return this.mapToDomain(result);
    }
  }

  async delete(id: string): Promise<void> {
    await prisma.scaleEntry.delete({
      where: { id },
    });
  }

  private mapToDomain(prismaScale: PrismaScaleWithRelations): ScaleEntry {
    return {
      id: prismaScale.id,
      date: prismaScale.date,
      service: prismaScale.service as ServiceType,
      members: prismaScale.members.map((pm) => ({
        member: pm.member
          ? {
              id: pm.member.id,
              name: pm.member.name,
              instruments: pm.member.instruments as Instrument[],
            }
          : undefined,
        instrument: pm.instrument as Instrument,
      })),
    };
  }
}

export class PrismaScaleTemplateRepository implements IScaleTemplateRepository {
  async findAll(): Promise<ScaleTemplate[]> {
    const templates = await prisma.scaleTemplate.findMany();
    return templates.map(this.mapToDomain);
  }

  async findById(id: string): Promise<ScaleTemplate | null> {
    const template = await prisma.scaleTemplate.findUnique({
      where: { id },
    });
    if (!template) return null;
    return this.mapToDomain(template);
  }

  async save(template: ScaleTemplate): Promise<ScaleTemplate> {
    const data = {
      description: template.description,
      dayOfWeek: template.dayOfWeek,
      service: template.service,
      requiresConfirmation: template.requiresConfirmation,
      instruments: template.instruments,
      active: template.active,
    };

    const result = await prisma.scaleTemplate.upsert({
      where: { id: template.id },
      create: {
        id: template.id && template.id.length > 0 ? template.id : undefined,
        ...data,
      },
      update: data,
    });

    return this.mapToDomain(result);
  }

  async delete(id: string): Promise<void> {
    await prisma.scaleTemplate.delete({
      where: { id },
    });
  }

  private mapToDomain(prismaTemplate: PrismaTemplate): ScaleTemplate {
    return {
      id: prismaTemplate.id,
      description: prismaTemplate.description,
      dayOfWeek: prismaTemplate.dayOfWeek,
      service: prismaTemplate.service as ServiceType,
      requiresConfirmation: prismaTemplate.requiresConfirmation,
      instruments: prismaTemplate.instruments as Instrument[],
      active: prismaTemplate.active,
    };
  }
}
