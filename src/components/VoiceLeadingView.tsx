import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, RotateCcw } from "lucide-react";
import type { ChordVoicing } from "@/data/chords";
import { getAllChordsWithCustom, rootNotes } from "@/data/chords";
import { getLeftHanded } from "@/hooks/useLeftHanded";
import { useChordPlayer } from "@/hooks/useChordPlayer";

// ── Types ──────────────────────────────────────────────────────────────────────

type Quality = "stay" | "smooth" | "moderate" | "jump" | "appears" | "disappears" | "both-muted";

interface StringMove {
  string:    string;
  posA:      number;  // fret (-1 = muted)
  posB:      number;
  semitones: number | null;
  quality:   Quality;
}

const QUALITY_COLOR: Record<Quality, string> = {
  "stay":        "hsl(var(--primary))",
  "smooth":      "hsl(142 68% 45%)",
  "moderate":    "hsl(38 92% 50%)",
  "jump":        "hsl(0 76% 60%)",
  "appears":     "hsl(var(--accent))",
  "disappears":  "hsl(var(--muted-foreground))",
  "both-muted":  "transparent",
};

const QUALITY_LABEL: Record<Quality, string> = {
  "stay":        "common tone",
  "smooth":      "smooth",
  "moderate":    "moderate",
  "jump":        "jump",
  "appears":     "new note",
  "disappears":  "drops out",
  "both-muted":  "muted",
};

const STRING_NAMES = ["E", "A", "D", "G", "B", "e"];

function analyzeVoiceLeading(a: ChordVoicing, b: ChordVoicing): StringMove[] {
  return a.positions.map((posA, i) => {
    const posB = b.positions[i];
    if (posA === -1 && posB === -1) return { string: STRING_NAMES[i], posA, posB, semitones: null, quality: "both-muted" };
    if (posA === -1) return { string: STRING_NAMES[i], posA, posB, semitones: null, quality: "appears" };
    if (posB === -1) return { string: STRING_NAMES[i], posA, posB, semitones: null, quality: "disappears" };
    const semitones = posB - posA;
    const abs = Math.abs(semitones);
    const quality: Quality = abs === 0 ? "stay" : abs <= 2 ? "smooth" : abs <= 4 ? "moderate" : "jump";
    return { string: STRING_NAMES[i], posA, posB, semitones, quality };
  });
}

// ── Suffix list ────────────────────────────────────────────────────────────────

const VL_SUFFIXES = [
  { s: "major", l: "maj" }, { s: "minor", l: "min" },
  { s: "7",     l: "7"   }, { s: "m7",    l: "m7"  },
  { s: "maj7",  l: "maj7"}, { s: "sus4",  l: "sus4"},
  { s: "sus2",  l: "sus2"}, { s: "dim",   l: "dim" },
  { s: "aug",   l: "aug" }, { s: "m7b5",  l: "ø7"  },
];

// ── Main view ──────────────────────────────────────────────────────────────────

