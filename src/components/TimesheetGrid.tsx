import React from 'react';

interface TimesheetGridProps {
    grid: boolean[][];
    weekDates: Date[];
    timeLabels: string[];
    days: string[];
    handleMouseDown: (dayIndex: number, slotIndex: number) => void;
    handleMouseEnter: (dayIndex: number, slotIndex: number) => void;
    getSlotStartTime: (index: number) => string;
    getSlotEndTime: (index: number) => string;
    totalSlots: number;
}

export default function TimesheetGrid({
    grid,
    weekDates,
    timeLabels,
    days,
    handleMouseDown,
    handleMouseEnter,
    getSlotStartTime,
    getSlotEndTime,
    totalSlots,
}: TimesheetGridProps) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto select-none">
            {/* Container avec min-w pour assurer que la grille ne s'écrase pas sur mobile */}
            <div className="min-w-[900px]">
                {/* En-tête des jours */}
                <div className="grid grid-cols-[60px_repeat(7,1fr)] sm:grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-slate-200">
                    <div className="p-3 sm:p-4 bg-slate-50 border-r border-slate-200" />
                    {days.map((day, i) => {
                        const isToday = weekDates[i].toDateString() === new Date().toDateString();
                        return (
                            <div
                                key={day}
                                className={`p-2 sm:p-3 text-center border-r border-slate-100 last:border-r-0 ${isToday ? "bg-sky-50" : "bg-white"
                                    }`}
                            >
                                <p className={`text-[10px] sm:text-xs font-bold uppercase mb-1 ${isToday ? "text-sky-600" : "text-slate-400"}`}>
                                    {day}
                                </p>
                                <div
                                    className={`mx-auto w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full font-bold text-xs sm:text-sm ${isToday ? "bg-sky-600 text-white" : "text-slate-700"
                                        }`}
                                >
                                    {weekDates[i].getDate()}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Corps de la grille */}
                <div className="relative">
                    {timeLabels.map((time, slotIndex) => {
                        const isHourLine = slotIndex % 2 === 0;
                        return (
                            <div key={time} className="grid grid-cols-[60px_repeat(7,1fr)] sm:grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] h-7 sm:h-8">
                                {/* Colonne heure */}
                                <div
                                    className={`border-r border-slate-300 pr-2 sm:pr-3 flex items-start justify-end pt-0.5 ${isHourLine
                                        ? "text-[10px] sm:text-xs text-slate-700 font-semibold"
                                        : "text-[9px] sm:text-[10px] text-slate-400 font-normal"
                                        }`}
                                >
                                    {time}
                                </div>

                                {/* Cellules */}
                                {days.map((_, dayIndex) => {
                                    const isActive = grid[dayIndex][slotIndex];
                                    const prevActive = slotIndex > 0 && grid[dayIndex][slotIndex - 1];
                                    const nextActive = slotIndex < totalSlots - 1 && grid[dayIndex][slotIndex + 1];
                                    const isRangeStart = isActive && !prevActive;
                                    const isRangeEnd = isActive && !nextActive;

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
                                            {isRangeStart && (
                                                <div className="absolute top-1 left-1 text-[9px] sm:text-[10px] font-semibold text-white drop-shadow-sm pointer-events-none select-none z-10">
                                                    {getSlotStartTime(slotIndex)}
                                                </div>
                                            )}
                                            {isRangeEnd && (
                                                <div className="absolute bottom-1 right-1 text-[9px] sm:text-[10px] font-semibold text-white drop-shadow-sm pointer-events-none select-none z-10">
                                                    {getSlotEndTime(slotIndex)}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
