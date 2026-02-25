"use server";

import { repositoryFactory } from "../infrastructure/factory";
import { ScaleTemplate, ScaleEntry } from "../domain/types";
import { revalidatePath } from "next/cache";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  addMonths,
} from "date-fns";

export async function getTemplates(): Promise<ScaleTemplate[]> {
  const repo = repositoryFactory.getScaleTemplateRepository();
  return repo.findAll();
}

export async function saveTemplate(
  template: ScaleTemplate,
): Promise<ScaleTemplate> {
  const repo = repositoryFactory.getScaleTemplateRepository();
  const savedTemplate = await repo.save(template);
  revalidatePath("/admin");
  return savedTemplate;
}

export async function deleteTemplate(id: string): Promise<void> {
  const repo = repositoryFactory.getScaleTemplateRepository();
  await repo.delete(id);
  revalidatePath("/admin");
}

export async function generateMonthScales(monthStr?: string): Promise<void> {
  const templateRepo = repositoryFactory.getScaleTemplateRepository();
  const scaleRepo = repositoryFactory.getScaleRepository();

  const templates = await templateRepo.findAll();
  const activeTemplates = templates.filter((t) => t.active);

  if (activeTemplates.length === 0) return;

  const targetDate = monthStr
    ? new Date(monthStr + "-01T12:00:00")
    : addMonths(new Date(), 1);
  const start = startOfMonth(targetDate);
  const end = endOfMonth(targetDate);

  const currentMonthStr = format(start, "yyyy-MM");
  const existingScales = await scaleRepo.findByMonth(currentMonthStr);

  const daysInMonth = eachDayOfInterval({ start, end });

  for (const day of daysInMonth) {
    const dayOfWeek = getDay(day);
    const dayTemplates = activeTemplates.filter(
      (t) => t.dayOfWeek === dayOfWeek,
    );

    for (const template of dayTemplates) {
      const dateStr = format(day, "yyyy-MM-dd");

      const alreadyExists = existingScales.some(
        (s) => s.date === dateStr && s.service === template.service,
      );
      if (alreadyExists) continue;

      const newScale: ScaleEntry = {
        id: "", // Repository handles ID generation
        date: dateStr,
        service: template.service,
        members: template.instruments.map((inst) => ({
          instrument: inst,
          member: undefined,
        })),
      };

      const savedScale = await scaleRepo.save(newScale);
      existingScales.push(savedScale);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/");
}
