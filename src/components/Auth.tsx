import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, Loader2, User, Eye, EyeOff } from 'lucide-react';
import EmailVerificationPending from './EmailVerificationPending';

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const [showVerificationPending, setShowVerificationPending] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const getErrorMessage = (error: any): string => {
        const errorMsg = error.message.toLowerCase();

        if (errorMsg.includes('invalid login credentials') || errorMsg.includes('invalid credentials')) {
            return 'Email ou mot de passe incorrect.';
        }
        if (errorMsg.includes('email not confirmed')) {
            return 'Veuillez vérifier votre email avant de vous connecter.';
        }
        if (errorMsg.includes('user already registered')) {
            return 'Un compte existe déjà avec cet email.';
        }
        if (errorMsg.includes('password should be at least')) {
            return 'Le mot de passe doit contenir au moins 6 caractères.';
        }
        if (errorMsg.includes('invalid email')) {
            return 'Format d\'email invalide.';
        }
        if (errorMsg.includes('email rate limit exceeded')) {
            return 'Trop de tentatives. Veuillez réessayer dans quelques minutes.';
        }

        return error.message || 'Une erreur est survenue. Veuillez réessayer.';
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                });
                if (error) throw error;
                setShowVerificationPending(true);
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: getErrorMessage(error) });
        } finally {
            setLoading(false);
        }
    };

    if (showVerificationPending) {
        return (
            <EmailVerificationPending
                email={email}
                onBackToLogin={() => {
                    setShowVerificationPending(false);
                    setIsSignUp(false);
                    setEmail('');
                    setPassword('');
                    setFullName('');
                    setMessage(null);
                }}
            />
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-slate-200">
                <div className="text-center mb-8">
                    <div className="bg-sky-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-sky-600">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Bienvenue</h1>
                    <p className="text-slate-500 mt-2">Connectez-vous pour gérer vos feuilles de temps</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    {isSignUp && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nom et Prénom</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                    placeholder="Jean Dupont"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                placeholder="votre@email.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-12 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                                placeholder="••••••••"
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            isSignUp ? "S'inscrire" : "Se connecter"
                        )}
                    </button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-slate-500">Ou continuer avec</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={async () => {
                        setLoading(true);
                        const { error } = await supabase.auth.signInWithOAuth({
                            provider: 'google',
                            options: {
                                redirectTo: window.location.origin,
                            },
                        });
                        if (error) {
                            setMessage({ type: 'error', text: error.message });
                            setLoading(false);
                        }
                    }}
                    className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-lg border border-slate-300 transition-all flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    Google
                </button>

                <div className="mt-6 text-center text-sm text-slate-500">
                    {isSignUp ? "Déjà un compte ?" : "Pas encore de compte ?"}
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setMessage(null);
                        }}
                        className="text-sky-600 font-semibold ml-1 hover:underline"
                    >
                        {isSignUp ? "Se connecter" : "Créer un compte"}
                    </button>
                </div>
            </div>
        </div>
    );
}
