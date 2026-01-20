import React, { useState } from 'react';
import { User } from '../types';
import { db } from '../services/db';

interface RegisterProps {
  onLogin: (user: User) => void;
  navigate: (page: string) => void;
}

export const Register: React.FC<RegisterProps> = ({ onLogin, navigate }) => {
  // Gestion des étapes : 'FORM' ou 'OTP'
  const [step, setStep] = useState<'FORM' | 'OTP'>('FORM');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // ÉTAPE 1 : Validation formulaire + Envoi OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    const phoneRegex = /^0[67]\d{8}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      setError("Numéro de téléphone invalide (Format: 06... ou 07...).");
      return;
    }

    setLoading(true);
    try {
        // Simulation envoi OTP
        await db.sendOTP(formData.phone);
        setStep('OTP'); // Passage à l'étape suivante
    } catch (err: any) {
        setError(err.message || "Erreur lors de l'envoi du code.");
    } finally {
        setLoading(false);
    }
  };

  // ÉTAPE 2 : Vérification OTP + Création Compte
  const handleVerifyOTP = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');

      try {
          // Simulation vérification (code hardcodé '1234')
          if (otpCode !== '1234') {
              throw new Error("Code de vérification incorrect.");
          }

          // Inscription réelle
          const newUser = await db.register({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password
          });
          onLogin(newUser);

      } catch (err: any) {
          setError(err.message);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex bg-white">
      
      {/* RIGHT COLUMN: IMAGE (Desktop Only) - INVERSE ORDER FOR VARIETY */}
      {/* Utilisation d'un background pour éviter les images blanches si le chargement est lent */}
      <div className="hidden md:block w-1/2 relative order-2 bg-daretPink/5">
         {/* IMAGE: Groupe de femmes / Ambiance chaleureuse (Lien stable) */}
         <img 
            className="absolute inset-0 w-full h-full object-cover" 
            src="https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?q=80&w=2854&auto=format&fit=crop" 
            alt="Famille marocaine réunie autour d'un moment convivial" 
         />
         <div className="absolute inset-0 bg-gradient-to-t from-daretPink/90 via-daretPink/20 to-transparent flex items-end p-16">
            <div className="text-white max-w-lg">
                <h3 className="text-3xl font-bold mb-4">Rejoignez la famille.</h3>
                <p className="text-white/90 text-lg">
                    "La solidarité est notre force. Avec Daretna, j'épargne avec mes sœurs et mes amies en toute tranquillité."
                </p>
            </div>
         </div>
      </div>

      {/* LEFT COLUMN: FORM */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-12 lg:p-16 order-1">
        <div className="w-full max-w-md space-y-8">
            <div className="text-left">
                <h2 className="text-4xl font-extrabold text-navy-900 tracking-tight">Créer un compte 🚀</h2>
                <p className="mt-2 text-slate-500">
                    Commencez votre voyage vers une épargne sereine dès aujourd'hui.
                </p>
            </div>

            {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center animate-pulse">
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                {error}
            </div>
            )}

            {step === 'FORM' ? (
                /* --- FORMULAIRE D'INSCRIPTION --- */
                <form onSubmit={handleRequestOTP} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                        <input 
                        type="text" 
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-daretPink focus:border-transparent outline-none transition placeholder-slate-300"
                        placeholder="ex: Yassine Alami"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input 
                        type="email" 
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-daretPink focus:border-transparent outline-none transition placeholder-slate-300"
                        placeholder="ex: yassine@gmail.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                        <input 
                        type="tel" 
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-daretPink focus:border-transparent outline-none transition placeholder-slate-300"
                        placeholder="ex: 0661234567"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
                        <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"}
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-daretPink focus:border-transparent outline-none transition placeholder-slate-300"
                            placeholder="Minimum 6 caractères"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                        >
                            {showPassword ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                            ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            )}
                        </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirmer mot de passe</label>
                        <input 
                        type="password" 
                        name="confirmPassword"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-daretPink focus:border-transparent outline-none transition placeholder-slate-300"
                        placeholder="••••••••"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-navy-900 text-white py-4 rounded-lg font-bold hover:bg-navy-800 transition shadow-lg disabled:opacity-70 flex justify-center items-center transform hover:-translate-y-0.5"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        ) : null}
                        {loading ? 'Envoi du code...' : "Continuer"}
                    </button>
                </form>
            ) : (
                /* --- FORMULAIRE OTP --- */
                <form onSubmit={handleVerifyOTP} className="space-y-6">
                    <div className="text-center py-4">
                        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                            📱
                        </div>
                        <h3 className="font-bold text-navy-900">Vérification SMS</h3>
                        <p className="text-sm text-slate-500 mt-2">
                            Nous avons envoyé un code de sécurité au <strong>{formData.phone}</strong>.
                        </p>
                        <p className="text-xs text-slate-400 mt-1">(Code Démo: 1234)</p>
                    </div>

                    <div className="flex justify-center">
                         <input 
                                type="text" 
                                maxLength={4}
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                className="w-48 text-center text-4xl tracking-[0.5em] px-4 py-4 rounded-xl border-2 border-slate-200 focus:border-daretPink focus:ring-0 outline-none transition font-mono font-bold text-navy-900 bg-slate-50"
                                placeholder="0000"
                                autoFocus
                            />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading || otpCode.length !== 4}
                        className="w-full bg-green-600 text-white py-4 rounded-lg font-bold hover:bg-green-700 transition shadow-lg disabled:opacity-70 flex justify-center items-center"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        ) : null}
                        {loading ? 'Vérification...' : "Confirmer & Créer mon compte"}
                    </button>

                    <button 
                        type="button" 
                        onClick={() => setStep('FORM')}
                        className="w-full text-slate-500 text-sm hover:text-navy-900 underline"
                    >
                        Modifier mon numéro
                    </button>
                </form>
            )}

            <div className="mt-8 text-center pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-600">
                Déjà membre ?{' '}
                <button onClick={() => navigate('login')} className="font-bold text-daretPink hover:underline">
                Se connecter
                </button>
            </p>
            </div>
        </div>
      </div>
    </div>
  );
};