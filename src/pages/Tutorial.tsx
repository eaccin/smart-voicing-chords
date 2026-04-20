import { Guitar, Piano, Zap, Music2, LayoutGrid, BookOpen, PlayCircle, RotateCcw, CheckCircle2, Waves, ListMusic, BrainCircuit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTour, TOUR_STEPS } from "@/contexts/TourContext";

const SECTION_ICONS: Record<string, React.ReactNode> = {
  welcome: <BookOpen className="w-4 h-4" />,
  "bottom-nav": <LayoutGrid className="w-4 h-4" />,
  guitar: <Guitar className="w-4 h-4" />,
  piano: <Piano className="w-4 h-4" />,
  engine: <Zap className="w-4 h-4 text-yellow-500" />,
  progressions: <ListMusic className="w-4 h-4" />,
  songs: <Music2 className="w-4 h-4" />,
  quiz: <BrainCircuit className="w-4 h-4" />,
  scales: <Waves className="w-4 h-4" />,
  done: <CheckCircle2 className="w-4 h-4 text-green-500" />,
};

export default function Tutorial() {
  const navigate = useNavigate();
  const { startTour, resetTour, completedStepIds } = useTour();

  const completedCount = completedStepIds.size;
  const totalSteps = TOUR_STEPS.length;
  const allDone = completedCount >= totalSteps;
  const hasStarted = completedCount > 0;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1 className="text-lg font-semibold tracking-tighter text-foreground">
            🎵 Smart Voicing — Guide
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-28 space-y-5">

        {/* Hero card */}
        <div className="p-5 bg-card rounded-2xl border border-border/50 space-y-4">
          <p className="text-sm text-foreground leading-relaxed">
            This app helps you find, learn, and organize guitar and piano chords.
            Build progressions, generate smooth voicing paths, create lead sheets,
            and view them in Real Book notation.
          </p>

          {/* Progress indicator */}
          {hasStarted && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Tour progress</span>
                <span className="text-xs text-muted-foreground">{completedCount}/{totalSteps} steps</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={startTour}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              <PlayCircle className="w-4 h-4" />
              {allDone ? "Restart Tour" : hasStarted ? "Continue Tour" : "Start Tour"}
            </button>
            {hasStarted && (
              <button
                onClick={() => { resetTour(); }}
                className="flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-xl border border-border/50 hover:border-border"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset progress
              </button>
            )}
          </div>
        </div>

        {/* Tour steps checklist */}
        <div className="space-y-1">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-2">
            Tour checklist
          </h2>
          {TOUR_STEPS.map((step) => {
            const done = completedStepIds.has(step.id);
            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                  done
                    ? "bg-primary/5 border-primary/20"
                    : "bg-card border-border/40"
                }`}
              >
                <div className={`flex-shrink-0 ${done ? "text-primary" : "text-muted-foreground"}`}>
                  {done
                    ? <CheckCircle2 className="w-4 h-4" />
                    : SECTION_ICONS[step.id] ?? <BookOpen className="w-4 h-4" />}
                </div>
                <span className={`text-sm flex-1 ${done ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Quick links */}
        <div className="space-y-1">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-2">
            Jump to a section
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <QuickLink icon={<Guitar className="w-4 h-4" />} label="Guitar Chords" onClick={() => navigate("/guitar")} />
            <QuickLink icon={<Piano className="w-4 h-4" />} label="Piano Chords" onClick={() => navigate("/piano")} />
            <QuickLink icon={<Zap className="w-4 h-4 text-yellow-500" />} label="Smart Engine" onClick={() => navigate("/engine")} />
            <QuickLink icon={<Music2 className="w-4 h-4" />} label="Songs" onClick={() => navigate("/songs")} />
            <QuickLink icon={<ListMusic className="w-4 h-4" />} label="Progressions" onClick={() => navigate("/progressions")} />
            <QuickLink icon={<BrainCircuit className="w-4 h-4" />} label="Chord Quiz" onClick={() => navigate("/quiz")} />
            <QuickLink icon={<Waves className="w-4 h-4" />} label="Scales" onClick={() => navigate("/scales")} />
            <QuickLink icon={<LayoutGrid className="w-4 h-4" />} label="CAGED System" onClick={() => navigate("/caged")} />
          </div>
        </div>

        <div className="p-4 bg-secondary/30 rounded-2xl">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            💡 Tip: Double-tap a chord in the picker to quickly insert it into a section.
          </p>
        </div>
      </main>
    </div>
  );
}

function QuickLink({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-3 bg-card border border-border/50 rounded-xl text-sm font-medium text-foreground hover:bg-accent/50 hover:border-border transition-colors text-left"
    >
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </button>
  );
}
