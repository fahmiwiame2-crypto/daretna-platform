import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Settings, CreditCard, CheckCircle2, MessageSquare, ArrowRight, Star, Users, ShieldCheck } from 'lucide-react';

interface LandingProps {
  navigate: (page: string) => void;
}

export const Landing: React.FC<LandingProps> = ({ navigate }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans text-slate-800 bg-white selection:bg-daretPink/30">

      {/* 1. HERO SECTION */}
      <section className="relative pt-10 pb-20 lg:pt-20 lg:pb-32 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-50 rounded-full blur-[120px] opacity-60 animate-pulse"></div>
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-50 rounded-full blur-[100px] opacity-40"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Text Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="relative z-10 text-center lg:text-left"
            >
              <motion.div
                variants={itemVariants}
                className="inline-flex items-center px-4 py-1.5 rounded-full bg-daretPink/10 text-daretPink text-sm font-bold mb-8 border border-daretPink/20 shadow-sm"
              >
                <span className="w-2.5 h-2.5 bg-daretPink rounded-full mr-2.5 animate-pulse"></span>
                La Tontine Digitale #1 au Maroc
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="text-5xl md:text-7xl font-extrabold tracking-tight text-navy-900 leading-[1.1] mb-8"
              >
                Votre Daret, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-daretPink via-purple-600 to-indigo-600">
                  entre de bonnes mains.
                </span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-lg md:text-xl text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed"
              >
                Réinventez la tontine traditionnelle. Sécurisez votre épargne, réalisez vos projets et rejoignez une communauté de confiance grâce au digital.
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start"
              >
                <button
                  onClick={() => navigate('register')}
                  className="px-10 py-4 bg-navy-900 hover:bg-navy-800 text-white rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-1 flex items-center justify-center group"
                >
                  Commencer l'aventure
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => navigate('login')}
                  className="px-10 py-4 bg-white text-navy-900 border-2 border-slate-100 hover:border-slate-200 hover:bg-slate-50 rounded-full font-bold text-lg transition duration-300 shadow-sm flex items-center justify-center"
                >
                  Se connecter
                </button>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="mt-12 flex items-center justify-center lg:justify-start space-x-6"
              >
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <img
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm"
                      src={`https://images.unsplash.com/photo-${i === 1 ? '1531123897727-8f129e1688ce' : i === 2 ? '1573496359142-b8d87734a5a2' : '1589156280159-27698a70f29e'}?auto=format&fit=crop&w=100&q=80`}
                      alt="User"
                    />
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm">+10k</div>
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1 text-yellow-500 mb-0.5">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-current" />)}
                  </div>
                  <p className="text-sm font-medium text-slate-500">Membres actifs au Maroc</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Visual Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 2 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative z-10 hidden lg:block"
            >
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-[6px] border-white group transition-all duration-500 hover:rotate-0 hover:scale-[1.02]">
                <img
                  src="https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?q=80&w=2854&auto=format&fit=crop"
                  alt="Famille réunie autour d'un moment convivial"
                  className="w-full h-auto object-cover transform duration-700 group-hover:scale-110"
                />

                {/* Badge Vérifié par IA */}
                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/50 flex items-center gap-2 z-20">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-bold text-navy-900 uppercase tracking-wider">Vérifié par IA</span>
                </div>

                {/* Floating UI Elements */}
                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="absolute bottom-8 left-8 right-8 bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-white/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Daret Vacances 2025</p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-navy-900 font-bold text-sm">Tour de Malika : Payé</p>
                      </div>
                    </div>
                    <div className="text-daretPink font-black text-2xl">+ 5,000 <span className="text-xs font-bold">DH</span></div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                  className="absolute top-8 right-8 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/50 flex items-center gap-2"
                >
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-bold text-navy-900">Vérifié par IA</span>
                </motion.div>
              </div>

              {/* Dynamic Blob */}
              <div className="absolute -top-10 -right-10 w-72 h-72 bg-gradient-to-br from-daretPink/20 to-purple-400/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. FEATURES SECTION */}
      <section id="features" className="py-32 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <h2 className="text-4xl md:text-5xl font-black text-navy-900 mb-6 italic">L'esprit de famille, <br className="md:hidden" /> la sécurité en plus</h2>
            <div className="w-24 h-2 bg-gradient-to-r from-daretPink to-purple-600 mx-auto rounded-full mb-8"></div>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Nous avons gardé la convivialité de la Daret traditionnelle en supprimant les risques, les oublis et les conflits.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Sécurité Totale",
                desc: "Notre algorithme Trust Score vérifie l'historique de chaque participant pour garantir la sérénité du groupe.",
                color: "blue"
              },
              {
                icon: <Settings className="w-8 h-8" />,
                title: "Zéro Retard",
                desc: "Fini la gêne des relances. Daretna automatise les rappels par SMS et notifications de manière respectueuse.",
                color: "purple"
              },
              {
                icon: <CreditCard className="w-8 h-8" />,
                title: "Liberté de Paiement",
                desc: "Payez via Carte Bancaire, PayPal ou virement. Suivez chaque centime en temps réel depuis votre application.",
                color: "green"
              }
            ].map((f, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="bg-white p-10 rounded-[2rem] shadow-sm hover:shadow-2xl transition duration-500 border border-slate-100 group cursor-default"
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-colors duration-500 ${f.color === 'blue' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' :
                    f.color === 'purple' ? 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white' :
                      'bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white'
                  }`}>
                  {f.icon}
                </div>
                <h3 className="text-2xl font-bold text-navy-900 mb-4">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. AI & INNOVATION SECTION */}
      <section className="py-32 bg-white px-4 relative">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">

          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:w-1/2 relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl z-10">
              <img
                src="https://images.unsplash.com/photo-1664575602276-acd073f104c1?q=80&w=2940&auto=format&fit=crop"
                alt="Usage de l'application"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/60 to-transparent"></div>
            </div>

            {/* AI Notification Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="absolute -bottom-10 -right-6 lg:-right-10 z-20 bg-white p-6 rounded-2xl shadow-2xl border border-slate-100 max-w-xs"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shrink-0">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-navy-900 mb-1">Coach DaretBot</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    "D'après vos revenus, une cotisation de 1,500 MAD est idéale pour épargner sans pression."
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <div className="lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block px-4 py-1.5 bg-navy-900 text-white text-xs font-black rounded-full mb-8 tracking-tighter uppercase">
                Innover pour nos traditions
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-navy-900 mb-8 leading-tight">
                Une technologie qui <br /> comprend le Maroc.
              </h2>
              <p className="text-slate-600 text-lg mb-10 leading-relaxed">
                Daretna utilise l'intelligence artificielle pour recréer la confiance d'antan. Nous analysons la fiabilité pour bâtir des groupes sains et durables.
              </p>

              <div className="space-y-8">
                {[
                  { title: "Score de Confiance Inteligent", desc: "Un algorithme exclusif qui récompense votre ponctualité par des accès privilégiés." },
                  { title: "Assistant IA en Darija", desc: "Besoin de conseils ? Parlez à DaretBot comme à un ami, en Français ou en Darija." }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-5">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shadow-md">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-navy-900 mb-2">{item.title}</h4>
                      <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. FOOTER */}
      <footer className="bg-navy-900 text-slate-400 pt-24 pb-12 border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-16 mb-20">
          <div className="md:col-span-2">
            <div className="text-3xl font-black text-white mb-8 flex items-center tracking-tighter">
              Daretna<span className="text-daretPink">.ma</span>
            </div>
            <p className="text-slate-400 text-lg max-w-md leading-relaxed mb-8">
              La première plateforme de tontine digitale certifiée au Maroc. Rejoignez 10,000+ membres.
            </p>
            <div className="flex gap-4">
              {/* Social Icons Placeholder */}
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full bg-navy-800 border border-navy-700 flex items-center justify-center hover:bg-daretPink transition-colors cursor-pointer group">
                  <div className="w-4 h-4 bg-slate-400 group-hover:bg-white transition-colors rounded-sm"></div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-8 text-lg uppercase tracking-widest text-sm">Contact</h4>
            <ul className="space-y-6 text-sm">
              <li className="flex items-start gap-3">
                <span className="text-daretPink">📍</span>
                <span>Technopark, <br />Mohammedia, Maroc</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-daretPink">📧</span>
                <a href="mailto:contact@daretna.ma" className="hover:text-white transition-colors">contact@daretna.ma</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-8 text-lg uppercase tracking-widest text-sm">Légal</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Conditions Générales</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Politique de Confidentialité</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Sécurité des Fonds</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pt-12 border-t border-navy-800 flex flex-col md:flex-row justify-between items-center gap-6 text-xs font-medium">
          <p>© 2025 Daretna.ma. Made with ❤️ in Morocco 🇲🇦.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition">FAQ</a>
            <a href="#" className="hover:text-white transition">Blog</a>
            <a href="#" className="hover:text-white transition">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};