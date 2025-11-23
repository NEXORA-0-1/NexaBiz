'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ArrowRight, Zap, Brain, Rocket, Shield, ChevronDown, Sparkles, Target, LineChart, Users } from 'lucide-react';

// Loading Screen Component
const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 20);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center">
      <div className="text-center space-y-8">
        <div className="relative">
          <div className="text-7xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-pulse drop-shadow-2xl">
            NexaBiz
          </div>
          <div className="absolute inset-0 blur-[100px] bg-gradient-to-r from-purple-600/40 via-pink-600/40 to-blue-600/40 -z-10"></div>
        </div>
        <div className="w-80 h-2 bg-slate-800/50 rounded-full overflow-hidden mx-auto backdrop-blur-sm border border-slate-700/50">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 transition-all duration-300 shadow-lg shadow-purple-500/50"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-slate-300 text-lg font-semibold tracking-wider">{progress}%</div>
      </div>
    </div>
  );
};

// Animated Background Component with enhanced visuals
const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const particles: Particle[] = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      opacity: number;
      color: string;

      constructor(canvasWidth: number, canvasHeight: number) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
        this.radius = Math.random() * 3 + 1;
        this.opacity = Math.random() * 0.6 + 0.2;
        const colors = ['147, 51, 234', '236, 72, 153', '59, 130, 246'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update(canvasWidth: number, canvasHeight: number) {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvasWidth) this.vx *= -1;
        if (this.y < 0 || this.y > canvasHeight) this.vy *= -1;
      }

      draw(context: CanvasRenderingContext2D) {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        const gradient = context.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        gradient.addColorStop(0, `rgba(${this.color}, ${this.opacity})`);
        gradient.addColorStop(1, `rgba(${this.color}, 0)`);
        context.fillStyle = gradient;
        context.fill();
      }
    }

    for (let i = 0; i < 150; i++) {
      particles.push(new Particle(canvas.width, canvas.height));
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.update(canvas.width, canvas.height);
        particle.draw(ctx);
      });

      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(147, 51, 234, ${0.15 * (1 - distance / 120)})`;
            ctx.lineWidth = 1;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none opacity-50" />;
};

// Floating orbs background
const FloatingOrbs = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
    </div>
  );
};

// Navigation Component
const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? 'bg-slate-950/90 backdrop-blur-2xl border-b border-purple-500/20 shadow-lg shadow-purple-500/5' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="text-3xl font-black bg-linear-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg cursor-pointer hover:scale-105 transition-transform">
            NexaBiz
          </div>

          <div className="hidden md:flex items-center gap-10">
            {['Hero', 'Services', 'Why NexaBiz', 'Process', 'Testimonials'].map(item => (
              <button
                key={item}
                onClick={() => scrollToSection(item.toLowerCase().replace(' ', '-'))}
                className="text-slate-300 hover:text-white transition-all duration-300 text-sm font-semibold tracking-wide relative group"
              >
                {item}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-linear-to-r from-purple-500 to-pink-500 group-hover:w-full transition-all duration-300"></span>
              </button>
            ))}
            <button className="px-8 py-3 bg-linear-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full text-white font-bold hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1">
              Get Started
            </button>
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden mt-6 pb-6 space-y-4 animate-fadeIn border-t border-purple-500/20 pt-6">
            {['Hero', 'Services', 'Why NexaBiz', 'Process', 'Testimonials'].map(item => (
              <button
                key={item}
                onClick={() => scrollToSection(item.toLowerCase().replace(' ', '-'))}
                className="block w-full text-left text-slate-300 hover:text-white transition-colors duration-300 text-lg py-2 px-4 rounded-lg hover:bg-white/5"
              >
                {item}
              </button>
            ))}
            <button className="w-full px-8 py-3 bg-linear-to-r from-purple-600 to-pink-600 rounded-full text-white font-bold mt-4">
              Get Started
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

// Hero Section - Enhanced
const HeroSection = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 30,
        y: (e.clientY / window.innerHeight - 0.5) * 30
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/60 to-slate-900"></div>
      
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:80px_80px]"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <div 
          className="space-y-10"
          style={{
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
            transition: 'transform 0.2s ease-out'
          }}
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-300 text-sm font-semibold backdrop-blur-xl shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform cursor-pointer">
            <Sparkles className="w-4 h-4" />
            AI-Powered Business Solutions
            <ArrowRight className="w-4 h-4" />
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-tight tracking-tight">
            <span className="block bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent drop-shadow-2xl mb-2 md:mb-4">
              Where Vision
            </span>
            <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-2xl">
              Turns Into Power
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed font-light px-4">
            We build <span className="font-bold text-white">AI-powered business solutions</span> for any type of business. Transform your operations with cutting-edge technology.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center pt-8 sm:pt-12 px-4">
            <button className="group w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full text-white text-base sm:text-lg font-bold hover:shadow-2xl hover:shadow-purple-500/60 transition-all duration-500 transform hover:scale-110 hover:-translate-y-2 flex items-center justify-center gap-3 relative overflow-hidden">
              <span className="relative z-10">Start Your Journey</span>
              <ArrowRight className="group-hover:translate-x-2 transition-transform relative z-10" size={20} />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </button>
            <button className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-white/5 backdrop-blur-xl border-2 border-white/20 rounded-full text-white text-base sm:text-lg font-bold hover:bg-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105">
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-3xl mx-auto pt-12 sm:pt-16 px-4">
            {[
              { label: 'Projects Delivered', value: '500+' },
              { label: 'Happy Clients', value: '200+' },
              { label: 'Success Rate', value: '99%' }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-400 text-xs sm:text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="text-purple-400 drop-shadow-lg" size={40} />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-slate-950 to-transparent"></div>
    </section>
  );
};

// Services Section - Ultra Enhanced
const ServicesSection = () => {
  const services = [
    {
      icon: <Brain className="w-10 h-10" />,
      title: 'AI Integration',
      description: 'Seamlessly integrate cutting-edge AI models into your existing workflows and systems with zero downtime.',
      features: ['GPT Integration', 'Custom Models', 'API Development']
    },
    {
      icon: <Zap className="w-10 h-10" />,
      title: 'Automation',
      description: 'Automate repetitive tasks and streamline operations with intelligent solutions that learn and adapt.',
      features: ['Workflow Automation', 'RPA Solutions', 'Smart Bots']
    },
    {
      icon: <Rocket className="w-10 h-10" />,
      title: 'Scale & Growth',
      description: 'Build scalable infrastructure that grows with your business demands and handles peak loads effortlessly.',
      features: ['Cloud Architecture', 'Load Balancing', 'Performance Tuning']
    },
    {
      icon: <Shield className="w-10 h-10" />,
      title: 'Security First',
      description: 'Enterprise-grade security measures to protect your data and operations with military-grade encryption.',
      features: ['End-to-End Encryption', 'Compliance', 'Threat Detection']
    }
  ];

  return (
    <section id="services" className="relative py-40 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 sm:mb-20 md:mb-24">
          <div className="inline-block px-5 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-300 text-xs sm:text-sm font-semibold mb-6">
            What We Offer
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6 sm:mb-8 px-4">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
              Our Services
            </span>
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto px-4">
            Comprehensive AI solutions tailored to your business needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="group relative p-8 bg-gradient-to-br from-slate-900/80 to-purple-900/30 backdrop-blur-xl border border-purple-500/20 rounded-3xl hover:border-purple-500/60 transition-all duration-700 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 cursor-pointer overflow-hidden"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/10 group-hover:to-pink-600/10 transition-all duration-700 rounded-3xl"></div>
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-125 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-purple-500/20">
                  <div className="text-purple-400 group-hover:text-pink-400 transition-colors duration-300">
                    {service.icon}
                  </div>
                </div>
                
                <h3 className="text-2xl font-black text-white mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
                  {service.title}
                </h3>
                
                <p className="text-slate-400 mb-6 leading-relaxed">
                  {service.description}
                </p>
                
                <ul className="space-y-2">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Why NexaBiz Section - Enhanced
const WhySection = () => {
  const reasons = [
    { 
      number: '01', 
      title: 'Proven Expertise', 
      description: 'Years of experience delivering AI solutions across industries with measurable ROI',
      icon: <Target className="w-8 h-8" />
    },
    { 
      number: '02', 
      title: 'Custom Solutions', 
      description: 'Tailored strategies that fit your unique business needs and scale with you',
      icon: <Sparkles className="w-8 h-8" />
    },
    { 
      number: '03', 
      title: 'Fast Deployment', 
      description: 'Quick implementation with minimal disruption to operations and maximum efficiency',
      icon: <Zap className="w-8 h-8" />
    },
    { 
      number: '04', 
      title: '24/7 Support', 
      description: 'Round-the-clock assistance to ensure your success and business continuity',
      icon: <Shield className="w-8 h-8" />
    }
  ];

  return (
    <section id="why-nexabiz" className="relative py-40 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <div className="inline-block px-5 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-300 text-sm font-semibold mb-6">
            Why Choose Us
          </div>
          <h2 className="text-5xl md:text-7xl font-black mb-8">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
              Why Choose NexaBiz?
            </span>
          </h2>
          <p className="text-2xl text-slate-400 max-w-3xl mx-auto">
            We're not just another tech company. We're your growth partner.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {reasons.map((reason, index) => (
            <div
              key={index}
              className="group relative p-10 bg-gradient-to-br from-slate-900/90 to-purple-900/40 backdrop-blur-xl border border-purple-500/20 rounded-3xl hover:border-purple-500/60 transition-all duration-700 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 cursor-pointer overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-700"></div>
              
              <div className="relative flex items-start gap-8">
                <div className="text-8xl font-black bg-gradient-to-br from-purple-500/40 to-pink-500/40 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-500">
                  {reason.number}
                </div>
                
                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      {reason.icon}
                    </div>
                    <h3 className="text-3xl font-black text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
                      {reason.title}
                    </h3>
                  </div>
                  <p className="text-slate-400 text-lg leading-relaxed">{reason.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Process Section - Enhanced
const ProcessSection = () => {
  const steps = [
    { 
      title: 'Discovery', 
      description: 'We analyze your needs and define clear objectives with stakeholder interviews',
      icon: <Target className="w-8 h-8" />
    },
    { 
      title: 'Strategy', 
      description: 'Custom roadmap aligned with your business goals and KPIs',
      icon: <LineChart className="w-8 h-8" />
    },
    { 
      title: 'Development', 
      description: 'Agile implementation with continuous feedback and sprint reviews',
      icon: <Rocket className="w-8 h-8" />
    },
    { 
      title: 'Launch', 
      description: 'Seamless deployment and comprehensive team training programs',
      icon: <Zap className="w-8 h-8" />
    },
    { 
      title: 'Optimize', 
      description: 'Ongoing monitoring and performance improvements with analytics',
      icon: <Sparkles className="w-8 h-8" />
    }
  ];

  return (
    <section id="process" className="relative py-40 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <div className="inline-block px-5 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-300 text-sm font-semibold mb-6">
            How We Work
          </div>
          <h2 className="text-5xl md:text-7xl font-black mb-8">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
              Our Process
            </span>
          </h2>
          <p className="text-2xl text-slate-400 max-w-3xl mx-auto">
            A proven methodology that delivers results every time
          </p>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/20 via-pink-500/40 to-purple-500/20 hidden lg:block"></div>
          
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative group">
                <div className="bg-gradient-to-br from-slate-900/90 to-purple-900/40 backdrop-blur-xl border-2 border-purple-500/30 rounded-3xl p-8 hover:border-purple-500/60 transition-all duration-700 hover:scale-110 hover:shadow-2xl hover:shadow-purple-500/40 cursor-pointer h-full">
                  {/* Number badge */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-purple-500/50 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">
                    {index + 1}
                  </div>
                  
                  {/* Icon */}
                  <div className="mt-8 mb-6 flex justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      {step.icon}
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-black text-white mb-4 text-center group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
                    {step.title}
                  </h3>
                  <p className="text-slate-400 text-sm text-center leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Testimonials Section - NEW
const TestimonialsSection = () => {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'CEO, TechCorp',
      content: 'NexaBiz transformed our business operations completely. The AI integration was seamless and the ROI exceeded all expectations.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'CTO, StartupHub',
      content: 'Working with NexaBiz has been a game-changer. Their expertise in AI automation saved us countless hours and resources.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Director, Innovation Labs',
      content: 'The team at NexaBiz delivered beyond our expectations. Their support is outstanding and the solutions are world-class.',
      rating: 5
    }
  ];

  return (
    <section id="testimonials" className="relative py-40 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <div className="inline-block px-5 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-300 text-sm font-semibold mb-6">
            Client Success Stories
          </div>
          <h2 className="text-5xl md:text-7xl font-black mb-8">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
              What Clients Say
            </span>
          </h2>
          <p className="text-2xl text-slate-400 max-w-3xl mx-auto">
            Don't just take our word for it - hear from our satisfied clients
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group p-8 bg-gradient-to-br from-slate-900/90 to-purple-900/40 backdrop-blur-xl border border-purple-500/20 rounded-3xl hover:border-purple-500/60 transition-all duration-700 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 cursor-pointer"
            >
              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="w-6 h-6 fill-yellow-400" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              
              <p className="text-slate-300 text-lg mb-8 leading-relaxed italic">
                "{testimonial.content}"
              </p>
              
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-black text-xl">
                  {testimonial.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-bold text-white text-lg">{testimonial.name}</div>
                  <div className="text-slate-400 text-sm">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// CTA Section - NEW
const CTASection = () => {
  return (
    <section className="relative py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-blue-600/20"></div>
      <div className="absolute inset-0 backdrop-blur-3xl"></div>
      
      <div className="max-w-5xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-purple-500/20 border border-purple-500/40 rounded-full text-purple-300 text-sm font-semibold backdrop-blur-xl mb-8">
          <Sparkles className="w-4 h-4" />
          Ready to Transform Your Business?
        </div>
        
        <h2 className="text-5xl md:text-7xl font-black mb-8 leading-tight">
          <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent drop-shadow-2xl">
            Let's Build Something
          </span>
          <br />
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-2xl">
            Amazing Together
          </span>
        </h2>
        
        <p className="text-xl text-slate-300 mb-12 max-w-3xl mx-auto">
          Join hundreds of businesses that have already transformed their operations with our AI-powered solutions.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <button className="group px-12 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full text-white text-lg font-bold hover:shadow-2xl hover:shadow-purple-500/60 transition-all duration-500 transform hover:scale-110 flex items-center gap-3 justify-center relative overflow-hidden">
            <span className="relative z-10">Schedule Free Consultation</span>
            <ArrowRight className="group-hover:translate-x-2 transition-transform relative z-10" size={24} />
          </button>
          <button className="px-12 py-5 bg-white/10 backdrop-blur-xl border-2 border-white/30 rounded-full text-white text-lg font-bold hover:bg-white/20 transition-all duration-300 hover:scale-105">
            View Case Studies
          </button>
        </div>
      </div>
    </section>
  );
};

// Footer Component - Enhanced
const Footer = () => {
  return (
    <footer className="relative py-20 px-6 border-t border-purple-500/20 bg-slate-950/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-5 gap-12 mb-16">
          <div className="md:col-span-2 space-y-6">
            <div className="text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
              NexaBiz
            </div>
            <p className="text-slate-400 text-lg leading-relaxed max-w-md">
              Transforming businesses with AI-powered solutions. Where vision turns into power.
            </p>
            <div className="flex gap-4">
              {['twitter', 'linkedin', 'github', 'instagram'].map(social => (
                <a 
                  key={social}
                  href="#" 
                  className="w-12 h-12 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center text-purple-400 hover:text-purple-300 transition-all duration-300 hover:scale-110"
                >
                  <Users className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-black text-lg mb-6">Company</h4>
            <ul className="space-y-3">
              {['About Us', 'Careers', 'Blog', 'Press Kit', 'Partners'].map(item => (
                <li key={item}>
                  <a href="#" className="text-slate-400 hover:text-purple-400 transition-colors text-base hover:translate-x-2 inline-block">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-black text-lg mb-6">Services</h4>
            <ul className="space-y-3">
              {['AI Integration', 'Automation', 'Consulting', 'Training', 'Support'].map(item => (
                <li key={item}>
                  <a href="#" className="text-slate-400 hover:text-purple-400 transition-colors text-base hover:translate-x-2 inline-block">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-black text-lg mb-6">Contact</h4>
            <ul className="space-y-3 text-base text-slate-400">
              <li className="hover:text-purple-400 transition-colors cursor-pointer">
                contact@nexabiz.com
              </li>
              <li className="hover:text-purple-400 transition-colors cursor-pointer">
                +1 (555) 123-4567
              </li>
              <li className="hover:text-purple-400 transition-colors cursor-pointer">
                San Francisco, CA
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-purple-500/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm">
              &copy; 2024 NexaBiz. All rights reserved. Where Vision Turns Into Power.
            </p>
            <div className="flex gap-8 text-sm text-slate-400">
              <a href="#" className="hover:text-purple-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-purple-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-purple-400 transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Main App Component
export default function App() {
  const [loading, setLoading] = useState(true);

  return (
    <>
      {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
      
      {!loading && (
        <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden relative">
          <AnimatedBackground />
          <FloatingOrbs />
          <Navigation />
          <HeroSection />
          <ServicesSection />
          <WhySection />
          <ProcessSection />
          <TestimonialsSection />
          <CTASection />
          <Footer />
        </div>
      )}
    </>
  );
}