"use client";

import React from "react";
import { AlertTriangle, Info } from "lucide-react";
import { ScaleAlert } from "@/lib/utils/scale-alerts";

interface ScaleAlertIconProps {
  alerts: ScaleAlert[];
}

/**
 * Inline alert icon(s) displayed next to a member in the scale form.
 * Shows the most severe alert icon with all messages on hover.
 */
export function ScaleAlertIcon({ alerts }: ScaleAlertIconProps) {
  if (alerts.length === 0) return null;

  const hasWarning = alerts.some((a) => a.severity === "warning");
  const messages = alerts.map((a) => a.message).join("\n");

  return (
    <span className="inline-flex shrink-0 cursor-help" title={messages}>
      {hasWarning ? (
        <AlertTriangle className="h-4 w-4 text-amber-500" />
      ) : (
        <Info className="h-4 w-4 text-blue-400" />
      )}
    </span>
  );
}

interface ScaleAlertPanelProps {
  alerts: ScaleAlert[];
}

/**
 * Panel that displays general (non-member-specific) alerts
 * and a summary of member alerts, shown above the dialog footer.
 */
export function ScaleAlertPanel({ alerts }: ScaleAlertPanelProps) {
  if (alerts.length === 0) return null;

  const generalAlerts = alerts.filter((a) => !a.memberId);
  const memberAlerts = alerts.filter((a) => !!a.memberId);

  // Deduplicate member alerts by id
  const uniqueMemberAlerts = memberAlerts.filter(
    (alert, index, self) => self.findIndex((a) => a.id === alert.id) === index,
  );

  const warningAlerts = [
    ...generalAlerts.filter((a) => a.severity === "warning"),
    ...uniqueMemberAlerts.filter((a) => a.severity === "warning"),
  ];
  const infoAlerts = [
    ...generalAlerts.filter((a) => a.severity === "info"),
    ...uniqueMemberAlerts.filter((a) => a.severity === "info"),
  ];

  return (
    <div className="max-h-32 space-y-2 overflow-y-auto pr-1">
      {warningAlerts.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-500">
            <AlertTriangle className="h-3.5 w-3.5" />
            Atenção
          </div>
          <ul className="space-y-1">
            {warningAlerts.map((alert) => (
              <li
                key={alert.id}
                className="text-xs text-amber-400/80 leading-relaxed"
              >
                • {alert.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {infoAlerts.length > 0 && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-blue-400">
            <Info className="h-3.5 w-3.5" />
            Sugestões
          </div>
          <ul className="space-y-1">
            {infoAlerts.map((alert) => (
              <li
                key={alert.id}
                className="text-xs text-blue-300/80 leading-relaxed"
              >
                • {alert.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
