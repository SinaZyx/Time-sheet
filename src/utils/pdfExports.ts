import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const START_HOUR = 6;
const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

interface TimesheetData {
    employeeName: string;
    weekStartDate: Date;
    gridData: boolean[][];
}

// Calculer les heures pour un jour
function getDayHours(grid: boolean[], slotsPerHour: number = 2): number {
    return grid.filter(Boolean).length * (1 / slotsPerHour);
}

// Calculer les heures supplémentaires
function calculateOvertime(gridData: boolean[][]): number {
    let totalOT = 0;
    gridData.forEach((day) => {
        const hours = getDayHours(day);
        if (hours > 7) totalOT += hours - 7;
    });
    return totalOT;
}

// Calculer le total d'heures
function calculateHours(gridData: boolean[][]): number {
    return gridData.flat().filter(Boolean).length * 0.5;
}

// Formater une plage horaire
function formatRange(startSlot: number, endSlot: number): string {
    const startMin = START_HOUR * 60 + startSlot * 30;
    const endMin = START_HOUR * 60 + endSlot * 30;
    const formatTime = (min: number) => {
        const h = Math.floor(min / 60);
        const m = min % 60;
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    };
    return `${formatTime(startMin)} - ${formatTime(endMin)}`;
}

// Obtenir les plages horaires d'un jour
function getRangesText(dayGrid: boolean[]): string {
    const ranges: string[] = [];
    let start: number | null = null;

    for (let i = 0; i < dayGrid.length; i++) {
        if (dayGrid[i] && start === null) {
            start = i;
        } else if (!dayGrid[i] && start !== null) {
            ranges.push(formatRange(start, i));
            start = null;
        }
    }
    if (start !== null) ranges.push(formatRange(start, dayGrid.length));
    return ranges.length > 0 ? ranges.join(" / ") : "Repos";
}

// Générer les dates de la semaine à partir du lundi
function getWeekDates(monday: Date): Date[] {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
    });
}

/**
 * Génère un PDF pour un seul employé
 */
export function generateSingleEmployeePDF(data: TimesheetData): Blob {
    const doc = new jsPDF("l", "mm", "a4");
    const { employeeName, weekStartDate, gridData } = data;
    const weekDates = getWeekDates(weekStartDate);

    // Header
    doc.setFillColor(2, 132, 199);
    doc.rect(0, 0, 297, 25, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("FEUILLE DE TEMPS HEBDOMADAIRE", 15, 17);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const weekEndDate = weekDates[6];
    const weekStr = `${weekStartDate.toLocaleDateString("fr-FR")} - ${weekEndDate.toLocaleDateString("fr-FR")}`;
    doc.text(`Semaine du : ${weekStr}`, 280, 17, { align: "right" });

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    doc.text(`Collaborateur : ${employeeName}`, 15, 35, { align: "left" });

    // Table
    const tableBody = weekDates.map((date, i) => [
        DAYS[i],
        date.toLocaleDateString("fr-FR"),
        getRangesText(gridData[i]),
        `${getDayHours(gridData[i]).toFixed(2)} h`,
    ]);

    autoTable(doc, {
        startY: 45,
        head: [["Jour", "Date", "Horaires (Debut - Fin)", "Total"]],
        body: tableBody,
        theme: "striped",
        headStyles: { fillColor: [2, 132, 199], textColor: 255, fontStyle: "bold", fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
            0: { fontStyle: "bold", cellWidth: 30 },
            1: { cellWidth: 30 },
            2: { cellWidth: "auto" },
            3: { fontStyle: "bold", halign: "center", cellWidth: 30 },
        },
        alternateRowStyles: { fillColor: [240, 249, 255] },
    });

    const finalY = (doc as any).lastAutoTable.finalY ?? 120;
    const totalH = calculateHours(gridData);
    const totalOT = calculateOvertime(gridData);

    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const blockHeight = 70;
    let boxY = finalY + 8;

    if (boxY + blockHeight > pageHeight) {
        boxY = Math.max(30, pageHeight - blockHeight - 10);
    }

    let sigY = boxY + 50;
    if (sigY + 12 > pageHeight) {
        sigY = pageHeight - 20;
    }

    doc.setDrawColor(2, 132, 199);
    doc.setLineWidth(0.5);
    doc.setFillColor(240, 249, 255);
    const boxWidth = 90;
    const boxX = pageWidth - boxWidth - 15;
    doc.roundedRect(boxX, boxY, boxWidth, 26, 3, 3, "FD");

    doc.setFontSize(11);
    doc.setTextColor(2, 132, 199);
    doc.text("TOTAL SEMAINE", boxX + boxWidth / 2, boxY + 7, { align: "center" });

    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(`${totalH.toFixed(2)} Heures`, boxX + boxWidth / 2, boxY + 16, { align: "center" });

    if (totalOT > 0) {
        doc.setFontSize(10);
        doc.setTextColor(217, 119, 6);
        doc.text(`Dont ${totalOT.toFixed(2)}h sup.`, boxX + boxWidth / 2, boxY + 22, { align: "center" });
    }

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "italic");
    doc.text("Signature Salarie", 20, sigY);
    doc.text("Signature Responsable", 200, sigY);

    return doc.output("blob");
}

