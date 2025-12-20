import React from 'react';
import { Mail, Loader2, Download, AlertTriangle } from 'lucide-react';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    exportPeriod: 'month' | 'week' | 'custom';
    setExportPeriod: (period: 'month' | 'week' | 'custom') => void;
    selectedExportMonth: string;
    setSelectedExportMonth: (val: string) => void;
    selectedExportWeek: string;
    setSelectedExportWeek: (val: string) => void;
    exportStartDate: string;
    setExportStartDate: (val: string) => void;
    exportEndDate: string;
    setExportEndDate: (val: string) => void;
    exportRecipient: string;
    setExportRecipient: (val: string) => void;
    exportingPeriod: boolean;
    exportError: string | null;
    handlePeriodDownload: () => void;
    handlePeriodEmail: () => void;
}

export default function ExportModal({
    isOpen,
    onClose,
    exportPeriod,
    setExportPeriod,
    selectedExportMonth,
    setSelectedExportMonth,
    selectedExportWeek,
    setSelectedExportWeek,
    exportStartDate,
    setExportStartDate,
    exportEndDate,
    setExportEndDate,
    exportRecipient,
    setExportRecipient,
    exportingPeriod,
    exportError,
    handlePeriodDownload,
    handlePeriodEmail,
}: ExportModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 relative">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Exporter des feuilles</h2>
                        <p className="text-sm text-slate-500">Choisis une période et envoie le PDF.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Période</label>
                        <select
                            value={exportPeriod}
                            onChange={(e) => setExportPeriod(e.target.value as 'month' | 'week' | 'custom')}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        >
                            <option value="month">Mois</option>
                            <option value="week">Semaine</option>
                            <option value="custom">Période personnalisée</option>
                        </select>
                    </div>

                    {exportPeriod === 'month' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Mois</label>
                            <input
                                type="month"
                                value={selectedExportMonth}
                                onChange={(e) => setSelectedExportMonth(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>
                    )}

                    {exportPeriod === 'week' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Semaine (date du lundi)</label>
                            <input
                                type="date"
                                value={selectedExportWeek}
                                onChange={(e) => setSelectedExportWeek(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>
                    )}

                    {exportPeriod === 'custom' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Date début</label>
                                <input
                                    type="date"
                                    value={exportStartDate}
                                    onChange={(e) => setExportStartDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Date fin</label>
                                <input
                                    type="date"
                                    value={exportEndDate}
                                    onChange={(e) => setExportEndDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Email destinataire</label>
                        <input
                            type="email"
                            value={exportRecipient}
                            onChange={(e) => setExportRecipient(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            placeholder="rh@entreprise.com"
                        />
                    </div>
                </div>

                {exportError && (
                    <div className="flex items-center gap-2 mt-2 text-red-600 bg-red-50 p-2 rounded-md">
                        <AlertTriangle size={16} />
                        <p className="text-xs">{exportError}</p>
                    </div>
                )}

                <p className="text-xs text-slate-500 mt-3">
                    Le PDF sera téléchargé puis Outlook s’ouvrira avec un message prérempli. Pense à joindre le PDF.
                </p>

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handlePeriodDownload}
                        disabled={exportingPeriod}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {exportingPeriod ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                        <span className="hidden sm:inline">Télécharger</span> PDF
                    </button>
                    <button
                        onClick={handlePeriodEmail}
                        disabled={exportingPeriod}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Mail size={16} /> Outlook
                    </button>
                </div>
            </div>
        </div>
    );
}
