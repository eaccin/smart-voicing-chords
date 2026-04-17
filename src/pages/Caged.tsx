import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import ChordDiagram from "@/components/ChordDiagram";
import CagedFretboard from "@/components/CagedFretboard";
import { useChordPlayer } from "@/hooks/useChordPlayer";
import {
  CAGED_ORDER,
  CAGED_SHAPES,
  PLAYABLE_ROOTS,
  buildCagedVoicing,
  barreFretForShape,
  cagedPositionsForKey,
  type CagedShape,
} from "@/lib/caged";

export default function Caged() {
  const [rootKey, setRootKey] = useState<string>("G");
  const [shape, setShape] = useState<CagedShape>("E");

  const { playChord } = useChordPlayer();

  const barreFret = useMemo(() => barreFretForShape(shape, rootKey), [shape, rootKey]);
  const voicing = useMemo(() => buildCagedVoicing(shape, barreFret), [shape, barreFret]);
  const shapeDef = CAGED_SHAPES[shape];

  // All 5 positions so we can show barre frets in the shape toggle
  const allPositions = useMemo(() => {
    const map = new Map<CagedShape, number>();
    cagedPositionsForKey(rootKey).forEach(p => map.set(p.shape, p.barreFret));
    return map;
  }, [rootKey]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border/50 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            CAGED System
          </p>

          {/* Key selector */}
          <div className="flex flex-wrap gap-1 mb-2">
            {PLAYABLE_ROOTS.map(k => (
              <button
                key={k}
                onClick={() => setRootKey(k)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  rootKey === k
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {k}
              </button>
            ))}
          </div>

          {/* Shape toggle */}
          <div className="flex gap-1">
            {CAGED_ORDER.map(s => {
              const fret = allPositions.get(s) ?? 0;
              const isActive = shape === s;
              return (
                <button
                  key={s}
                  onClick={() => setShape(s)}
                  className={`flex-1 flex flex-col items-center py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="text-sm font-extrabold font-mono leading-none">{s}</span>
                  <span className={`text-[9px] font-mono mt-0.5 leading-none ${
                    isActive ? "opacity-80" : "opacity-60"
                  }`}>
                    {fret === 0 ? "open" : `fr ${fret}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">

        {/* Intro card */}
        <div className="bg-secondary/40 rounded-2xl p-4 border border-border/30">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            What is CAGED?
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The CAGED system uses the shapes of the five open major chords —{" "}
            <span className="text-foreground font-semibold">C, A, G, E, D</span>{" "}
            — as movable templates. Barre any shape up the neck and it becomes a major chord in a new key.
            Together the five shapes cover the entire fretboard, helping you see chord tones, play arpeggios,
            and connect positions.
          </p>
        </div>

        {/* Title + play */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {rootKey} — {shape} shape
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {barreFret === 0 ? "Played in open position" : `Barre at fret ${barreFret}`}
            </p>
          </div>
          <button
            onClick={() => playChord(voicing)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-opacity hover:opacity-90"
          >
            <Play className="w-3.5 h-3.5" />
            Play
          </button>
        </div>

        {/* Full-neck CAGED fretboard */}
        <div className="bg-card rounded-2xl p-3 border border-border/40">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Neck Map
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {shape} shape highlighted
            </span>
          </div>
          <CagedFretboard
            chordKey={rootKey}
            voicing={voicing}
            barreFret={barreFret}
          />
        </div>

        {/* Close-up chord diagram */}
        <div className="bg-card rounded-2xl p-4 border border-border/40">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Chord Diagram
          </p>
          <div className="flex justify-center">
            <ChordDiagram voicing={voicing} size="lg" />
          </div>
        </div>

        {/* Shape info */}
        <div className="bg-card rounded-2xl p-4 border border-border/40 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Root Location
              </p>
              <p className="text-sm font-semibold text-foreground">{shapeDef.rootLocation}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Difficulty
              </p>
              <div className="flex gap-0.5 justify-end">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < shapeDef.difficulty ? "bg-primary" : "bg-secondary"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              About This Shape
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {shapeDef.description}
            </p>
          </div>
        </div>

        {/* Practice tips */}
        <div className="bg-secondary/40 rounded-2xl p-4 border border-border/30">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Practice Tips
          </p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li>• Memorize the <span className="text-foreground font-semibold">root dots</span> — they tell you which chord you're playing</li>
            <li>• Try all 5 shapes for the same chord — they're the <span className="text-foreground font-semibold">same notes</span> in different places</li>
            <li>• Connect neighbouring shapes: the last fret of one shape is the first fret of the next</li>
            <li>• Practise transitioning between C → A → G → E → D up the neck</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
