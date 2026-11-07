"use client";
import { useEffect, useRef, useState } from "react";
import { publicAssetPath } from "@/lib/paths";
import durations from "../../public/companion/v2/timing.json";

export type PetReaction = "cheer" | "oops";
export function reactPet(reaction: PetReaction) {
  window.dispatchEvent(new CustomEvent("aksharam:pet", { detail: reaction }));
}
const lines = {
  cheer: ["Yes! A round of applause!", "That letter didn't stand a chance.", "Look at you go! One more?", "Correct! Take a tiny bow."],
  oops: ["Hmph! Tricky letter. Let's try again.", "A tiny dramatic pout… okay, we can do this!", "I'm cross with the letter, not you.", "Plot twist! Mistakes count as practice."],
  idle: ["One little letter at a time.", "I brought enthusiasm. You bring curiosity.", "My pigtails believe in you.", "A small break is allowed, you know."],
};
export function StudyPet() {
  const [mood, setMood] = useState<"idle" | PetReaction>("idle");
  const [message, setMessage] = useState("");
  const [quiet, setQuiet] = useState(false);
  const sequence = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);
  const napping = useRef(false);
  useEffect(() => {
    const react = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail !== "cheer" && detail !== "oops") return;
      // Finish the current gesture rather than snapping between reactions.
      if (busy.current || napping.current) return;
      busy.current = true;
      const reaction: PetReaction = detail;
      if (timer.current) clearTimeout(timer.current);
      setMood(reaction);
      setMessage(lines[reaction][sequence.current++ % lines[reaction].length]);
      timer.current = setTimeout(() => { busy.current = false; setMood("idle"); setMessage(""); }, durations[reaction]);
    };
    window.addEventListener("aksharam:pet", react);
    return () => { window.removeEventListener("aksharam:pet", react); if (timer.current) clearTimeout(timer.current); };
  }, []);
  return <aside className={`study-pet ${quiet ? "pet-quiet" : ""}`} aria-label="Learning companion">
    {!quiet && <>
      {message && <p className="pet-speech" role="status">{message}</p>}
      <button className="pet-character" aria-label="Say hello to your companion" onClick={() => {
        if (busy.current) return;
        if (timer.current) clearTimeout(timer.current);
        setMessage(lines.idle[sequence.current++ % lines.idle.length]);
        timer.current = setTimeout(() => setMessage(""), 4000);
      }}>
        <picture><source media="(prefers-reduced-motion: reduce)" srcSet={publicAssetPath("/companion/v2/still.png")} />
          {/* Native image preserves GIF animation and needs no image optimizer. */}
          <img key={mood} src={publicAssetPath(`/companion/v2/${mood}.gif`)} width="128" height="128" alt="" />
        </picture>
      </button>
    </>}
    <button className="pet-toggle" onClick={() => {
      if (timer.current) clearTimeout(timer.current);
      busy.current = false; napping.current = !quiet;
      setQuiet(!quiet); setMood("idle"); setMessage("");
    }}>{quiet ? "Show companion" : "Let her nap"}</button>
  </aside>;
}
