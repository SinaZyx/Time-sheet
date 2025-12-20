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

// Nettoyer le nom de la feuille (max 31 chars, pas de caractères interdits)
function sanitizeSheetName(name: string): string {
    return name.replace(/[\[\]\*\/\\\?\:]/g, '_').substring(0, 31);
}

/**
 * Génère un fichier Excel consolidé :
 * 1. Feuille "Récapitulatif" : Liste de toutes les semaines de tous les employés avec totaux.
 * 2. Une feuille par employé : Détail jour par jour de toutes leurs semaines.
 */
export function generateConsolidatedExcel(timesheets: TimesheetData[]): void {
    const wb = XLSX.utils.book_new();

    // --- Feuille 1 : Récapitulatif Global ---
    const summaryData: any[] = [];

    // Trier par nom d'employé puis par date
    const sortedTimesheets = [...timesheets].sort((a, b) => {
        const nameCompare = a.employeeName.localeCompare(b.employeeName);
        if (nameCompare !== 0) return nameCompare;
        return a.weekStartDate.getTime() - b.weekStartDate.getTime();
    });

    sortedTimesheets.forEach(ts => {
        const weekDates = getWeekDates(ts.weekStartDate);
        const weekStr = `Semaine du ${ts.weekStartDate.toLocaleDateString("fr-FR")} au ${weekDates[6].toLocaleDateString("fr-FR")}`;

        const totalHours = ts.gridData.flat().filter(Boolean).length * 0.5;
        const totalSupp = Math.max(0, totalHours - 35);
        const normalHours = Math.min(totalHours, 35);

        summaryData.push({
            "Employé": ts.employeeName,
            "Période": weekStr,
            "Heures Totales": totalHours,
            "Heures Normales": normalHours,
            "Heures Supp.": totalSupp
        });
    });

    // Totaux globaux pour le récap
    const grandTotalHours = summaryData.reduce((sum, row) => sum + row["Heures Totales"], 0);
    const grandTotalSupp = summaryData.reduce((sum, row) => sum + row["Heures Supp."], 0);

    summaryData.push({}); // Ligne vide
    summaryData.push({
        "Employé": "TOTAL GÉNÉRAL",
        "Heures Totales": grandTotalHours,
        "Heures Supp.": grandTotalSupp
    });

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary["!cols"] = [
        { wch: 25 }, // Employé
        { wch: 35 }, // Période
        { wch: 15 }, // Totales
        { wch: 15 }, // Normales
        { wch: 15 }  // Supp
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Récapitulatif");


    // --- Feuilles par Employé ---

    // Grouper les timesheets par employé
    const sheetsByEmployee: { [key: string]: TimesheetData[] } = {};
    sortedTimesheets.forEach(ts => {
        if (!sheetsByEmployee[ts.employeeName]) {
            sheetsByEmployee[ts.employeeName] = [];
        }
        sheetsByEmployee[ts.employeeName].push(ts);
    });

    // Créer une feuille pour chaque employé
    Object.keys(sheetsByEmployee).forEach(empName => {
        const empTimesheets = sheetsByEmployee[empName];
        const empSheetData: any[] = [];

        empTimesheets.forEach((ts, index) => {
            const weekDates = getWeekDates(ts.weekStartDate);
            // En-tête de la semaine
            empSheetData.push({
                "Date": `SEMAINE DU ${ts.weekStartDate.toLocaleDateString("fr-FR")} AU ${weekDates[6].toLocaleDateString("fr-FR")}`,
                "Jour": "",
                "Horaires": "",
                "Heures": ""
            });

            // Détail jours
            let weekTotal = 0;
            weekDates.forEach((date, dayIndex) => {
                const hours = getDayHours(ts.gridData[dayIndex]);
                weekTotal += hours;

                empSheetData.push({
                    "Date": date.toLocaleDateString("fr-FR"),
                    "Jour": DAYS[dayIndex],
                    "Horaires": getRangesText(ts.gridData[dayIndex]),
                    "Heures": hours || "" // Laisser vide si 0 pour lisibilité ? ou mettre 0
                });
            });

            // Total semaine
            const supp = Math.max(0, weekTotal - 35);
            empSheetData.push({
                "Date": "TOTAL SEMAINE",
                "Jour": "",
                "Horaires": supp > 0 ? `Dont ${supp}h supp.` : "",
                "Heures": weekTotal
            });

            // Ligne vide entre les semaines (sauf après la dernière)
            if (index < empTimesheets.length - 1) {
                empSheetData.push({});
            }
        });

        const wsAtom = XLSX.utils.json_to_sheet(empSheetData);

        // Ajustement largeurs colonnes
        wsAtom["!cols"] = [
            { wch: 15 }, // Date
            { wch: 12 }, // Jour
            { wch: 40 }, // Horaires
            { wch: 10 }  // Heures
        ];

        XLSX.utils.book_append_sheet(wb, wsAtom, sanitizeSheetName(empName));
    });

    // Sauvegarder
    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `releves_heures_RH_${date}.xlsx`);
}
