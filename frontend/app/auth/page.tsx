"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import "./auth.css";

export default function AuthPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch session", error);
      }
      if (data?.session) {
        router.replace("/auth/callback");
        return;
      }
      setChecking(false);
    };

    checkSession();
  }, [router]);

  const content = checking ? (
    <p className="auth-loading">Checking your session…</p>
  ) : (
    <div className="auth-card">
      <h1 className="auth-title">Sign in</h1>
      <p className="auth-body">
        Enter your Cal Poly email to receive a one-time code.
      </p>
      <form
        className="auth-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setMessage("");
          setError("");
          const normalizedEmail = email.trim().toLowerCase();
          if (!normalizedEmail.endsWith("@calpoly.edu")) {
            setError("Please enter your Cal Poly email address");
            return;
          }
          setSubmitting(true);
          const redirectTo =
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback`
              : undefined;
          const { error: signInError } = await supabase.auth.signInWithOtp({
            email: normalizedEmail,
            options: {
              emailRedirectTo: redirectTo,
            },
          });
          if (signInError) {
            setError(signInError.message ?? "Unable to send sign-in email.");
          } else {
            setMessage("Check your email for a sign-in link or code.");
          }
          setSubmitting(false);
        }}
      >
        <label className="auth-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="username@calpoly.edu"
          className="auth-input"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button
          type="submit"
          className="auth-button-primary"
          disabled={!email || submitting}
        >
          {submitting ? "Sending..." : "Send magic link"}
        </button>
        {message ? <p className="auth-success">{message}</p> : null}
        {error ? <p className="auth-error">{error}</p> : null}
      </form>
    </div>
  );

  return <main className="auth-page">{content}</main>;
}
