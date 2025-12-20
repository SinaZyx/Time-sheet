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

                    <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end w-full md:w-auto">
                        {dataLoading && <Loader2 className="animate-spin text-sky-600 mr-2" size={20} />}

                        {/* User Block: Full width on very small screens, auto on larger */}
                        <div className="flex items-center gap-2 sm:gap-3 bg-slate-100 p-1.5 sm:p-2 rounded-lg border border-slate-200 w-full sm:w-auto mb-2 sm:mb-0">
                            <User size={18} className="text-slate-400 ml-1 sm:ml-2" />
                            <div className="flex flex-col flex-1 sm:flex-none">
                                <span className="text-[10px] sm:text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                                    Nom & prenom
                                </span>
                                <input
                                    type="text"
                                    value={collabName}
                                    onChange={(e) => setCollabName(e.target.value)}
                                    className="bg-transparent border-none outline-none text-sm font-medium w-full sm:w-48 text-slate-700 placeholder:text-slate-400"
                                    placeholder="Nom Prénom"
                                />
                            </div>
                            <button
                                onClick={openNameModal}
                                className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-sky-600 hover:text-sky-700 font-semibold px-2 py-1 bg-sky-50 rounded-md border border-sky-100 hover:bg-sky-100 transition-colors whitespace-nowrap"
                                title="Modifier le nom/prénom associé"
                            >
                                Corriger
                            </button>
                        </div>

                        {/* Actions Group - using a container to keep them together if needed */}
                        <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
                            <button
                                onClick={clearGrid}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                title="Tout effacer"
                            >
                                <Trash2 size={20} />
                            </button>

                            <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block" />

                            <button
                                onClick={exportExcel}
                                className="flex items-center gap-2 px-2 sm:px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium text-xs sm:text-sm transition-all"
                                title="Exporter Excel"
                            >
                                <FileSpreadsheet size={18} className="sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Excel</span>
                            </button>

                            <button
                                onClick={openExportModal}
                                className="flex items-center gap-2 px-2 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-xs sm:text-sm shadow-md shadow-indigo-200 transition-all active:scale-95"
                                title="Exporter les feuilles de temps"
                            >
                                <FileText size={18} className="sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Feuilles</span>
                            </button>

                            <button
                                onClick={exportPDF}
                                className="flex items-center gap-2 px-2 sm:px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium text-xs sm:text-sm shadow-md shadow-sky-200 transition-all active:scale-95"
                                title="Télécharger PDF"
                            >
                                <Download size={18} className="sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">PDF</span>
                            </button>

                            {userRole === 'admin' && (
                                <>
                                    <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block" />
                                    <button
                                        onClick={() => setViewMode('rh')}
                                        className="flex items-center gap-2 px-2 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-xs sm:text-sm transition-all"
                                        title="Tableau de bord RH"
                                    >
                                        <Users size={18} className="sm:w-4 sm:h-4" />
                                        <span className="hidden sm:inline">RH</span>
                                    </button>
                                </>
                            )}

                            <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block" />

                            <button
                                onClick={onSignOut}
                                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                                title="Se déconnecter"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
