"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Bookmark,
  CalendarDays,
  ClipboardList,
  Paperclip,
  Trophy,
  Unlock,
  Upload,
  WalletCards,
} from "lucide-react";
import { getSessionWithRecovery, supabase } from "@/lib/supabaseClient";
import "./landing.css";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.unobserve(el);
  }, [threshold]);

  return { ref, visible };
}

export default function Home() {
  const router = useRouter();
  const [heroVisible, setHeroVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTimer = setTimeout(() => setLoading(false), 780);
    const heroTimer = setTimeout(() => setHeroVisible(true), 260);
    return () => {
      clearTimeout(loadTimer);
      clearTimeout(heroTimer);
    };
  }, []);

  useEffect(() => {
    getSessionWithRecovery(supabase).then(({ session }) => {
      if (session) router.replace("/dashboard");
    });
  }, [router]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="lp-root">
      <div className={`lp-loading${loading ? "" : " is-hidden"}`} aria-hidden={!loading}>
        <div className="lp-loading-card">
          <span className="lp-loading-mark" />
          <span className="lp-loading-text">Organizing notes</span>
          <span className="lp-loading-line" />
        </div>
      </div>

      <section className="lp-hero" id="hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-copy">
            <p className={`lp-hero-kicker${heroVisible ? " lp-fade-in" : " lp-fade-out"}`} style={{ transitionDelay: "60ms" }}>
              Cal Poly student notes, traded fairly
            </p>
            <h1
              className={`lp-hero-heading${heroVisible ? " lp-fade-in" : " lp-fade-out"}`}
              style={{ transitionDelay: "120ms" }}
            >
              Upload notes.
              <span>Earn credits.</span>
              Unlock class materials.
            </h1>
            <p className={`lp-hero-sub${heroVisible ? " lp-fade-in" : " lp-fade-out"}`} style={{ transitionDelay: "190ms" }}>
              Share lecture notes, study guides, and exam reviews. Earn credits when classmates use them, then spend those credits on materials for your current courses.
            </p>

            <div className={`lp-hero-actions${heroVisible ? " lp-fade-in" : " lp-fade-out"}`} style={{ transitionDelay: "260ms" }}>
              <Link href="/auth" className="lp-action-btn lp-action-btn--primary">
                Start sharing
                <ArrowRight className="lp-button-icon" size={18} strokeWidth={2.8} aria-hidden />
              </Link>
              <button type="button" onClick={() => scrollToSection("how-it-works")} className="lp-action-btn lp-action-btn--secondary">
                See how it works
              </button>
            </div>

            <div className={`lp-verify-note${heroVisible ? " lp-fade-in" : " lp-fade-out"}`} style={{ transitionDelay: "330ms" }}>
              <span className="lp-verify-icon" aria-hidden>
                <BadgeCheck size={24} strokeWidth={2.4} />
              </span>
              <span>
                <strong>Cal Poly students only</strong>
                <em>must be verified by @calpoly.edu</em>
              </span>
            </div>
          </div>

          <div className={`lp-hero-visual${heroVisible ? " lp-fade-in" : " lp-fade-out"}`} style={{ transitionDelay: "220ms" }}>
            <div className="lp-note-scene" aria-hidden>
              <span className="lp-doodle lp-doodle--star" />
              <span className="lp-doodle lp-doodle--spark" />
              <div className="lp-note-card lp-note-card--lecture">
                <Paperclip className="lp-note-clip" size={74} strokeWidth={2.1} />
                <span className="lp-note-course">CSC 357</span>
                <span className="lp-note-title">Lecture Notes</span>
                <span className="lp-note-rule" />
              </div>
              <div className="lp-note-card lp-note-card--study">
                <span className="lp-note-tape" />
                <span className="lp-note-course">MATH 241</span>
                <span className="lp-note-title">Study Guide</span>
                <span className="lp-note-rule" />
              </div>
              <div className="lp-note-card lp-note-card--review">
                <span className="lp-note-pin" />
                <span className="lp-note-course">BIO 161</span>
                <span className="lp-note-title">Exam Review</span>
                <span className="lp-note-rule" />
              </div>
            </div>
          </div>
        </div>

        <button type="button" onClick={() => scrollToSection("how-it-works")} className="lp-scroll-cue" aria-label="Scroll to how it works">
          <span />
        </button>
      </section>

      <HowItWorksSection />
      <FeaturesSection />

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div>
            <p className="lp-footer-brand">Poly Pages</p>
            <p className="lp-footer-sub">Independent student project - not affiliated with Cal Poly administration.</p>
          </div>
          <Link href="/auth" className="lp-footer-link">Start sharing</Link>
        </div>
      </footer>
    </div>
  );
}

