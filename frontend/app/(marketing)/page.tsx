"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  BookOpen,
  Bookmark,
  CalendarDays,
  ClipboardList,
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
    const loadTimer = setTimeout(() => setLoading(false), 520);
    const heroTimer = setTimeout(() => setHeroVisible(true), 720);
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
            <h1
              className={`lp-hero-heading${heroVisible ? " lp-fade-in" : " lp-fade-out"}`}
              style={{ transitionDelay: "80ms" }}
            >
              Upload notes.
              <span className="lp-accent-line">Earn credits.</span>
              <span className="lp-title-desktop">Unlock class materials.</span>
              <span className="lp-title-mobile">Unlock materials.</span>
            </h1>
            <p className={`lp-hero-sub${heroVisible ? " lp-fade-in" : " lp-fade-out"}`} style={{ transitionDelay: "160ms" }}>
              Trade class materials with verified Cal Poly students. Upload approved notes to earn credits, then spend those credits on lecture notes, study guides, and exam reviews.
            </p>

            <div className={`lp-mobile-exchange${heroVisible ? " lp-fade-in" : " lp-fade-out"}`} style={{ transitionDelay: "220ms" }} aria-hidden>
              <span>
                <strong>Upload</strong>
                CSC 357 notes
              </span>
              <span>
                <strong>Earn</strong>
                +12 credits
              </span>
              <span>
                <strong>Unlock</strong>
                Study guides
              </span>
            </div>

            <div className={`lp-hero-actions${heroVisible ? " lp-fade-in" : " lp-fade-out"}`} style={{ transitionDelay: "240ms" }}>
              <Link href="/auth" className="lp-action-btn lp-action-btn--primary">
                Join now
              </Link>
              <button type="button" onClick={() => scrollToSection("how-it-works")} className="lp-action-btn lp-action-btn--secondary">
                How credits work
              </button>
            </div>

            <div className={`lp-verify-note${heroVisible ? " lp-fade-in" : " lp-fade-out"}`} style={{ transitionDelay: "310ms" }}>
              <span className="lp-verify-icon" aria-hidden>
                <BadgeCheck size={24} strokeWidth={2.4} />
              </span>
              <span>
                <strong>Verified Cal Poly students only</strong>
                <em>requires an @calpoly.edu email</em>
              </span>
            </div>
          </div>

          <div className={`lp-hero-visual${heroVisible ? " lp-fade-in" : " lp-fade-out"}`} style={{ transitionDelay: "220ms" }}>
            <div className="lp-note-scene" aria-hidden>
              <span className="lp-doodle lp-doodle--star" />
              <span className="lp-doodle lp-doodle--spark" />
              <div className="lp-note-card lp-note-card--lecture">
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
      </section>

      <HowItWorksSection />
      <FeaturesSection />

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div>
            <p className="lp-footer-brand">Poly Pages</p>
            <p className="lp-footer-sub">Independent student project - not affiliated with Cal Poly administration.</p>
          </div>
          <Link href="/auth" className="lp-footer-link">Join now</Link>
        </div>
      </footer>
    </div>
  );
}

function HowItWorksSection() {
  const { ref, visible } = useInView(0.15);
  const steps = [
    { Icon: Upload, num: "01", title: "Contribute materials", desc: "Upload lecture notes, study guides, exam reviews, or class resources tied to a Cal Poly course." },
    { Icon: WalletCards, num: "02", title: "Earn credits", desc: "Approved uploads add credits to your account as the course collection grows." },
    { Icon: Unlock, num: "03", title: "Unlock resources", desc: "Spend credits on materials for classes you are taking now or checking out next." },
  ];

  return (
    <section ref={ref} id="how-it-works" className="lp-section lp-section--cream">
      <div className="lp-section-inner">
        <div className="lp-section-head">
          <p className={`lp-section-label${visible ? " lp-fade-in" : " lp-fade-out"}`}>How it works</p>
          <h2 className={`lp-section-heading${visible ? " lp-fade-in" : " lp-fade-out"}`} style={{ transitionDelay: "90ms" }}>
            <span>Upload once.</span>
            <span>Use credits anytime.</span>
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
    { Icon: ClipboardList, title: "Track your classes", desc: "Pin current courses and jump straight to matching notes and materials." },
    { Icon: BookOpen, title: "Find course materials", desc: "Browse lecture notes, study guides, exam reviews, and PDFs by course." },
    { Icon: CalendarDays, title: "Preview future courses", desc: "Look through materials from classes you are considering before registration." },
    { Icon: Trophy, title: "Earn from uploads", desc: "See which contributions are getting used and building credits." },
    { Icon: WalletCards, title: "Manage credits", desc: "Track your balance, unlocks, and upload history in one place." },
    { Icon: Bookmark, title: "Save useful materials", desc: "Bookmark the files you want ready when you study." },
  ];

  return (
    <section ref={ref} id="features" className="lp-section lp-section--features">
      <div className="lp-section-inner">
        <div className="lp-feature-header">
          <div>
            <h2 className={`lp-section-heading${visible ? " lp-fade-in" : " lp-fade-out"}`}>
              <span>Find notes by course.</span>
              <span>Unlock with credits.</span>
            </h2>
          </div>
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
            <strong>Upload what you have. Unlock what you need.</strong>
            <span>Credits keep the exchange balanced for every student.</span>
          </div>
          <Link href="/auth" className="lp-action-btn lp-action-btn--primary lp-final-cta">
            Join now
          </Link>
        </div>
      </div>
    </section>
  );
}
