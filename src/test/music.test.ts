import { describe, expect, it } from "vitest";
import { getChordToneNames, getVoicingNoteNames, spellChordTones } from "@/lib/music";

describe("music spelling", () => {
  it("spells common flat and sharp chords correctly", () => {
    expect(getChordToneNames("Bb", "7")).toEqual(["Bb", "D", "F", "Ab"]);
    expect(getChordToneNames("C#", "major")).toEqual(["C#", "E#", "G#"]);
    expect(getChordToneNames("Eb", "minor")).toEqual(["Eb", "Gb", "Bb"]);
  });

  it("preserves chord function for edge-case roots", () => {
    expect(getChordToneNames("E", "major")).toEqual(["E", "G#", "B"]);
    expect(getChordToneNames("F#", "minor")).toEqual(["F#", "A", "C#"]);
    expect(getChordToneNames("B", "major")).toEqual(["B", "D#", "F#"]);
  });

  it("handles altered tensions with diatonic spelling", () => {
    expect(spellChordTones("B", ["1", "3", "5", "b7", "#9"])).toEqual(["B", "D#", "F#", "A", "C##"]);
  });

  it("maps voicing midi notes back to correctly spelled note names", () => {
    expect(getVoicingNoteNames("C#", "major", [61, 65, 68])).toEqual(["C#4", "E#4", "G#4"]);
    expect(getVoicingNoteNames("Bb", "minor", [58, 61, 65])).toEqual(["Bb3", "Db4", "F4"]);
  });
});