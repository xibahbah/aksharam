"use client";
import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import type { Letter } from "@/types";
import { publicAssetPath } from "@/lib/paths";
import { clipPath, speechText } from "@/lib/audio";

/** A second tap within this window replays the sound slowly. */
export const SLOW_WINDOW_MS = 5000;
export const SLOW_RATE = 0.6;
const VOICE_RATE = 0.75; // browser voices sound rushed at 1×

/**
 * Plays, in order of preference: a generated clip, a native recording
 * (audioUrl), or a browser Malayalam voice. Renders nothing when none exist,
 * so learners are not shown a disabled control on every card.
 */
export function AudioButton({
  letter,
  autoPlay = false,
}: {
  letter: Letter;
  autoPlay?: boolean;
}) {
  const [voice, setVoice] = useState<SpeechSynthesisVoice>();
  const [message, setMessage] = useState("");
  const [playing, setPlaying] = useState(false);
  const [slow, setSlow] = useState(false);
  const lastTap = useRef<number | null>(null);
  const current = useRef<HTMLAudioElement | null>(null);
  const src = clipPath(letter) ?? letter.audioUrl;
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const update = () =>
      setVoice(
        window.speechSynthesis
          .getVoices()
          .find((v) => /^ml(?:-|_|$)/i.test(v.lang)),
      );
    update();
    window.speechSynthesis.addEventListener("voiceschanged", update);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", update);
      window.speechSynthesis.cancel();
    };
  }, []);
  const available = !!src || !!voice;
  function play(rate = 1) {
    setMessage("");
    setSlow(rate < 1);
    if (src) {
      current.current?.pause?.();
      const audio = new Audio(publicAssetPath(src));
      current.current = audio;
      audio.playbackRate = rate;
      audio.preservesPitch = true; // slower, not deeper
      setPlaying(true);
      audio.onended = () => setPlaying(false);
      audio.onerror = () => {
        setPlaying(false);
        setMessage("Recording could not be loaded.");
      };
      void audio.play()?.catch(() => {
        setPlaying(false);
        setMessage("Tap to play.");
      });
    } else if (voice) {
      const utterance = new SpeechSynthesisUtterance(speechText(letter));
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = VOICE_RATE * rate;
      utterance.onstart = () => setPlaying(true);
      utterance.onend = () => setPlaying(false);
      utterance.onerror = () => {
        setPlaying(false);
        setMessage("The Malayalam browser voice is unavailable.");
      };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }
  const played = useRef(false);
  useEffect(() => {
    // Listening questions play once on arrival; browsers may require a tap.
    if (autoPlay && available && !played.current) {
      played.current = true;
      lastTap.current = Date.now();
      play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- play once per mount
  }, [autoPlay, available]);
  if (!available) return null;
  return (
    <div className="audio-control">
      <button
        className="audio-button"
        onClick={() => {
          const now = Date.now();
          const again =
            lastTap.current !== null && now - lastTap.current < SLOW_WINDOW_MS;
          // Tap again soon after to hear it slowly; the next tap starts over.
          lastTap.current = again ? null : now;
          play(again ? SLOW_RATE : 1);
        }}
        aria-label="Play pronunciation"
        title={`${
          clipPath(letter)
            ? "Computer voice; not yet checked by a native speaker"
            : letter.audioUrl
              ? "Recording"
              : "Browser Malayalam voice; quality may vary"
        }. Tap again within 5 seconds to hear it slowly.`}
      >
        <Volume2 size={19} />
        <span>
          {playing ? (slow ? `Slow ${SLOW_RATE}×` : "Playing…") : "Listen"}
        </span>
      </button>
      {message && <span role="status">{message}</span>}
    </div>
  );
}
