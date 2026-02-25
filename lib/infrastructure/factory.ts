import {
  IMemberRepository,
  IScaleRepository,
  IScaleTemplateRepository,
} from "../domain/interfaces";
import {
  PrismaMemberRepository,
  PrismaScaleRepository,
  PrismaScaleTemplateRepository,
} from "./prismaRepository";

class RepositoryFactory {
  private memberRepo: IMemberRepository | null = null;
  private scaleRepo: IScaleRepository | null = null;
  private templateRepo: IScaleTemplateRepository | null = null;

  getMemberRepository(): IMemberRepository {
    if (!this.memberRepo) {
      this.memberRepo = new PrismaMemberRepository();
    }
    return this.memberRepo;
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
