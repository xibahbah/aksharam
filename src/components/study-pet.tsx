"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { publicAssetPath } from "@/lib/paths";
import { companionAnswer, companionScenes, type CompanionMood, type AnswerRun } from "@/lib/companion";
import durations from "../../public/companion/v3/timing.json";
export type PetReaction = "cheer" | "oops";
export function reactPet(reaction: PetReaction) {
  window.dispatchEvent(new CustomEvent("aksharam:pet", { detail: reaction }));
}
export function StudyPet() {
  const path = usePathname();
  const [mood, setMood] = useState<CompanionMood>("idle");
  const [message, setMessage] = useState("");
  const [quiet, setQuiet] = useState(false);
  const [gallery, setGallery] = useState(false);
  const [serial, setSerial] = useState(0);
  const run = useRef<AnswerRun>({ right: 0, wrong: 0 });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);
  const napping = useRef(false);
  const playRef = useRef<(m: CompanionMood, nap?: boolean) => void>(() => {});
  useEffect(() => {
    run.current = { right: 0, wrong: 0 };
  }, [path]);
  useEffect(() => {
    let pending: CompanionMood | null = null;
    const play = (next: CompanionMood, nap = false) => {
      if (busy.current) { if (!nap) pending = next; return; }
      if (timer.current) clearTimeout(timer.current);
      busy.current = true;
      setMood(next); setSerial(s => s + 1); setMessage(companionScenes[next].message);
      timer.current = setTimeout(() => {
        busy.current = false;
        if (nap) { napping.current = true; pending = null; setQuiet(true); }
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
  return <aside className={`study-pet ${quiet ? "pet-quiet" : ""}`} aria-label="Learning companion">
    {!quiet && <>
      {gallery && <div className="pet-gallery" role="group" aria-label="Preview companion reactions">
        {(Object.keys(companionScenes) as CompanionMood[]).map(scene => <button key={scene} onClick={() => {
          playRef.current(scene); setGallery(false);
        }}>{companionScenes[scene].label}</button>)}
      </div>}
      {message && <p className="pet-speech" role="status">{message}</p>}
      <button className="pet-character" aria-label="Say hello to your companion" onClick={() => playRef.current("wave")}>
        <picture><source media="(prefers-reduced-motion: reduce)" srcSet={publicAssetPath("/companion/v3/still.png")} />
          <img key={serial + mood} src={publicAssetPath(`/companion/v3/${mood}.gif`)} width="128" height="128" alt="" />
        </picture>
      </button>
      <button className="pet-toggle" aria-expanded={gallery} onClick={() => setGallery(!gallery)}>Try reactions</button>
    </>}
    <button className="pet-toggle" onClick={() => {
      setGallery(false);
      if (!quiet) {
        if (timer.current) clearTimeout(timer.current);
        busy.current = false;
        playRef.current("sleepy", true);
      } else { napping.current = false; setQuiet(false); playRef.current("wave"); }
    }}>{quiet ? "Show companion" : "Let her nap"}</button>
  </aside>;
}
