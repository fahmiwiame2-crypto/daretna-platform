import React, { useState } from 'react';
import { User } from '../types';
import { db } from '../services/db';

interface LoginProps {
  onLogin: (user: User) => void;
  navigate?: (page: string) => void; 
}

export const Login: React.FC<LoginProps> = ({ onLogin, navigate }) => {
  const [email, setEmail] = useState('amine@test.com');
  const [password, setPassword] = useState('123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Pass password to login (now supported by db service)
    const user = await db.login(email, password);
    setLoading(false);
    
    if (user) {
      onLogin(user);
    } else {
      setError("Email ou mot de passe incorrect.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex bg-white">
      {/* LEFT COLUMN: FORM */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          <div className="text-left">
            <h2 className="text-4xl font-extrabold text-navy-900 tracking-tight">Bon retour 👋</h2>
            <p className="mt-2 text-slate-500">
              Gérez vos Darets et suivez votre épargne en toute simplicité.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r text-sm flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Adresse Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-daretPink focus:border-transparent transition"
                placeholder="vous@exemple.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-daretPink focus:border-transparent transition"
                  placeholder="••••••••"
                />
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                    {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-daretPink focus:ring-daretPink border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900 cursor-pointer">
                  Se souvenir de moi
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-daretPink hover:text-pink-600">
                  Mot de passe oublié ?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-navy-900 hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-daretPink disabled:opacity-70 transition transform hover:-translate-y-0.5"
            >
               {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
               ) : null}
               {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>

            <div className="mt-6 text-center text-sm text-slate-500">
                <p>Pas encore membre ? {' '}
                    <button onClick={() => navigate && navigate('register')} className="text-daretPink font-bold hover:underline">
                        Créer un compte gratuit
                    </button>
                </p>
            </div>
            
            {/* Demo Helpers */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
                <p className="mb-1">Comptes Démo :</p>
                <div className="flex justify-center gap-4">
                    <span className="bg-slate-50 px-2 py-1 rounded border">amine@test.com / 123</span>
                    <span className="bg-slate-50 px-2 py-1 rounded border">sara@test.com / 123</span>
                </div>
            </div>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: IMAGE (Desktop Only) */}
      <div className="hidden md:block w-1/2 relative">
         {/* IMAGE: Femme marocaine confiante, style professionnel/traditionnel */}
         <img 
            className="absolute inset-0 w-full h-full object-cover" 
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2788&auto=format&fit=crop" 
            alt="Femme marocaine confiante utilisant une technologie" 
         />
         <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 via-navy-900/20 to-transparent flex items-end p-16">
            <div className="text-white max-w-lg">
                <h3 className="text-3xl font-bold mb-4">La confiance se mérite, Daretna la garantit.</h3>
                <p className="text-slate-200 text-lg">
                    "Grâce à Daretna, j'ai pu organiser le mariage de ma fille sans m'endetter. C'est simple, transparent et sécurisé."
                </p>
                <div className="mt-6 flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur border border-white/50 flex items-center justify-center text-sm font-bold">SM</div>
                    <span className="font-medium text-white/90">Samira M., Utilisatrice depuis 2023</span>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};