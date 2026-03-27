import { Guitar, Piano, Zap, Music2, LayoutGrid, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Tutorial() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1 className="text-lg font-semibold tracking-tighter text-foreground">
            🎵 Welcome to Smart Voicing
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Intro */}
        <div className="p-4 bg-card rounded-2xl border border-border/50">
          <p className="text-sm text-foreground leading-relaxed">
            This app helps you find, learn, and organize guitar and piano chords.
            Build chord progressions, generate optimized voicing paths, create lead sheets,
            and view them in Real Book notation.
          </p>
        </div>

        {/* Sections */}
        <Section
          icon={<Guitar className="w-5 h-5 text-primary" />}
          title="Guitar Chord Library"
          description="Browse all guitar chords by root note and type. Tap any chord to see its voicings and diagrams. Press Play to hear how it sounds. You can also create custom voicings."
          action={() => navigate("/guitar")}
          actionLabel="Open Guitar Chords"
        />

        <Section
          icon={<Piano className="w-5 h-5 text-primary" />}
          title="Piano Chord Library"
          description="Same concept for piano. Browse chords and see which keys to press on the keyboard diagram. Switch between inversions (Root, 1st, 2nd) to explore different voicings."
          action={() => navigate("/piano")}
          actionLabel="Open Piano Chords"
        />

        <Section
          icon={<Zap className="w-5 h-5 text-accent" />}
          title="Smart Voicing Engine"
          description="Enter a chord progression (2+ chords) and the engine finds the best voicing path with minimal fret movement. Choose a key to see the harmonic field. Save results as songs."
          action={() => navigate("/engine")}
          actionLabel="Open Engine"
        />

        <Section
          icon={<Music2 className="w-5 h-5 text-primary" />}
          title="Songs & Sections"
          description="Create songs with sections (Verse, Chorus, Bridge…). Add chords to each section, set BPM and time signature. You can load saved progressions into any section."
        />

        <Section
          icon={<LayoutGrid className="w-5 h-5 text-primary" />}
          title="Lead Sheet Editor"
          description="Switch to Lead Sheet mode in the song editor. Tap beat dots to place chords in measures. Drag chords to reposition them. Duplicate entire progressions with one tap."
        />

        <Section
          icon={<BookOpen className="w-5 h-5 text-primary" />}
          title="Real Book View"
          description="View your lead sheet as professional staff notation with treble or bass clef. Set the song key. Press Play for synchronized playback with a visual cursor that follows each beat."
        />

        <div className="p-4 bg-secondary/30 rounded-2xl">
          <p className="text-xs text-muted-foreground text-center">
            Tip: Double-tap a chord in the picker to quickly insert it into a section.
          </p>
        </div>
      </main>
    </div>
  );
}

function Section({
  icon,
  title,
  description,
  action,
  actionLabel,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="p-4 bg-card rounded-2xl border border-border/50">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      {action && actionLabel && (
        <button
          onClick={action}
          className="mt-3 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
        >
          {actionLabel} →
        </button>
      )}
    </div>
  );
}
