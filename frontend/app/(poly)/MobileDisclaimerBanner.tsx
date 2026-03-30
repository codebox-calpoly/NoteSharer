"use client";

import { useSyncExternalStore } from "react";

const KEY = "poly-pages-disclaimer-dismissed";
const SYNC = "poly-pages-disclaimer-sync";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(SYNC, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SYNC, onChange);
  };
}

function readDismissed(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export default function MobileDisclaimerBanner() {
  const dismissed = useSyncExternalStore(subscribe, readDismissed, readDismissed);

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1");
      window.dispatchEvent(new Event(SYNC));
    } catch {
      /* ignore quota / private mode */
    }
  };

  if (dismissed) return null;
  return (
    <div
      className="poly-mobile-disclaimer"
      role="note"
      aria-label="Disclaimer"
    >
      <p>
        Poly Pages is an independent student project and is not affiliated with
        or endorsed by California Polytechnic State University.
      </p>
      <button
        type="button"
        className="poly-mobile-disclaimer-dismiss"
        onClick={dismiss}
        aria-label="Dismiss disclaimer"
      >
        Dismiss
      </button>
    </div>
  );
}
