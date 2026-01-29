import { IMemberRepository, IScaleRepository } from "../domain/interfaces";
import {
  PrismaMemberRepository,
  PrismaScaleRepository,
} from "./prismaRepository";

class RepositoryFactory {
  private memberRepo: IMemberRepository | null = null;
  private scaleRepo: IScaleRepository | null = null;

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
}

export const repositoryFactory = new RepositoryFactory();
