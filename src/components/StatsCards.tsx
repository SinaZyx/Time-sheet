import React from "react";
import { Clock, TrendingUp } from "lucide-react";

interface StatsCardsProps {
    totalHours: number;
    overtimeHours: number;
}

export default function StatsCards({ totalHours, overtimeHours }: StatsCardsProps) {
    return (
        <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-3 sm:gap-6">
            <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Clock size={40} />
                </div>
                <div>
                    <p className="text-[10px] sm:text-sm font-medium text-slate-500 mb-0.5 sm:mb-1">Total</p>
                    <p className="text-xl sm:text-3xl font-bold text-sky-600 z-10 relative">
                        {totalHours.toFixed(2)} <span className="text-xs sm:text-lg text-slate-400 font-normal">h</span>
                    </p>
                </div>
            </div>

            <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <TrendingUp size={40} className="text-amber-500" />
                </div>
                <div>
                    <p className="text-[10px] sm:text-sm font-medium text-slate-500 mb-0.5 sm:mb-1">Heures Supp.</p>
                    <p className="text-xl sm:text-3xl font-bold text-amber-500 z-10 relative">
                        {overtimeHours.toFixed(2)} <span className="text-xs sm:text-lg text-slate-400 font-normal">h</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
