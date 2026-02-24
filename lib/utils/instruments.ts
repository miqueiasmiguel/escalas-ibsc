import { Music, MicVocal, Guitar, Drum, Piano } from "lucide-react";

export const getInstrumentIcon = (instrument: string) => {
  const name = instrument.toLowerCase();
  if (name.includes("voz")) return MicVocal;
  if (
    name.includes("guitarra") ||
    name.includes("violão") ||
    name.includes("baixo")
  )
    return Guitar;
  if (name.includes("teclado") || name.includes("piano")) return Piano;
  if (name.includes("bateria") || name.includes("cajon")) return Drum;
  return Music;
};
