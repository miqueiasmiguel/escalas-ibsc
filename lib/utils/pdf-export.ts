import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScaleEntry } from "../domain/types";

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

export const exportScalesToPDF = (
  scales: ScaleEntry[],
  selectedMonth: string,
) => {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  const now = new Date();

  // Configuration
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Header - Title 1
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Departamento de Música", pageWidth / 2, 20, { align: "center" });

  // Header - Title 2
  const monthName = format(parseISO(`${selectedMonth}-01`), "MMMM 'de' yyyy", {
    locale: ptBR,
  });
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Escala de ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`,
    pageWidth / 2,
    28,
    { align: "center" },
  );

  // Timestamp
  doc.setFontSize(8);
  doc.setTextColor(100);
  const timestamp = format(now, "dd/MM/yyyy 'às' HH:mm");
  doc.text(`Gerado em: ${timestamp}`, pageWidth - margin, 10, {
    align: "right",
  });

  let currentY = 40;

  // Sort scales by date
  const sortedScales = [...scales].sort((a, b) => a.date.localeCompare(b.date));

  sortedScales.forEach((scale) => {
    // Check if we need a new page
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    // Scale Header (Date - Day of Week | Service)
    const dateStr = format(parseISO(scale.date), "dd/MM/yyyy", {
      locale: ptBR,
    });
    const dayOfWeek = format(parseISO(scale.date), "EEEE", { locale: ptBR });
    const headerTitle = `${dateStr} - ${dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)}`;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(headerTitle, margin, currentY);

    // Service Badge-like text
    const serviceText = scale.service.toUpperCase();
    const serviceWidth = doc.getTextWidth(serviceText);
    const bgColor = scale.service === "Manhã" ? 240 : 200;
    doc.setFillColor(bgColor, bgColor, bgColor); // RGB for grayscale
    doc.rect(
      pageWidth - margin - serviceWidth - 4,
      currentY - 5,
      serviceWidth + 4,
      7,
      "F",
    );
    doc.setFontSize(9);
    doc.text(serviceText, pageWidth - margin - 2, currentY, { align: "right" });

    currentY += 5;

    // Group members by instrument
    const groupedMembers = scale.members.reduce(
      (acc, sm) => {
        if (!acc[sm.instrument]) acc[sm.instrument] = [];
        acc[sm.instrument].push(sm.member.name);
        return acc;
      },
      {} as Record<string, string[]>,
    );

    const tableRows = Object.entries(groupedMembers).map(
      ([instrument, names]) => [instrument.toUpperCase(), names.join(", ")],
    );

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [["Instrumento", "Integrantes"]],
      body: tableRows,
      theme: "striped",
      headStyles: {
        fillColor: [63, 81, 181],
        fontSize: 9,
        halign: "left",
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 40 },
        1: { halign: "left" },
      },
      styles: { fontSize: 9, cellPadding: 2 },
      didDrawPage: (data) => {
        currentY = data.cursor?.y || currentY;
      },
    });

    const lastTable = doc.lastAutoTable;
    if (lastTable && lastTable.finalY) {
      currentY = lastTable.finalY + 10;
    } else {
      currentY += 20; // fallback
    }
  });

  // Save the PDF
  const fileName = `escala-${selectedMonth}.pdf`;
  doc.save(fileName);
};
