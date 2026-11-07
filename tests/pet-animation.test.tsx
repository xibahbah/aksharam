import React from 'react';
import {act, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, expect, it, vi} from 'vitest';
import {PetAnimation} from '@/components/pet-animation';
import {StudyPet} from '@/components/study-pet';
const draw=vi.fn();
const clear=vi.fn();
function setup() {
 vi.useFakeTimers();
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({drawImage:draw,clearRect:clear} as unknown as CanvasRenderingContext2D);
 vi.stubGlobal('Image',class {
  onload: null|(()=>void)=null;
  onerror: null|(()=>void)=null;
  src='';
  constructor(){Promise.resolve().then(()=>this.onload?.());}
 });
}
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();draw.mockClear();clear.mockClear();});
it('preserves the same canvas through ten full nap/wake cycles',async()=>{
 setup();
 const {container}=render(<StudyPet/>);
 await act(async()=>{});
 const canvas=container.querySelector('canvas');
 for(let i=0;i<10;i++) {
  await act(async()=>{fireEvent.click(screen.getByText('Let her nap'));});
  fireEvent.click(screen.getByText('Settling down…')); // Disabled repeated click.
  await act(async()=>{vi.advanceTimersByTime(2200);});
  expect(screen.getByText('Wake her up')).toBeEnabled();
  await act(async()=>{vi.advanceTimersByTime(6500);});
  expect(draw.mock.lastCall?.[0].src).toContain('/sleep-v1/sleeping-');
  await act(async()=>{fireEvent.click(screen.getByText('Wake her up'));});
  fireEvent.click(screen.getByText('Waking up…'));
  await act(async()=>{vi.advanceTimersByTime(2000);});
  expect(screen.getByText('Let her nap')).toBeEnabled();
  expect(container.querySelector('canvas')).toBe(canvas);
  expect(draw.mock.lastCall?.[0].src).toContain('/v3/idle-');
 }
 // Every clear is paired with a draw in the same task, never a blank repaint.
 expect(clear).toHaveBeenCalledTimes(draw.mock.calls.length);
});
it('keeps the outgoing drawing while loading, and ignores superseded loads',async()=>{
 setup();
 const pending:Array<{onload:null|(()=>void);src:string}>=[];
 const ready=vi.fn();
 vi.stubGlobal('Image',class {
  onload:null|(()=>void)=null;onerror:null|(()=>void)=null;src='';
  constructor(){pending.push(this);}
 });
 const {rerender}=render(<PetAnimation mood="wave" serial={101} onReady={ready}/>);
 const old=[...pending];
 rerender(<PetAnimation mood="stretch" serial={102} onReady={ready}/>);
 await act(async()=>{old.forEach(image=>image.onload?.());});
 expect(draw).not.toHaveBeenCalled();
 expect(ready).not.toHaveBeenCalled();
 await act(async()=>{pending.filter(image=>!old.includes(image)).forEach(image=>image.onload?.());});
 expect(ready).toHaveBeenCalledExactlyOnceWith('stretch');
 const count=draw.mock.calls.length;
 rerender(<PetAnimation mood="thinking" serial={103} onReady={ready}/>);
 expect(draw).toHaveBeenCalledTimes(count);
 expect(clear).toHaveBeenCalledTimes(count);
});
