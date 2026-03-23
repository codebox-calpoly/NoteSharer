"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionWithRecovery, supabase } from "@/lib/supabaseClient";
import { CourseEnrollmentPicker, type EnrollmentCourseOption } from "@/app/components/CourseEnrollmentPicker";
import { generateUniqueNickname } from "@/lib/nicknames";
import "./onboarding.css";

type EnrollmentResponse = {
  activeCycle: {
    id: string;
    name: string;
    catalogTerm: string | null;
  } | null;
  selectedClasses: EnrollmentCourseOption[];
  selectedCourseIds: string[];
  enrollmentRequired: boolean;
};

const INTRO_STEPS = [
  {
    kicker: "Welcome",
    title: "Welcome to Poly Pages",
    body: "Built for Cal Poly SLO students to share useful notes and find help faster.",
  },
  {
    kicker: "Credits",
    title: "Credits reward real contribution",
    body: "Upload helpful notes, earn credits after approval, and use those credits to unlock notes from other students.",
  },
  {
    kicker: "Guidelines",
    title: "Only upload material you are allowed to share",
    body: "Do not upload professor slides, exams, answer keys, or other material that belongs to the course staff.",
  },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [shuffling, setShuffling] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<EnrollmentCourseOption[]>([]);
  const [enrollment, setEnrollment] = useState<EnrollmentResponse | null>(null);
  const [courseRefreshMode, setCourseRefreshMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const load = async () => {
      const refreshMode =
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("mode") === "course-refresh";
      setCourseRefreshMode(refreshMode);

      const { session } = await getSessionWithRecovery(supabase);
      if (!session) {
        router.replace("/auth");
        return;
      }

      setAccessToken(session.access_token);

      const [{ data: profile, error: profileError }, enrollmentRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("onboarding_complete, display_name")
          .eq("id", session.user.id)
          .single(),
        fetch("/api/me/enrollment", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
      ]);

      if (profileError) {
        setError("Could not load your profile. Please sign in again.");
        setLoading(false);
        return;
      }

      if (!enrollmentRes.ok) {
        setError("Could not load your current enrollment cycle.");
        setLoading(false);
        return;
      }

      const enrollmentPayload = (await enrollmentRes.json()) as EnrollmentResponse;
      setEnrollment(enrollmentPayload);
      setSelectedCourses(enrollmentPayload.selectedClasses ?? []);

      if (profile?.onboarding_complete && !refreshMode && !enrollmentPayload.enrollmentRequired) {
        router.replace("/dashboard");
        return;
      }

      if (refreshMode && !enrollmentPayload.enrollmentRequired) {
        router.replace("/dashboard");
        return;
      }

      setDisplayName(profile?.display_name ?? null);
      setCurrentStep(refreshMode ? INTRO_STEPS.length + 2 : 0);
      setLoading(false);
    };

    void load();
  }, [router]);

  const shuffleNickname = async () => {
    setShuffling(true);
    setError(null);
    try {
      const nickname = await generateUniqueNickname(supabase);
      setDisplayName(nickname);
    } catch (generationError) {
      console.error("Failed to generate nickname", generationError);
      setError("Unable to generate a nickname. Please try again.");
    } finally {
      setShuffling(false);
    }
  };

  const complete = async () => {
    setSaving(true);
    setError(null);
    const { session } = await getSessionWithRecovery(supabase);
    const userId = session?.user.id;
    if (!userId || !accessToken) {
      router.replace("/auth");
      return;
    }

    let nameToSave = displayName;
    if (!courseRefreshMode && !nameToSave) {
      try {
        nameToSave = await generateUniqueNickname(supabase);
        setDisplayName(nameToSave);
      } catch (generationError) {
        console.error("Failed to generate nickname", generationError);
        setError("Unable to generate a nickname. Please try again.");
        setSaving(false);
        return;
      }
    }

    try {
      if (!courseRefreshMode) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ onboarding_complete: true, display_name: nameToSave })
          .eq("id", userId);

        if (updateError) {
          throw updateError;
        }
      }

      const enrollmentRes = await fetch("/api/me/enrollment", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ courseIds: selectedCourses.map((course) => course.id) }),
      });

      if (!enrollmentRes.ok) {
        const payload = (await enrollmentRes.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to save enrolled courses.");
      }

      router.replace("/dashboard");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to finish onboarding.");
      setSaving(false);
      return;
    }
  };

  const lastNewUserStep = INTRO_STEPS.length + 2;
  const isIntroStep = currentStep < INTRO_STEPS.length;
  const isNicknameStep = currentStep === INTRO_STEPS.length;
  const isTermsStep = currentStep === INTRO_STEPS.length + 1;
  const isCourseStep = currentStep === lastNewUserStep;

  const currentIntro = useMemo(
    () => (isIntroStep ? INTRO_STEPS[currentStep] : null),
    [currentStep, isIntroStep],
  );

  if (loading) {
    return (
      <main className="onboarding-page">
        <section className="onboarding-card">
          <p className="onboarding-status">Loading...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="onboarding-page">
      <section className="onboarding-card">
        {courseRefreshMode ? (
          <>
            <p className="onboarding-kicker">Enrollment Refresh</p>
            <h1 className="onboarding-title">Update your current classes</h1>
            <p className="onboarding-body">
              {enrollment?.activeCycle?.name
                ? `Select the courses you are currently enrolled in for ${enrollment.activeCycle.name}.`
                : "Select the courses you are currently enrolled in."}
            </p>
          </>
        ) : isIntroStep && currentIntro ? (
          <>
            <p className="onboarding-kicker">{currentIntro.kicker}</p>
            <h1 className="onboarding-title">{currentIntro.title}</h1>
            <p className="onboarding-body">{currentIntro.body}</p>
          </>
        ) : isNicknameStep ? (
          <>
            <p className="onboarding-kicker">Anonymous Identity</p>
            <h1 className="onboarding-title">Let&apos;s keep it anonymous</h1>
            <div className="onboarding-nickname">
              <div className="onboarding-nickname-row">
                <span className="onboarding-nickname-chip">
                  {displayName ?? "Tap shuffle to generate"}
                </span>
                <button
                  type="button"
                  className="onboarding-secondary"
                  onClick={shuffleNickname}
                  disabled={shuffling || saving}
                >
                  {shuffling ? "Shuffling..." : "Shuffle nickname"}
                </button>
              </div>
              <p className="onboarding-body">
                This is the name other students will see instead of your real identity.
              </p>
            </div>
          </>
        ) : isTermsStep ? (
          <>
            <p className="onboarding-kicker">Terms</p>
            <h1 className="onboarding-title">Agree to the rules before you start</h1>
            <label className="onboarding-terms">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
              />
              <span>
                I agree to the{" "}
                <a
                  href="/terms-and-conditions"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms &amp; Conditions
                </a>
              </span>
            </label>
          </>
        ) : (
          <>
            <p className="onboarding-kicker">Courses</p>
            <h1 className="onboarding-title">Select your current classes</h1>
            <p className="onboarding-body">
              We use this to show your courses first in browse and ask you to refresh them each term.
            </p>
            <CourseEnrollmentPicker
              accessToken={accessToken}
              selectedCourses={selectedCourses}
              onChange={setSelectedCourses}
              disabled={saving}
            />
          </>
        )}

        <div className="onboarding-actions">
          {!courseRefreshMode && currentStep > 0 ? (
            <button
              type="button"
              className="onboarding-secondary"
              onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
              disabled={saving}
            >
              Back
            </button>
          ) : null}

          {isCourseStep || courseRefreshMode ? (
            <button
              className="onboarding-button"
              onClick={complete}
              disabled={saving}
            >
              {saving ? "Saving..." : courseRefreshMode ? "Save courses" : "Start"}
            </button>
          ) : (
            <button
              className="onboarding-button"
              onClick={() => setCurrentStep((step) => step + 1)}
              disabled={saving || (isTermsStep && !acceptedTerms)}
            >
              Continue
            </button>
          )}

          {error ? <p className="onboarding-error">{error}</p> : null}
        </div>
      </section>
    </main>
  );
}
