"use client";

import React, { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';

interface HomeComponentProps {
    onStartGame: () => void;
}

export default function HomeComponent({ onStartGame }: HomeComponentProps) {
    const { activeTheme, setActiveTheme } = useGameStore();

    // The available themes from homepage.html
    const themes = [
        { id: 'Ragtime Ruckus', name: 'Ragtime Ruckus', icon: '🎹', desc: 'Syncopate or Perish' },
        { id: 'Cyberpunk Synthwave', name: 'Cyberpunk Synthwave', icon: '🏙️', desc: 'Jack into the Grid' },
        { id: 'Sleazy Jazz', name: 'Sleazy Jazz', icon: '🎷', desc: "It's Smooth. It's Sweaty." },
        { id: 'Lo-fi Chill Beats', name: 'Lo-fi Chill Beats', icon: '🌙', desc: 'Study / Relax / Dissociate' },
    ];

    const particlesContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initialize particle animation
        if (!particlesContainerRef.current) return;

        const container = particlesContainerRef.current;
        const colors = ['#a855f7', '#ec4899', '#f97316', '#f59e0b', '#c084fc'];

        // Clear old particles (React strict mode protection)
        container.innerHTML = '';

        for (let i = 0; i < 30; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            const size = Math.random() * 5 + 2;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const duration = 6 + Math.random() * 10;
            const delay = Math.random() * 8;
            const left = Math.random() * 100;

            p.style.cssText = `
                width: ${size}px; 
                height: ${size}px;
                left: ${left}%;
                background: ${color};
                animation-duration: ${duration}s;
                animation-delay: ${delay}s;
            `;
            container.appendChild(p);
        }
    }, []);

    // Also ensures we default to one of the valid themes if activeTheme isn't in the list
    useEffect(() => {
        if (!themes.find(t => t.id === activeTheme)) {
            setActiveTheme(themes[0].id);
        }
    }, [activeTheme, setActiveTheme]);

    return (
        <div className="relative w-full h-screen font-[var(--font-barlow)] overflow-hidden">
            {/* Animated Background Layers */}
            <div className="bg-layer"></div>
            <div className="grid-lines"></div>
            <div className="particles" ref={particlesContainerRef}></div>

            {/* Main Content Layout */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center gap-9 p-6">

                {/* Logo Section */}
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-5 animate-fade-down">
                        <div className="w-[72px] h-[72px] bg-gradient-to-br from-violet-800 to-violet-600 rounded-[18px] flex items-center justify-center text-3xl shadow-[0_0_24px_rgba(124,58,237,0.7),0_0_60px_rgba(124,58,237,0.3)] animate-pulse-icon">
                            🎵
                        </div>
                        <div className="font-[var(--font-black-ops)] text-6xl leading-none tracking-tighter">
                            <span className="text-purple-400">BEAT</span>
                            <span className="text-pink-500">OFF</span>
                        </div>
                    </div>
                    <p className="font-[var(--font-barlow-condensed)] text-[13px] tracking-[0.25em] text-[#8b7aa0] text-center mt-2 animate-fade-down-delayed uppercase">
                        The Rhythm Battle
                    </p>
                </div>

                {/* Tagline */}
                <p className="text-[16px] text-[#c4b5d4] text-center max-w-[440px] leading-relaxed animate-fade-up-1">
                    Move your hands & feet into the glowing zones. Let the AI judge roast you.
                </p>

                {/* Theme Selector Section */}
                <div className="flex flex-col items-center gap-4 animate-fade-up-2">
                    <span className="font-[var(--font-barlow-condensed)] text-[12px] tracking-[0.3em] text-[#8b7aa0] uppercase">
                        Choose Your Theme
                    </span>
                    <div className="flex flex-wrap justify-center gap-[14px]">
                        {themes.map((theme) => (
                            <div
                                key={theme.id}
                                onClick={() => setActiveTheme(theme.id)}
                                className={`theme-card w-[176px] bg-[#1e083c99] border border-purple-600/25 rounded-xl p-5 pb-4 flex flex-col items-center gap-2.5 cursor-pointer select-none relative
                                    ${activeTheme === theme.id ? 'active' : ''}`}
                            >
                                <span className="text-[30px]">{theme.icon}</span>
                                <span className="font-[var(--font-barlow-condensed)] text-[15px] font-bold tracking-[0.04em] text-[#f1e8ff] text-center">
                                    {theme.name}
                                </span>
                                <span className="text-[11.5px] text-[#8b7aa0] text-center leading-snug">
                                    {theme.desc}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Start Button */}
                <button
                    onClick={onStartGame}
                    className="start-btn w-[340px] py-5 border-none rounded-full bg-gradient-to-r from-purple-500 to-pink-500 font-[var(--font-black-ops)] text-[22px] tracking-[0.1em] text-white cursor-pointer mt-4 animate-fade-up-3"
                >
                    START GAME
                </button>
            </div>
        </div>
    );
}
