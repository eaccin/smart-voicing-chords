import React, { createContext, useContext, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export interface TourStep {
  id: string;
  route: string;
  /** CSS selector for the element to spotlight. null = centered modal style. */
  target: string | null;
  title: string;
  description: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    route: "/",
    target: null,
    title: "Welcome to Smart Voicing 🎵",
    description:
      "Let's take a quick tour of everything this app can do. It'll only take a minute — or skip anytime!",
  },
  {
    id: "bottom-nav",
    route: "/",
    target: "#bottom-nav",
    title: "Navigation Bar",
    description:
      "This bar at the bottom lets you jump between all sections of the app. Swipe it sideways to reveal more tabs.",
  },
  {
    id: "guitar",
    route: "/guitar",
    target: "[data-tour='nav-guitar']",
    title: "🎸 Guitar Chord Library",
    description:
      "Browse all guitar chords by root note and type. Tap any chord to see diagrams and voicings, and press Play to hear how it sounds.",
  },
  {
    id: "piano",
    route: "/piano",
    target: "[data-tour='nav-piano']",
    title: "🎹 Piano Chords",
    description:
      "Same concept for piano — see which keys to press and switch between chord inversions (Root, 1st, 2nd).",
  },
  {
    id: "engine",
    route: "/engine",
    target: "[data-tour='nav-engine']",
    title: "⚡ Smart Voicing Engine",
    description:
      "Enter a chord progression and the engine finds voicings that minimize hand movement — for smooth, connected playing.",
  },
  {
    id: "progressions",
    route: "/progressions",
    target: "[data-tour='nav-progressions']",
    title: "🎼 Progressions",
    description:
      "Build and analyze chord progressions. Get substitution suggestions and see how chords relate in a key.",
  },
  {
    id: "songs",
    route: "/songs",
    target: "[data-tour='nav-songs']",
    title: "🎵 Songs",
    description:
      "Create songs with sections (Verse, Chorus, Bridge), set BPM and time signature, and build Real Book lead sheets.",
  },
  {
    id: "quiz",
    route: "/quiz",
    target: "[data-tour='nav-quiz']",
    title: "🧠 Chord Quiz",
    description:
      "Test your ear and chord knowledge with interactive quizzes. A great daily practice habit!",
  },
  {
    id: "scales",
    route: "/scales",
    target: "[data-tour='nav-scales']",
    title: "🎶 Scales",
    description:
      "Visualize scales across the guitar fretboard. Great for improvisation and understanding chord-scale relationships.",
  },
  {
    id: "done",
    route: "/guitar",
    target: null,
    title: "You're all set! 🎉",
    description:
      "That covers the main features. Start exploring — and tap the Guide tab anytime if you want to revisit this tour.",
  },
];

const STORAGE_KEY = "smart_voicing_tour_v1";

interface TourContextType {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  step: TourStep | null;
  completedStepIds: Set<string>;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
  resetTour: () => void;
}

const TourContext = createContext<TourContextType | null>(null);

export function useTour(): TourContextType {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used inside TourProvider");
  return ctx;
}

function loadCompletedSteps(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveCompletedSteps(ids: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedStepIds, setCompletedStepIds] = useState<Set<string>>(
    loadCompletedSteps
  );

  const step = TOUR_STEPS[currentStep] ?? null;

  const goToStep = useCallback(
    (index: number) => {
      const s = TOUR_STEPS[index];
      if (s) navigate(s.route);
    },
    [navigate]
  );

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
    goToStep(0);
  }, [goToStep]);

  const markCurrentComplete = useCallback(
    (stepIndex: number) => {
      const s = TOUR_STEPS[stepIndex];
      if (!s) return;
      setCompletedStepIds((prev) => {
        const next = new Set(prev);
        next.add(s.id);
        saveCompletedSteps(next);
        return next;
      });
    },
    []
  );

  const nextStep = useCallback(() => {
    markCurrentComplete(currentStep);
    const nextIndex = currentStep + 1;
    if (nextIndex >= TOUR_STEPS.length) {
      setIsActive(false);
      return;
    }
    setCurrentStep(nextIndex);
    goToStep(nextIndex);
  }, [currentStep, markCurrentComplete, goToStep]);

  const prevStep = useCallback(() => {
    const prevIndex = Math.max(0, currentStep - 1);
    setCurrentStep(prevIndex);
    goToStep(prevIndex);
  }, [currentStep, goToStep]);

  const endTour = useCallback(() => {
    markCurrentComplete(currentStep);
    setIsActive(false);
  }, [currentStep, markCurrentComplete]);

  const resetTour = useCallback(() => {
    setCompletedStepIds(new Set());
    saveCompletedSteps(new Set());
  }, []);

  return (
    <TourContext.Provider
      value={{
        isActive,
        currentStep,
        totalSteps: TOUR_STEPS.length,
        step,
        completedStepIds,
        startTour,
        nextStep,
        prevStep,
        endTour,
        resetTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}
