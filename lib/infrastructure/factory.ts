import {
  IMemberRepository,
  IScaleRepository,
  IScaleTemplateRepository,
  IUnavailabilityRepository,
  IRecurringUnavailabilityRepository,
} from "../domain/interfaces";
import {
  PrismaMemberRepository,
  PrismaScaleRepository,
  PrismaScaleTemplateRepository,
  PrismaUnavailabilityRepository,
  PrismaRecurringUnavailabilityRepository,
} from "./prismaRepository";

class RepositoryFactory {
  private memberRepo: IMemberRepository | null = null;
  private scaleRepo: IScaleRepository | null = null;
  private templateRepo: IScaleTemplateRepository | null = null;
  private unavailabilityRepo: IUnavailabilityRepository | null = null;
  private recurringUnavailabilityRepo: IRecurringUnavailabilityRepository | null =
    null;

  getMemberRepository(): IMemberRepository {
    if (!this.memberRepo) {
      this.memberRepo = new PrismaMemberRepository();
    }
    return this.memberRepo;
  }

  getUnavailabilityRepository(): IUnavailabilityRepository {
    if (!this.unavailabilityRepo) {
      this.unavailabilityRepo = new PrismaUnavailabilityRepository();
    }
    return this.unavailabilityRepo;
  }

  getRecurringUnavailabilityRepository(): IRecurringUnavailabilityRepository {
    if (!this.recurringUnavailabilityRepo) {
      this.recurringUnavailabilityRepo =
        new PrismaRecurringUnavailabilityRepository();
    }
    return this.recurringUnavailabilityRepo;
  }

  getScaleRepository(): IScaleRepository {
    if (!this.scaleRepo) {
      this.scaleRepo = new PrismaScaleRepository();
    }
    return this.scaleRepo;
  }

  getScaleTemplateRepository(): IScaleTemplateRepository {
    if (!this.templateRepo) {
      this.templateRepo = new PrismaScaleTemplateRepository();
    }
    return this.templateRepo;
  }
}

export const repositoryFactory = new RepositoryFactory();
