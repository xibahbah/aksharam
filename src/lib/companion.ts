export type CompanionMood = "idle" | "cheer" | "oops" | "wave" | "sleepy" | "proud" | "determined" | "relieved" | "surprised" | "thinking" | "puzzled" | "stretch";
export type AnswerRun = { right: number; wrong: number };
export function companionAnswer(run: AnswerRun, correct: boolean): { run: AnswerRun; mood: CompanionMood } {
  if (correct) return { run: { right: run.right + 1, wrong: 0 }, mood: run.wrong > 0 ? "relieved" : run.right >= 2 ? "proud" : "cheer" };
  return { run: { right: 0, wrong: run.wrong + 1 }, mood: run.wrong >= 2 ? "determined" : run.wrong === 1 ? "puzzled" : run.right > 0 ? "surprised" : "oops" };
}
export const companionScenes: Record<CompanionMood, { label: string; message: string }> = {
  idle: { label: "Quiet blink", message: "One little letter at a time." },
  cheer: { label: "Correct answer", message: "Yes! A round of applause!" },
  oops: { label: "Wrong answer", message: "Hmph! Tricky letter. Let's try again." },
  proud: { label: "3+ correct in a row", message: "Three or more in a row! Look at you go." },
  puzzled: { label: "Two mistakes", message: "These letters are sneaky. Let's look again." },
  determined: { label: "3+ mistakes", message: "We can figure this out. Take your time." },
  relieved: { label: "Wrong → right", message: "There it is! That's how learning happens." },
  surprised: { label: "Right → wrong", message: "Plot twist! One miss doesn't undo your progress." },
  wave: { label: "Hello", message: "Hello, letter explorer!" },
  thinking: { label: "Thinking", message: "Hmm… let's look at that curve." },
  sleepy: { label: "Sleepy", message: "A little rest is allowed, you know." },
  stretch: { label: "Stretch break", message: "Uncurl those shoulders. Tiny stretch?" },
};
