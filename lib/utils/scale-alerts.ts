import { ScaleEntry, Member, ScaleMember } from "../domain/types";

export type AlertSeverity = "critical" | "warning" | "info";

export interface ScaleAlert {
  id: string;
  severity: AlertSeverity;
  message: string;
  memberId?: string;
}

const WINDOW_SIZE = 8;
const OVERLOAD_THRESHOLD = 1.5;
const CONSECUTIVE_THRESHOLD = 2;
const INACTIVE_WEEKS = 4;

/**
 * Analyzes the scale being edited against all existing scales and returns alerts.
 */
export function analyzeScale(
  editingScale: Partial<ScaleEntry>,
  allScales: ScaleEntry[],
  allMembers: Member[],
): ScaleAlert[] {
  const alerts: ScaleAlert[] = [];
  const currentMembers = editingScale.members || [];

  // Sort scales by date descending to get the most recent first
  const sortedScales = [...allScales]
    .filter((s) => s.id !== editingScale.id) // Exclude the scale being edited
    .sort((a, b) => b.date.localeCompare(a.date));

  const recentScales = sortedScales.slice(0, WINDOW_SIZE);

  alerts.push(...checkOverloadByInstrument(currentMembers, recentScales));
  alerts.push(...checkOverloadTotal(currentMembers, recentScales));
  alerts.push(
    ...checkConsecutiveScales(currentMembers, sortedScales, editingScale.date),
  );
  alerts.push(...checkNoVocalist(currentMembers));
  alerts.push(
    ...checkInactiveMembers(currentMembers, allMembers, sortedScales),
  );
  alerts.push(...checkOpenSlots(currentMembers));

  return alerts;
}

/**
 * Layer 1: Per-instrument overload.
 * For each member+instrument in the editing scale, checks if that member
 * plays that instrument significantly more than the average for that instrument.
 */
function checkOverloadByInstrument(
  currentMembers: ScaleMember[],
  recentScales: ScaleEntry[],
): ScaleAlert[] {
  const alerts: ScaleAlert[] = [];

  // Build a map: instrument -> { memberId -> count }
  const instrumentCounts = new Map<string, Map<string, number>>();

  for (const scale of recentScales) {
    for (const sm of scale.members) {
      if (!sm.member) continue;
      if (!instrumentCounts.has(sm.instrument)) {
        instrumentCounts.set(sm.instrument, new Map());
      }
      const memberMap = instrumentCounts.get(sm.instrument)!;
      memberMap.set(sm.member.id, (memberMap.get(sm.member.id) || 0) + 1);
    }
  }

  for (const sm of currentMembers) {
    if (!sm.member) continue;
    const memberMap = instrumentCounts.get(sm.instrument);
    if (!memberMap || memberMap.size < 2) continue; // Need at least 2 people for comparison

    const counts = Array.from(memberMap.values());
    const average = counts.reduce((sum, c) => sum + c, 0) / counts.length;
    const memberCount = memberMap.get(sm.member.id) || 0;

    if (average > 0 && memberCount >= average * OVERLOAD_THRESHOLD) {
      alerts.push({
        id: `overload-instrument-${sm.member.id}-${sm.instrument}`,
        severity: "warning",
        memberId: sm.member.id,
        message: `${sm.member.name} tocou ${sm.instrument} ${memberCount}× nas últimas ${recentScales.length} escalas (média: ${average.toFixed(1)}×).`,
      });
    }
  }

  return alerts;
}

/**
 * Layer 2: Total frequency overload.
 * Counts how many DISTINCT scales a member appeared in (regardless of instrument),
 * and compares against the average across all active members.
 */
function checkOverloadTotal(
  currentMembers: ScaleMember[],
  recentScales: ScaleEntry[],
): ScaleAlert[] {
  const alerts: ScaleAlert[] = [];

  // Map: memberId -> number of distinct scales they appeared in
  const memberScaleCount = new Map<string, number>();

  for (const scale of recentScales) {
    // Use a Set to count each member only once per scale
    const uniqueMembers = new Set(
      scale.members.filter((sm) => !!sm.member).map((sm) => sm.member!.id),
    );
    for (const memberId of uniqueMembers) {
      memberScaleCount.set(memberId, (memberScaleCount.get(memberId) || 0) + 1);
    }
  }

  if (memberScaleCount.size < 2) return alerts; // Need at least 2 active members

  const counts = Array.from(memberScaleCount.values());
  const average = counts.reduce((sum, c) => sum + c, 0) / counts.length;

  // Get unique member IDs in the current scale
  const currentMemberIds = new Set(
    currentMembers.filter((sm) => !!sm.member).map((sm) => sm.member!.id),
  );

  for (const memberId of currentMemberIds) {
    const memberCount = memberScaleCount.get(memberId) || 0;

    if (average > 0 && memberCount >= average * OVERLOAD_THRESHOLD) {
      const member = currentMembers.find((sm) => sm.member?.id === memberId);
      if (member && member.member) {
        alerts.push({
          id: `overload-total-${memberId}`,
          severity: "warning",
          memberId,
          message: `${member.member.name} participou de ${memberCount} das últimas ${recentScales.length} escalas (média: ${average.toFixed(1)}).`,
        });
      }
    }
  }

  return alerts;
}

