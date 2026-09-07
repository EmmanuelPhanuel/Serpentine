import { useCallback, useEffect, useState } from "react";
import { KEYS, highestLevelFromSaves, parseBests, parseDifficulty, readPreference, writePreference } from "../preferences";
import { isColorUnlocked, unlockedColor, type SnakeColor } from "../game/worlds";
import { setMuted } from "../game/audio";

export function usePreferences() {
  const [difficulty, setDifficulty] = useState(() => parseDifficulty(readPreference(KEYS.difficulty)));
  const [bests, setBests] = useState(() => parseBests(readPreference(KEYS.bests)));
  const [highestLevel, setHighestLevel] = useState(() => highestLevelFromSaves(readPreference(KEYS.highestLevel), bests));
  const [snakeColor, setSnakeColorState] = useState(() => unlockedColor(readPreference(KEYS.snakeColor), highestLevel));
  const [muted, setMutedState] = useState(() => readPreference(KEYS.muted) === "1");

  useEffect(() => { writePreference(KEYS.snakeColor, snakeColor); }, [snakeColor]);
  useEffect(() => { writePreference(KEYS.highestLevel, String(highestLevel)); }, [highestLevel]);
  useEffect(() => { writePreference(KEYS.bests, JSON.stringify(bests)); }, [bests]);
  useEffect(() => { writePreference(KEYS.difficulty, difficulty); }, [difficulty]);
  useEffect(() => {
    setMuted(muted);
    writePreference(KEYS.muted, muted ? "1" : "0");
  }, [muted]);

  const handleScore = useCallback((score: number) => {
    if (!Number.isSafeInteger(score) || score < 0) return;
    setBests(prev => score > prev[difficulty] ? { ...prev, [difficulty]: score } : prev);
  }, [difficulty]);

  const setSnakeColor = useCallback((color: SnakeColor) => {
    if (isColorUnlocked(color, highestLevel)) setSnakeColorState(color);
  }, [highestLevel]);

  const recordLevel = useCallback((level: number) => {
    if (Number.isSafeInteger(level) && level >= 1) setHighestLevel(previous => Math.max(previous, level));
  }, []);

  return { highestLevel, recordLevel, snakeColor, setSnakeColor, difficulty, setDifficulty, bests, muted, setMutedState, handleScore };
}
