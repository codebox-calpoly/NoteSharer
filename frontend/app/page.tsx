"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/app/components/ThemeToggle";

const ANIMA_IMG = "https://c.animaapp.com/vYVdVbUl/img";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroVisible] = useState(true);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div
      className="landing-page flex flex-col items-start relative w-full min-h-screen page-bg"
      style={{ fontFamily: "var(--font-inter), Inter, Helvetica, sans-serif" }}
    >
      {/* Header */}
      <header className="landing-header flex flex-col w-full items-start pt-0 pb-px px-0 bg-white border-b border-solid border-neutral-200 sticky top-0 z-50">
        <div className="flex h-[72px] items-center justify-between px-4 md:px-8 py-0 relative w-full">
          <div className="flex items-center gap-3 relative">
            <span className="logo-box relative w-[54px] h-[54px]">
              <img
                className="relative w-[54px] h-[54px] landing-logo"
                alt="Poly Pages Logo"
                src={`${ANIMA_IMG}/container-8.svg`}
              />
            </span>
            <div className="relative h-8">
              <h1 className="font-bold text-[var(--poly-neutral-dark)] text-xl md:text-2xl tracking-[0] leading-8 whitespace-nowrap">
                Poly Pages
              </h1>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <button
              type="button"
              onClick={() => scrollToSection("how-it-works")}
              className="font-medium text-[var(--poly-neutral-muted)] text-base tracking-[0] leading-6 whitespace-nowrap hover:text-[#6dbe8b] transition-colors duration-200"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("why-poly-pages")}
              className="font-medium text-[var(--poly-neutral-muted)] text-base tracking-[0] leading-6 whitespace-nowrap hover:text-[#6dbe8b] transition-colors duration-200"
            >
              Why Us
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("features")}
              className="font-medium text-[var(--poly-neutral-muted)] text-base tracking-[0] leading-6 whitespace-nowrap hover:text-[#6dbe8b] transition-colors duration-200"
            >
              Features
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/auth"
            className="hidden md:flex relative w-[95.05px] h-10 rounded-[10px] border border-solid border-black shadow-[0px_4px_4px_#00000040] cursor-pointer transition-all duration-200 hover:shadow-[0px_6px_6px_#00000040] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0px_2px_2px_#00000040] items-center justify-center bg-[var(--variable-collection-warm-apricot)]"
            aria-label="Log In"
          >
            <span className="font-semibold text-[#2c1b1b] text-base text-center tracking-[0] leading-6 whitespace-nowrap">
              Log In
            </span>
          </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden relative w-10 h-10 flex flex-col items-center justify-center gap-1.5 cursor-pointer z-50"
            aria-label="Toggle menu"
          >
            <span
              className={`w-6 h-0.5 bg-[#2e2e2e] transition-all duration-300 ${
                mobileMenuOpen ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`w-6 h-0.5 bg-[#2e2e2e] transition-all duration-300 ${
                mobileMenuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`w-6 h-0.5 bg-[#2e2e2e] transition-all duration-300 ${
                mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </button>
        </div>

        <div
          className={`landing-mobile-menu md:hidden fixed top-[73px] left-0 w-full bg-white border-b border-neutral-200 transition-all duration-300 ease-in-out ${
            mobileMenuOpen
              ? "max-h-screen opacity-100"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
          style={{ zIndex: 40 }}
        >
          <nav className="flex flex-col items-start gap-4 px-8 py-6">
            <button
              type="button"
              onClick={() => scrollToSection("how-it-works")}
              className="font-medium text-[var(--poly-neutral-muted)] text-base tracking-[0] leading-6 hover:text-[#6dbe8b] transition-colors duration-200 w-full text-left"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("why-poly-pages")}
              className="font-medium text-[var(--poly-neutral-muted)] text-base tracking-[0] leading-6 hover:text-[#6dbe8b] transition-colors duration-200 w-full text-left"
            >
              Why Us
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("features")}
              className="font-medium text-[var(--poly-neutral-muted)] text-base tracking-[0] leading-6 hover:text-[#6dbe8b] transition-colors duration-200 w-full text-left"
            >
              Features
            </button>
            <Link
              href="/auth"
              className="relative w-full h-10 rounded-[10px] border border-solid border-black shadow-[0px_4px_4px_#00000040] cursor-pointer transition-all duration-200 active:translate-y-px active:shadow-[0px_2px_2px_#00000040] mt-2 flex items-center justify-center bg-[var(--variable-collection-warm-apricot)]"
              aria-label="Log In"
            >
              <span className="font-semibold text-[#2c1b1b] text-base text-center tracking-[0] leading-6 whitespace-nowrap">
                Log In
              </span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative w-full pt-16 md:pt-20 pb-16 md:pb-24 px-4 md:px-8"
        aria-label="Hero Section"
        id="hero"
      >
        <div className="relative max-w-6xl mx-auto">
          <header
            className={`mb-8 md:mb-12 transition-all duration-1000 ${
              heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h1 className="font-bold text-3xl md:text-5xl lg:text-6xl text-center tracking-[0] leading-tight md:leading-[72px] px-4">
              <span className="landing-tagline-gray">Share notes. Earn credits. </span>
              <span className="text-[#6dbe8b]">Learn together.</span>
            </h1>
          </header>

          <div
            className={`mb-8 md:mb-12 transition-all duration-1000 delay-200 ${
              heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <p className="max-w-3xl mx-auto font-normal text-[#666666] text-base md:text-xl text-center tracking-[0] leading-relaxed md:leading-[34px] px-4">
              A peer to peer helping platform that rewards contribution. Upload
              your notes from class, earn credits, and unlock notes from students
              all across campus.
            </p>
          </div>

          <div
            className={`flex justify-center mb-12 md:mb-16 transition-all duration-1000 delay-400 ${
              heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <Link
              href="/auth"
              className="relative w-full max-w-[200px] h-[59px] rounded-[14px] border border-solid border-[#080000] shadow-[0px_4px_4px_#00000040] cursor-pointer transition-all duration-200 hover:shadow-[0px_6px_8px_#00000050] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0px_2px_2px_#00000040] flex items-center justify-center bg-[var(--variable-collection-warm-apricot)]"
              aria-label="Sign up for the platform"
            >
              <span className="font-semibold text-black text-lg text-center tracking-[0] leading-[27px] whitespace-nowrap">
                Sign Up
              </span>
            </Link>
          </div>

          <div
            className={`flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 lg:gap-16 transition-all duration-1000 delay-600 ${
              heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <img
              className="w-full max-w-[346px] h-auto"
              alt="Laptop displaying notes interface"
              src={`${ANIMA_IMG}/mask-group@2x.png`}
            />
            <img
              className="w-full max-w-[154px] h-auto"
              alt="Mobile phone displaying notes interface"
              src={`${ANIMA_IMG}/mask-group-1@2x.png`}
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorksSection />

      {/* Why Poly Pages */}
      <WhyChooseUsSection />

      {/* Features */}
      <FeaturesSection />

      {/* Footer */}
      <footer className="landing-footer flex flex-col w-full items-start pt-8 md:pt-12 pb-8 px-4 md:px-8 bg-neutral-50 border-t border-solid border-neutral-200">
        <div className="flex flex-col md:flex-row h-auto md:h-[61px] items-start md:items-center justify-between gap-6 md:gap-0 w-full max-w-6xl mx-auto">
          <div className="flex flex-col items-start gap-2">
            <div className="relative h-8">
              <h2 className="font-bold text-[#6dbe8b] text-2xl tracking-[0] leading-8 whitespace-nowrap">
                Poly Pages
              </h2>
            </div>
            <div className="relative h-[21px]">
              <p className="font-normal text-[#999999] text-sm tracking-[0] leading-[21px] whitespace-nowrap">
                CodeBox TM
              </p>
            </div>
          </div>
          <nav
            className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8"
            aria-label="Footer navigation"
          >
            <a
              href="#about"
              className="font-medium text-[#666666] text-base tracking-[0] leading-6 whitespace-nowrap hover:text-[#6dbe8b] transition-colors duration-200"
            >
              About
            </a>
            <a
              href="/terms-and-conditions"
              className="font-medium text-[#666666] text-base tracking-[0] leading-6 whitespace-nowrap hover:text-[#6dbe8b] transition-colors duration-200"
            >
              Community Guidelines
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function HowItWorksSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  const steps = [
    {
      icon: `${ANIMA_IMG}/container.svg`,
      title: "Upload Your Notes",
      description: "Upload your study materials and lecture notes",
    },
    {
      icon: `${ANIMA_IMG}/container-1.svg`,
      title: "Earn Credits",
      description: "Receive credits every time you upload.",
    },
    {
      icon: `${ANIMA_IMG}/container-2.svg`,
      title: "Unlock Study Materials",
      description:
        "Use your credits to access notes from students across campus.",
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="flex flex-col w-full items-start gap-12 md:gap-16 pt-16 md:pt-24 pb-12 md:pb-16 px-4 md:px-8 bg-white"
    >
      <header className="relative w-full">
        <h2
          className={`font-bold text-[#2e2e2e] text-3xl md:text-4xl text-center tracking-[0] leading-10 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          How Poly Pages Works
        </h2>
      </header>
      <div className="relative w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <article
              key={index}
              className={`flex flex-col items-center transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${(index + 1) * 150}ms` }}
            >
              <img
                className="w-[88px] h-[88px] mb-6 transition-transform duration-300 hover:scale-110"
                alt={step.title}
                src={step.icon}
              />
              <h3 className="font-semibold text-[#2e2e2e] text-xl md:text-2xl text-center tracking-[0] leading-8 mb-3 px-4">
                {step.title}
              </h3>
              <p className="font-normal text-[#666666] text-base text-center tracking-[0] leading-[25.6px] px-4 max-w-[280px]">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyChooseUsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  const features = [
    {
      icon: `${ANIMA_IMG}/container-3.svg`,
      title: "Organized and searchable notes",
      description:
        "Find exactly what you need with smart categorization and powerful search across all subjects and courses.",
    },
    {
      icon: `${ANIMA_IMG}/container-4.svg`,
      title: "Fair credit based system",
      description:
        "Contribute to earn, use credits to access. A balanced ecosystem that rewards quality and participation. Learn more",
    },
    {
      icon: `${ANIMA_IMG}/container-5.svg`,
      title: "Built for students, by students",
      description:
        "Designed with real student needs in mind. Community-driven and focused on collaborative learning.",
    },
    {
      icon: `${ANIMA_IMG}/container-6.svg`,
      title: "Clean and distraction free experience",
      description:
        "No clutter, no ads. Just a simple, intuitive platform designed to help you study better.",
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="why-poly-pages"
      className="flex flex-col w-full items-start gap-12 md:gap-16 px-4 md:px-8 py-16 md:py-24"
    >
      <header className="relative w-full">
        <h2
          className={`font-bold text-[#2e2e2e] text-3xl md:text-4xl text-center tracking-[0] leading-10 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          Why Poly Pages?
        </h2>
      </header>
      <div className="relative w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <article
              key={index}
              className={`flex flex-col bg-white rounded-2xl shadow-[0px_4px_20px_#00000014] p-8 md:p-10 transition-all duration-700 hover:shadow-[0px_8px_30px_#00000020] hover:-translate-y-1 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${(index + 1) * 100}ms` }}
            >
              <img
                className="w-16 h-16 mb-6 transition-transform duration-300 hover:scale-110"
                alt={`${feature.title} icon`}
                src={feature.icon}
              />
              <h3 className="font-semibold text-[#2e2e2e] text-xl md:text-2xl tracking-[0] leading-8 mb-4">
                {feature.title}
              </h3>
              <p className="font-normal text-[#666666] text-base tracking-[0] leading-[27.2px]">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="flex flex-col gap-6 md:gap-8 bg-white w-full px-4 md:px-8 py-16 md:py-24"
    >
      <img
        className={`w-16 h-16 md:w-20 md:h-20 mx-auto transition-all duration-700 ${
          isVisible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-8 scale-75"
        }`}
        alt="Campus collaboration icon"
        src={`${ANIMA_IMG}/container-7.svg`}
      />
      <div className="w-full flex justify-center">
        <h2
          className={`max-w-3xl font-bold text-[#2e2e2e] text-3xl md:text-4xl text-center tracking-[0] leading-10 px-4 transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          Built for campus collaboration
        </h2>
      </div>
      <div className="w-full flex justify-center">
        <p
          className={`max-w-2xl font-normal text-[#666666] text-base md:text-xl text-center tracking-[0] leading-relaxed md:leading-[34px] px-4 transition-all duration-700 delay-400 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          Join a growing community of students helping each other succeed. Share
          knowledge, support peers, and achieve more together.
        </p>
      </div>
    </section>
  );
}
