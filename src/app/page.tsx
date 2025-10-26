"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  Package,
  MessageSquare,
  TrendingUp,
  Zap,
  Shield,
  ArrowRight,
  Play,
} from "lucide-react";
import Link from "next/link";

interface ParticleProps {
  delay: number;
  duration: number;
  size: number;
  left: number;
  top: number;
}

const Particle: React.FC<ParticleProps> = ({
  delay,
  duration,
  size,
  left,
  top,
}) => (
  <div
    className="absolute rounded-full bg-cyan-400 opacity-20"
    style={{
      width: `${size}px`,
      height: `${size}px`,
      left: `${left}%`,
      top: `${top}%`,
      animation: `float ${duration}s ease-in-out ${delay}s infinite`,
    }}
  />
);

export default function NexaBizLanding() {
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const statsRef = useRef<HTMLDivElement | null>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [countUp, setCountUp] = useState({
    speed: 0,
    waste: 0,
    satisfaction: 0,
  });
  const [mounted, setMounted] = useState(false);

  const [particles] = useState<ParticleProps[]>(() =>
    Array.from({ length: 30 }, () => ({
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 4,
      size: 2 + Math.random() * 3,
      left: Math.random() * 100,
      top: Math.random() * 100,
    }))
  );

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e: MouseEvent) =>
      setMousePosition({ x: e.clientX, y: e.clientY });

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousemove", handleMouseMove);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setStatsVisible(true);
      },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      if (statsRef.current) observer.unobserve(statsRef.current);
    };
  }, []);

  useEffect(() => {
    if (statsVisible) {
      const duration = 2000;
      const steps = 60;
      const increment = duration / steps;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        const progress = step / steps;
        setCountUp({
          speed: Math.floor(40 * progress),
          waste: Math.floor(25 * progress),
          satisfaction: Math.floor(90 * progress),
        });
        if (step >= steps) clearInterval(timer);
      }, increment);

      return () => clearInterval(timer);
    }
  }, [statsVisible]);

  const agents = [
    {
      id: 1,
      icon: Activity,
      title: "Demand Predictor Agent",
      description:
        "Predicts future product demand using AI-driven forecasting and historical data analysis.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: 2,
      icon: Package,
      title: "Supply Optimizer Agent",
      description:
        "Monitors stock levels and automates supply chain efficiency with real-time alerts.",
      color: "from-cyan-500 to-teal-500",
    },
    {
      id: 3,
      icon: MessageSquare,
      title: "Smart Correspondence Agent",
      description:
        "Handles customer emails with human-like intelligence and context-aware responses.",
      color: "from-teal-500 to-blue-500",
    },
  ];

  const techStack = [
    { name: "Next.js", color: "text-white" },
    { name: "Firebase", color: "text-yellow-400" },
    { name: "Gemini AI", color: "text-blue-400" },
    { name: "Node.js", color: "text-green-400" },
  ];

  return (
    <div className="bg-gray-900 text-white overflow-hidden relative">
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.8s ease-out forwards; }
        .gradient-text {
          background: linear-gradient(135deg, #06b6d4, #3b82f6, #06b6d4);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientShift 3s ease infinite;
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .neon-border {
          box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
          transition: all 0.3s ease;
        }
        .neon-border:hover {
          box-shadow: 0 0 40px rgba(6, 182, 212, 0.6);
          transform: translateY(-5px);
        }
      `}</style>

      {/* Particles Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {mounted && particles.map((p, i) => <Particle key={i} {...p} />)}
      </div>

      {/* HERO Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: mounted
              ? `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(6,182,212,0.15), transparent 50%)`
              : `radial-gradient(circle at 50% 50%, rgba(6,182,212,0.15), transparent 50%)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-gray-900 to-cyan-900/20" />

        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="animate-slideUp">
            <div className="inline-block mb-4 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
              <span className="text-cyan-400 text-sm font-semibold">
                Next-Gen Manufacturing Intelligence
              </span>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold mb-6 gradient-text leading-tight">
              NexaBiz AI
            </h1>
            <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
              Empowering Manufacturing with AI-Driven Intelligence
            </p>
            <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto">
              NexaBiz integrates multi-agent AI systems to automate forecasting,
              inventory management, and customer communication.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              {/* Get Started Button redirects to signup page */}
              <Link
                href="/signup"
                className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-semibold text-lg neon-border flex items-center gap-3 inline-flex"
              >
                Get Started
                <ArrowRight className="group-hover:translate-x-2 transition-transform" />
              </Link>

              <button className="px-8 py-4 border-2 border-cyan-500/50 rounded-lg font-semibold text-lg hover:bg-cyan-500/10 transition-all flex items-center gap-3">
                <Play size={20} />
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT Section */}
      <section className="py-24 relative" style={{ transform: `translateY(${scrollY * 0.1}px)` }}>
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <h2 className="text-5xl font-bold mb-8 gradient-text">
            The Future of Smart Manufacturing
          </h2>
          <p className="text-xl text-gray-300 mb-6">
            NexaBiz AI is an intelligent, end-to-end business management
            platform that combines specialized AI agents to optimize operations.
          </p>
          <p className="text-lg text-gray-400">
            Built on machine learning and analytics, NexaBiz unifies forecasting,
            supply chain optimization, and automated communication into one ecosystem.
          </p>
        </div>
      </section>

      {/* AGENTS Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <h2 className="text-5xl font-bold text-center mb-16 gradient-text">
            Intelligent Multi-Agent System
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {agents.map((agent) => {
              const Icon = agent.icon;
              return (
                <div
                  key={agent.id}
                  onMouseEnter={() => setHoveredCard(agent.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className="relative group cursor-pointer"
                >
                  <div className="h-full p-8 bg-gray-800/50 backdrop-blur-sm border-2 border-cyan-500/20 rounded-2xl neon-border transition-all">
                    <div
                      className={`w-16 h-16 mb-6 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center`}
                    >
                      <Icon size={32} />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-cyan-400">{agent.title}</h3>
                    <p className="text-gray-300">{agent.description}</p>
                    {hoveredCard === agent.id && (
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl pointer-events-none" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* IMPACT Section */}
      <section ref={statsRef} className="py-24 bg-gray-800/30 relative">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold mb-16 gradient-text">
            Measurable Business Impact
          </h2>
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div>
              <div className="text-6xl font-bold text-cyan-400 mb-4">+{countUp.speed}%</div>
              <p className="text-xl text-gray-300">Faster Decisions</p>
              <TrendingUp className="mx-auto mt-4 text-cyan-400" size={32} />
            </div>
            <div>
              <div className="text-6xl font-bold text-blue-400 mb-4">-{countUp.waste}%</div>
              <p className="text-xl text-gray-300">Inventory Waste</p>
              <Shield className="mx-auto mt-4 text-blue-400" size={32} />
            </div>
            <div>
              <div className="text-6xl font-bold text-teal-400 mb-4">+{countUp.satisfaction}%</div>
              <p className="text-xl text-gray-300">Customer Satisfaction</p>
              <Zap className="mx-auto mt-4 text-teal-400" size={32} />
            </div>
          </div>
        </div>
      </section>

      {/* TECH STACK Section */}
      <section className="py-24">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold mb-16 gradient-text">
            Powered by Modern Technology
          </h2>
          <div className="flex flex-wrap justify-center gap-12 max-w-4xl mx-auto">
            {techStack.map((tech, idx) => (
              <div key={idx} className="group text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-xl border border-cyan-500/30 flex items-center justify-center group-hover:scale-110 transition-transform neon-border">
                  <span className={`text-3xl font-bold ${tech.color}`}>{tech.name[0]}</span>
                </div>
                <p className="text-gray-300 font-semibold">{tech.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden" style={{ transform: `translateY(${scrollY * 0.05}px)` }}>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/40 to-blue-900/40" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-6xl md:text-7xl font-bold mb-8 gradient-text">
            Join the Future of Manufacturing
          </h2>
          <p className="text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Transform your operations with AI-driven intelligence. Start optimizing today.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-bold text-xl neon-border">
              Request Demo
            </button>
            <button className="px-10 py-5 border-2 border-cyan-500/50 rounded-lg font-bold text-xl hover:bg-cyan-500/10 transition-all">
              Start Free Trial
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-gray-800">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-400">
            © 2025 NexaBiz AI. Empowering manufacturing with intelligence.
          </p>
        </div>
      </footer>
    </div>
  );
}
