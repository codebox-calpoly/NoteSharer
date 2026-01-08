"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import "./auth.css";

export default function AuthPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [awaitingOtp, setAwaitingOtp] = useState(false);
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
          setSubmitting(true);
          if (!awaitingOtp) {
            const normalizedEmail = email.trim().toLowerCase();
            if (!normalizedEmail.endsWith("@calpoly.edu")) {
              setError("Please enter your Cal Poly email address");
              setSubmitting(false);
              return;
            }
            const { error: signInError } = await supabase.auth.signInWithOtp({
              email: normalizedEmail,
              options: {
                shouldCreateUser: true,
              },
            });
            if (signInError) {
              setError(signInError.message ?? "Unable to send sign-in email.");
            } else {
              setAwaitingOtp(true);
              setMessage("Check your email for the one-time code.");
            }
          } else {
            const normalizedEmail = email.trim().toLowerCase();
            const token = otp.trim();
            if (!token) {
              setError("Enter the one-time code from your email.");
              setSubmitting(false);
              return;
            }
            const { error: verifyError } = await supabase.auth.verifyOtp({
              email: normalizedEmail,
              token,
              type: "email",
            });
            if (verifyError) {
              setError(verifyError.message ?? "Invalid or expired code.");
            } else {
              router.replace("/auth/callback");
            }
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
          disabled={awaitingOtp}
        />
        {awaitingOtp ? (
          <>
            <p className="auth-body">
              Enter the one-time code from your email.
            </p>
            <label className="auth-label" htmlFor="otp">
              One-time code
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              required
              placeholder="Enter the code"
              className="auth-input"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
            />
            <button
              type="button"
              className="auth-button-secondary"
              onClick={() => {
                setAwaitingOtp(false);
                setOtp("");
                setMessage("");
                setError("");
              }}
            >
              Use a different email
            </button>
          </>
        ) : null}
        <button
          type="submit"
          className="auth-button-primary"
          disabled={!email || submitting || (awaitingOtp && !otp.trim())}
        >
          {awaitingOtp
            ? submitting
              ? "Verifying..."
              : "Verify code"
            : submitting
              ? "Sending..."
              : "Send code"}
        </button>
        {message ? <p className="auth-success">{message}</p> : null}
        {error ? <p className="auth-error">{error}</p> : null}
      </form>
    </div>
  );

  return <main className="auth-page">{content}</main>;
}
