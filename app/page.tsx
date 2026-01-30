"use client";

import React, { useState, useMemo, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Filter,
  Calendar as CalendarIcon,
  Users,
  Music,
  MicVocal,
  Guitar,
  Drum,
  Piano,
  FileDown,
} from "lucide-react";

const getInstrumentIcon = (instrument: string) => {
  const name = instrument.toLowerCase();
  if (name.includes("voz") || name.includes("ministro")) return MicVocal;
  if (
    name.includes("guitarra") ||
    name.includes("violão") ||
    name.includes("baixo")
  )
    return Guitar;
  if (name.includes("teclado") || name.includes("piano")) return Piano;
  if (name.includes("bateria")) return Drum;
  return Music;
};
import { getMembers } from "@/lib/actions/members";
import { getScales } from "@/lib/actions/scales";
import { ScaleEntry, Member } from "@/lib/domain/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { exportScalesToPDF } from "@/lib/utils/pdf-export";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
            availableMonths.includes(currentMonth)
              ? currentMonth
              : availableMonths[0],
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

  const filteredScales = useMemo(() => {
    return scales.filter((scale) => {
      const scaleMonth = format(parseISO(scale.date), "yyyy-MM");
      const isMonthMatch = !selectedMonth || scaleMonth === selectedMonth;
      const isMemberMatch =
        selectedMember === "all" ||
        scale.members.some((m) => m.member.id === selectedMember);

      return isMonthMatch && isMemberMatch;
    });
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
    <div className="min-h-screen bg-background p-4 md:p-8">
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
            onClick={() => exportScalesToPDF(filteredScales, selectedMonth)}
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
              onValueChange={(value) => setSelectedMonth(value)}>
              <SelectTrigger className="flex w-full">
                <SelectValue placeholder="Selecione um mês/ano" />
              </SelectTrigger>
              <SelectContent>
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
              onValueChange={(value) => setSelectedMember(value)}>
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
        <div className="space-y-4">
          {filteredScales.length > 0 ? (
            filteredScales.map((scale) => (
              <Card key={scale.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {format(parseISO(scale.date), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}{" "}
                      -{" "}
                      <span className="capitalize">
                        {format(parseISO(scale.date), "EEEE", { locale: ptBR })}
                      </span>
                    </CardTitle>
                    <Badge
                      variant={
                        scale.service === "Manhã" ? "secondary" : "default"
                      }
                      className="font-semibold uppercase tracking-wider"
                    >
                      {scale.service}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {Object.entries(
                      scale.members.reduce(
                        (acc, sm) => {
                          if (!acc[sm.instrument]) acc[sm.instrument] = [];
                          acc[sm.instrument].push(sm.member);
                          return acc;
                        },
                        {} as Record<
                          string,
                          (typeof scale.members)[0]["member"][]
                        >,
                      ),
                    ).map(([instrument, members], idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-start gap-3 rounded-lg p-2 transition-colors",
                          members.some((m) => m.id === selectedMember)
                            ? "bg-primary/5"
                            : "hover:bg-muted/50",
                        )}
                      >
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          {React.createElement(getInstrumentIcon(instrument), {
                            className: "h-3.5 w-3.5",
                          })}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-1.5 text-sm">
                          <span className="font-semibold uppercase text-muted-foreground min-w-20">
                            {instrument}:
                          </span>
                          <span className="text-foreground">
                            {members.map((m, i) => (
                              <React.Fragment key={m.id + "." + i}>
                                <span
                                  className={cn(
                                    m.id === selectedMember &&
                                      "text-primary font-bold underline decoration-primary/30 underline-offset-4",
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
                            ))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
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
