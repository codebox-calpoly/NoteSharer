"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import "./reset-my-data.css";

type Status = "idle" | "loading" | "success" | "error";

export default function ResetMyDataPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        if (!cancelled) {
          setStatus("error");
          setMessage("Not logged in. Sign in first, then visit this page again.");
        }
        return;
      }

      if (!cancelled) setStatus("loading");

      try {
        const res = await fetch("/api/account/reset-my-data", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const data = await res.json().catch(() => ({}));

        if (cancelled) return;

        if (!res.ok) {
          setStatus("error");
          setMessage(data?.error ?? "Reset failed.");
          return;
        }

        setStatus("success");
        setMessage(data?.message ?? "Done. Reload the dashboard to see the changes.");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Request failed.");
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="reset-page">
      <h1>Reset my data</h1>
      {status === "idle" && <p>Checking session…</p>}
      {status === "loading" && <p>Resetting your downloads and all votes…</p>}
      {status === "success" && (
        <>
          <p className="reset-success">{message}</p>
          <Link href="/dashboard">Back to dashboard</Link>
        </>
      )}
      {status === "error" && (
        <>
          <p className="reset-error">{message}</p>
          <Link href="/auth">Sign in</Link>
          {" · "}
          <Link href="/dashboard">Dashboard</Link>
        </>
      )}
    </main>
  );
}
