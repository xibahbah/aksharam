"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { PetAnimation, type AnimationMood } from "./pet-animation";
import { companionAnswer, companionScenes, type CompanionMood, type AnswerRun } from "@/lib/companion";
import durations from "../../public/companion/v3/timing.json";
import sleepDurations from "../../public/companion/sleep-v1/timing.json";
type SleepPhase = "awake" | "settling" | "sleeping" | "waking";
export type PetReaction = "cheer" | "oops";
export function reactPet(reaction: PetReaction) {
  window.dispatchEvent(new CustomEvent("aksharam:pet", { detail: reaction }));
}
export function StudyPet() {
  const path = usePathname();
  const [mood, setMood] = useState<CompanionMood>("idle");
  const [message, setMessage] = useState("");
  const [sleepPhase, setSleepPhase] = useState<SleepPhase>("awake");
  const quiet = sleepPhase !== "awake";
  const [gallery, setGallery] = useState(false);
  const [serial, setSerial] = useState(0);
  const run = useRef<AnswerRun>({ right: 0, wrong: 0 });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);
  const napping = useRef(false);
  const napRequested = useRef(false);
  const napRef = useRef<() => void>(() => {});
  const playRef = useRef<(m: CompanionMood) => void>(() => {});
  useEffect(() => {
    run.current = { right: 0, wrong: 0 };
  }, [path]);
  useEffect(() => {
    let pending: CompanionMood | null = null;
    const beginNap = () => {
      pending = null; napRequested.current = false;
      setMessage(""); setGallery(false); setSleepPhase("settling");
    };
    napRef.current = () => {
      napping.current = true;
      napRequested.current = true;
      pending = null;
      if (!busy.current) beginNap();
    };
    const play = (next: CompanionMood) => {
      if (napping.current) return;
      if (busy.current) { pending = next; return; }
      if (timer.current) clearTimeout(timer.current);
      busy.current = true;
      setMood(next); setSerial(s => s + 1); setMessage(companionScenes[next].message);
      timer.current = setTimeout(() => {
        busy.current = false;
        if (napRequested.current) { beginNap(); return; }
        if (pending && !napping.current) { const queued = pending; pending = null; play(queued); }
        else { setMood("idle"); setMessage(""); }
      }, next === "idle" ? 2200 : durations[next]);
    };
    playRef.current = play;
    const react = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail !== "cheer" && detail !== "oops") return;
      const result = companionAnswer(run.current, detail === "cheer");
      run.current = result.run;
      if (!napping.current) play(result.mood);
    };
    window.addEventListener("aksharam:pet", react);
    return () => {
      window.removeEventListener("aksharam:pet", react);
      if (timer.current) clearTimeout(timer.current);
      busy.current = false;
    };
  }, []);
  const wake = () => {
    if (sleepPhase !== "sleeping") return;
    setSleepPhase("waking");
  };
  // Start phase timers only once the new drawing is decoded and visible.
  const sleepReady = (renderedMood: AnimationMood) => {
    if (renderedMood !== sleepPhase) return;
    if (sleepPhase !== "settling" && sleepPhase !== "waking") return;
    if (timer.current) clearTimeout(timer.current);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timer.current = setTimeout(() => {
      if (sleepPhase === "settling") setSleepPhase("sleeping");
      else { napping.current = false; setMood("idle"); setMessage(""); setSerial(s => s + 1); setSleepPhase("awake"); }
    }, reduce ? 0 : sleepDurations[sleepPhase]);
  };
  return <aside className={`study-pet ${quiet ? "pet-quiet" : ""}`} aria-label="Learning companion">
    {!quiet && <>
      {gallery && <div className="pet-gallery" role="group" aria-label="Preview companion reactions">
        {(Object.keys(companionScenes) as CompanionMood[]).map(scene => <button key={scene} onClick={() => {
          playRef.current(scene); setGallery(false);
        }}>{companionScenes[scene].label}</button>)}
      </div>}
      {message && <p className="pet-speech" role="status">{message}</p>}
    </>}
      <button className="pet-character" aria-label={quiet ? "Wake companion" : "Say hello to your companion"}
        disabled={sleepPhase === "settling" || sleepPhase === "waking"}
        onClick={() => quiet ? wake() : playRef.current("wave")}>
        <PetAnimation mood={quiet ? sleepPhase : mood} serial={serial} onReady={sleepReady} />
      </button>
      <button className="pet-toggle" style={{ visibility: quiet ? "hidden" : "visible" }}
        disabled={quiet} aria-hidden={quiet} aria-expanded={gallery}
        onClick={() => setGallery(!gallery)}>Try reactions</button>
    <button className="pet-toggle" onClick={() => {
      setGallery(false);
      if (!quiet) napRef.current(); else wake();
    }} disabled={sleepPhase === "settling" || sleepPhase === "waking"}>
      {sleepPhase === "settling" ? "Settling down…" : sleepPhase === "waking" ? "Waking up…" : quiet ? "Wake her up" : "Let her nap"}
    </button>
  </aside>;
}
