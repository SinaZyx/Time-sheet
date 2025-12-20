import React from "react";

export default function Legend() {
    return (
        <div className="col-span-1 md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-6">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-sky-100 border border-sky-300 flex items-center justify-center">
                    <div className="w-6 h-6 rounded bg-sky-500" />
                </div>
                <div className="text-sm">
                    <p className="font-bold text-slate-700">Travaillé</p>
                    <p className="text-slate-500">Clique et glisse</p>
                </div>
            </div>
            <div className="hidden sm:block h-10 w-px bg-slate-100" />
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                    <div className="w-6 h-6 rounded bg-white border border-slate-200" />
                </div>
                <div className="text-sm">
                    <p className="font-bold text-slate-700">Repos</p>
                    <p className="text-slate-500">Laisse vide</p>
                </div>
            </div>
            <div className="flex-1 text-center sm:text-right text-sm text-slate-400 italic mt-2 sm:mt-0">
                Astuce : clique sur une zone bleue pour activer la gomme
            </div>
        </div>
    );
}
