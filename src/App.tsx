import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileSpreadsheet,
  Trash2,
  User,
  TrendingUp,
  LogOut,
  Loader2,
  Users,
  LayoutGrid,
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import Auth from "./components/Auth";
import EmailNotVerified from "./components/EmailNotVerified";
import RHDashboard from "./components/RHDashboard";

const START_HOUR = 6;
const END_HOUR = 23; // 23h00 inclus
const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const SLOTS_PER_HOUR = 2; // 30 min slots
const TOTAL_SLOTS = (END_HOUR - START_HOUR + 1) * SLOTS_PER_HOUR;

export default function App() {
  const [grid, setGrid] = useState<boolean[][]>(() =>
    Array(7)
      .fill(null)
      .map(() => Array(TOTAL_SLOTS).fill(false)),
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ day: number; slot: number } | null>(null);
  const [isErasing, setIsErasing] = useState(false);
  const [collabName, setCollabName] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'employee' | 'admin' | null>(null);
  const [viewMode, setViewMode] = useState<'employee' | 'rh'>('employee');

  // Labels horaires 06:00, 06:30, ...
  const timeLabels = Array.from({ length: TOTAL_SLOTS }, (_, i) => {
    const totalMinutes = START_HOUR * 60 + i * 30;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  });

  const getMonday = useCallback((d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    return date;
  }, []);

  const monday = useMemo(() => getMonday(currentDate), [currentDate, getMonday]);

  // Convertir monday en string pour éviter les problèmes de référence
  const mondayStr = useMemo(() => monday.toISOString().split('T')[0], [monday]);

  const weekDates = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    }), [monday]
  );

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        setSession(session);
        if (session?.user) {
          const name = session.user.user_metadata.full_name || session.user.email?.split('@')[0];
          if (name) setCollabName(name);

          // Récupérer le rôle de l'utilisateur
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Error fetching profile:', error);
          }

          setUserRole(profile?.role || 'employee');
        }
      } catch (error) {
        console.error('Error in auth init:', error);
      } finally {
        setAuthLoading(false);
      }
    }).catch((error) => {
      console.error('Error getting session:', error);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        setSession(session);

        // Gérer la vérification d'email
        if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
          setVerificationMessage('Email vérifié avec succès ! Bienvenue.');
          setTimeout(() => setVerificationMessage(null), 5000);
        }

        if (session?.user) {
          const name = session.user.user_metadata.full_name || session.user.email?.split('@')[0];
          if (name) setCollabName(name);

          // Récupérer le rôle de l'utilisateur
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Error fetching profile on auth change:', error);
          }

          setUserRole(profile?.role || 'employee');
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchWeekData = useCallback(async () => {
    if (!session) return;
    setDataLoading(true);
    try {
      const { data, error } = await supabase
        .from('timesheets')
        .select('grid_data')
        .eq('user_id', session.user.id)
        .eq('week_start_date', mondayStr)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setGrid(data.grid_data);
      } else {
        setGrid(Array(7).fill(null).map(() => Array(TOTAL_SLOTS).fill(false)));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setDataLoading(false);
    }
  }, [session, mondayStr]);

  const saveWeekData = useCallback(async (currentGrid: boolean[][]) => {
    if (!session) return;
    try {
      const { error } = await supabase
        .from('timesheets')
        .upsert({
          user_id: session.user.id,
          week_start_date: mondayStr,
          grid_data: currentGrid,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,week_start_date' });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, [session, mondayStr]);

  useEffect(() => {
    if (session) {
      fetchWeekData();
    }
  }, [session, fetchWeekData]);

  const updateGrid = (day: number, slot: number, val: boolean) => {
    setGrid((prev) => {
      const newGrid = prev.map((row) => [...row]);
      newGrid[day][slot] = val;
      return newGrid;
    });
  };

  const handleMouseDown = (dayIndex: number, slotIndex: number) => {
    setIsDragging(true);
    setDragStart({ day: dayIndex, slot: slotIndex });
    setIsErasing(grid[dayIndex][slotIndex]);
    updateGrid(dayIndex, slotIndex, !grid[dayIndex][slotIndex]);
  };

  const handleMouseEnter = (dayIndex: number, slotIndex: number) => {
    if (!isDragging || !dragStart) return;
    if (dayIndex !== dragStart.day) return;

    const start = Math.min(dragStart.slot, slotIndex);
    const end = Math.max(dragStart.slot, slotIndex);

    setGrid((prev) => {
      const newGrid = prev.map((row) => [...row]);
      for (let i = start; i <= end; i += 1) {
        newGrid[dayIndex][i] = !isErasing;
      }
      return newGrid;
    });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      saveWeekData(grid);
    }
    setIsDragging(false);
    setDragStart(null);
  };

  const changeWeek = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + offset * 7);
    setCurrentDate(newDate);
  };

  const clearGrid = () => {
    if (window.confirm("Voulez-vous vraiment effacer tout le planning ?")) {
      const newGrid = Array(7)
        .fill(null)
        .map(() => Array(TOTAL_SLOTS).fill(false));
      setGrid(newGrid);
      saveWeekData(newGrid);
    }
  };

  const calculateHours = () => grid.flat().filter(Boolean).length * 0.5;

  const calculateOvertime = () => {
    let totalOT = 0;
    grid.forEach((day) => {
      const hours = day.filter(Boolean).length * 0.5;
      if (hours > 7) totalOT += hours - 7;
    });
    return totalOT;
  };

  const getDayHours = (dayIndex: number) => grid[dayIndex].filter(Boolean).length * 0.5;

  const formatRange = (startSlot: number, endSlot: number) => {
    const startMin = START_HOUR * 60 + startSlot * 30;
    const endMin = START_HOUR * 60 + endSlot * 30;
    const formatTime = (min: number) => {
      const h = Math.floor(min / 60);
      const m = min % 60;
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    };
    return `${formatTime(startMin)} - ${formatTime(endMin)}`;
  };

  const getRangesText = (dayIndex: number) => {
    const slots = grid[dayIndex];
    const ranges: string[] = [];
    let start: number | null = null;

    for (let i = 0; i < slots.length; i += 1) {
      if (slots[i] && start === null) {
        start = i;
      } else if (!slots[i] && start !== null) {
        ranges.push(formatRange(start, i));
        start = null;
      }
    }
    if (start !== null) ranges.push(formatRange(start, slots.length));
    return ranges.length > 0 ? ranges.join(" / ") : "Repos";
  };

  const exportPDF = () => {
    const doc = new jsPDF("l", "mm", "a4");

    doc.setFillColor(2, 132, 199);
    doc.rect(0, 0, 297, 25, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("FEUILLE DE TEMPS HEBDOMADAIRE", 15, 17);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const weekStr = `${monday.toLocaleDateString("fr-FR")} - ${weekDates[6].toLocaleDateString("fr-FR")}`;
    doc.text(`Semaine du : ${weekStr}`, 280, 17, { align: "right" });

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    doc.text(`Collaborateur : ${collabName || "_________________"}`, 15, 35, { align: "left" });

    const tableBody = weekDates.map((date, i) => [
      DAYS[i],
      date.toLocaleDateString("fr-FR"),
      getRangesText(i),
      `${getDayHours(i).toFixed(2)} h`,
    ]);

    const tableResult = autoTable(doc, {
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

    const finalY =
      (tableResult as any)?.lastAutoTable?.finalY ??
      (doc as any)?.lastAutoTable?.finalY ??
      120;
    const totalH = calculateHours();
    const totalOT = calculateOvertime();

    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const blockHeight = 70; // bloc total + signatures
    let boxY = finalY + 8; // juste sous le tableau

    // Si ça ne tient pas, on remonte au maximum pour rester sur la même page
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
    const boxX = pageWidth - boxWidth - 15; // aligné à droite avec marge
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

    doc.save(`releve_heures_${monday.toISOString().slice(0, 10)}.pdf`);
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const summaryData = weekDates.map((date, i) => {
      const hours = getDayHours(i);
      const supp = hours > 7 ? hours - 7 : 0;
      return {
        Jour: DAYS[i],
        Date: date.toLocaleDateString("fr-FR"),
        Horaires: getRangesText(i),
        Total: hours,
        "Heures Supp.": supp,
      };
    });

    const totalH = calculateHours();
    const totalOT = calculateOvertime();
    summaryData.push({
      Jour: "TOTAL",
      Date: "",
      Horaires: "",
      Total: totalH,
      "Heures Supp.": totalOT,
    });

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary["!cols"] = [
      { wch: 15 },
      { wch: 15 },
      { wch: 40 },
      { wch: 10 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resume");
    XLSX.writeFile(wb, "releve_heures.xlsx");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-sky-600" size={40} />
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  // Vérifier si l'email est confirmé
  if (!session.user.email_confirmed_at) {
    return <EmailNotVerified email={session.user.email || ''} />;
  }

  // Afficher la vue RH si l'utilisateur est admin et en mode RH
  if (viewMode === 'rh' && userRole === 'admin') {
    return (
      <div>
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewMode('employee')}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-sm transition-all"
                >
                  <LayoutGrid size={16} />
                  Ma feuille de temps
                </button>
              </div>
              <button
                onClick={() => supabase.auth.signOut()}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                title="Se déconnecter"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>
        <RHDashboard />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-sky-200"
      onMouseUp={handleMouseUp}
    >
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-sky-600 p-2 rounded-lg text-white shadow-lg shadow-sky-200">
                <Calendar size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Planning Hebdomadaire</h1>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => changeWeek(-1)}
                    className="p-0.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-sky-600 transition-colors"
                    title="Semaine precedente"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm text-slate-500 font-medium capitalize min-w-[180px] text-center select-none">
                    {monday.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} -{" "}
                    {weekDates[6].toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
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

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {dataLoading && <Loader2 className="animate-spin text-sky-600 mr-2" size={20} />}
              <div className="flex items-center gap-3 bg-slate-100 p-2 rounded-lg border border-slate-200">
                <User size={18} className="text-slate-400 ml-2" />
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                    Nom & prenom
                  </span>
                  <input
                    type="text"
                    value={collabName}
                    onChange={(e) => setCollabName(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm font-medium w-48 text-slate-700 placeholder:text-slate-400"
                    placeholder="Nom Prénom"
                  />
                </div>
              </div>

              <button
                onClick={clearGrid}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Tout effacer"
              >
                <Trash2 size={20} />
              </button>
              <div className="h-6 w-px bg-slate-300 mx-1" />
              <button
                onClick={exportExcel}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium text-sm transition-all"
              >
                <FileSpreadsheet size={16} /> Excel
              </button>
              <button
                onClick={exportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium text-sm shadow-md shadow-sky-200 transition-all active:scale-95"
              >
                <Download size={16} /> PDF
              </button>
              {userRole === 'admin' && (
                <>
                  <div className="h-6 w-px bg-slate-300 mx-1" />
                  <button
                    onClick={() => setViewMode('rh')}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-all"
                    title="Tableau de bord RH"
                  >
                    <Users size={16} /> RH
                  </button>
                </>
              )}
              <div className="h-6 w-px bg-slate-300 mx-1" />
              <button
                onClick={() => supabase.auth.signOut()}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                title="Se déconnecter"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {verificationMessage && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <span>{verificationMessage}</span>
            <button
              onClick={() => setVerificationMessage(null)}
              className="text-green-700 hover:text-green-900 font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Heures</p>
              <p className="text-3xl font-bold text-sky-600">
                {calculateHours().toFixed(2)} <span className="text-lg text-slate-400 font-normal">h</span>
              </p>
            </div>
            <div className="bg-sky-50 p-3 rounded-full text-sky-600">
              <Clock size={24} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Heures Supp. (&gt;7h)</p>
              <p className="text-3xl font-bold text-amber-500">
                {calculateOvertime().toFixed(2)} <span className="text-lg text-slate-400 font-normal">h</span>
              </p>
            </div>
            <div className="bg-amber-50 p-3 rounded-full text-amber-500">
              <TrendingUp size={24} />
            </div>
          </div>

          <div className="col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-sky-100 border border-sky-300 flex items-center justify-center">
                <div className="w-6 h-6 rounded bg-sky-500" />
              </div>
              <div className="text-sm">
                <p className="font-bold text-slate-700">Travaille</p>
                <p className="text-slate-500">Clique et glisse</p>
              </div>
            </div>
            <div className="h-10 w-px bg-slate-100" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                <div className="w-6 h-6 rounded bg-white border border-slate-200" />
              </div>
              <div className="text-sm">
                <p className="font-bold text-slate-700">Repos</p>
                <p className="text-slate-500">Laisse vide</p>
              </div>
            </div>
            <div className="flex-1 text-right text-sm text-slate-400 italic">
              Astuce : clique sur une zone bleue pour activer la gomme
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden select-none">
          <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-slate-200">
            <div className="p-4 bg-slate-50 border-r border-slate-200" />
            {DAYS.map((day, i) => {
              const isToday = weekDates[i].toDateString() === new Date().toDateString();
              return (
                <div
                  key={day}
                  className={`p-3 text-center border-r border-slate-100 last:border-r-0 ${isToday ? "bg-sky-50" : "bg-white"
                    }`}
                >
                  <p className={`text-xs font-bold uppercase mb-1 ${isToday ? "text-sky-600" : "text-slate-400"}`}>
                    {day}
                  </p>
                  <div
                    className={`mx-auto w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${isToday ? "bg-sky-600 text-white" : "text-slate-700"
                      }`}
                  >
                    {weekDates[i].getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative">
            {timeLabels.map((time, slotIndex) => {
              const isHourLine = slotIndex % 2 === 0;
              return (
                <div key={time} className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] h-8">
                  <div
                    className={`border-r border-slate-300 pr-3 flex items-start justify-end pt-0.5 ${
                      isHourLine
                        ? "text-xs text-slate-700 font-semibold"
                        : "text-[10px] text-slate-400 font-normal"
                    }`}
                  >
                    {time}
                  </div>
                  {DAYS.map((_, dayIndex) => {
                    const isActive = grid[dayIndex][slotIndex];
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
                        className={`border-r border-slate-300 last:border-r-0 cursor-pointer transition-colors relative ${isHourLine ? "border-b border-slate-300" : "border-b border-slate-200"
                          } hover:bg-slate-100`}
                      >
                        <div
                          className={`
                            absolute inset-0.5 transition-all duration-150 pointer-events-none
                            ${isActive ? "bg-sky-600 shadow-sm" : "bg-transparent"}
                            ${roundedClass}
                          `}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div >
  );
}
