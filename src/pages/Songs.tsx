import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Music2, Trash2, ChevronRight } from "lucide-react";
import type { Song } from "@/data/songs";
import { getSongs, deleteSong, createId } from "@/data/songs";
import SongEditor from "@/components/SongEditor";

export default function Songs() {
  const [songs, setSongs] = useState<Song[]>(() => getSongs());
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  const refresh = useCallback(() => setSongs(getSongs()), []);

  function handleNew() {
    const song: Song = {
      id: createId(),
      title: "",
      sections: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setEditingSong(song);
  }

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    deleteSong(id);
    refresh();
  }

  if (editingSong) {
    return (
      <SongEditor
        song={editingSong}
        onBack={() => { setEditingSong(null); refresh(); }}
        onSaved={refresh}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Music2 className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-semibold tracking-tighter text-foreground">My Songs</h1>
            <button
              onClick={handleNew}
              className="ml-auto p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 pb-24">
        {songs.length > 0 ? (
          <div className="space-y-2">
            {songs.map(song => (
              <motion.button
                key={song.id}
                layout
                onClick={() => setEditingSong(song)}
                className="w-full flex items-center gap-3 p-4 bg-card rounded-2xl text-left group hover:bg-surface-elevated transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Music2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {song.title || "Untitled Song"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {song.sections.length} section{song.sections.length !== 1 ? "s" : ""}
                    {song.artist ? ` · ${song.artist}` : ""}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(song.id, e)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Music2 className="w-8 h-8 text-primary" />
            </div>
            <p className="text-foreground font-semibold">No songs yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create a song to build chord progressions with sections
            </p>
            <button
              onClick={handleNew}
              className="mt-4 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
            >
              Create Your First Song
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
