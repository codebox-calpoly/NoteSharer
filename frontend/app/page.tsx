"use client";

import React from "react";
import Link from "next/link";

export default function Home() {
  const popularCourses = [
    { code: "CS 101", name: "Introduction to Computer Science", notes: "142", id: "" },
    { code: "MATH 200", name: "Calculus II", notes: "238", id: "" },
    { code: "PSYCH 150", name: "Introduction to Psychology", notes: "187", id: "" },
    { code: "ECON 101", name: "Principles of Microeconomics", notes: "165", id: "" },
    { code: "BIO 220", name: "Molecular Biology", notes: "203", id: "" },
    { code: "CHEM 115", name: "General Chemistry", notes: "194", id: "" },
    { code: "ENG 210", name: "World Literature", notes: "128", id: "" },
    { code: "PHYS 201", name: "Classical Mechanics", notes: "156", id: "" },
  ];

  return (
    <div className="poly-page" style={{ background: "var(--poly-bg-page)", minHeight: "100vh" }}>
      {/* Navbar */}
      <header className="poly-navbar">
        <div className="poly-navbar-inner">
          <Link href="/" className="poly-logo-row">
            <span className="poly-logo-text">NoteSharer</span>
          </Link>
          <Link href="/auth" className="poly-btn-primary">
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="poly-hero">
        <h1 className="poly-hero-title">Share notes. Earn credits. Learn together.</h1>
        <p className="poly-hero-subtitle">
          Browse hundreds of course notes shared by students across campus. Sign in to unlock
          downloads and start contributing to our learning community.
        </p>
      </section>

      {/* Popular Courses */}
      <section className="poly-section" style={{ paddingBottom: "var(--poly-space-4xl)" }}>
        <h2 className="poly-section-title">Popular Courses</h2>
        <p className="poly-section-desc">Explore notes from the most active courses on campus</p>
        <div className="poly-cards-grid">
          {popularCourses.map((course, i) => (
            <Link
              key={i}
              href="/auth"
              className="poly-course-card"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div>
                <span className="poly-course-badge">{course.code}</span>
              </div>
              <h3 className="poly-course-title">{course.name}</h3>
              <div className="poly-course-meta">
                <span>{course.notes} notes</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="poly-footer">
        <div className="poly-footer-logo">
          <span>© {new Date().getFullYear()} NoteSharer</span>
        </div>
        <nav className="poly-footer-nav">
          <Link href="#about">About</Link>
          <Link href="#contact">Contact</Link>
          <Link href="/terms-and-conditions">Community Guidelines</Link>
        </nav>
      </footer>
    </div>
  );
}
