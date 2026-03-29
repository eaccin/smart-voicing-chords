import { useLocation, useNavigate } from "react-router-dom";
import { Guitar, Music2, Zap, Piano, BookOpen, TableProperties } from "lucide-react";

const tabs = [
  { path: "/", label: "Guide", icon: BookOpen },
  { path: "/guitar", label: "Guitar", icon: Guitar },
  { path: "/piano", label: "Piano", icon: Piano },
  { path: "/tab", label: "Tab", icon: TableProperties },
  { path: "/engine", label: "Engine", icon: Zap },
  { path: "/songs", label: "Songs", icon: Music2 },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isMainRoute = tabs.some(t => t.path === location.pathname);
  if (!isMainRoute) return null;

  return (
    <nav id="bottom-nav" className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border/50">
      <div className="max-w-lg mx-auto flex">
        {tabs.map(tab => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[11px] font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
