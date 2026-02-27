"use client";

import React, { useState, useMemo } from "react";
import { format, parseISO, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  ChevronLeft,
  Calendar as CalendarIcon,
  AlertTriangle,
  XCircle,
  CalendarOff,
} from "lucide-react";

import {
  getMembers,
  addMember as apiAddMember,
  deleteMember as apiDeleteMember,
  updateMember as apiUpdateMember,
  addUnavailability,
  deleteUnavailability,
  addRecurringUnavailability,
  deleteRecurringUnavailability,
} from "@/lib/actions/members";
import {
  getScales,
  saveScale as apiSaveScale,
  deleteScale as apiDeleteScale,
} from "@/lib/actions/scales";
import {
  getTemplates,
  saveTemplate as apiSaveTemplate,
  deleteTemplate as apiDeleteTemplate,
  generateMonthScales as apiGenerateMonthScales,
} from "@/lib/actions/templates";
import {
  ScaleEntry,
  Member,
  Instrument,
  ServiceType,
  ScaleTemplate,
} from "@/lib/domain/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { analyzeScale } from "@/lib/utils/scale-alerts";
import {
  ScaleAlertIcon,
  ScaleAlertPanel,
} from "@/components/scale-alert-badge";
import { getInstrumentIcon } from "@/lib/utils/instruments";

const INSTRUMENTS: Instrument[] = [
  "Voz",
  "Violão",
  "Guitarra",
  "Baixo",
  "Teclado",
  "Bateria",
  "Cajon",
];

