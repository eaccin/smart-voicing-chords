import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Volume2, RotateCcw, CheckCircle, XCircle, Guitar, Piano } from "lucide-react";
import { getAllChordsWithCustom } from "@/data/chords";
import { getAllPianoChords } from "@/data/pianoChords";
import type { PianoChord, PianoChordVoicing } from "@/data/pianoChords";
import ChordDiagram from "@/components/ChordDiagram";
import PianoDiagram from "@/components/PianoDiagram";
import { useChordPlayer } from "@/hooks/useChordPlayer";
import { usePianoPlayer } from "@/hooks/usePianoPlayer";

type Mode       = "visual" | "ear";
type Instrument = "guitar" | "piano";

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Fisher-Yates — uniform distribution, no bias
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestion(chords: ReturnType<typeof getAllChordsWithCustom>) {
  const correct    = getRandom(chords);
  const voicing    = getRandom(correct.voicings);
  const distractors = shuffle(chords.filter(c => c.label !== correct.label)).slice(0, 3);
  const options    = shuffle([correct, ...distractors]);
  return { correct, voicing, options };
}

function buildPianoQuestion(chords: PianoChord[]) {
  const correct     = getRandom(chords);
  const voicing     = getRandom(correct.voicings);
  const distractors = shuffle(chords.filter(c => c.label !== correct.label)).slice(0, 3);
  const options     = shuffle([correct, ...distractors]);
  return { correct, voicing, options };
}

