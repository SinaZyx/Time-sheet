import React, { useState } from 'react';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EmailVerificationPendingProps {
    email: string;
    onBackToLogin: () => void;
}

export default function EmailVerificationPending({ email, onBackToLogin }: EmailVerificationPendingProps) {
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleResendEmail = async () => {
        setResending(true);
        setError(null);
        setResent(false);

        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
            });

            if (error) throw error;

            setResent(true);
            setTimeout(() => setResent(false), 5000);
        } catch (err: any) {
            setError(err.message || 'Erreur lors du renvoi de l\'email');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-slate-200">
                <div className="text-center mb-8">
                    <div className="bg-sky-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-sky-600">
                        <Mail size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Vérifiez votre email</h1>
                    <p className="text-slate-600 mb-4">
                        Nous avons envoyé un email de confirmation à :
                    </p>
                    <p className="text-sky-600 font-semibold text-lg mb-4">{email}</p>
                    <p className="text-slate-500 text-sm">
                        Cliquez sur le lien dans l'email pour activer votre compte.
                    </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <p className="text-amber-800 text-sm">
                        <strong>Note :</strong> L'email peut prendre quelques minutes à arriver.
                        Pensez à vérifier vos spams !
                    </p>
                </div>

                {resent && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                        <CheckCircle2 size={20} />
                        <span>Email renvoyé avec succès !</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleResendEmail}
                    disabled={resending || resent}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                >
                    {resending ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Envoi en cours...
                        </>
                    ) : resent ? (
                        <>
                            <CheckCircle2 size={20} />
                            Email envoyé
                        </>
                    ) : (
                        'Renvoyer l\'email'
                    )}
                </button>

                <button
                    onClick={onBackToLogin}
                    className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-lg border border-slate-300 transition-all"
                >
                    Retour à la connexion
                </button>
            </div>
        </div>
    );
}
