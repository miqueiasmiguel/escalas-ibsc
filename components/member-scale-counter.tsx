"use client";

import React, { useState, useMemo } from "react";
import { ScaleEntry, Member } from "@/lib/domain/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MemberScaleCounterProps {
  scales: ScaleEntry[];
  members: Member[];
  selectedMemberId?: string | null;
  onMemberClick?: (id: string | null) => void;
}

export function MemberScaleCounter({
  scales,
  members,
  selectedMemberId,
  onMemberClick,
}: MemberScaleCounterProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};

    // Count appearances in filtered scales
    scales.forEach((scale) => {
      scale.members.forEach((sm) => {
        if (sm.member) {
          counts[sm.member.id] = (counts[sm.member.id] || 0) + 1;
        }
      });
    });

    // Create sorted list
    return Object.entries(counts)
      .map(([id, count]) => {
        const member = members.find((m) => m.id === id);
        return {
          id,
          name: member?.name || "Desconhecido",
          count,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [scales, members]);

  if (stats.length === 0) return null;

  const handleMemberClick = (id: string) => {
    if (!onMemberClick) return;
    if (selectedMemberId === id) {
      onMemberClick(null);
    } else {
      onMemberClick(id);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-72 transition-all duration-300 ease-in-out">
      <Card className="shadow-2xl border-primary/20 bg-background/95 backdrop-blur-sm overflow-hidden">
        <CardHeader
          className="p-3 flex flex-row items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-bold">Resumo do Mês</CardTitle>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            {isMinimized ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-3 pt-0 max-h-80 overflow-y-auto">
            <div className="space-y-1 mt-2">
              {stats.map((item) => {
                const isSelected = selectedMemberId === item.id;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-md transition-all text-xs cursor-pointer",
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                        : "hover:bg-muted/80",
                    )}
                    onClick={() => handleMemberClick(item.id)}
                  >
                    <span className="font-semibold truncate pr-2">
                      {item.name}
                    </span>
                    <Badge
                      variant={isSelected ? "outline" : "secondary"}
                      className={cn(
                        "font-bold tabular-nums h-5 px-1.5 min-w-[1.25rem] flex justify-center",
                        isSelected &&
                          "border-primary-foreground text-primary-foreground bg-transparent",
                      )}
                    >
                      {item.count}
                    </Badge>
                  </div>
                );
              })}
            </div>
            {selectedMemberId && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-[10px] h-7 text-muted-foreground hover:text-primary"
                onClick={() => onMemberClick?.(null)}
              >
                Limpar destaque
              </Button>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