export default function Quiz() {
  const [instrument, setInstrument] = useState<Instrument>("guitar");
  const [mode, setMode] = useState<Mode>("visual");

  const allGuitar = useMemo(() => getAllChordsWithCustom().filter(c => c.voicings.length > 0), []);
  const allPiano  = useMemo(() => getAllPianoChords().filter(c => c.voicings.length > 0), []);

  const { playChord: playGuitar } = useChordPlayer();
  const { playChord: playPiano  } = usePianoPlayer();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1 className="text-lg font-semibold tracking-tighter text-foreground mb-3">Chord Quiz</h1>

          {/* Instrument selector */}
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setInstrument("guitar")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-colors ${
                instrument === "guitar" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Guitar className="w-4 h-4" />
              Guitar
            </button>
            <button
              onClick={() => setInstrument("piano")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-colors ${
                instrument === "piano" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Piano className="w-4 h-4" />
              Piano
            </button>
          </div>

          {/* Mode selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode("visual")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-colors ${
                mode === "visual" ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye className="w-4 h-4" />
              Name the Chord
            </button>
            <button
              onClick={() => setMode("ear")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-colors ${
                mode === "ear" ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Volume2 className="w-4 h-4" />
              Ear Training
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {instrument === "guitar" ? (
            mode === "visual" ? (
              <motion.div key="guitar-visual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <VisualQuiz allChords={allGuitar} playChord={playGuitar} />
              </motion.div>
            ) : (
              <motion.div key="guitar-ear" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EarQuiz allChords={allGuitar} playChord={playGuitar} />
              </motion.div>
            )
          ) : (
            mode === "visual" ? (
              <motion.div key="piano-visual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PianoVisualQuiz allChords={allPiano} playChord={playPiano} />
              </motion.div>
            ) : (
              <motion.div key="piano-ear" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PianoEarQuiz allChords={allPiano} playChord={playPiano} />
              </motion.div>
            )
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ── Guitar Visual Quiz ─────────────────────────────────────────────────────────

function VisualQuiz({
  allChords,
  playChord,
}: {
  allChords: ReturnType<typeof getAllChordsWithCustom>;
  playChord: (v: any) => void;
}) {
  const [score,      setScore]    = useState({ correct: 0, total: 0 });
  const [answered,   setAnswered] = useState<string | null>(null);
  const [streak,     setStreak]   = useState(0);
  const [questionId, setQuestionId] = useState(0);

  const question = useMemo(
    () => buildQuestion(allChords),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allChords, questionId],
  );

  const handleAnswer = useCallback((label: string) => {
    if (answered) return;
    setAnswered(label);
    const isCorrect = label === question.correct.label;
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
    setStreak(s => isCorrect ? s + 1 : 0);
    if (isCorrect) playChord(question.voicing);
  }, [answered, question, playChord]);

  const next = useCallback(() => {
    setAnswered(null);
    setQuestionId(id => id + 1);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      <ScoreBar score={score} streak={streak} />

      <p className="text-sm text-muted-foreground">What chord is this?</p>

      <div className="w-[220px]">
        <ChordDiagram voicing={question.voicing} size="lg" />
      </div>

      <button
        onClick={() => playChord(question.voicing)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground text-sm transition-colors"
      >
        <Volume2 className="w-4 h-4" /> Hear it
      </button>

      <AnswerGrid options={question.options} answered={answered} correctLabel={question.correct.label} onAnswer={handleAnswer} />

      {answered && (
        <FeedbackRow
          isCorrect={answered === question.correct.label}
          correctLabel={question.correct.label}
          onNext={next}
        />
      )}
    </div>
  );
}

// ── Guitar Ear Quiz ────────────────────────────────────────────────────────────

function EarQuiz({
  allChords,
  playChord,
}: {
  allChords: ReturnType<typeof getAllChordsWithCustom>;
  playChord: (v: any) => void;
}) {
  const [score,      setScore]    = useState({ correct: 0, total: 0 });
  const [answered,   setAnswered] = useState<string | null>(null);
  const [streak,     setStreak]   = useState(0);
  const [hasPlayed,  setHasPlayed] = useState(false);
  const [questionId, setQuestionId] = useState(0);

  const question = useMemo(
    () => buildQuestion(allChords),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allChords, questionId],
  );

  useEffect(() => {
    setHasPlayed(false);
    const t = setTimeout(() => {
      playChord(question.voicing);
      setHasPlayed(true);
    }, 400);
    return () => clearTimeout(t);
  }, [question, playChord]);

  const handleAnswer = useCallback((label: string) => {
    if (answered || !hasPlayed) return;
    setAnswered(label);
    const isCorrect = label === question.correct.label;
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
    setStreak(s => isCorrect ? s + 1 : 0);
  }, [answered, hasPlayed, question]);

  const next = useCallback(() => {
    setAnswered(null);
    setQuestionId(id => id + 1);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      <ScoreBar score={score} streak={streak} />

      <p className="text-sm text-muted-foreground text-center">
        {hasPlayed ? "What chord did you hear?" : "Listen…"}
      </p>

      <button
        onClick={() => { playChord(question.voicing); setHasPlayed(true); }}
        className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
      >
        <Volume2 className="w-8 h-8" />
      </button>
      <p className="text-xs text-muted-foreground">Tap to replay</p>

      <AnswerGrid options={question.options} answered={answered} correctLabel={question.correct.label} onAnswer={handleAnswer} disabled={!hasPlayed} />

      {answered && (
        <>
          {answered !== question.correct.label && (
            <div className="w-[160px]">
              <ChordDiagram voicing={question.voicing} size="lg" />
            </div>
          )}
          <FeedbackRow
            isCorrect={answered === question.correct.label}
            correctLabel={question.correct.label}
            onNext={next}
          />
        </>
      )}
    </div>
  );
}

// ── Piano Visual Quiz ──────────────────────────────────────────────────────────

function PianoVisualQuiz({
  allChords,
  playChord,
}: {
  allChords: PianoChord[];
  playChord: (v: PianoChordVoicing) => void;
}) {
  const [score,      setScore]    = useState({ correct: 0, total: 0 });
  const [answered,   setAnswered] = useState<string | null>(null);
  const [streak,     setStreak]   = useState(0);
  const [questionId, setQuestionId] = useState(0);

  const question = useMemo(
    () => buildPianoQuestion(allChords),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allChords, questionId],
  );

  const handleAnswer = useCallback((label: string) => {
    if (answered) return;
    setAnswered(label);
    const isCorrect = label === question.correct.label;
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
    setStreak(s => isCorrect ? s + 1 : 0);
    if (isCorrect) playChord(question.voicing);
  }, [answered, question, playChord]);

  const next = useCallback(() => {
    setAnswered(null);
    setQuestionId(id => id + 1);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      <ScoreBar score={score} streak={streak} />

      <p className="text-sm text-muted-foreground">What chord is this?</p>

      <div className="w-full max-w-[300px]">
        <PianoDiagram voicing={question.voicing} size="lg" />
      </div>

      <button
        onClick={() => playChord(question.voicing)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground text-sm transition-colors"
      >
        <Volume2 className="w-4 h-4" /> Hear it
      </button>

      <AnswerGrid options={question.options} answered={answered} correctLabel={question.correct.label} onAnswer={handleAnswer} />

      {answered && (
        <FeedbackRow
          isCorrect={answered === question.correct.label}
          correctLabel={question.correct.label}
          onNext={next}
        />
      )}
    </div>
  );
}

// ── Piano Ear Quiz ─────────────────────────────────────────────────────────────

function PianoEarQuiz({
  allChords,
  playChord,
}: {
  allChords: PianoChord[];
  playChord: (v: PianoChordVoicing) => void;
}) {
  const [score,      setScore]    = useState({ correct: 0, total: 0 });
  const [answered,   setAnswered] = useState<string | null>(null);
  const [streak,     setStreak]   = useState(0);
  const [hasPlayed,  setHasPlayed] = useState(false);
  const [questionId, setQuestionId] = useState(0);

  const question = useMemo(
    () => buildPianoQuestion(allChords),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allChords, questionId],
  );

  useEffect(() => {
    setHasPlayed(false);
    const t = setTimeout(() => {
      playChord(question.voicing);
      setHasPlayed(true);
    }, 400);
    return () => clearTimeout(t);
  }, [question, playChord]);

  const handleAnswer = useCallback((label: string) => {
    if (answered || !hasPlayed) return;
    setAnswered(label);
    const isCorrect = label === question.correct.label;
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
    setStreak(s => isCorrect ? s + 1 : 0);
  }, [answered, hasPlayed, question]);

  const next = useCallback(() => {
    setAnswered(null);
    setQuestionId(id => id + 1);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      <ScoreBar score={score} streak={streak} />

      <p className="text-sm text-muted-foreground text-center">
        {hasPlayed ? "What chord did you hear?" : "Listen…"}
      </p>

      <button
        onClick={() => { playChord(question.voicing); setHasPlayed(true); }}
        className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
      >
        <Volume2 className="w-8 h-8" />
      </button>
      <p className="text-xs text-muted-foreground">Tap to replay</p>

      <AnswerGrid options={question.options} answered={answered} correctLabel={question.correct.label} onAnswer={handleAnswer} disabled={!hasPlayed} />

      {answered && (
        <>
          {answered !== question.correct.label && (
            <div className="w-full max-w-[260px]">
              <PianoDiagram voicing={question.voicing} size="lg" />
            </div>
          )}
          <FeedbackRow
            isCorrect={answered === question.correct.label}
            correctLabel={question.correct.label}
            onNext={next}
          />
        </>
      )}
    </div>
  );
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function AnswerGrid({
  options,
  answered,
  correctLabel,
  onAnswer,
  disabled = false,
}: {
  options: Array<{ label: string }>;
  answered: string | null;
  correctLabel: string;
  onAnswer: (label: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
      {options.map(opt => {
        const isChosen  = answered === opt.label;
        const isCorrect = opt.label === correctLabel;
        let style = "bg-secondary text-foreground hover:bg-surface-elevated";
        if (answered) {
          if (isCorrect)     style = "bg-green-500/20 text-green-400 ring-2 ring-green-500/50";
          else if (isChosen) style = "bg-red-500/20 text-red-400 ring-2 ring-red-500/50";
          else               style = "bg-secondary/40 text-muted-foreground";
        }
        return (
          <button
            key={opt.label}
            onClick={() => onAnswer(opt.label)}
            disabled={!!answered || disabled}
            className={`py-3 rounded-xl text-sm font-bold transition-all disabled:cursor-default ${
              disabled && !answered ? "opacity-40" : ""
            } ${style}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function FeedbackRow({
  isCorrect,
  correctLabel,
  onNext,
}: {
  isCorrect: boolean;
  correctLabel: string;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-3"
    >
      <div className="flex items-center gap-2">
        {isCorrect
          ? <><CheckCircle className="w-5 h-5 text-green-400" /><span className="text-sm font-semibold text-green-400">Correct!</span></>
          : <><XCircle className="w-5 h-5 text-red-400" /><span className="text-sm font-semibold text-red-400">It was {correctLabel}</span></>
        }
      </div>
      <button
        onClick={onNext}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
      >
        <RotateCcw className="w-4 h-4" /> Next
      </button>
    </motion.div>
  );
}

// ── Score bar ──────────────────────────────────────────────────────────────────

function ScoreBar({ score, streak }: { score: { correct: number; total: number }; streak: number }) {
  const pct = score.total === 0 ? 0 : Math.round((score.correct / score.total) * 100);
  return (
    <div className="w-full flex items-center justify-between bg-secondary/40 rounded-xl px-4 py-2">
      <div className="text-center">
        <p className="text-xs text-muted-foreground">Score</p>
        <p className="text-sm font-bold text-foreground">{score.correct}/{score.total}</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground">Accuracy</p>
        <p className="text-sm font-bold text-foreground">{pct}%</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground">Streak</p>
        <p className={`text-sm font-bold ${streak >= 3 ? "text-yellow-400" : "text-foreground"}`}>
          {streak >= 3 ? "🔥" : ""}{streak}
        </p>
      </div>
    </div>
  );
}
