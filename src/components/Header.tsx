import React from "react";
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Download,
    FileSpreadsheet,
    FileText,
    LogOut,
    User,
    LayoutGrid,
    Loader2,
    Users,
    Trash2,
} from "lucide-react";

interface HeaderProps {
    currentDate: Date;
    weekDates: Date[];
    changeWeek: (offset: number) => void;
    setCurrentDate: (date: Date) => void;
    monday: Date;
    collabName: string;
    setCollabName: (name: string) => void;
    openNameModal: () => void;
    clearGrid: () => void;
    exportExcel: () => void;
    openExportModal: () => void;
    exportPDF: () => void;
    viewMode: 'employee' | 'rh';
    setViewMode: (mode: 'employee' | 'rh') => void;
    userRole: 'employee' | 'admin' | null;
    onSignOut: () => void;
    dataLoading: boolean;
}

export default function Header({
    currentDate,
    weekDates,
    changeWeek,
    setCurrentDate,
    monday,
    collabName,
    setCollabName,
    openNameModal,
    clearGrid,
    exportExcel,
    openExportModal,
    exportPDF,
    viewMode,
    setViewMode,
    userRole,
    onSignOut,
    dataLoading,
}: HeaderProps) {
    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-sky-600 p-2 rounded-lg text-white shadow-lg shadow-sky-200">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">Planning Hebdomadaire</h1>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <button
                                    onClick={() => changeWeek(-1)}
                                    className="p-0.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-sky-600 transition-colors"
                                    title="Semaine precedente"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <span className="text-xs sm:text-sm text-slate-500 font-medium capitalize min-w-[140px] sm:min-w-[180px] text-center select-none">
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
                                    className="text-xs text-sky-600 hover:text-sky-700 font-medium ml-0 sm:ml-2 px-2 py-0.5 bg-sky-50 rounded hover:bg-sky-100 transition-colors"
                                >
                                    Aujourd'hui
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-start md:justify-end w-full md:w-auto">
                        {dataLoading && <Loader2 className="animate-spin text-sky-600 mr-2" size={20} />}
                        <div className="flex items-center gap-3 bg-slate-100 p-2 rounded-lg border border-slate-200 w-full sm:w-auto">
                            <User size={18} className="text-slate-400 ml-2" />
                            <div className="flex flex-col">
                                <span className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                                    Nom & prenom
                                </span>
                                <input
                                    type="text"
                                    value={collabName}
                                    onChange={(e) => setCollabName(e.target.value)}
                                    className="bg-transparent border-none outline-none text-sm font-medium w-32 sm:w-48 text-slate-700 placeholder:text-slate-400"
                                    placeholder="Nom Prénom"
                                />
                            </div>
                            <button
                                onClick={openNameModal}
                                className="ml-2 text-xs text-sky-600 hover:text-sky-700 font-semibold px-2 py-1 bg-sky-50 rounded-md border border-sky-100 hover:bg-sky-100 transition-colors"
                                title="Modifier le nom/prénom associé"
                            >
                                Corriger
                            </button>
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
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium text-xs sm:text-sm transition-all"
                        >
                            <FileSpreadsheet size={16} /> Excel
                        </button>
                        <button
                            onClick={openExportModal}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-xs sm:text-sm shadow-md shadow-indigo-200 transition-all active:scale-95"
                            title="Exporter les feuilles de temps"
                        >
                            <FileText size={16} /> Feuilles
                        </button>
                        <button
                            onClick={exportPDF}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium text-xs sm:text-sm shadow-md shadow-sky-200 transition-all active:scale-95"
                        >
                            <Download size={16} /> PDF
                        </button>
                        {userRole === 'admin' && (
                            <>
                                <div className="h-6 w-px bg-slate-300 mx-1" />
                                <button
                                    onClick={() => setViewMode('rh')}
                                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-xs sm:text-sm transition-all"
                                    title="Tableau de bord RH"
                                >
                                    <Users size={16} /> RH
                                </button>
                            </>
                        )}
                        <div className="h-6 w-px bg-slate-300 mx-1" />
                        <button
                            onClick={onSignOut}
                            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Se déconnecter"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
