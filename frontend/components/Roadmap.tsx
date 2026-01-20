import React from 'react';
import { motion } from 'framer-motion';

interface RoadmapMember {
    userId: string;
    name: string;
    isPaid: boolean;
    isCurrent: boolean;
    position: number;
}

interface RoadmapProps {
    members: RoadmapMember[];
    currentTurn: number;
}

export const Roadmap: React.FC<RoadmapProps> = ({ members, currentTurn }) => {
    // Generate path points (sinusoidal path)
    const points = members.map((_, i) => ({
        x: 50 + i * 150,
        y: 100 + Math.sin(i * 1.5) * 40
    }));

    const svgWidth = points.length * 150 + 100;

    return (
        <div className="w-full overflow-x-auto pb-8 pt-4 custom-scrollbar">
            <div style={{ width: svgWidth, minHeight: '220px' }} className="relative mx-auto">
                <svg width={svgWidth} height="200" className="absolute top-0 left-0">
                    {/* Path background */}
                    <path
                        d={`M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`}
                        fill="transparent"
                        stroke="rgba(15, 23, 42, 0.05)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Active progression path */}
                    <motion.path
                        d={`M ${points.slice(0, currentTurn + 1).map(p => `${p.x},${p.y}`).join(' L ')}`}
                        fill="transparent"
                        stroke="#E91E63"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    />

                    {/* Connection lines to labels */}
                    {points.map((p, i) => (
                        <line
                            key={`line-${i}`}
                            x1={p.x} y1={p.y}
                            x2={p.x} y2={p.y + (i % 2 === 0 ? 40 : -40)}
                            stroke="rgba(15, 23, 42, 0.1)"
                            strokeDasharray="4 4"
                        />
                    ))}
                </svg>

                {/* Member Nodes */}
                {members.map((member, i) => {
                    const p = points[i];
                    return (
                        <div
                            key={member.userId}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                            style={{ left: p.x, top: p.y }}
                        >
                            {/* The Node Dot */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl border-4 transition-all duration-500 ${member.isCurrent
                                        ? 'bg-navy-900 border-daretPink scale-125 z-20'
                                        : member.isPaid
                                            ? 'bg-green-500 border-white'
                                            : 'bg-white border-slate-100'
                                    }`}
                            >
                                <span className={`text-lg font-black ${member.isCurrent ? 'text-daretPink' : member.isPaid ? 'text-white' : 'text-slate-300'
                                    }`}>
                                    {member.isPaid ? '✓' : i + 1}
                                </span>

                                {/* Current indicator ripple */}
                                {member.isCurrent && (
                                    <span className="absolute inset-0 rounded-2xl bg-daretPink/30 animate-ping"></span>
                                )}
                            </motion.div>

                            {/* Label */}
                            <div
                                className={`absolute left-1/2 transform -translate-x-1/2 whitespace-nowrap text-center ${i % 2 === 0 ? 'top-16' : 'bottom-16'
                                    }`}
                            >
                                <p className={`text-[10px] font-black uppercase tracking-tighter ${member.isCurrent ? 'text-navy-900' : 'text-slate-400'
                                    }`}>
                                    {member.name}
                                </p>
                                {member.isCurrent && (
                                    <span className="text-[10px] bg-daretPink text-white px-2 py-0.5 rounded-full font-black animate-bounce mt-1 inline-block">
                                        À TOI !
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
