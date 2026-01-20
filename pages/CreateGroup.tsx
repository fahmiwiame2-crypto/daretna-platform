import React, { useState } from 'react';
import { User, Periodicity } from '../types';
import { db } from '../services/db';
import { useLanguage } from '../contexts/LanguageContext'; // Import context


interface CreateGroupProps {
  user: User;
  navigate: (page: string) => void;
}

export const CreateGroup: React.FC<CreateGroupProps> = ({ user, navigate }) => {
  const { t, language } = useLanguage(); // Use hook
  const [formData, setFormData] = useState({
    name: '',
    amountPerPerson: 1000,
    periodicity: Periodicity.MONTHLY,
    startDate: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.createGroup(formData, user);
      navigate('dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <button onClick={() => navigate('dashboard')} className="text-slate-500 hover:text-navy-900 mb-6 flex items-center">
        ← Retour au dashboard
      </button>

      <div className="bg-white p-8 rounded-2xl shadow border border-slate-100">
        <h1 className="text-2xl font-bold text-navy-900 mb-6">{t('create.title')}</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('create.name')}</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-navy-900 outline-none"
              placeholder="ex: Daret Vacances 2024"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
            {/* Cultural Suggestions */}
            <div className="mt-3 flex flex-wrap gap-2">
              {['Daret Ramadan 🌙', 'Daret Mariage 💍', 'Daret Voyage ✈️', 'Daret Aid 🐑'].map(sug => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setFormData({ ...formData, name: sug })}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-full transition border border-slate-200"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('create.amount')}</label>
              <input
                type="number"
                min="100"
                step="100"
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-navy-900 outline-none"
                value={formData.amountPerPerson}
                onChange={e => setFormData({ ...formData, amountPerPerson: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('create.period')}</label>
              <select
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-navy-900 outline-none"
                value={formData.periodicity}
                onChange={e => setFormData({ ...formData, periodicity: e.target.value as Periodicity })}
              >
                <option value={Periodicity.MONTHLY}>Mensuel</option>
                <option value={Periodicity.WEEKLY}>Hebdomadaire</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('create.start')}</label>
            <input
              type="date"
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-navy-900 outline-none"
              value={formData.startDate}
              onChange={e => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-navy-900 text-white py-4 rounded-lg font-bold hover:bg-navy-800 transition shadow-lg"
            >
              {t('create.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};