const DAYS_OF_WEEK = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export default function AdminDashboard() {
  const [members, setMembers] = useState<Member[]>([]);
  const [scales, setScales] = useState<ScaleEntry[]>([]);
  const [templates, setTemplates] = useState<ScaleTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("scales");
  const [mounted, setMounted] = React.useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersData, scalesData, templatesData] = await Promise.all([
        getMembers(),
        getScales(),
        getTemplates(),
      ]);
      setMembers(membersData);
      setScales(scalesData);
      setTemplates(templatesData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const [newMemberName, setNewMemberName] = useState("");
  const [selectedInstruments, setSelectedInstruments] = useState<Instrument[]>(
    [],
  );
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const [isScaleDialogOpen, setIsScaleDialogOpen] = useState(false);
  const [editingScale, setEditingScale] = useState<Partial<ScaleEntry>>({
    date: format(new Date(), "yyyy-MM-dd"),
    service: "Noite",
    members: [],
  });

  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<
    Partial<ScaleTemplate>
  >({
    description: "",
    dayOfWeek: 0,
    service: "Manhã",
    requiresConfirmation: false,
    instruments: [],
    active: true,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [filterMonth, setFilterMonth] = useState("");

  const [isUnavailDialogOpen, setIsUnavailDialogOpen] = useState(false);
  const [selectedMemberUnavail, setSelectedMemberUnavail] =
    useState<Member | null>(null);
  const [newUnavailStart, setNewUnavailStart] = useState("");
  const [newUnavailEnd, setNewUnavailEnd] = useState("");
  const [newRecurringDay, setNewRecurringDay] = useState("0");

  React.useEffect(() => {
    if (mounted) {
      setFilterMonth(format(new Date(), "yyyy-MM"));
    }
  }, [mounted]);

  const generationMonths = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = addMonths(new Date(), i);
      return {
        value: format(d, "yyyy-MM"),
        label: format(d, "MMMM 'de' yyyy", { locale: ptBR }),
      };
    });
  }, []);

  const filteredScales = useMemo(() => {
    return scales.filter((s) => s.date.startsWith(filterMonth));
  }, [scales, filterMonth]);

  const scaleAlerts = useMemo(
    () => analyzeScale(editingScale, scales, members),
    [editingScale, scales, members],
  );

  const getAlertsForMember = (memberId: string) =>
    scaleAlerts.filter((a) => a.memberId === memberId);

  const saveMember = async () => {
    if (newMemberName.trim()) {
      try {
        if (editingMember) {
          await apiUpdateMember(
            editingMember.id,
            newMemberName,
            selectedInstruments,
          );
        } else {
          await apiAddMember(newMemberName, selectedInstruments);
        }
        setNewMemberName("");
        setSelectedInstruments([]);
        setEditingMember(null);
        setIsMemberDialogOpen(false);
        await fetchData();
      } catch (error) {
        console.error("Failed to save member:", error);
      }
    }
  };

  const openNewMemberDialog = () => {
    setEditingMember(null);
    setNewMemberName("");
    setSelectedInstruments([]);
    setIsMemberDialogOpen(true);
  };

  const openEditMemberDialog = (member: Member) => {
    setEditingMember(member);
    setNewMemberName(member.name);
    setSelectedInstruments(member.instruments || []);
    setIsMemberDialogOpen(true);
  };

  const deleteMember = async (id: string) => {
    try {
      await apiDeleteMember(id);
      await fetchData();
    } catch (error) {
      console.error("Failed to delete member:", error);
    }
  };

  const fetchAndUpdateMember = async () => {
    await fetchData();
    const updatedMembers = await getMembers();
    if (selectedMemberUnavail) {
      const updated = updatedMembers.find(
        (m) => m.id === selectedMemberUnavail.id,
      );
      setSelectedMemberUnavail(updated || null);
    }
  };

  const saveUnavailability = async () => {
    if (selectedMemberUnavail && newUnavailStart && newUnavailEnd) {
      try {
        await addUnavailability(
          selectedMemberUnavail.id,
          new Date(newUnavailStart).toISOString(),
          new Date(newUnavailEnd).toISOString(),
        );
        setNewUnavailStart("");
        setNewUnavailEnd("");
        await fetchAndUpdateMember();
      } catch (error) {
        console.error("Failed to save unavailability:", error);
      }
    }
  };

  const handleDeleteUnavailability = async (id: string) => {
    try {
      await deleteUnavailability(id);
      await fetchAndUpdateMember();
    } catch (error) {
      console.error("Failed to delete unavailability:", error);
    }
  };

  const saveRecurringUnavailability = async () => {
    if (selectedMemberUnavail && newRecurringDay) {
      try {
        await addRecurringUnavailability(
          selectedMemberUnavail.id,
          parseInt(newRecurringDay),
        );
        setNewRecurringDay("0");
        await fetchAndUpdateMember();
      } catch (error) {
        console.error("Failed to save recurring unavailability:", error);
      }
    }
  };

  const handleDeleteRecurringUnavailability = async (id: string) => {
    try {
      await deleteRecurringUnavailability(id);
      await fetchAndUpdateMember();
    } catch (error) {
      console.error("Failed to delete recurring unavailability:", error);
    }
  };

  const saveScale = async () => {
    if (editingScale.date && editingScale.service) {
      const scaleToSave: ScaleEntry = {
        id: editingScale.id || Math.random().toString(36).substr(2, 9),
        date: editingScale.date,
        service: editingScale.service as ServiceType,
        members: editingScale.members || [],
      };

      try {
        await apiSaveScale(scaleToSave);
        setIsScaleDialogOpen(false);
        setEditingScale({
          date: format(new Date(), "yyyy-MM-dd"),
          service: "Noite",
          members: [],
        });
        await fetchData();
      } catch (error) {
        console.error("Failed to save scale:", error);
      }
    }
  };

  const deleteScale = async (id: string) => {
    try {
      await apiDeleteScale(id);
      await fetchData();
    } catch (error) {
      console.error("Failed to delete scale:", error);
    }
  };

  const saveTemplate = async () => {
    if (editingTemplate.description && editingTemplate.service) {
      const templateToSave: ScaleTemplate = {
        id: editingTemplate.id || "",
        description: editingTemplate.description,
        dayOfWeek: editingTemplate.dayOfWeek ?? 0,
        service: editingTemplate.service as ServiceType,
        requiresConfirmation: editingTemplate.requiresConfirmation ?? false,
        instruments: editingTemplate.instruments || [],
        active: editingTemplate.active ?? true,
      };

      try {
        await apiSaveTemplate(templateToSave);
        setIsTemplateDialogOpen(false);
        await fetchData();
      } catch (error) {
        console.error("Failed to save template:", error);
      }
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await apiDeleteTemplate(id);
      await fetchData();
    } catch (error) {
      console.error("Failed to delete template:", error);
    }
  };

  const generateMonthScales = async () => {
    try {
      setIsGenerating(true);
      await apiGenerateMonthScales(filterMonth);
      await fetchData();
    } catch (error) {
      console.error("Failed to generate scales:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground animate-pulse">
            Carregando dados...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-primary">
                Painel do Líder
              </h1>
              <p className="text-muted-foreground">
                Gerencie integrantes e a escala do ministério.
              </p>
            </div>
          </div>
        </header>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="scales" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Escalas
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Integrantes
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Modelos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scales" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Próximas Escalas</h2>
              <div className="flex items-center gap-2">
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {generationMonths.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        <span className="capitalize">{m.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={generateMonthScales}
                  disabled={isGenerating}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Gerar
                </Button>
                <Dialog
                  open={isScaleDialogOpen}
                  onOpenChange={setIsScaleDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      className="gap-2"
                      onClick={() => {
                        setEditingScale({
                          date: format(new Date(), "yyyy-MM-dd"),
                          service: "Noite",
                          members: [],
                        });
                        setIsScaleDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Nova Escala
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingScale.id
                          ? "Editar Escala"
                          : "Criar Nova Escala"}
                      </DialogTitle>
                      <DialogDescription>
                        Preencha os detalhes do culto e escale os músicos.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="date">Data</Label>
                          <Input
                            id="date"
                            type="date"
                            value={editingScale.date}
                            onChange={(e) =>
                              setEditingScale({
                                ...editingScale,
                                date: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="service">Culto</Label>
                          <Select
                            defaultValue={editingScale.service}
                            onValueChange={(value) =>
                              setEditingScale({
                                ...editingScale,
                                service: value as ServiceType,
                              })
                            }
                          >
                            <SelectTrigger className="flex w-full">
                              <SelectValue placeholder="Selecione um culto" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Manhã">Manhã</SelectItem>
                              <SelectItem value="Noite">Noite</SelectItem>
                              <SelectItem value="Especial">Especial</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Integrantes Escalados</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1"
                            onClick={() => {
                              const current = editingScale.members || [];
                              setEditingScale({
                                ...editingScale,
                                members: [
                                  ...current,
                                  { member: undefined, instrument: "Voz" },
                                ],
                              });
                            }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Adicionar Integrante
                          </Button>
                        </div>

                        <div className="max-h-75 space-y-3 overflow-y-auto pr-2">
                          {(editingScale.members || []).map((sm, index) => (
                            <div
                              key={index}
                              className="flex items-end gap-3 rounded-lg border bg-muted/30 p-3"
                            >
                              <div className="grid flex-1 grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="text-[10px] uppercase text-muted-foreground">
                                    Instrumento
                                  </Label>
                                  <select
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    value={sm.instrument}
                                    onChange={(e) => {
                                      const current = [
                                        ...(editingScale.members || []),
                                      ];
                                      current[index] = {
                                        ...current[index],
                                        instrument: e.target
                                          .value as Instrument,
                                      };
                                      setEditingScale({
                                        ...editingScale,
                                        members: current,
                                      });
                                    }}
                                  >
                                    {INSTRUMENTS.map((inst) => (
                                      <option key={inst} value={inst}>
                                        {inst}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-[10px] uppercase text-muted-foreground">
                                    Integrante
                                  </Label>
                                  <select
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    value={sm.member?.id || ""}
                                    onChange={(e) => {
                                      const member = members.find(
                                        (m) => m.id === e.target.value,
                                      );
                                      const current = [
                                        ...(editingScale.members || []),
                                      ];
                                      current[index] = {
                                        ...current[index],
                                        member: member,
                                      };
                                      setEditingScale({
                                        ...editingScale,
                                        members: current,
                                      });
                                    }}
                                  >
                                    <option value="">Selecione...</option>
                                    {(() => {
                                      const filteredMembers = members.filter(
                                        (m) =>
                                          m.instruments.includes(sm.instrument),
                                      );
                                      const displayMembers =
                                        filteredMembers.length > 0
                                          ? filteredMembers
                                          : members;

                                      return displayMembers
                                        .sort((a, b) =>
                                          a.name.localeCompare(b.name),
                                        )
                                        .map((m) => (
                                          <option key={m.id} value={m.id}>
                                            {m.name}
                                          </option>
                                        ));
                                    })()}
                                  </select>
                                </div>
                              </div>
                              <ScaleAlertIcon
                                alerts={
                                  sm.member
                                    ? getAlertsForMember(sm.member.id)
                                    : []
                                }
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  const current = [
                                    ...(editingScale.members || []),
                                  ];
                                  current.splice(index, 1);
                                  setEditingScale({
                                    ...editingScale,
                                    members: current,
                                  });
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}

                          {(editingScale.members || []).length === 0 && (
                            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
                              <Users className="mb-2 h-8 w-8 text-muted-foreground/30" />
                              <p className="text-sm text-muted-foreground">
                                Nenhum integrante adicionado à escala.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <ScaleAlertPanel alerts={scaleAlerts} />
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsScaleDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={saveScale}>Salvar Escala</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid gap-4">
              {filteredScales.map((scale) => {
                const alerts = analyzeScale(scale, scales, members);
                const criticalCount = alerts.filter(
                  (a) => a.severity === "critical",
                ).length;
                const warningCount = alerts.filter(
                  (a) => a.severity === "warning",
                ).length;
                return (
                  <Card key={scale.id}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <CalendarIcon className="h-5 w-5" />
                          <div>
                            <div className="font-semibold flex items-center gap-2">
                              {format(parseISO(scale.date), "dd/MM/yyyy", {
                                locale: ptBR,
                              })}
                              <Badge
                                variant={
                                  scale.service === "Manhã"
                                    ? "secondary"
                                    : "default"
                                }
                                className="text-[10px] uppercase font-bold"
                              >
                                {scale.service}
                              </Badge>
                              {criticalCount > 0 && (
                                <span
                                  className="inline-flex items-center gap-1 cursor-help"
                                  title={alerts
                                    .filter((a) => a.severity === "critical")
                                    .map((a) => a.message)
                                    .join("\n")}
                                >
                                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                                  <span className="text-[10px] text-red-500 font-medium">
                                    {criticalCount}
                                  </span>
                                </span>
                              )}
                              {warningCount > 0 && (
                                <span
                                  className="inline-flex items-center gap-1 cursor-help"
                                  title={alerts
                                    .filter((a) => a.severity === "warning")
                                    .map((a) => a.message)
                                    .join("\n")}
                                >
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                  <span className="text-[10px] text-amber-500 font-medium">
                                    {warningCount}
                                  </span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(scale.date), "EEEE", {
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {scale.members.slice(0, 3).map((sm, i) => (
                            <Badge
                              key={i}
                              variant={sm.member ? "outline" : "secondary"}
                              className="text-[10px] px-1.5 flex items-center gap-1 border-dashed"
                            >
                              {React.createElement(
                                getInstrumentIcon(sm.instrument),
                                {
                                  className: "h-2 w-2 text-muted-foreground",
                                },
                              )}
                              {sm.member
                                ? sm.member.name
                                : `Vaga: ${sm.instrument}`}
                            </Badge>
                          ))}
                          {scale.members.length > 3 && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5"
                            >
                              +{scale.members.length - 3}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingScale(scale);
                              setIsScaleDialogOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => deleteScale(scale.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filteredScales.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                  <CalendarIcon className="mb-2 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma escala encontrada para este mês.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Ministério de Louvor</h2>
              <Dialog
                open={isMemberDialogOpen}
                onOpenChange={setIsMemberDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button onClick={openNewMemberDialog} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Membro
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingMember ? "Editar Integrante" : "Novo Integrante"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingMember
                        ? "Edite os dados do músico."
                        : "Adicione um novo músico ao ministério."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo</Label>
                      <Input
                        id="name"
                        placeholder="Ex: Pedro Silva"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveMember()}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Instrumentos</Label>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {INSTRUMENTS.map((inst) => {
                          const isSelected = selectedInstruments.includes(inst);
                          const Icon = getInstrumentIcon(inst);
                          return (
                            <Badge
                              key={inst}
                              variant={isSelected ? "default" : "outline"}
                              className={cn(
                                "cursor-pointer gap-1 px-3 py-1 text-xs transition-colors hover:opacity-80",
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:bg-muted",
                              )}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedInstruments(
                                    selectedInstruments.filter(
                                      (i) => i !== inst,
                                    ),
                                  );
                                } else {
                                  setSelectedInstruments([
                                    ...selectedInstruments,
                                    inst,
                                  ]);
                                }
                              }}
                            >
                              <Icon className="h-3 w-3" />
                              {inst}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsMemberDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={saveMember}>
                      {editingMember ? "Salvar" : "Adicionar"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog
                open={isUnavailDialogOpen}
                onOpenChange={setIsUnavailDialogOpen}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      Indisponibilidades: {selectedMemberUnavail?.name}
                    </DialogTitle>
                    <DialogDescription>
                      Gerencie os períodos em que este integrante não poderá ser
                      escalado.
                    </DialogDescription>
                  </DialogHeader>

                  <Tabs defaultValue="specific" className="mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="specific">
                        Datas Específicas
                      </TabsTrigger>
                      <TabsTrigger value="recurring">Recorrentes</TabsTrigger>
                    </TabsList>

                    <TabsContent value="specific" className="grid gap-4 py-4">
                      <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                        {selectedMemberUnavail?.unavailabilities?.map((u) => (
                          <div
                            key={u.id}
                            className="flex justify-between items-center bg-muted/50 p-3 rounded-md border"
                          >
                            <div className="text-sm space-y-1">
                              <div>
                                <span className="font-semibold">Início:</span>{" "}
                                {format(parseISO(u.start), "dd/MM/yyyy HH:mm", {
                                  locale: ptBR,
                                })}
                              </div>
                              <div>
                                <span className="font-semibold">Fim:</span>{" "}
                                {format(parseISO(u.end), "dd/MM/yyyy HH:mm", {
                                  locale: ptBR,
                                })}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive h-8 w-8 hover:bg-destructive/10"
                              onClick={() => handleDeleteUnavailability(u.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {(!selectedMemberUnavail?.unavailabilities ||
                          selectedMemberUnavail.unavailabilities.length ===
                            0) && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhuma indisponibilidade cadastrada.
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t">
                        <div className="space-y-2">
                          <Label>Início</Label>
                          <Input
                            type="datetime-local"
                            value={newUnavailStart}
                            onChange={(e) => setNewUnavailStart(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fim</Label>
                          <Input
                            type="datetime-local"
                            value={newUnavailEnd}
                            onChange={(e) => setNewUnavailEnd(e.target.value)}
                          />
                        </div>
                      </div>
                      <Button
                        onClick={saveUnavailability}
                        disabled={!newUnavailStart || !newUnavailEnd}
                        className="w-full mt-2"
                      >
                        Adicionar Indisponibilidade
                      </Button>
                    </TabsContent>

                    <TabsContent value="recurring" className="grid gap-4 py-4">
                      <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                        {selectedMemberUnavail?.recurringUnavailabilities?.map(
                          (u) => (
                            <div
                              key={u.id}
                              className="flex justify-between items-center bg-muted/50 p-3 rounded-md border"
                            >
                              <div className="text-sm">
                                <span className="font-semibold">Toda:</span>{" "}
                                {DAYS_OF_WEEK[u.dayOfWeek]}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive h-8 w-8 hover:bg-destructive/10"
                                onClick={() =>
                                  handleDeleteRecurringUnavailability(u.id)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ),
                        )}
                        {(!selectedMemberUnavail?.recurringUnavailabilities ||
                          selectedMemberUnavail.recurringUnavailabilities
                            .length === 0) && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhuma indisponibilidade recorrente.
                          </p>
                        )}
                      </div>
                      <div className="space-y-2 mt-2 pt-4 border-t">
                        <Label>Dia da Semana</Label>
                        <Select
                          value={newRecurringDay}
                          onValueChange={setNewRecurringDay}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS_OF_WEEK.map((day, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={saveRecurringUnavailability}
                        className="w-full mt-2"
                      >
                        Adicionar Indisponibilidade Recorrente
                      </Button>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{member.name}</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(member.instruments || []).map((inst) => (
                                <Badge
                                  key={inst}
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0 leading-tight"
                                >
                                  {inst}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedMemberUnavail(member);
                              setIsUnavailDialogOpen(true);
                            }}
                          >
                            <CalendarOff className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditMemberDialog(member)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => deleteMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Modelos de Escala</h2>
              <Dialog
                open={isTemplateDialogOpen}
                onOpenChange={setIsTemplateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    className="gap-2"
                    onClick={() => {
                      setEditingTemplate({
                        description: "",
                        dayOfWeek: 0,
                        service: "Manhã",
                        requiresConfirmation: false,
                        instruments: [],
                        active: true,
                      });
                      setIsTemplateDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Novo Modelo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingTemplate.id ? "Editar Modelo" : "Novo Modelo"}
                    </DialogTitle>
                    <DialogDescription>
                      Defina um padrão de escala para geração automática.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="desc">Descrição</Label>
                      <Input
                        id="desc"
                        placeholder="Ex: Culto de Domingo"
                        value={editingTemplate.description}
                        onChange={(e) =>
                          setEditingTemplate({
                            ...editingTemplate,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dayOfWeek">Dia da Semana</Label>
                        <Select
                          value={editingTemplate.dayOfWeek?.toString()}
                          onValueChange={(val) =>
                            setEditingTemplate({
                              ...editingTemplate,
                              dayOfWeek: parseInt(val),
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS_OF_WEEK.map((day, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="service">Culto</Label>
                        <Select
                          value={editingTemplate.service}
                          onValueChange={(val) =>
                            setEditingTemplate({
                              ...editingTemplate,
                              service: val as ServiceType,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Manhã">Manhã</SelectItem>
                            <SelectItem value="Noite">Noite</SelectItem>
                            <SelectItem value="Especial">Especial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Instrumentos Necessários</Label>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {INSTRUMENTS.map((inst) => {
                          const isSelected =
                            editingTemplate.instruments?.includes(inst);
                          const Icon = getInstrumentIcon(inst);
                          return (
                            <Badge
                              key={inst}
                              variant={isSelected ? "default" : "outline"}
                              className={cn(
                                "cursor-pointer gap-1 px-3 py-1 text-xs transition-colors hover:opacity-80",
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:bg-muted",
                              )}
                              onClick={() => {
                                const current =
                                  editingTemplate.instruments || [];
                                if (isSelected) {
                                  setEditingTemplate({
                                    ...editingTemplate,
                                    instruments: current.filter(
                                      (i) => i !== inst,
                                    ),
                                  });
                                } else {
                                  setEditingTemplate({
                                    ...editingTemplate,
                                    instruments: [...current, inst],
                                  });
                                }
                              }}
                            >
                              <Icon className="h-3 w-3" />
                              {inst}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsTemplateDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={saveTemplate}>Salvar Modelo</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold">
                          {template.description}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{DAYS_OF_WEEK[template.dayOfWeek]}</span>
                          <span>•</span>
                          <span>{template.service}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(template.instruments || []).map((inst) => (
                            <Badge
                              key={inst}
                              variant="secondary"
                              className="text-[10px]"
                            >
                              {inst}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingTemplate(template);
                            setIsTemplateDialogOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => deleteTemplate(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {templates.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                  <Plus className="mb-2 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum modelo de escala cadastrado.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