/**
 * Génère un PDF consolidé avec plusieurs employés
 */
export function generateConsolidatedPDF(timesheets: TimesheetData[]): void {
    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    timesheets.forEach((data, index) => {
        if (index > 0) {
            doc.addPage();
        }

        const { employeeName, weekStartDate, gridData } = data;
        const weekDates = getWeekDates(weekStartDate);

        // Header
        doc.setFillColor(2, 132, 199);
        doc.rect(0, 0, 297, 25, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("FEUILLE DE TEMPS HEBDOMADAIRE", 15, 17);

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        const weekEndDate = weekDates[6];
        const weekStr = `${weekStartDate.toLocaleDateString("fr-FR")} - ${weekEndDate.toLocaleDateString("fr-FR")}`;
        doc.text(`Semaine du : ${weekStr}`, 280, 17, { align: "right" });

        doc.setTextColor(50, 50, 50);
        doc.setFontSize(11);
        doc.text(`Collaborateur : ${employeeName}`, 15, 35, { align: "left" });

        // Table
        const tableBody = weekDates.map((date, i) => [
            DAYS[i],
            date.toLocaleDateString("fr-FR"),
            getRangesText(gridData[i]),
            `${getDayHours(gridData[i]).toFixed(2)} h`,
        ]);

        autoTable(doc, {
            startY: 45,
            head: [["Jour", "Date", "Horaires (Debut - Fin)", "Total"]],
            body: tableBody,
            theme: "striped",
            headStyles: { fillColor: [2, 132, 199], textColor: 255, fontStyle: "bold", fontSize: 8 },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
                0: { fontStyle: "bold", cellWidth: 30 },
                1: { cellWidth: 30 },
                2: { cellWidth: "auto" },
                3: { fontStyle: "bold", halign: "center", cellWidth: 30 },
            },
            alternateRowStyles: { fillColor: [240, 249, 255] },
        });

        const finalY = (doc as any).lastAutoTable.finalY ?? 120;
        const totalH = calculateHours(gridData);
        const totalOT = calculateOvertime(gridData);

        const pageHeight = doc.internal.pageSize.getHeight();
        const blockHeight = 70;
        let boxY = finalY + 8;

        if (boxY + blockHeight > pageHeight) {
            boxY = Math.max(30, pageHeight - blockHeight - 10);
        }

        let sigY = boxY + 50;
        if (sigY + 12 > pageHeight) {
            sigY = pageHeight - 20;
        }

        doc.setDrawColor(2, 132, 199);
        doc.setLineWidth(0.5);
        doc.setFillColor(240, 249, 255);
        const boxWidth = 90;
        const boxX = pageWidth - boxWidth - 15;
        doc.roundedRect(boxX, boxY, boxWidth, 26, 3, 3, "FD");

        doc.setFontSize(11);
        doc.setTextColor(2, 132, 199);
        doc.text("TOTAL SEMAINE", boxX + boxWidth / 2, boxY + 7, { align: "center" });

        doc.setFontSize(16);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text(`${totalH.toFixed(2)} Heures`, boxX + boxWidth / 2, boxY + 16, { align: "center" });

        if (totalOT > 0) {
            doc.setFontSize(10);
            doc.setTextColor(217, 119, 6);
            doc.text(`Dont ${totalOT.toFixed(2)}h sup.`, boxX + boxWidth / 2, boxY + 22, { align: "center" });
        }

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "italic");
        doc.text("Signature Salarie", 20, sigY);
        doc.text("Signature Responsable", 200, sigY);
    });

    // Sauvegarder
    const date = new Date().toISOString().slice(0, 10);
    doc.save(`releves_heures_${timesheets.length}_employes_${date}.pdf`);
}
