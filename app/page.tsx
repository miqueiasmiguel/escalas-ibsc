"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  format,
  parseISO,
  isAfter,
  isBefore,
  startOfDay,
  isSameDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Filter,
  Calendar as CalendarIcon,
  Users,
  FileDown,
} from "lucide-react";

import { getMembers } from "@/lib/actions/members";
import { getScales } from "@/lib/actions/scales";
import { ScaleEntry, Member } from "@/lib/domain/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { exportScalesToPDF } from "@/lib/utils/pdf-export";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getInstrumentIcon } from "@/lib/utils/instruments";

export default function ScalePage() {
  const [scales, setScales] = useState<ScaleEntry[]>([]);
  const [membersList, setMembersList] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const months = useMemo(() => {
    const dates = scales.map((s) => format(parseISO(s.date), "yyyy-MM"));
    return Array.from(new Set(dates)).sort((a, b) => b.localeCompare(a));
  }, [scales]);

  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedMember, setSelectedMember] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scalesData, membersData] = await Promise.all([
          getScales(),
          getMembers(),
        ]);
        setScales(scalesData);
        setMembersList(membersData);

        const availableMonths = Array.from(
          new Set(scalesData.map((s) => format(parseISO(s.date), "yyyy-MM"))),
        ).sort((a, b) => b.localeCompare(a));

        if (availableMonths.length > 0) {
          const currentMonth = format(new Date(), "yyyy-MM");
          setSelectedMonth(
            availableMonths.includes(currentMonth) ? currentMonth : "all",
          );
        }
      } catch (error) {
        console.error("Failed to fetch scales:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categorizedScales = useMemo(() => {
    const today = startOfDay(new Date());

    const filtered = scales
      .filter((scale) => {
        const scaleMonth = format(parseISO(scale.date), "yyyy-MM");
        const isMonthMatch =
          selectedMonth === "all" ||
          !selectedMonth ||
          scaleMonth === selectedMonth;
        const isMemberMatch =
          selectedMember === "all" ||
          scale.members.some((m) => m.member?.id === selectedMember);

        return isMonthMatch && isMemberMatch;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    const pastScales = filtered
      .filter((s) => isBefore(parseISO(s.date), today))
      .reverse();
    const future = filtered.filter(
      (s) =>
        isSameDay(parseISO(s.date), today) || isAfter(parseISO(s.date), today),
    );

    const nextScale = future.length > 0 ? future[0] : null;
    const upcomingScales = future.length > 1 ? future.slice(1) : [];

    return { nextScale, upcomingScales, pastScales, all: filtered };
  }, [scales, selectedMonth, selectedMember]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground animate-pulse">
            Carregando escalas...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">
              Escalas de Louvor
            </h1>
            <p className="text-muted-foreground">
              Visualize e filtre as escalas do ministério.
            </p>
          </div>
          <button
            onClick={() =>
              exportScalesToPDF(categorizedScales.all, selectedMonth)
            }
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            <FileDown className="h-4 w-4" />
            Exportar PDF
          </button>
        </header>

        {/* Filters */}
        <div className="grid grid-cols-1 gap-4 rounded-xl border bg-card p-4 shadow-sm md:grid-cols-2">
          <div className="space-y-2">
            <Label>
              <CalendarIcon className="h-4 w-4" />
              Mês/Ano
            </Label>
            <Select
              defaultValue={selectedMonth}
              onValueChange={(value) => setSelectedMonth(value)}
            >
              <SelectTrigger className="flex w-full">
                <SelectValue placeholder="Selecione um mês/ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m} value={m}>
                    {format(parseISO(`${m}-01`), "MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              <Users className="h-4 w-4" />
              Integrante
            </Label>
            <Select
              defaultValue={selectedMember}
              onValueChange={(value) => setSelectedMember(value)}
            >
              <SelectTrigger className="flex w-full">
                <SelectValue placeholder="Selecione um integrante" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os integrantes</SelectItem>
                {membersList.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Scale List */}
        <div className="space-y-12">
          {categorizedScales.nextScale ||
          categorizedScales.upcomingScales.length > 0 ||
          categorizedScales.pastScales.length > 0 ? (
            <>
              {/* Próxima Escala */}
              {categorizedScales.nextScale && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <h2 className="text-xl font-bold text-primary uppercase tracking-wider">
                      Próxima Escala
                    </h2>
                  </div>
                  <ScaleCard
                    scale={categorizedScales.nextScale}
                    isNext
                    selectedMember={selectedMember}
                  />
                </section>
              )}

              {/* Escalas Futuras */}
              {categorizedScales.upcomingScales.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-xl font-bold text-muted-foreground uppercase tracking-wider">
                    Próximas Datas
                  </h2>
                  <div className="space-y-4">
                    {categorizedScales.upcomingScales.map((scale) => (
                      <ScaleCard
                        key={scale.id}
                        scale={scale}
                        selectedMember={selectedMember}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Histórico */}
              {categorizedScales.pastScales.length > 0 && (
                <section className="space-y-4 opacity-80">
                  <h2 className="text-xl font-bold text-muted-foreground uppercase tracking-wider">
                    Histórico Anterior
                  </h2>
                  <div className="space-y-4">
                    {categorizedScales.pastScales.map((scale) => (
                      <ScaleCard
                        key={scale.id}
                        scale={scale}
                        selectedMember={selectedMember}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center text-muted-foreground">
              <Filter className="mb-4 h-12 w-12 opacity-20" />
              <p>Nenhuma escala encontrada para os filtros selecionados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScaleCard({
  scale,
  isNext,
  selectedMember,
}: {
  scale: ScaleEntry;
  isNext?: boolean;
  selectedMember: string;
}) {
  return (
    <Card
      key={scale.id}
      className={cn(
        "overflow-hidden transition-all duration-300",
        isNext
          ? "border-primary/50 shadow-lg shadow-primary/10 ring-1 ring-primary/20"
          : "hover:shadow-md",
      )}
    >
      <CardHeader
        className={cn(
          isNext &&
            "bg-gradient-to-r from-primary/5 via-transparent to-transparent",
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className={cn("text-lg", isNext && "text-primary")}>
              {format(parseISO(scale.date), "dd/MM/yyyy", {
                locale: ptBR,
              })}{" "}
              -{" "}
              <span className="capitalize">
                {format(parseISO(scale.date), "EEEE", { locale: ptBR })}
              </span>
            </CardTitle>
            {isNext && (
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-primary/70">
                {selectedMember !== "all"
                  ? "Sua escala mais próxima"
                  : "Próxima escala do ministério"}
              </span>
            )}
          </div>
          <Badge
            variant={scale.service === "Manhã" ? "secondary" : "default"}
            className={cn(
              "font-semibold uppercase tracking-wider",
              isNext && "bg-primary text-primary-foreground",
            )}
          >
            {scale.service}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div>
          {Object.entries(
            scale.members.reduce(
              (acc, sm) => {
                if (!acc[sm.instrument]) acc[sm.instrument] = [];
                if (sm.member) acc[sm.instrument].push(sm.member);
                return acc;
              },
              {} as Record<string, Member[]>,
            ),
          ).map(([instrument, members], idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-3 rounded-lg p-2 transition-colors",
                members.some((m) => m.id === selectedMember)
                  ? "bg-primary/5"
                  : "hover:bg-muted/50",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-primary",
                  isNext ? "bg-primary/20" : "bg-primary/10",
                )}
              >
                {React.createElement(getInstrumentIcon(instrument), {
                  className: "h-3.5 w-3.5",
                })}
              </div>
              <div className="flex flex-wrap items-center gap-x-1.5 text-sm">
                <span className="min-w-20 font-semibold uppercase text-muted-foreground">
                  {instrument}:
                </span>
                <span className="text-foreground">
                  {members.length > 0 ? (
                    members.map((m, i) => (
                      <React.Fragment key={m.id + "." + i}>
                        <span
                          className={cn(
                            m.id === selectedMember &&
                              "font-bold text-primary underline decoration-primary/30 underline-offset-4",
                          )}
                        >
                          {m.name}
                        </span>
                        {i < members.length - 2
                          ? ", "
                          : i === members.length - 2
                            ? " e "
                            : ""}
                      </React.Fragment>
                    ))
                  ) : (
                    <span className="italic text-muted-foreground">
                      Vaga disponível
                    </span>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
