import React from "react";
import { Clock, TrendingUp } from "lucide-react";

interface StatsCardsProps {
    totalHours: number;
    overtimeHours: number;
}

export default function StatsCards({ totalHours, overtimeHours }: StatsCardsProps) {
    return (
        <>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Total Heures</p>
                    <p className="text-3xl font-bold text-sky-600">
                        {totalHours.toFixed(2)} <span className="text-lg text-slate-400 font-normal">h</span>
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
                        {overtimeHours.toFixed(2)} <span className="text-lg text-slate-400 font-normal">h</span>
                    </p>
                </div>
                <div className="bg-amber-50 p-3 rounded-full text-amber-500">
                    <TrendingUp size={24} />
                </div>
            </div>
        </>
    );
}