export default function VoiceLeadingView() {
  const allChords = useMemo(() => getAllChordsWithCustom(), []);
  const { playChord } = useChordPlayer();

  const [rootA, setRootA]   = useState("C");
  const [suffA, setSuffA]   = useState("major");
  const [vIdxA, setVIdxA]   = useState(0);
  const [rootB, setRootB]   = useState("A");
  const [suffB, setSuffB]   = useState("minor");
  const [vIdxB, setVIdxB]   = useState(0);

  const [editing, setEditing] = useState<"A" | "B" | null>("A");
  const [animKey, setAnimKey] = useState(0);
  const [animPhase, setAnimPhase] = useState<"idle" | "A" | "moving" | "B">("idle");

  const chordA = allChords.find(c => c.key === rootA && c.suffix === suffA);
  const chordB = allChords.find(c => c.key === rootB && c.suffix === suffB);
  const voicingA = chordA?.voicings[Math.min(vIdxA, (chordA?.voicings.length ?? 1) - 1)];
  const voicingB = chordB?.voicings[Math.min(vIdxB, (chordB?.voicings.length ?? 1) - 1)];

  const moves = useMemo(() => {
    if (!voicingA || !voicingB) return [];
    return analyzeVoiceLeading(voicingA, voicingB);
  }, [voicingA, voicingB]);

  const totalMovement = useMemo(
    () => moves.reduce((s, m) => s + Math.abs(m.semitones ?? 0), 0),
    [moves],
  );

  const smoothnessLabel = totalMovement === 0 ? "Perfect — no movement"
    : totalMovement <= 3 ? "Very smooth"
    : totalMovement <= 7 ? "Smooth"
    : totalMovement <= 12 ? "Moderate"
    : "Large movement";

  const smoothnessColor = totalMovement === 0 ? "text-primary"
    : totalMovement <= 7 ? "text-green-400"
    : totalMovement <= 12 ? "text-amber-400"
    : "text-red-400";

  function runAnimation() {
    if (!voicingA || !voicingB) return;
    setAnimKey(k => k + 1);
    setAnimPhase("A");
    playChord(voicingA);
    setTimeout(() => setAnimPhase("moving"), 400);
    setTimeout(() => { setAnimPhase("B"); playChord(voicingB); }, 1100);
    setTimeout(() => setAnimPhase("idle"), 1800);
  }

  function swap() {
    const [pA, pB] = [vIdxA, vIdxB];
    setRootA(rootB); setSuffA(suffB); setVIdxA(pB);
    setRootB(rootA); setSuffB(suffA); setVIdxB(pA);
  }

  const labelA = chordA?.label ?? `${rootA}${suffA}`;
  const labelB = chordB?.label ?? `${rootB}${suffB}`;

  return (
    <div className="flex flex-col gap-4">

      {/* Chord A / B selector badges */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setEditing(e => e === "A" ? null : "A")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            editing === "A" ? "bg-primary text-primary-foreground" : "bg-card border border-border/50 text-foreground hover:bg-surface-elevated"
          }`}
        >
          {labelA} <span className="text-xs font-normal opacity-60">v{vIdxA + 1}</span>
        </button>
        <button onClick={swap} title="Swap" className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => setEditing(e => e === "B" ? null : "B")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            editing === "B" ? "bg-accent text-accent-foreground" : "bg-card border border-border/50 text-foreground hover:bg-surface-elevated"
          }`}
        >
          {labelB} <span className="text-xs font-normal opacity-60">v{vIdxB + 1}</span>
        </button>
      </div>

      {/* Inline chord editor */}
      <AnimatePresence>
        {editing && (
          <motion.div key={editing} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <ChordEditorPanel
              label={editing === "A" ? "Chord A" : "Chord B"}
              isA={editing === "A"}
              root={editing === "A" ? rootA : rootB}
              suffix={editing === "A" ? suffA : suffB}
              voicingIdx={editing === "A" ? vIdxA : vIdxB}
              chord={editing === "A" ? chordA ?? null : chordB ?? null}
              onRootChange={r => { if (editing === "A") { setRootA(r); setVIdxA(0); } else { setRootB(r); setVIdxB(0); } }}
              onSuffixChange={s => { if (editing === "A") { setSuffA(s); setVIdxA(0); } else { setSuffB(s); setVIdxB(0); } }}
              onVoicingChange={i => editing === "A" ? setVIdxA(i) : setVIdxB(i)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visualization */}
      {voicingA && voicingB && (
        <>
          <VoiceLeadingDiagram
            key={animKey}
            voicingA={voicingA}
            voicingB={voicingB}
            moves={moves}
            animPhase={animPhase}
            labelA={labelA}
            labelB={labelB}
          />

          {/* Score */}
          <div className="flex items-center justify-between bg-secondary/40 rounded-xl px-4 py-2">
            <span className="text-xs text-muted-foreground">Voice leading quality</span>
            <span className={`text-xs font-bold ${smoothnessColor}`}>
              {smoothnessLabel} <span className="text-muted-foreground font-normal">({totalMovement} st total)</span>
            </span>
          </div>

          {/* Animate button */}
          <button
            onClick={runAnimation}
            disabled={animPhase !== "idle"}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {animPhase !== "idle"
              ? <><RotateCcw className="w-4 h-4 animate-spin" /> Playing…</>
              : <><Play className="w-4 h-4" /> Animate Transition</>
            }
          </button>

          {/* String analysis */}
          <div className="bg-card rounded-xl border border-border/40 overflow-hidden">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2 border-b border-border/30">
              Movement per string
            </p>
            {moves.map((m, i) =>
              m.quality === "both-muted" ? null : (
                <div key={i} className="flex items-center gap-2 px-4 py-2 border-b border-border/10 last:border-0">
                  <span className="text-xs font-mono font-bold text-muted-foreground w-4">{m.string}</span>
                  <span className="text-xs font-mono text-foreground w-5 text-right">
                    {m.posA === -1 ? "×" : m.posA === 0 ? "○" : m.posA}
                  </span>
                  <div className="flex-1 flex items-center gap-1">
                    <div className="flex-1 h-px rounded-full" style={{ backgroundColor: QUALITY_COLOR[m.quality], opacity: m.quality === "stay" ? 0.3 : 0.7 }} />
                    {m.semitones !== null && m.semitones !== 0 && (
                      <span className="text-[10px] font-mono font-bold" style={{ color: QUALITY_COLOR[m.quality] }}>
                        {m.semitones > 0 ? `+${m.semitones}` : m.semitones}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-foreground w-5">
                    {m.posB === -1 ? "×" : m.posB === 0 ? "○" : m.posB}
                  </span>
                  <span className="text-[10px] font-semibold w-20 text-right" style={{ color: QUALITY_COLOR[m.quality] }}>
                    {QUALITY_LABEL[m.quality]}
                  </span>
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Chord editor panel ─────────────────────────────────────────────────────────

function ChordEditorPanel({
  label, isA, root, suffix, voicingIdx, chord, onRootChange, onSuffixChange, onVoicingChange,
}: {
  label: string; isA: boolean;
  root: string; suffix: string; voicingIdx: number;
  chord: ReturnType<typeof getAllChordsWithCustom>[0] | null;
  onRootChange: (r: string) => void;
  onSuffixChange: (s: string) => void;
  onVoicingChange: (i: number) => void;
}) {
  const activeCls = isA
    ? "bg-primary text-primary-foreground"
    : "bg-accent text-accent-foreground";

  return (
    <div className="bg-card rounded-xl border border-border/40 p-3">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</p>

      {/* Root */}
      <div className="flex flex-wrap gap-1 mb-2">
        {rootNotes.map(r => (
          <button key={r} onClick={() => onRootChange(r)}
            className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-colors ${
              root === r ? activeCls : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >{r}</button>
        ))}
      </div>

      {/* Suffix */}
      <div className="flex flex-wrap gap-1 mb-3">
        {VL_SUFFIXES.map(({ s, l }) => (
          <button key={s} onClick={() => onSuffixChange(s)}
            className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-colors ${
              suffix === s ? activeCls : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >{l}</button>
        ))}
      </div>

      {/* Voicing thumbnails */}
      {chord && chord.voicings.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {chord.voicings.map((_, i) => (
            <button key={i} onClick={() => onVoicingChange(i)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex-shrink-0 transition-colors ${
                voicingIdx === i ? activeCls : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {chord.voicings[i].name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Voice leading diagram ──────────────────────────────────────────────────────

const DOT_R      = 13;
const N_STRINGS  = 6;
const N_FRETS    = 5;
const PAD        = 38;
const TOP_PAD    = 42;
const FRET_SP    = 46;
const STR_SP     = 34;

function VoiceLeadingDiagram({
  voicingA, voicingB, moves, animPhase, labelA, labelB,
}: {
  voicingA: ChordVoicing; voicingB: ChordVoicing;
  moves: StringMove[];
  animPhase: "idle" | "A" | "moving" | "B";
  labelA: string; labelB: string;
}) {
  const leftHanded = getLeftHanded();

  // Shared fret range
  const allPlayed = [...voicingA.positions, ...voicingB.positions].filter(p => p > 0);
  const minFret   = allPlayed.length > 0 ? Math.min(...allPlayed) : 1;
  const maxFret   = allPlayed.length > 0 ? Math.max(...allPlayed) : 5;
  const startFret = maxFret > N_FRETS ? Math.max(1, minFret - 1) : 1;
  const showNut   = startFret === 1;

  const svgW = PAD * 2 + (N_STRINGS - 1) * STR_SP;
  const svgH = TOP_PAD + N_FRETS * FRET_SP + 28;

  const sx  = (i: number) => PAD + i * STR_SP;
  const fy  = (f: number) => TOP_PAD + f * FRET_SP;

  // Y position for a fret value
  function noteY(pos: number): number {
    if (pos === 0) return fy(0) - 17;  // open = above nut
    const disp = pos - startFret + 1;
    return fy(Math.max(0, disp - 1)) + FRET_SP / 2;
  }

  // During animation, which set of dots to show
  const showA = animPhase === "idle" || animPhase === "A" || animPhase === "moving";
  const showB = animPhase === "idle" || animPhase === "B";

  // For the animated dots (moving phase): they interpolate A→B
  const isMoving = animPhase === "moving";

  return (
    <div className="bg-card rounded-xl border border-border/40 p-3">
      {/* Legend */}
      <div className="flex justify-center gap-4 mb-2">
        <div className="flex items-center gap-1.5">
          <svg width={14} height={14}><circle cx={7} cy={7} r={5} fill="none" stroke="hsl(var(--primary))" strokeWidth={2}/></svg>
          <span className="text-[10px] text-muted-foreground">{labelA}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width={14} height={14}><circle cx={7} cy={7} r={5} fill="hsl(var(--primary))"/></svg>
          <span className="text-[10px] text-muted-foreground">common</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width={14} height={14}><circle cx={7} cy={7} r={5} fill="hsl(var(--accent))"/></svg>
          <span className="text-[10px] text-muted-foreground">{labelB}</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="w-full max-w-[260px] mx-auto block"
        style={leftHanded ? { transform: "scaleX(-1)" } : undefined}
      >
        {/* Start fret label */}
        {!showNut && (
          <text x={PAD - 22} y={fy(0) + FRET_SP / 2 + 4} textAnchor="middle"
            className="fill-muted-foreground font-mono" fontSize={12}>{startFret}</text>
        )}

        {/* Nut / top line */}
        <line x1={PAD} y1={fy(0)} x2={PAD + (N_STRINGS - 1) * STR_SP} y2={fy(0)}
          stroke={showNut ? "hsl(var(--nut-color))" : "hsl(var(--fret-color))"}
          strokeWidth={showNut ? 5 : 2} strokeLinecap="round" />

        {/* Fret lines */}
        {Array.from({ length: N_FRETS }, (_, f) => (
          <line key={f} x1={PAD} y1={fy(f + 1)} x2={PAD + (N_STRINGS - 1) * STR_SP} y2={fy(f + 1)}
            stroke="hsl(var(--fret-color))" strokeWidth={1.5} />
        ))}

        {/* String lines */}
        {Array.from({ length: N_STRINGS }, (_, i) => (
          <line key={i} x1={sx(i)} y1={fy(0)} x2={sx(i)} y2={fy(N_FRETS)}
            stroke="hsl(var(--string-color))" strokeWidth={1.5} />
        ))}

        {/* Movement arrows — between chord A and chord B positions (static only) */}
        {animPhase === "idle" && moves.map((m, i) => {
          if (m.quality === "stay" || m.quality === "both-muted") return null;
          if (m.posA === -1 || m.posB === -1) return null;

          const x  = sx(i);
          const yA = noteY(m.posA);
          const yB = noteY(m.posB);
          const dir = yB > yA ? 1 : -1;
          const y1  = yA + dir * (DOT_R + 2);
          const y2  = yB - dir * (DOT_R + 2);
          if (Math.abs(y2 - y1) < 6) return null;

          const color = QUALITY_COLOR[m.quality];
          const arrowW = 5;

          return (
            <g key={i}>
              <motion.line x1={x} y1={y1} x2={x} y2={y2}
                stroke={color} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.75}
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
              />
              <motion.polygon
                points={`${x - arrowW},${y2 - dir * arrowW} ${x + arrowW},${y2 - dir * arrowW} ${x},${y2}`}
                fill={color} opacity={0.85}
                initial={{ opacity: 0 }} animate={{ opacity: 0.85 }}
                transition={{ delay: i * 0.06 + 0.35 }}
              />
            </g>
          );
        })}

        {/* Animated traveling dots (moving phase) */}
        {(animPhase === "A" || animPhase === "moving" || animPhase === "B") &&
          voicingA.positions.map((posA, i) => {
            const posB = voicingB.positions[i];
            if (posA === -1 && posB === -1) return null;
            const activePos = animPhase === "B" ? (posB === -1 ? posA : posB) : posA;
            const targetPos = isMoving ? (posB === -1 ? posA : posB) : activePos;
            if (activePos === -1) return null;

            const x   = sx(i);
            const yNow = noteY(activePos);
            const yTarget = noteY(targetPos);
            const color = isMoving ? QUALITY_COLOR[moves[i]?.quality ?? "smooth"] : "hsl(var(--primary))";
            const finalColor = animPhase === "B" ? "hsl(var(--accent))" : color;

            return (
              <motion.circle key={i} cx={x} r={DOT_R}
                fill={finalColor}
                animate={{ cy: isMoving ? yTarget : yNow }}
                initial={{ cy: yNow }}
                transition={{ duration: 0.65, delay: i * 0.07, ease: "easeInOut" }}
              />
            );
          })
        }

        {/* Static: chord A dots (hollow, primary border) */}
        {animPhase === "idle" && voicingA.positions.map((pos, i) => {
          if (pos === -1) {
            // Muted X
            const x = sx(i); const y = fy(0) - 17; const s = 5;
            return (
              <g key={`ax-${i}`}>
                <line x1={x - s} y1={y - s} x2={x + s} y2={y + s} stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeLinecap="round" />
                <line x1={x + s} y1={y - s} x2={x - s} y2={y + s} stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeLinecap="round" />
              </g>
            );
          }
          if (moves[i]?.quality === "stay") return null; // drawn as common tone below
          const x = sx(i);
          const y = noteY(pos);
          return (
            <motion.circle key={`a-${i}`} cx={x} cy={y} r={DOT_R}
              fill="none" stroke="hsl(var(--primary))" strokeWidth={2.5}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: i * 0.04 }}
            />
          );
        })}

        {/* Static: chord B dots (filled accent) */}
        {animPhase === "idle" && voicingB.positions.map((pos, i) => {
          if (pos === -1 || moves[i]?.quality === "stay") return null;
          const x = sx(i); const y = noteY(pos);
          return (
            <motion.circle key={`b-${i}`} cx={x} cy={y} r={DOT_R}
              fill="hsl(var(--accent))"
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: i * 0.04 + 0.25 }}
            />
          );
        })}

        {/* Common tones — glowing primary */}
        {animPhase === "idle" && moves.map((m, i) => {
          if (m.quality !== "stay" || m.posA === -1) return null;
          const x = sx(i); const y = noteY(m.posA);
          return (
            <motion.circle key={`ct-${i}`} cx={x} cy={y} r={DOT_R}
              fill="hsl(var(--primary))"
              style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.6))" }}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: i * 0.04 }}
            />
          );
        })}

        {/* String names */}
        {STRING_NAMES.map((name, i) => (
          <text key={i} x={sx(i)} y={fy(N_FRETS) + 20}
            textAnchor="middle" className="fill-muted-foreground font-mono" fontSize={10}>
            {name}
          </text>
        ))}
      </svg>
    </div>
  );
}
