import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useTour } from "@/contexts/TourContext";

const SPOTLIGHT_PADDING = 10;
const TOOLTIP_WIDTH = 296;
const TOOLTIP_MARGIN = 12;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function useTargetRect(selector: string | null, currentStep: number): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }

    function measure() {
      const el = document.querySelector(selector as string);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setRect(null);
      }
    }

    // Give navigation + render time to settle
    const t1 = setTimeout(measure, 80);
    const t2 = setTimeout(measure, 300);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selector, currentStep]);

  return rect;
}

function getSpotlight(rect: Rect): Rect {
  return {
    top: rect.top - SPOTLIGHT_PADDING,
    left: rect.left - SPOTLIGHT_PADDING,
    width: rect.width + SPOTLIGHT_PADDING * 2,
    height: rect.height + SPOTLIGHT_PADDING * 2,
  };
}

function getTooltipStyle(
  spotlight: Rect | null
): React.CSSProperties {
  if (!spotlight) {
    // Centered on screen
    return {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: TOOLTIP_WIDTH,
    };
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Prefer below; fall back to above
  const spaceBelow = vh - (spotlight.top + spotlight.height);
  const spaceAbove = spotlight.top;
  const estimatedTooltipH = 190;

  let top: number;
  if (spaceBelow >= estimatedTooltipH + TOOLTIP_MARGIN) {
    top = spotlight.top + spotlight.height + TOOLTIP_MARGIN;
  } else if (spaceAbove >= estimatedTooltipH + TOOLTIP_MARGIN) {
    top = spotlight.top - estimatedTooltipH - TOOLTIP_MARGIN;
  } else {
    // Not enough space above or below — center vertically in the available gap
    top = spaceBelow > spaceAbove
      ? spotlight.top + spotlight.height + TOOLTIP_MARGIN
      : 12;
  }

  // Center horizontally on the spotlight, clamped to viewport edges
  let left = spotlight.left + spotlight.width / 2 - TOOLTIP_WIDTH / 2;
  left = Math.max(TOOLTIP_MARGIN, Math.min(left, vw - TOOLTIP_WIDTH - TOOLTIP_MARGIN));

  return { top, left, width: TOOLTIP_WIDTH, position: "fixed" as const };
}

export default function TourOverlay() {
  const { isActive, currentStep, totalSteps, step, nextStep, prevStep, endTour } =
    useTour();
  const tooltipRef = useRef<HTMLDivElement>(null);

  const targetRect = useTargetRect(step?.target ?? null, currentStep);
  const spotlight = targetRect ? getSpotlight(targetRect) : null;
  const tooltipStyle = getTooltipStyle(spotlight);

  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Build SVG mask hole path
  const maskHole = spotlight
    ? `M0 0 L${window.innerWidth} 0 L${window.innerWidth} ${window.innerHeight} L0 ${window.innerHeight} Z
       M${spotlight.left + 10} ${spotlight.top}
       Q${spotlight.left} ${spotlight.top} ${spotlight.left} ${spotlight.top + 10}
       L${spotlight.left} ${spotlight.top + spotlight.height - 10}
       Q${spotlight.left} ${spotlight.top + spotlight.height} ${spotlight.left + 10} ${spotlight.top + spotlight.height}
       L${spotlight.left + spotlight.width - 10} ${spotlight.top + spotlight.height}
       Q${spotlight.left + spotlight.width} ${spotlight.top + spotlight.height} ${spotlight.left + spotlight.width} ${spotlight.top + spotlight.height - 10}
       L${spotlight.left + spotlight.width} ${spotlight.top + 10}
       Q${spotlight.left + spotlight.width} ${spotlight.top} ${spotlight.left + spotlight.width - 10} ${spotlight.top}
       Z`
    : null;

  return (
    <AnimatePresence>
      {isActive && step && (
        <div className="fixed inset-0 z-[9990]" key={`tour-${currentStep}`}>
          {/* Clickable backdrop (dismiss) */}
          <div
            className="absolute inset-0 cursor-pointer"
            style={{ zIndex: 1 }}
            onClick={endTour}
          />

          {/* SVG overlay with cutout spotlight */}
          <motion.svg
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 2, width: "100%", height: "100%" }}
          >
            {maskHole ? (
              <path
                d={maskHole}
                fill="rgba(0,0,0,0.68)"
                fillRule="evenodd"
              />
            ) : (
              <rect width="100%" height="100%" fill="rgba(0,0,0,0.68)" />
            )}
          </motion.svg>

          {/* Spotlight highlight ring */}
          {spotlight && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute rounded-xl pointer-events-none"
              style={{
                zIndex: 3,
                top: spotlight.top,
                left: spotlight.left,
                width: spotlight.width,
                height: spotlight.height,
                boxShadow: "0 0 0 2px hsl(var(--primary)), 0 0 20px 2px hsl(var(--primary) / 0.35)",
              }}
            />
          )}

          {/* Tooltip card */}
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.22, delay: 0.05 }}
            className="absolute bg-card border border-border/80 rounded-2xl shadow-2xl p-4 pointer-events-auto"
            style={{ ...tooltipStyle, zIndex: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                Step {currentStep + 1} of {totalSteps}
              </span>
              <button
                onClick={endTour}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5 -mr-0.5 rounded"
                aria-label="Close tour"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1 bg-muted rounded-full mb-3 overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.35 }}
              />
            </div>

            {/* Content */}
            <h3 className="text-sm font-bold text-foreground mb-1 leading-snug">
              {step.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              {step.description}
            </p>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={prevStep}
                disabled={isFirst}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors py-1.5"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>

              <div className="flex items-center gap-2">
                {!isLast && (
                  <button
                    onClick={endTour}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 px-2"
                  >
                    Skip
                  </button>
                )}
                <button
                  onClick={nextStep}
                  className="flex items-center gap-1 px-4 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  {isLast ? "Finish 🎉" : "Next"}
                  {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
