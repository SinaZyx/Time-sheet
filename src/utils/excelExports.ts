import * as XLSX from "xlsx";

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

// Générer les dates de la semaine
function getWeekDates(monday: Date): Date[] {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
    });
}

/**
 * Génère un fichier Excel consolidé avec tous les employés sélectionnés
 */
export function generateConsolidatedExcel(timesheets: TimesheetData[]): void {
    const wb = XLSX.utils.book_new();

    // Feuille 1: Vue détaillée par employé et par jour
    const detailedData: any[] = [];

    timesheets.forEach((data) => {
        const { employeeName, weekStartDate, gridData } = data;
        const weekDates = getWeekDates(weekStartDate);
        const weekStr = `${weekStartDate.toLocaleDateString("fr-FR")} - ${weekDates[6].toLocaleDateString("fr-FR")}`;

        weekDates.forEach((date, dayIndex) => {
            const hours = getDayHours(gridData[dayIndex]);
            const supp = hours > 7 ? hours - 7 : 0;

            detailedData.push({
                "Employé": employeeName,
                "Semaine": weekStr,
                "Jour": DAYS[dayIndex],
                "Date": date.toLocaleDateString("fr-FR"),
                "Horaires": getRangesText(gridData[dayIndex]),
                "Heures": hours,
                "Heures Supp.": supp,
            });
        });

        // Ligne de total par employé
        const totalHours = gridData.flat().filter(Boolean).length * 0.5;
        const totalSupp = gridData.reduce((total, day) => {
            const dayHours = getDayHours(day);
            return total + (dayHours > 7 ? dayHours - 7 : 0);
        }, 0);

        detailedData.push({
            "Employé": `TOTAL ${employeeName}`,
            "Semaine": "",
            "Jour": "",
            "Date": "",
            "Horaires": "",
            "Heures": totalHours,
            "Heures Supp.": totalSupp,
        });

        // Ligne vide pour séparer les employés
        detailedData.push({
            "Employé": "",
            "Semaine": "",
            "Jour": "",
            "Date": "",
            "Horaires": "",
            "Heures": "",
            "Heures Supp.": "",
        });
    });

    // Total général
    const grandTotalHours = timesheets.reduce((sum, data) => {
        return sum + data.gridData.flat().filter(Boolean).length * 0.5;
    }, 0);

    const grandTotalSupp = timesheets.reduce((sum, data) => {
        return sum + data.gridData.reduce((total, day) => {
            const dayHours = getDayHours(day);
            return total + (dayHours > 7 ? dayHours - 7 : 0);
        }, 0);
    }, 0);

    detailedData.push({
        "Employé": "TOTAL GÉNÉRAL",
        "Semaine": "",
        "Jour": "",
        "Date": "",
        "Horaires": "",
        "Heures": grandTotalHours,
        "Heures Supp.": grandTotalSupp,
    });

    const wsDetailed = XLSX.utils.json_to_sheet(detailedData);
    wsDetailed["!cols"] = [
        { wch: 25 },  // Employé
        { wch: 25 },  // Semaine
        { wch: 12 },  // Jour
        { wch: 12 },  // Date
        { wch: 40 },  // Horaires
        { wch: 10 },  // Heures
        { wch: 15 },  // Heures Supp.
    ];
    XLSX.utils.book_append_sheet(wb, wsDetailed, "Details");

    // Feuille 2: Résumé par employé
    const summaryData = timesheets.map((data) => {
        const { employeeName, weekStartDate, gridData } = data;
        const weekDates = getWeekDates(weekStartDate);
        const weekStr = `${weekStartDate.toLocaleDateString("fr-FR")} - ${weekDates[6].toLocaleDateString("fr-FR")}`;

        const totalHours = gridData.flat().filter(Boolean).length * 0.5;
        const totalSupp = gridData.reduce((total, day) => {
            const dayHours = getDayHours(day);
            return total + (dayHours > 7 ? dayHours - 7 : 0);
        }, 0);

        return {
            "Employé": employeeName,
            "Semaine": weekStr,
            "Total Heures": totalHours,
            "Heures Supp.": totalSupp,
            "Heures Normales": totalHours - totalSupp,
        };
    });

    // Total du résumé
    summaryData.push({
        "Employé": "TOTAL",
        "Semaine": "",
        "Total Heures": grandTotalHours,
        "Heures Supp.": grandTotalSupp,
        "Heures Normales": grandTotalHours - grandTotalSupp,
    });

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary["!cols"] = [
        { wch: 25 },  // Employé
        { wch: 25 },  // Semaine
        { wch: 15 },  // Total Heures
        { wch: 15 },  // Heures Supp.
        { wch: 18 },  // Heures Normales
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resume");

    // Feuille 3: Statistiques
    const avgHours = grandTotalHours / timesheets.length;
    const avgSupp = grandTotalSupp / timesheets.length;

    const statsData = [
        { "Statistique": "Nombre d'employés", "Valeur": timesheets.length },
        { "Statistique": "Total heures", "Valeur": grandTotalHours.toFixed(2) },
        { "Statistique": "Total heures supplémentaires", "Valeur": grandTotalSupp.toFixed(2) },
        { "Statistique": "Moyenne heures par employé", "Valeur": avgHours.toFixed(2) },
        { "Statistique": "Moyenne heures supp. par employé", "Valeur": avgSupp.toFixed(2) },
    ];

    const wsStats = XLSX.utils.json_to_sheet(statsData);
    wsStats["!cols"] = [
        { wch: 35 },  // Statistique
        { wch: 15 },  // Valeur
    ];
    XLSX.utils.book_append_sheet(wb, wsStats, "Statistiques");

    // Sauvegarder le fichier
    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `releves_heures_consolide_${timesheets.length}_employes_${date}.xlsx`);
}
