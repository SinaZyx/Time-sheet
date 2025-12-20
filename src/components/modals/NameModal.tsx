import React from 'react';

interface NameModalProps {
    isOpen: boolean;
    onClose: () => void;
    newName: string;
    setNewName: (val: string) => void;
    saveNameChange: () => void;
    savingName: boolean;
    nameError: string | null;
}

export default function NameModal({
    isOpen,
    onClose,
    newName,
    setNewName,
    saveNameChange,
    savingName,
    nameError,
}: NameModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 relative">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Modifier le nom/prénom</h2>
                        <p className="text-sm text-slate-500">Met à jour le nom associé à ton compte.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        ×
                    </button>
                </div>

                <label className="block text-sm font-medium text-slate-700 mb-2">Nom & Prénom</label>
                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                    placeholder="Jean Dupont"
                />
                {nameError && <p className="text-xs text-red-600 mt-1">{nameError}</p>}

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={saveNameChange}
                        disabled={savingName}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {savingName ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </div>
        </div>
    );
}
