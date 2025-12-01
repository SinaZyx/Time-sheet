import React, { useState, useEffect } from 'react';
import { Calendar, Download, FileSpreadsheet, Users, Loader2, Filter, CheckSquare, Square, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateConsolidatedPDF, generateSingleEmployeePDF } from '../utils/pdfExports';
import { generateConsolidatedExcel } from '../utils/excelExports';
import JSZip from 'jszip';

interface Employee {
    id: string;
    name: string;
    email: string;
    totalHours: number;
    lastUpdate: Date | null;
}

interface TimesheetRecord {
    user_id: string;
    week_start_date: string;
    grid_data: boolean[][];
    updated_at: string;
}

export default function RHDashboard() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [filterPeriod, setFilterPeriod] = useState<'week' | 'month' | 'custom' | 'latest'>('latest');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedWeek, setSelectedWeek] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            // Récupérer tous les utilisateurs avec leur profile
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id');

            if (profilesError) throw profilesError;

            if (!profiles || profiles.length === 0) {
                setEmployees([]);
                setLoading(false);
                return;
            }

            const userIds = profiles.map(p => p.id);

            // Récupérer les informations utilisateur
            const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

            if (usersError) throw usersError;

            // Récupérer tous les timesheets du mois en cours
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const { data: timesheets, error: timesheetsError } = await supabase
                .from('timesheets')
                .select('user_id, grid_data, week_start_date, updated_at')
                .gte('week_start_date', firstDayOfMonth.toISOString().split('T')[0])
                .lte('week_start_date', lastDayOfMonth.toISOString().split('T')[0]);

            if (timesheetsError) throw timesheetsError;

            // Calculer les statistiques pour chaque employé
            const employeesData: Employee[] = userIds.map(userId => {
                const user = users?.find(u => u.id === userId);
                const userTimesheets = timesheets?.filter(t => t.user_id === userId) || [];

                // Calculer le total d'heures du mois
                const totalHours = userTimesheets.reduce((sum, ts) => {
                    return sum + ts.grid_data.flat().filter(Boolean).length * 0.5;
                }, 0);

                // Trouver la dernière mise à jour
                const lastUpdate = userTimesheets.length > 0
                    ? new Date(Math.max(...userTimesheets.map(t => new Date(t.updated_at).getTime())))
                    : null;

                return {
                    id: userId,
                    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Inconnu',
                    email: user?.email || '',
                    totalHours,
                    lastUpdate,
                };
            });

            setEmployees(employeesData.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (error) {
            console.error('Erreur lors de la récupération des employés:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleEmployee = (id: string) => {
        const newSelected = new Set(selectedEmployees);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedEmployees(newSelected);
    };

    const toggleAll = () => {
        if (selectedEmployees.size === employees.length) {
            setSelectedEmployees(new Set());
        } else {
            setSelectedEmployees(new Set(employees.map(e => e.id)));
        }
    };

    const fetchTimesheetsForExport = async (): Promise<any[]> => {
        if (selectedEmployees.size === 0) {
            alert('Veuillez sélectionner au moins un employé');
            return [];
        }

        const userIds = Array.from(selectedEmployees);
        let query = supabase
            .from('timesheets')
            .select('user_id, grid_data, week_start_date, updated_at')
            .in('user_id', userIds);

        // Appliquer les filtres selon le type de période
        if (filterPeriod === 'week' && selectedWeek) {
            query = query.eq('week_start_date', selectedWeek);
        } else if (filterPeriod === 'month' && selectedMonth) {
            const [year, month] = selectedMonth.split('-');
            const firstDay = new Date(parseInt(year), parseInt(month) - 1, 1);
            const lastDay = new Date(parseInt(year), parseInt(month), 0);
            query = query
                .gte('week_start_date', firstDay.toISOString().split('T')[0])
                .lte('week_start_date', lastDay.toISOString().split('T')[0]);
        } else if (filterPeriod === 'custom' && startDate && endDate) {
            query = query
                .gte('week_start_date', startDate)
                .lte('week_start_date', endDate);
        }

        const { data: timesheets, error } = await query;

        if (error) {
            console.error('Erreur lors de la récupération des timesheets:', error);
            return [];
        }

        // Si mode "latest", garder seulement la dernière feuille de chaque employé
        if (filterPeriod === 'latest' && timesheets) {
            const latestByUser = new Map<string, any>();
            timesheets.forEach(ts => {
                const existing = latestByUser.get(ts.user_id);
                if (!existing || new Date(ts.updated_at) > new Date(existing.updated_at)) {
                    latestByUser.set(ts.user_id, ts);
                }
            });
            return Array.from(latestByUser.values());
        }

        return timesheets || [];
    };

    const handleExportConsolidatedPDF = async () => {
        setExporting(true);
        try {
            const timesheets = await fetchTimesheetsForExport();
            if (timesheets.length === 0) {
                alert('Aucune feuille de temps trouvée pour la période sélectionnée');
                return;
            }

            const { data: { users } } = await supabase.auth.admin.listUsers();

            const pdfData = timesheets.map(ts => ({
                employeeName: users?.find(u => u.id === ts.user_id)?.user_metadata?.full_name ||
                             users?.find(u => u.id === ts.user_id)?.email?.split('@')[0] ||
                             'Inconnu',
                weekStartDate: new Date(ts.week_start_date),
                gridData: ts.grid_data,
            }));

            generateConsolidatedPDF(pdfData);
        } catch (error) {
            console.error('Erreur lors de l\'export PDF:', error);
            alert('Erreur lors de l\'export PDF');
        } finally {
            setExporting(false);
        }
    };

    const handleExportZipPDFs = async () => {
        setExporting(true);
        try {
            const timesheets = await fetchTimesheetsForExport();
            if (timesheets.length === 0) {
                alert('Aucune feuille de temps trouvée pour la période sélectionnée');
                return;
            }

            const { data: { users } } = await supabase.auth.admin.listUsers();
            const zip = new JSZip();

            for (const ts of timesheets) {
                const user = users?.find(u => u.id === ts.user_id);
                const employeeName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Inconnu';

                const pdfData = {
                    employeeName,
                    weekStartDate: new Date(ts.week_start_date),
                    gridData: ts.grid_data,
                };

                const pdfBlob = generateSingleEmployeePDF(pdfData);
                const fileName = `${employeeName.replace(/\s+/g, '_')}_${ts.week_start_date}.pdf`;
                zip.file(fileName, pdfBlob);
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `releves_heures_${timesheets.length}_employes.zip`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erreur lors de l\'export ZIP:', error);
            alert('Erreur lors de l\'export ZIP');
        } finally {
            setExporting(false);
        }
    };

    const handleExportExcel = async () => {
        setExporting(true);
        try {
            const timesheets = await fetchTimesheetsForExport();
            if (timesheets.length === 0) {
                alert('Aucune feuille de temps trouvée pour la période sélectionnée');
                return;
            }

            const { data: { users } } = await supabase.auth.admin.listUsers();

            const excelData = timesheets.map(ts => ({
                employeeName: users?.find(u => u.id === ts.user_id)?.user_metadata?.full_name ||
                             users?.find(u => u.id === ts.user_id)?.email?.split('@')[0] ||
                             'Inconnu',
                weekStartDate: new Date(ts.week_start_date),
                gridData: ts.grid_data,
            }));

            generateConsolidatedExcel(excelData);
        } catch (error) {
            console.error('Erreur lors de l\'export Excel:', error);
            alert('Erreur lors de l\'export Excel');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-sky-100 p-3 rounded-lg">
                                <Users className="text-sky-600" size={32} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">Tableau de bord RH</h1>
                                <p className="text-slate-500">Gestion des feuilles de temps des employés</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-500">Employés</p>
                            <p className="text-3xl font-bold text-sky-600">{employees.length}</p>
                        </div>
                    </div>

                    {/* Filtres */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Période</label>
                            <select
                                value={filterPeriod}
                                onChange={(e) => setFilterPeriod(e.target.value as any)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                            >
                                <option value="latest">Dernière feuille</option>
                                <option value="week">Par semaine</option>
                                <option value="month">Par mois</option>
                                <option value="custom">Personnalisée</option>
                            </select>
                        </div>

                        {filterPeriod === 'week' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Semaine</label>
                                <input
                                    type="date"
                                    value={selectedWeek}
                                    onChange={(e) => setSelectedWeek(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                                />
                            </div>
                        )}

                        {filterPeriod === 'month' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Mois</label>
                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                                />
                            </div>
                        )}

                        {filterPeriod === 'custom' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Date début</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Date fin</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Boutons d'export */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleExportConsolidatedPDF}
                            disabled={selectedEmployees.size === 0 || exporting}
                            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {exporting ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
                            PDF Consolidé
                        </button>
                        <button
                            onClick={handleExportZipPDFs}
                            disabled={selectedEmployees.size === 0 || exporting}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {exporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                            ZIP de PDFs
                        </button>
                        <button
                            onClick={handleExportExcel}
                            disabled={selectedEmployees.size === 0 || exporting}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {exporting ? <Loader2 className="animate-spin" size={16} /> : <FileSpreadsheet size={16} />}
                            Excel Consolidé
                        </button>
                        <div className="flex-1"></div>
                        <span className="text-sm text-slate-600 self-center">
                            {selectedEmployees.size} employé{selectedEmployees.size > 1 ? 's' : ''} sélectionné{selectedEmployees.size > 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {/* Liste des employés */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <button
                            onClick={toggleAll}
                            className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-sky-600 transition-colors"
                        >
                            {selectedEmployees.size === employees.length ? (
                                <CheckSquare size={20} className="text-sky-600" />
                            ) : (
                                <Square size={20} />
                            )}
                            Tout sélectionner
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="animate-spin text-sky-600" size={40} />
                        </div>
                    ) : employees.length === 0 ? (
                        <div className="text-center p-12 text-slate-500">
                            <Users size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Aucun employé trouvé</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-12">
                                            <span className="sr-only">Sélection</span>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Employé
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Total heures (mois)
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Dernière saisie
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {employees.map((employee) => (
                                        <tr
                                            key={employee.id}
                                            onClick={() => toggleEmployee(employee.id)}
                                            className="hover:bg-slate-50 cursor-pointer transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                {selectedEmployees.has(employee.id) ? (
                                                    <CheckSquare size={20} className="text-sky-600" />
                                                ) : (
                                                    <Square size={20} className="text-slate-400" />
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-slate-900">
                                                        {employee.name}
                                                    </div>
                                                    <div className="text-sm text-slate-500">{employee.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold text-sky-600">
                                                    {employee.totalHours.toFixed(2)} h
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {employee.lastUpdate
                                                    ? employee.lastUpdate.toLocaleDateString('fr-FR')
                                                    : 'Jamais'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
