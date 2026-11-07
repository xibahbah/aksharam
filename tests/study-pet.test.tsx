import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { StudyPet, reactPet } from "@/components/study-pet";
import { companionAnswer, type AnswerRun } from "@/lib/companion";
afterEach(() => vi.useRealTimers());
it("finishes gestures, queues recovery without taking focus, and naps", () => {
 vi.useFakeTimers();
 render(<><button>Continue</button><StudyPet /></>);
 const next=screen.getByText("Continue");next.focus();
 act(()=>reactPet("oops"));
 expect(screen.getByRole("status")).toHaveTextContent("Tricky letter");
 expect(next).toHaveFocus();
 act(()=>reactPet("cheer"));
 expect(screen.getByRole("status")).toHaveTextContent("Tricky letter");
 act(()=>vi.advanceTimersByTime(2700));
 expect(screen.getByRole("status")).toHaveTextContent("That's how learning happens");
 act(()=>vi.advanceTimersByTime(2300));
 expect(screen.queryByRole("status")).not.toBeInTheDocument();
 fireEvent.click(screen.getByText("Let her nap"));
 act(()=>vi.advanceTimersByTime(2300));
 act(()=>reactPet("cheer"));
 expect(screen.queryByRole("status")).not.toBeInTheDocument();
 fireEvent.click(screen.getByText("Show companion"));
 expect(screen.getByRole("status")).toHaveTextContent("Hello");
});
it("distinguishes right/wrong streaks and recovery in actual answer order",()=>{
 let run:AnswerRun={right:0,wrong:0};
 const moods=[true,true,true,false,false,false,true].map(correct=>{
  const result=companionAnswer(run,correct);run=result.run;return result.mood;
 });
 expect(moods).toEqual(['cheer','cheer','proud','surprised','puzzled','determined','relieved']);
});
it("exposes all twelve reaction previews without changing answer history",()=>{
 render(<StudyPet/>);fireEvent.click(screen.getByText('Try reactions'));
 expect(screen.getByRole('group',{name:'Preview companion reactions'}).querySelectorAll('button')).toHaveLength(12);
 fireEvent.click(screen.getByText('Thinking'));
 expect(screen.getByRole('status')).toHaveTextContent('curve');
});
it("keeps the old drawing until the next GIF decodes, without remounting it", async () => {
 const {container}=render(<StudyPet/>);
 const image=(name:string)=>container.querySelector<HTMLImageElement>(`img[src$="/${name}"]`)!;
 const idle=image('idle.gif');
 await act(async()=>{fireEvent.load(idle);});
 expect(idle.parentElement).toHaveStyle({visibility:'visible'});
 act(()=>reactPet('oops'));
 const incoming=image('oops.gif');
 let finish!:()=>void;
 incoming.decode=()=>new Promise<void>(resolve=>{finish=resolve;});
 await act(async()=>{fireEvent.load(incoming);});
 expect(idle.isConnected).toBe(true);
 expect(idle.parentElement).toHaveStyle({visibility:'visible'});
 expect(incoming.parentElement).toHaveStyle({visibility:'hidden'});
 await act(async()=>finish());
 expect(image('oops.gif')).toBe(incoming);
 expect(incoming.parentElement).toHaveStyle({visibility:'visible'});
 expect(idle.isConnected).toBe(false);
});
it("retains the current drawing when an incoming image fails", async()=>{
 const {container}=render(<StudyPet/>);
 const idle=container.querySelector<HTMLImageElement>('img[src$="/idle.gif"]')!;
 await act(async()=>{fireEvent.load(idle);});
 act(()=>reactPet('oops'));
 const incoming=container.querySelector<HTMLImageElement>('img[src$="/oops.gif"]')!;
 incoming.decode=()=>Promise.reject(new Error('decode failed'));
 await act(async()=>{fireEvent.load(incoming);});
 expect(idle.parentElement).toHaveStyle({visibility:'visible'});
 expect(incoming.parentElement).toHaveStyle({visibility:'hidden'});
});
