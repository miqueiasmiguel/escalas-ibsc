"use server";

import { repositoryFactory } from "../infrastructure/factory";
import { Member, Instrument } from "../domain/types";
import { revalidatePath } from "next/cache";

export async function getMembers(): Promise<Member[]> {
  const repo = repositoryFactory.getMemberRepository();
  return repo.findAll();
}

export async function addMember(
  name: string,
  instruments: Instrument[] = [],
): Promise<Member> {
  const repo = repositoryFactory.getMemberRepository();
  const member = await repo.create({ name, instruments });
  revalidatePath("/admin");
  return member;
}

export async function deleteMember(id: string): Promise<void> {
  const repo = repositoryFactory.getMemberRepository();
  await repo.delete(id);
  revalidatePath("/admin");
}

export async function updateMember(
  id: string,
  name: string,
  instruments: Instrument[] = [],
): Promise<Member> {
  const repo = repositoryFactory.getMemberRepository();
  const member = await repo.update(id, { name, instruments });
  revalidatePath("/admin");
  return member;
}

export async function addUnavailability(
  memberId: string,
  start: string,
  end: string,
): Promise<void> {
  const repo = repositoryFactory.getUnavailabilityRepository();
  await repo.create({ memberId, start, end });
  revalidatePath("/admin");
}

export async function deleteUnavailability(id: string): Promise<void> {
  const repo = repositoryFactory.getUnavailabilityRepository();
  await repo.delete(id);
  revalidatePath("/admin");
}