/**
 * Checks if a member has been scheduled in 2+ consecutive most-recent scales
 * and is being scheduled again.
 */
function checkConsecutiveScales(
  currentMembers: ScaleMember[],
  sortedScales: ScaleEntry[],
  currentDate?: string,
): ScaleAlert[] {
  const alerts: ScaleAlert[] = [];
  if (sortedScales.length < CONSECUTIVE_THRESHOLD) return alerts;

  // Get the N most recent scales before the current date
  const priorScales = currentDate
    ? sortedScales.filter((s) => s.date < currentDate)
    : sortedScales;

  const recentConsecutive = priorScales.slice(0, CONSECUTIVE_THRESHOLD);
  if (recentConsecutive.length < CONSECUTIVE_THRESHOLD) return alerts;

  const currentMemberIds = new Set(
    currentMembers.filter((sm) => !!sm.member).map((sm) => sm.member!.id),
  );

  for (const memberId of currentMemberIds) {
    const inAllRecent = recentConsecutive.every((scale) =>
      scale.members.some((sm) => sm.member?.id === memberId),
    );

    if (inAllRecent) {
      const member = currentMembers.find((sm) => sm.member?.id === memberId);
      if (member && member.member) {
        alerts.push({
          id: `consecutive-${memberId}`,
          severity: "warning",
          memberId,
          message: `${member.member.name} foi escalado(a) nas últimas ${CONSECUTIVE_THRESHOLD} escalas consecutivas.`,
        });
      }
    }
  }

  return alerts;
}

/**
 * Checks if the scale has at least one vocalist.
 */
function checkNoVocalist(currentMembers: ScaleMember[]): ScaleAlert[] {
  if (currentMembers.length === 0) return [];

  const hasVocalist = currentMembers.some((sm) => sm.instrument === "Voz");
  if (!hasVocalist) {
    return [
      {
        id: "no-vocalist",
        severity: "warning",
        message: "Nenhum integrante com a função Voz foi adicionado à escala.",
      },
    ];
  }
  return [];
}

/**
 * Checks for members who haven't been scheduled in 4+ weeks.
 * Only reports members NOT already in the current scale (as suggestions).
 */
function checkInactiveMembers(
  currentMembers: ScaleMember[],
  allMembers: Member[],
  sortedScales: ScaleEntry[],
): ScaleAlert[] {
  const alerts: ScaleAlert[] = [];
  const currentMemberIds = new Set(
    currentMembers.filter((sm) => !!sm.member).map((sm) => sm.member!.id),
  );

  const now = new Date();
  const inactiveThreshold = new Date(now);
  inactiveThreshold.setDate(inactiveThreshold.getDate() - INACTIVE_WEEKS * 7);
  const thresholdStr = inactiveThreshold.toISOString().slice(0, 10);

  for (const member of allMembers) {
    if (currentMemberIds.has(member.id)) continue; // Skip members already in the scale

    // Find the most recent scale containing this member
    const lastScale = sortedScales.find((scale) =>
      scale.members.some((sm) => sm.member?.id === member.id),
    );

    const isInactive = !lastScale || lastScale.date < thresholdStr;

    if (isInactive) {
      alerts.push({
        id: `inactive-${member.id}`,
        severity: "info",
        memberId: member.id,
        message: lastScale
          ? `${member.name} não é escalado(a) desde ${formatDateBR(lastScale.date)}.`
          : `${member.name} nunca foi escalado(a).`,
      });
    }
  }

  return alerts;
}

/**
 * Checks if there are any open slots (members without an assigned person).
 */
function checkOpenSlots(currentMembers: ScaleMember[]): ScaleAlert[] {
  const openSlots = currentMembers.filter((sm) => !sm.member);
  return openSlots.map((sm) => ({
    id: `open-slot-${sm.instrument}-${Math.random().toString(36).substr(2, 5)}`,
    severity: "critical",
    message: `Vaga em aberto: ${sm.instrument}`,
  }));
}

function formatDateBR(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}
