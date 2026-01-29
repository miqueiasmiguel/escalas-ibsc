"use server";

import { repositoryFactory } from "../infrastructure/factory";
import { ScaleEntry } from "../domain/types";
import { revalidatePath } from "next/cache";

export async function getScales(): Promise<ScaleEntry[]> {
  const repo = repositoryFactory.getScaleRepository();
  return repo.findAll();
}

export async function saveScale(scale: ScaleEntry): Promise<ScaleEntry> {
  const repo = repositoryFactory.getScaleRepository();
  const savedScale = await repo.save(scale);
  revalidatePath("/admin");
  revalidatePath("/");
  return savedScale;
}

export async function deleteScale(id: string): Promise<void> {
  const repo = repositoryFactory.getScaleRepository();
  await repo.delete(id);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function getScalesByMonth(month: string): Promise<ScaleEntry[]> {
  const repo = repositoryFactory.getScaleRepository();
  return repo.findByMonth(month);
}
