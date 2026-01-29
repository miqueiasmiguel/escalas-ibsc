import { IMemberRepository, IScaleRepository } from "@/lib/domain/interfaces";
import {
  Member,
  ScaleEntry,
  Instrument,
  ServiceType,
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
    };
  }>;
};

export class PrismaMemberRepository implements IMemberRepository {
  async findAll(): Promise<Member[]> {
    const members = await prisma.member.findMany();
    return members;
  }

  async findById(id: string): Promise<Member | null> {
    const member = await prisma.member.findUnique({
      where: { id },
    });
    return member;
  }

  async create(member: Omit<Member, "id">): Promise<Member> {
    const newMember = await prisma.member.create({
      data: {
        name: member.name,
      },
    });
    return newMember;
  }

  async update(id: string, member: Partial<Member>): Promise<Member> {
    const updatedMember = await prisma.member.update({
      where: { id },
      data: {
        name: member.name,
      },
    });
    return updatedMember;
  }

  async delete(id: string): Promise<void> {
    await prisma.member.delete({
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
                memberId: m.member.id,
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
              memberId: m.member.id,
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
        member: {
          id: pm.member.id,
          name: pm.member.name,
        },
        instrument: pm.instrument as Instrument,
      })),
    };
  }
}
