"use client";

import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  ChevronLeft,
  Calendar as CalendarIcon,
  Music,
  MicVocal,
  Guitar,
  Drum,
  Piano,
} from "lucide-react";

import {
  getMembers,
  addMember as apiAddMember,
  deleteMember as apiDeleteMember,
  updateMember as apiUpdateMember,
} from "@/lib/actions/members";
import {
  getScales,
  saveScale as apiSaveScale,
  deleteScale as apiDeleteScale,
} from "@/lib/actions/scales";
import {
  ScaleEntry,
  Member,
  Instrument,
  ServiceType,
} from "@/lib/domain/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const INSTRUMENTS: Instrument[] = [
  "Ministro",
  "Voz",
  "Violão",
  "Guitarra",
  "Baixo",
  "Teclado",
  "Bateria",
];

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

export default function AdminDashboard() {
  const [members, setMembers] = useState<Member[]>([]);
  const [scales, setScales] = useState<ScaleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("scales");
  const [mounted, setMounted] = React.useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersData, scalesData] = await Promise.all([
        getMembers(),
        getScales(),
      ]);
      setMembers(membersData);
      setScales(scalesData);
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
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const [isScaleDialogOpen, setIsScaleDialogOpen] = useState(false);
  const [editingScale, setEditingScale] = useState<Partial<ScaleEntry>>({
    date: format(new Date(), "yyyy-MM-dd"),
    service: "Noite",
    members: [],
  });

  const saveMember = async () => {
    if (newMemberName.trim()) {
      try {
        if (editingMember) {
          await apiUpdateMember(editingMember.id, newMemberName);
        } else {
          await apiAddMember(newMemberName);
        }
        setNewMemberName("");
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
    setIsMemberDialogOpen(true);
  };

  const openEditMemberDialog = (member: Member) => {
    setEditingMember(member);
    setNewMemberName(member.name);
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

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
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
    <div className="min-h-screen bg-background p-4 md:p-8">
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
          <TabsList className="grid w-full max-w-100 grid-cols-2">
            <TabsTrigger value="scales" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Escalas
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Integrantes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scales" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Próximas Escalas</h2>
              <Dialog
                open={isScaleDialogOpen}
                onOpenChange={setIsScaleDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Escala
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingScale.id ? "Editar Escala" : "Criar Nova Escala"}
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
                            })}
                        >
                          <SelectTrigger className="flex w-full">
                            <SelectValue placeholder="Selecione um mês/ano" />
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
                                { member: members[0], instrument: "Voz" },
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
                                      instrument: e.target.value as Instrument,
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
                                  value={sm.member.id}
                                  onChange={(e) => {
                                    const member = members.find(
                                      (m) => m.id === e.target.value,
                                    );
                                    if (member) {
                                      const current = [
                                        ...(editingScale.members || []),
                                      ];
                                      current[index] = {
                                        ...current[index],
                                        member,
                                      };
                                      setEditingScale({
                                        ...editingScale,
                                        members: current,
                                      });
                                    }
                                  }}
                                >
                                  {members.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
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

            <div className="grid gap-4">
              {scales
                .map((scale) => (
                  <Card key={scale.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="rounded-full bg-primary/10 p-2 text-primary">
                            <CalendarIcon className="h-5 w-5" />
                          </div>
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
                              variant="outline"
                              className="text-[10px] px-1.5 flex items-center gap-1"
                            >
                              {React.createElement(
                                getInstrumentIcon(sm.instrument),
                                {
                                  className:
                                    "h-2.5 w-2.5 text-muted-foreground",
                                },
                              )}
                              {sm.member.name}
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
                ))}
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Ministério de Louvor</h2>
              <Dialog
                open={isMemberDialogOpen}
                onOpenChange={setIsMemberDialogOpen}
              >
                <Button onClick={openNewMemberDialog} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Membro
                </Button>
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
                          {member.name}
                        </TableCell>
                        <TableCell className="text-right">
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
        </Tabs>
      </div>
    </div>
  );
}
