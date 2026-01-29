"use server";

import { repositoryFactory } from "../infrastructure/factory";
import { Member } from "../domain/types";
import { revalidatePath } from "next/cache";

export async function getMembers(): Promise<Member[]> {
  const repo = repositoryFactory.getMemberRepository();
  return repo.findAll();
}

export async function addMember(name: string): Promise<Member> {
  const repo = repositoryFactory.getMemberRepository();
  const member = await repo.create({ name });
  revalidatePath("/admin");
  return member;
}

export async function deleteMember(id: string): Promise<void> {
  const repo = repositoryFactory.getMemberRepository();
  await repo.delete(id);
  revalidatePath("/admin");
}

export async function updateMember(id: string, name: string): Promise<Member> {
  const repo = repositoryFactory.getMemberRepository();
  const member = await repo.update(id, { name });
  revalidatePath("/admin");
  return member;
}
