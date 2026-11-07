"use client";
import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import type { Letter } from "@/types";
import { publicAssetPath } from "@/lib/paths";
import { clipPath, speechText } from "@/lib/audio";

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
  function play() {
    setMessage("");
    if (src) {
      const audio = new Audio(publicAssetPath(src));
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
      utterance.rate = 0.75;
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
      play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- play once per mount
  }, [autoPlay, available]);
  if (!available) return null;
  return (
    <div className="audio-control">
      <button
        className="audio-button"
        disabled={playing}
        onClick={play}
        aria-label="Play pronunciation"
        title={
          clipPath(letter)
            ? "Computer voice; not yet checked by a native speaker"
            : letter.audioUrl
              ? "Recording"
              : "Browser Malayalam voice; quality may vary"
        }
      >
        <Volume2 size={19} />
        <span>{playing ? "Playing…" : "Listen"}</span>
      </button>
      {message && <span role="status">{message}</span>}
    </div>
  );
}
