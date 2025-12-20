import React from "react";

export default function Legend() {
    return (
        <div className="col-span-1 md:col-span-2 bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-row items-center justify-between gap-2 sm:gap-6">
            <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 sm:gap-3">
                    <div className="w-6 h-6 sm:w-12 sm:h-12 rounded-md sm:rounded-lg bg-sky-100 border border-sky-300 flex items-center justify-center">
                        <div className="w-3 h-3 sm:w-6 sm:h-6 rounded-sm sm:rounded bg-sky-500" />
                    </div>
                    <div className="text-xs sm:text-sm">
                        <p className="font-bold text-slate-700">Trav.</p>
                        <p className="text-[10px] sm:text-sm text-slate-500 hidden sm:block">Clique et glisse</p>
                    </div>
                </div>

                <div className="h-6 sm:h-10 w-px bg-slate-100 mx-1 sm:mx-0" />

                <div className="flex items-center gap-1.5 sm:gap-3">
                    <div className="w-6 h-6 sm:w-12 sm:h-12 rounded-md sm:rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                        <div className="w-3 h-3 sm:w-6 sm:h-6 rounded-sm sm:rounded bg-white border border-slate-200" />
                    </div>
                    <div className="text-xs sm:text-sm">
                        <p className="font-bold text-slate-700">Repos</p>
                        <p className="text-[10px] sm:text-sm text-slate-500 hidden sm:block">Laisse vide</p>
                    </div>
                </div>
            </div>

            <div className="text-[10px] sm:text-sm text-slate-400 italic text-right max-w-[120px] sm:max-w-none leading-tight">
                <span className="sm:hidden">Bleu = Gomme</span>
                <span className="hidden sm:inline">Astuce : clique sur une zone bleue pour activer la gomme</span>
            </div>
        </div>
    );
}
