import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { slides } from '@/data/slidesData';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import {
    ChevronLeft,
    ChevronRight,
    Users,
    Search,
    Lock,
    Shield,
    Activity,
}
    from 'lucide-react';




const AuthLeftPanel = () => {
    const [current, setCurrentSlide] = useState(0);
    const trackRef = useRef(null);
    const timerRef = useRef(null);
    const progTimerRef = useRef(null);
    const progStartRef = useRef(null);
    const [progress, setProgress] = useState(0);

    const TOTAL = slides.length;
    const INTERVAL = 5000;

    const iconMap = {
        users: Users,
        search: Search,
        lock: Lock,
        shield: Shield,
        activitty: Activity,
    };

    const goTo = (idx) => {
        const newIdx = ((idx % TOTAL) + TOTAL) % TOTAL;
        setCurrentSlide(newIdx);
        if (trackRef.current) {
            trackRef.current.style.transform = `translateX(-${newIdx * 100}%)`;
        }
        resetAuto();
    }

    const resetAuto = () => {
        clearInterval(timerRef.current);
        clearInterval(progTimerRef.current);
        setProgress(0);

        progStartRef.current = Date.now();
        progTimerRef.current = setInterval(() => {
            const elapsed = Date.now() - progStartRef.current;
            const pct = Math.min((elapsed / INTERVAL) * 100, 100);
            setProgress(pct);
        }, 50);

        timerRef.current = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % TOTAL);
        }, INTERVAL);

    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "ArrowLeft") goTo(current - 1);
            if (e.key === "ArrowRight") goTo(current + 1);

        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);

    }, [current]);

    useEffect(() => {
        if (trackRef.current) {
            trackRef.current.style.transform = `translateX(-${current * 100}%)`;
        }
    }, [current]);


    useEffect(() => {
        resetAuto();
        return () => {
            clearInterval(timerRef.current);
            clearInterval(progTimerRef.current);
        };
    }, []);

    const renderIcon = (iconName) => {
        const Icon = iconMap[iconName];
        return Icon ? <Icon className="w-3.75 h-3.75 stroke-sky-300" strokeWidth={1.9} /> : null;
    };

    const renderSlideContent = (slide) => {
        switch (slide.type) {
            case "features":
                return (
                    <div className='space-y-2.5'>
                        {slide.features.map((feat, i) => (
                            <Card
                                key={i}
                                className="bg-white/7 border border-white/16 backdrop-blur-md hover:bg-white/10 hover:border-white/30 transition rounded-[13px]"
                            >
                                <CardContent className="flex gap-3 p-3.25">
                                    <div className="w-9 h-9 rounded-[9px] bg-indigo-500/28 flex items-center justify-center shrink-0">
                                        {renderIcon(feat.icon)}
                                    </div>
                                    <div>
                                        <h5 className="font-[Outfit] text-[12.5px] font-semibold text-white mb-0.5">
                                            {feat.title}
                                        </h5>
                                        <p className="text-[11.5px] text-sky-200/60 font-light leading-relaxed">
                                            {feat.description}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))

                        }
                    </div>
                );


            case "stats":
                return (
                    <>
                        <div className='flex gap-2.5 mb-2.5'>
                            {slide.stats.map((stat, i) => (
                                <Card
                                    key={i}
                                    className="flex-1 bg-white/7 border border-white/16 rounded-[13px] backdrop-blur-md"
                                >
                                    <CardContent className="p-3.75">
                                        <div className="font-[Outfit] text-[27px] font-extrabold text-white leading-none mb-1">
                                            {stat.number}
                                            <span className="text-[15px] text-sky-300 ml-1">{stat.unit}</span>
                                        </div>
                                        <div className="text-[11px] text-sky-200/60 font-light">
                                            {stat.label}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))

                            }

                        </div>
                        <Card className="bg-white/7 border border-white/16 rounded-[13px] backdrop-blur-md">
                            <CardContent className="flex gap-3 p-3.25">
                                <div className="w-9 h-9 rounded-[9px] bg-indigo-500/28 flex items-center justify-center shrink-0">
                                    {renderIcon(slide.feature.icon)}
                                </div>
                                <div>
                                        <h5 className="font-[Outfit] text-[12.5px] font-semibold text-white mb-0.5">
                                        {slide.feature.title}
                                    </h5>
                                    <p className="text-[11.5px] text-sky-200/60 font-light leading-relaxed">
                                        {slide.feature.description}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>



                    </>
                );

            case "steps":
                return (
                    <div className='space-y-3'>
                        {slide.steps.map((step, i) => (
                            <div key={i} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/28 border border-sky-300/30 flex items-center justify-center shrink-0 font-[Outfit] font-bold text-white text-sm">
                                    {step.number}
                                </div>
                                <div>
                                    <h5 className="font-[Outfit] text-[12.5px] font-semibold text-white mb-0.5">
                                        {step.title}
                                    </h5>
                                    <p className="text-[11.5px] text-sky-200/70 font-light">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}

                    </div>
                );

            default:
                return null;
        }
    }

    return (
        <div className='basis-[47%] shrink-0 grow-0 relative overflow-hidden bg-linear-to-br from-[#091d3a] via-[#19376D] to-[#0f2550] flex flex-col'>
            {/**Blobs */}
            <div className="absolute w-105 h-105 -right-30 -top-25 bg-indigo-500/30 rounded-full blur-[65px] pointer-events-none" />
            <div className="absolute w-75 h-75 -left-20 -bottom-17.5 bg-slate-900/70 rounded-full blur-[65px] pointer-events-none" />
            <div className="absolute w-50 h-50 right-10 bottom-30 bg-sky-300/8 rounded-full blur-[65px] pointer-events-none" />

            {/** Progress Bar */}
            <div
                className='absolute bottom-0 left-0 h-0.5 bg-linear-to-r from-indigo-500 to-sky-300 transition-all duration-100 z-20'
                style={{ width: `${progress}%` }}
            />

            {/* Logo */}
            <div className="relative z-10 pt-9 px-12.5 flex items-center gap-2.75 shrink-0">
                <div className="w-8.75 h-8.75 rounded-[10px] bg-linear-to-br from-indigo-500 to-sky-300 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-4.25 h-4.25 fill-white">
                        <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
                    </svg>
                </div>
                <div className="font-[Outfit] text-[11.5px] font-bold text-white tracking-[0.08em] uppercase leading-tight">
                    Tradewings Documentation Data Management <em className="text-sky-300 not-italic block">System</em>
                </div>
            </div>

            {/** Carousel */}
            <div className="flex-1 relative overflow-hidden flex flex-col justify-center">
                <div
                    ref={trackRef}
                    className="flex transition-transform duration-800 ease-out"
                    style={{ willChange: "transform" }}
                >
                    {slides.map((slide) => (
                        <div
                            key={slide.id}
                            className="min-w-full px-12.5 py-9.5 flex flex-col gap-5"
                        >
                            {/* Tag — shadcn Badge */}
                            <Badge
                                variant="outline"
                                className="bg-white/7 border-sky-200/16 text-sky-300 text-[10.5px] tracking-[0.07em] uppercase rounded-full px-3.5 py-1.25 w-fit gap-1.75"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-300 animate-pulse inline-block" />
                                {slide.tag}
                            </Badge>

                            {/* Heading */}
                            <h2 className="font-[Outfit] text-[clamp(24px,2.8vw,36px)] font-extrabold text-white leading-tight tracking-tight max-w-90">
                                {slide.heading[0]}
                                <em className="not-italic bg-linear-to-r from-sky-300 to-[#d6f0fa] bg-clip-text text-transparent">
                                    {slide.heading[1]}
                                </em>
                            </h2>

                            {/* Description */}
                            <p className="text-[13.5px] text-sky-200/70 font-light leading-relaxed max-w-90">
                                {slide.description}
                            </p>

                            {/* Slide content */}
                            <div>{renderSlideContent(slide)}</div>
                        </div>



                    ))}
                </div>
            </div>

            {/**Controls */}
            <div className="relative z-10 px-12.5 py-9.5 flex items-center gap-4 shrink-0">
                {/* Dots */}
                <div className="flex gap-1.75 flex-1 items-center">
                    {slides.map((_, i) => (
                        <Button
                            key={i}
                            variant="ghost"
                            onClick={() => goTo(i)}
                            className={`h-1 p-0 rounded-sm transition-all duration-450 cursor-pointer hover:bg-transparent ${i === current ? "w-10 bg-sky-300" : "w-4.5 bg-sky-200/28 hover:bg-sky-200/40"
                                }`}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>

                {/* Nav buttons — shadcn Button */}
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => goTo(current - 1)}
                        className="w-9.25 h-9.25 rounded-full bg-white/7 border-white/16 text-sky-300 backdrop-blur-[10px] hover:bg-indigo-500/38 hover:border-sky-300/35 hover:text-sky-300"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.2} />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => goTo(current + 1)}
                        className="w-9.25 h-9.25 rounded-full bg-white/7 border-white/16 text-sky-300 backdrop-blur-[10px] hover:bg-indigo-500/38 hover:border-sky-300/35 hover:text-sky-300"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.2} />
                    </Button>
                </div>
            </div>

        </div>
    );
};

export default AuthLeftPanel;
