import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AudioUnlockOverlay from "@/components/AudioUnlockOverlay";
import { initTheme } from "@/hooks/useTheme";
import BottomNav from "@/components/BottomNav";
import TourOverlay from "@/components/TourOverlay";
import { TourProvider } from "@/contexts/TourContext";
import Tutorial from "./pages/Tutorial.tsx";
import Index from "./pages/Index.tsx";
import Songs from "./pages/Songs.tsx";
import VoicingEngine from "./pages/VoicingEngine.tsx";
import PianoChords from "./pages/PianoChords.tsx";
import TabEditor from "./pages/TabEditor.tsx";
import Progressions from "./pages/Progressions.tsx";
import Quiz from "./pages/Quiz.tsx";
import Scales from "./pages/Scales.tsx";
import Caged from "./pages/Caged.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

initTheme();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AudioUnlockOverlay />
      <BrowserRouter basename="/smart-voicing-chords">
        <TourProvider>
        <TourOverlay />
        <Routes>
          <Route path="/" element={<Tutorial />} />
          <Route path="/guitar" element={<Index />} />
          <Route path="/engine" element={<VoicingEngine />} />
          <Route path="/songs" element={<Songs />} />
          <Route path="/piano" element={<PianoChords />} />
          <Route path="/tab" element={<TabEditor />} />
          <Route path="/progressions" element={<Progressions />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/scales" element={<Scales />} />
          <Route path="/caged" element={<Caged />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomNav />
        </TourProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
