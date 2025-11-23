import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Download, FileSpreadsheet, Trash2, Clock, ChevronLeft, ChevronRight, User, CheckCircle2, TrendingUp } from 'lucide-react';

// --- Configuration ---
const START_HOUR = 6;
const END_HOUR = 23; // 23h00 inclus
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const SLOTS_PER_HOUR = 2; // 30 min slots
const TOTAL_SLOTS = (END_HOUR - START_HOUR + 1) * SLOTS_PER_HOUR;

// --- Scripts Loader Helper ---
const useScript = (url) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    }
  }, [url]);
};

// --- Composant Principal ---
export default function App() {
  // Chargement des libs externes pour PDF/Excel
  useScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  useScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js');
  useScript('https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js');

  // --- State ---
  // Grille: [DayIndex][SlotIndex] = boolean
  const [grid, setGrid] = useState<boolean[][]>(
    Array(7).fill(null).map(() => Array(TOTAL_SLOTS).fill(false))
  );
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{day: number, slot: number} | null>(null);
  const [isErasing, setIsErasing] = useState(false);
  
  // Valeur par défaut vide pour la mission
  const [missionName, setMissionName] = useState("");
  
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- Logic : Gestion du Temps ---
  
  // Générer les labels horaires (06:00, 06:30, ...)
  const timeLabels = Array.from({ length: TOTAL_SLOTS }, (_, i) => {
    const totalMinutes = (START_HOUR * 60) + (i * 30);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  });

  // Gestion Dates de la semaine
  const getMonday = (d: Date) => {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    return new Date(d.setDate(diff));
  };
  const monday = getMonday(currentDate);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  // --- Logic : Interaction Souris (Drag & Drop) ---

  const handleMouseDown = (dayIndex: number, slotIndex: number) => {
    setIsDragging(true);
    setDragStart({ day: dayIndex, slot: slotIndex });
    // Si on commence sur une case active, on gomme. Sinon on peint.
    setIsErasing(grid[dayIndex][slotIndex]);
    
    // Appliquer immédiatement à la case de départ
    updateGrid(dayIndex, slotIndex, !grid[dayIndex][slotIndex]);
  };

  const handleMouseEnter = (dayIndex: number, slotIndex: number) => {
    if (!isDragging || !dragStart) return;

    // Logique simple : on applique l'état (Peindre/Gommer) à la case survolée
    if (dayIndex === dragStart.day) {
        // On remplit tout entre start et current
        const start = Math.min(dragStart.slot, slotIndex);
        const end = Math.max(dragStart.slot, slotIndex);
        
        const newGrid = [...grid];
        const newDayCol = [...newGrid[dayIndex]];
        for (let i = start; i <= end; i++) {
            newDayCol[i] = !isErasing;
        }
        newGrid[dayIndex] = newDayCol;
        setGrid(newGrid);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  // Navigation Semaine
  const changeWeek = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (offset * 7));
    setCurrentDate(newDate);
  };

  const updateGrid = (day: number, slot: number, val: boolean) => {
    const newGrid = [...grid];
    newGrid[day] = [...newGrid[day]];
    newGrid[day][slot] = val;
    setGrid(newGrid);
  };

  const clearGrid = () => {
    if(confirm("Voulez-vous vraiment effacer tout le planning ?")) {
        setGrid(Array(7).fill(null).map(() => Array(TOTAL_SLOTS).fill(false)));
    }
  };

  // --- Logic : Calculs ---

  const calculateHours = () => {
    let total = 0;
    grid.forEach(day => {
        total += day.filter(Boolean).length * 0.5;
    });
    return total;
  };

  const calculateOvertime = () => {
    let totalOvertime = 0;
    grid.forEach(day => {
        const dayHours = day.filter(Boolean).length * 0.5;
        // On considère heure supp tout ce qui dépasse 7h par jour
        if (dayHours > 7) {
            totalOvertime += (dayHours - 7);
        }
    });
    return totalOvertime;
  };

  const getDayHours = (dayIndex: number) => {
    return grid[dayIndex].filter(Boolean).length * 0.5;
  };

  const getRangesText = (dayIndex: number) => {
    const slots = grid[dayIndex];
    let ranges = [];
    let start = null;

    for (let i = 0; i < slots.length; i++) {
        if (slots[i] && start === null) {
            start = i;
        } else if (!slots[i] && start !== null) {
            // Fin d'une plage
            ranges.push(formatRange(start, i));
            start = null;
        }
    }
    if (start !== null) {
        ranges.push(formatRange(start, slots.length));
    }
    return ranges.length > 0 ? ranges.join(" / ") : "Repos";
  };

  const formatRange = (startSlot: number, endSlot: number) => {
    const startMin = (START_HOUR * 60) + (startSlot * 30);
    const endMin = (START_HOUR * 60) + (endSlot * 30);
    
    const formatTime = (min: number) => {
        const h = Math.floor(min / 60);
        const m = min % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };
    return `${formatTime(startMin)} - ${formatTime(endMin)}`;
  };

  // --- Exports ---

  const exportPDF = () => {
    // @ts-ignore
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("Les outils PDF ne sont pas encore chargés. Vérifiez votre connexion ou réessayez dans quelques secondes.");
        return;
    }

    try {
        // @ts-ignore
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4');
        
        // Header Style
        doc.setFillColor(2, 132, 199); // Sky Blue 600
        doc.rect(0, 0, 297, 25, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("FEUILLE DE TEMPS HEBDOMADAIRE", 15, 17);
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        const weekStr = `${monday.toLocaleDateString('fr-FR')} - ${weekDates[6].toLocaleDateString('fr-FR')}`;
        doc.text(`Semaine du : ${weekStr}`, 280, 17, { align: 'right' });

        // Mission Info
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(11);
        doc.text(`Mission / Objet : ${missionName || 'Non spécifié'}`, 15, 35);
        doc.text(`Collaborateur : _________________`, 280, 35, { align: 'right' });

        // Table Data
        const tableBody = weekDates.map((date, i) => [
            DAYS[i],
            date.toLocaleDateString('fr-FR'),
            getRangesText(i),
            getDayHours(i).toFixed(2) + ' h'
        ]);

        // @ts-ignore
        doc.autoTable({
            startY: 45,
            head: [['Jour', 'Date', 'Horaires (Début - Fin)', 'Total']],
            body: tableBody,
            theme: 'striped',
            headStyles: { fillColor: [2, 132, 199], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 4 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 30 },
                1: { cellWidth: 30 },
                2: { cellWidth: 'auto' },
                3: { fontStyle: 'bold', halign: 'center', cellWidth: 30 }
            },
            alternateRowStyles: { fillColor: [240, 249, 255] }
        });

        // Totals Box
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        const totalH = calculateHours();
        const totalOT = calculateOvertime();
        
        // --- Box Totaux ---
        doc.setDrawColor(2, 132, 199);
        doc.setLineWidth(0.5);
        doc.setFillColor(240, 249, 255);
        doc.roundedRect(190, finalY, 90, 30, 3, 3, 'FD'); 
        
        doc.setFontSize(11);
        doc.setTextColor(2, 132, 199);
        doc.text("TOTAL SEMAINE", 235, finalY + 8, { align: 'center' });
        
        doc.setFontSize(16);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text(`${totalH.toFixed(2)} Heures`, 235, finalY + 18, { align: 'center' });

        if (totalOT > 0) {
            doc.setFontSize(10);
            doc.setTextColor(217, 119, 6); // Amber
            doc.text(`Dont ${totalOT.toFixed(2)}h sup.`, 235, finalY + 25, { align: 'center' });
        }

        // Signatures
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "italic");
        doc.text("Signature Salarié", 20, 170);
        doc.text("Signature Responsable", 200, 170);

        doc.save(`releve_heures_${monday.toISOString().slice(0,10)}.pdf`);
    } catch (e) {
        console.error(e);
        alert("Une erreur est survenue lors de la génération du PDF. Consultez la console.");
    }
  };

  const exportExcel = () => {
     // @ts-ignore
     if (!window.XLSX) {
        alert("L'outil Excel n'est pas encore chargé. Réessayez dans un instant.");
        return;
     }

     // @ts-ignore
     const wb = window.XLSX.utils.book_new();
     
     // Summary Sheet avec colonne Heures Supp
     const summaryData = weekDates.map((date, i) => {
         const hours = getDayHours(i);
         // Heures supp au-delà de 7h
         const supp = hours > 7 ? hours - 7 : 0;
         return {
             Jour: DAYS[i],
             Date: date.toLocaleDateString('fr-FR'),
             Horaires: getRangesText(i),
             Total: hours,
             'Heures Supp.': supp
         };
     });
     
     // Ajout de la ligne TOTAL
     const totalH = calculateHours();
     const totalOT = calculateOvertime();
     summaryData.push({ 
         Jour: 'TOTAL', 
         Date: '', 
         Horaires: '', 
         Total: totalH,
         'Heures Supp.': totalOT
     });

     // @ts-ignore
     const wsSummary = window.XLSX.utils.json_to_sheet(summaryData);
     
     // Ajustement largeur colonnes (approximatif)
     wsSummary['!cols'] = [
        { wch: 15 }, // Jour
        { wch: 15 }, // Date
        { wch: 40 }, // Horaires
        { wch: 10 }, // Total
        { wch: 15 }  // Heures Supp.
     ];

     // @ts-ignore
     window.XLSX.utils.book_append_sheet(wb, wsSummary, "Résumé");

     // @ts-ignore
     window.XLSX.writeFile(wb, "releve_heures.xlsx");
  };

  // --- Render ---

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-sky-200" onMouseUp={handleMouseUp}>
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-sky-600 p-2 rounded-lg text-white shadow-lg shadow-sky-200">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Planning Hebdomadaire</h1>
                        {/* Navigation Semaine */}
                        <div className="flex items-center gap-2 mt-1">
                             <button 
                                onClick={() => changeWeek(-1)}
                                className="p-0.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-sky-600 transition-colors"
                                title="Semaine précédente"
                             >
                                <ChevronLeft size={18} />
                             </button>
                             
                             <span className="text-sm text-slate-500 font-medium capitalize min-w-[180px] text-center select-none">
                                {monday.toLocaleDateString('fr-FR', {day: 'numeric', month: 'long'})} - {weekDates[6].toLocaleDateString('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'})}
                             </span>

                             <button 
                                onClick={() => changeWeek(1)}
                                className="p-0.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-sky-600 transition-colors"
                                title="Semaine suivante"
                             >
                                <ChevronRight size={18} />
                             </button>
                             
                             <button 
                                onClick={() => setCurrentDate(new Date())}
                                className="text-xs text-sky-600 hover:text-sky-700 font-medium ml-2 px-2 py-0.5 bg-sky-50 rounded hover:bg-sky-100 transition-colors"
                             >
                                Aujourd'hui
                             </button>
                        </div>
                    </div>
                </div>

                {/* Input Mission vide par défaut */}
                <div className="flex items-center gap-4 bg-slate-100 p-2 rounded-lg border border-slate-200">
                    <User size={18} className="text-slate-400 ml-2" />
                    <input 
                        type="text" 
                        value={missionName}
                        onChange={(e) => setMissionName(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm font-medium w-48 text-slate-700 placeholder:text-slate-400"
                        placeholder="Objet de la mission..."
                    />
                </div>

                <div className="flex items-center gap-2">
                     <button 
                        onClick={clearGrid}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Tout effacer"
                     >
                        <Trash2 size={20} />
                     </button>
                     <div className="h-6 w-px bg-slate-300 mx-1"></div>
                     <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium text-sm transition-all">
                        <FileSpreadsheet size={16} /> Excel
                     </button>
                     <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium text-sm shadow-md shadow-sky-200 transition-all transform active:scale-95">
                        <Download size={16} /> PDF
                     </button>
                </div>
            </div>
        </div>
      </header>

      {/* Main Calendar Area */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        
        {/* KPI Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Carte Total Heures */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Total Heures</p>
                    <p className="text-3xl font-bold text-sky-600">{calculateHours().toFixed(2)} <span className="text-lg text-slate-400 font-normal">h</span></p>
                </div>
                <div className="bg-sky-50 p-3 rounded-full text-sky-600">
                    <Clock size={24} />
                </div>
            </div>

            {/* Carte Heures Supplémentaires */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Heures Supp. ({'>'}7h)</p>
                    <p className="text-3xl font-bold text-amber-500">{calculateOvertime().toFixed(2)} <span className="text-lg text-slate-400 font-normal">h</span></p>
                </div>
                <div className="bg-amber-50 p-3 rounded-full text-amber-500">
                    <TrendingUp size={24} />
                </div>
            </div>

            {/* Legend / Instructions */}
            <div className="col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-sky-100 border border-sky-300 flex items-center justify-center">
                        <div className="w-6 h-6 rounded bg-sky-500"></div>
                    </div>
                    <div className="text-sm">
                        <p className="font-bold text-slate-700">Travaillé</p>
                        <p className="text-slate-500">Cliquez et glissez</p>
                    </div>
                </div>
                <div className="h-10 w-px bg-slate-100"></div>
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                        <div className="w-6 h-6 rounded bg-white border border-slate-200"></div>
                    </div>
                    <div className="text-sm">
                        <p className="font-bold text-slate-700">Repos</p>
                        <p className="text-slate-500">Laisser vide</p>
                    </div>
                </div>
                <div className="flex-1 text-right text-sm text-slate-400 italic">
                    Astuce : Cliquez sur une zone bleue pour activer la gomme
                </div>
            </div>
        </div>

        {/* The Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden select-none">
            {/* Header Row Days */}
            <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-slate-200">
                <div className="p-4 bg-slate-50 border-r border-slate-200"></div>
                {DAYS.map((day, i) => {
                    const isToday = weekDates[i].toDateString() === new Date().toDateString();
                    return (
                        <div key={day} className={`p-3 text-center border-r border-slate-100 last:border-r-0 ${isToday ? 'bg-sky-50' : 'bg-white'}`}>
                            <p className={`text-xs font-bold uppercase mb-1 ${isToday ? 'text-sky-600' : 'text-slate-400'}`}>{day}</p>
                            <div className={`mx-auto w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${isToday ? 'bg-sky-600 text-white' : 'text-slate-700'}`}>
                                {weekDates[i].getDate()}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Time Body */}
            <div className="relative">
                 {/* Lignes de temps (background grid) */}
                 {timeLabels.map((time, slotIndex) => {
                    // Afficher l'heure pile seulement, pas les demies, pour alléger visuellement
                    const showLabel = slotIndex % 2 === 0; 
                    const isHourLine = slotIndex % 2 === 0;
                    return (
                        <div key={time} className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] h-8">
                            <div className={`border-r border-slate-200 text-right pr-3 text-xs text-slate-400 relative -top-2 ${!showLabel && 'invisible'}`}>
                                {time}
                            </div>
                            {/* Les cellules de la grille */}
                            {DAYS.map((_, dayIndex) => {
                                const isActive = grid[dayIndex][slotIndex];
                                
                                // Calcul esthétique pour connecter les blocs verticaux
                                const prevActive = slotIndex > 0 && grid[dayIndex][slotIndex - 1];
                                const nextActive = slotIndex < TOTAL_SLOTS - 1 && grid[dayIndex][slotIndex + 1];
                                
                                let roundedClass = "rounded-sm";
                                if (isActive) {
                                    if (prevActive && nextActive) roundedClass = "";
                                    else if (prevActive) roundedClass = "rounded-b-md";
                                    else if (nextActive) roundedClass = "rounded-t-md";
                                    else roundedClass = "rounded-md";
                                }

                                return (
                                    <div 
                                        key={`${dayIndex}-${slotIndex}`}
                                        onMouseDown={() => handleMouseDown(dayIndex, slotIndex)}
                                        onMouseEnter={() => handleMouseEnter(dayIndex, slotIndex)}
                                        className={`
                                            border-r border-slate-100 last:border-r-0 cursor-pointer transition-colors relative
                                            ${isHourLine ? 'border-b border-slate-100' : ''}
                                            hover:bg-slate-50
                                        `}
                                    >
                                        {/* Le bloc coloré interne */}
                                        <div className={`
                                            absolute inset-0.5 transition-all duration-150 pointer-events-none
                                            ${isActive ? 'bg-sky-500 shadow-sm' : 'bg-transparent'}
                                            ${roundedClass}
                                        `}></div>
                                    </div>
                                )
                            })}
                        </div>
                    )
                 })}
            </div>
        </div>

      </main>
    </div>
  );
}