function HowItWorksSection() {
  const { ref, visible } = useInView(0.15);
  const steps = [
    { Icon: Upload, num: "01", title: "Upload useful materials", desc: "Share lecture notes, study guides, exam reviews, or other class files you would actually want before a midterm." },
    { Icon: WalletCards, num: "02", title: "Earn credits back", desc: "Approved uploads add credits to your account, so contributing to the library gives you access to more materials." },
    { Icon: Unlock, num: "03", title: "Unlock course help", desc: "Spend credits on notes and study materials for the classes you are taking now, all organized around Cal Poly courses." },
  ];

  return (
    <section ref={ref} id="how-it-works" className="lp-section lp-section--cream">
      <div className="lp-section-inner">
        <div className="lp-section-head">
          <p className={`lp-section-label${visible ? " lp-fade-in" : " lp-fade-out"}`}>How it works</p>
          <h2 className={`lp-section-heading${visible ? " lp-fade-in" : " lp-fade-out"}`} style={{ transitionDelay: "90ms" }}>
            Share what helped you. Get what helps next.
          </h2>
        </div>
        <div className="lp-steps-grid">
          {steps.map(({ Icon, ...s }, i) => (
            <article key={s.num} className={`lp-step-card${visible ? " lp-fade-in" : " lp-fade-out"}`} style={{ transitionDelay: `${180 + i * 110}ms` }}>
              <div className="lp-step-icon" aria-hidden>
                <Icon size={25} strokeWidth={2.35} />
              </div>
              <span className="lp-step-num">{s.num}</span>
              <h3 className="lp-card-title">{s.title}</h3>
              <p className="lp-card-desc">{s.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const { ref, visible } = useInView(0.18);
  const features = [
    { Icon: ClipboardList, title: "Track your classes", desc: "Keep your current courses close so the notes you need are always one click away." },
    { Icon: BookOpen, title: "Browse notes and study guides", desc: "Find PDFs, lecture notes, exam reviews, and study materials by course and professor." },
    { Icon: CalendarDays, title: "Scope out future courses", desc: "Peek at materials from classes you might take next quarter before you commit." },
    { Icon: Trophy, title: "Climb the leaderboards", desc: "Earn recognition when your uploads help classmates study better." },
    { Icon: WalletCards, title: "Manage your credits", desc: "See what you earned, what you unlocked, and where your contributions are paying off." },
    { Icon: Bookmark, title: "Save your best finds", desc: "Bookmark useful materials so finals week does not start with another search spiral." },
  ];

  return (
    <section ref={ref} id="features" className="lp-section lp-section--features">
      <div className="lp-section-inner">
        <div className="lp-feature-header">
          <div>
            <p className={`lp-section-label${visible ? " lp-fade-in" : " lp-fade-out"}`}>What you can do</p>
            <h2 className={`lp-section-heading${visible ? " lp-fade-in" : " lp-fade-out"}`} style={{ transitionDelay: "90ms" }}>
              A class library that feels built around your schedule.
            </h2>
          </div>
          <p className={`lp-feature-intro${visible ? " lp-fade-in" : " lp-fade-out"}`} style={{ transitionDelay: "150ms" }}>
            Poly Pages is more than an upload form. It is a course-aware place to trade notes, plan ahead, track credits, and find the materials that make studying less chaotic.
          </p>
        </div>
        <div className="lp-feature-card-grid">
          {features.map(({ Icon, title, desc }, i) => (
            <article key={title} className={`lp-feature-card${visible ? " lp-fade-in" : " lp-fade-out"}`} style={{ transitionDelay: `${210 + i * 70}ms` }}>
              <span className="lp-feature-icon" aria-hidden>
                <Icon size={23} strokeWidth={2.25} />
              </span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
        <div className={`lp-final-strip${visible ? " lp-fade-in" : " lp-fade-out"}`} style={{ transitionDelay: "640ms" }}>
          <div>
            <strong>Have notes from a class you already survived?</strong>
            <span>Turn them into credits for the next one.</span>
          </div>
          <Link href="/auth" className="lp-action-btn lp-action-btn--primary lp-final-cta">
            Start sharing
            <ArrowRight className="lp-button-icon" size={18} strokeWidth={2.8} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
