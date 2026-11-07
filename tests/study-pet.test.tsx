/* eslint-disable @next/next/no-img-element -- Test double exposes explicit image-ready events. */
import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { StudyPet, reactPet } from "@/components/study-pet";
import { companionAnswer, type AnswerRun } from "@/lib/companion";
vi.mock('@/components/pet-animation',()=>({
 PetAnimation:({mood,onReady}:{mood:string;onReady:(mood:string)=>void}) =>
  <img alt="" src={`/${mood}.gif`} onLoad={()=>onReady(mood)}/>,
}));
afterEach(() => vi.useRealTimers());
it("finishes gestures, queues recovery without taking focus, and naps", async () => {
 vi.useFakeTimers();
 const {container}=render(<><button>Continue</button><StudyPet /></>);
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
 expect(screen.getByText("Settling down…")).toBeDisabled();
 act(()=>vi.advanceTimersByTime(10000));
 expect(screen.getByText("Settling down…")).toBeInTheDocument();
 await act(async()=>{fireEvent.load(container.querySelector('img[src$="/settling.gif"]')!);});
 act(()=>vi.advanceTimersByTime(2200));
 expect(container.querySelector('img[src$="/sleeping.gif"]')).toBeInTheDocument();
 act(()=>reactPet("cheer"));
 expect(screen.queryByRole("status")).not.toBeInTheDocument();
 fireEvent.click(screen.getByText("Wake her up"));
 expect(screen.getByText("Waking up…")).toBeDisabled();
 await act(async()=>{fireEvent.load(container.querySelector('img[src$="/waking.gif"]')!);});
 act(()=>vi.advanceTimersByTime(2000));
 expect(screen.getByText("Let her nap")).toBeEnabled();
 expect(container.querySelector('img[src$="/idle.gif"]')).toBeInTheDocument();
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
it("waits for an active reaction to finish before settling down",()=>{
 vi.useFakeTimers();
 render(<StudyPet/>);
 act(()=>reactPet('cheer'));
 fireEvent.click(screen.getByText('Let her nap'));
 expect(screen.queryByText('Settling down…')).not.toBeInTheDocument();
 act(()=>reactPet('oops'));
 act(()=>vi.advanceTimersByTime(2000));
 expect(screen.getByText('Settling down…')).toBeDisabled();
 expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
