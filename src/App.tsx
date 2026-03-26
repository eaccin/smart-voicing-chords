import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AudioUnlockOverlay from "@/components/AudioUnlockOverlay";
import BottomNav from "@/components/BottomNav";
import Tutorial from "./pages/Tutorial.tsx";
import Index from "./pages/Index.tsx";
import Songs from "./pages/Songs.tsx";
import VoicingEngine from "./pages/VoicingEngine.tsx";
import PianoChords from "./pages/PianoChords.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AudioUnlockOverlay />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Tutorial />} />
          <Route path="/guitar" element={<Index />} />
          <Route path="/engine" element={<VoicingEngine />} />
          <Route path="/songs" element={<Songs />} />
          <Route path="/piano" element={<PianoChords />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
