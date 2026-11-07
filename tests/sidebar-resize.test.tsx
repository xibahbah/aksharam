import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { SidebarResize } from '@/components/sidebar-resize';

it('resizes with the keyboard, remembers the width, and resets', () => {
 const {container}=render(<div className="app-shell"><SidebarResize/></div>);
 const handle=screen.getByRole('separator');
 fireEvent.keyDown(handle,{key:'ArrowRight'});
 expect(handle).toHaveAttribute('aria-valuenow','220');
 expect(container.firstChild).toHaveStyle('--sidebar-width: 220px');
 expect(localStorage.getItem('aksharam.sidebar-width')).toBe('220');
 fireEvent.doubleClick(handle);
 expect(handle).toHaveAttribute('aria-valuenow','208');
 fireEvent.keyDown(handle,{key:'ArrowLeft'});
 expect(handle).toHaveAttribute('aria-valuenow','208');
});
it('restores a saved width and clamps a pointer drag',()=>{
 localStorage.setItem('aksharam.sidebar-width','240');
 render(<div className="app-shell"><SidebarResize/></div>);
 const handle=screen.getByRole('separator');
 expect(handle).toHaveAttribute('aria-valuenow','240');
 vi.stubGlobal('PointerEvent',MouseEvent);
 handle.setPointerCapture=vi.fn();
 handle.releasePointerCapture=vi.fn();
 fireEvent.pointerDown(handle,{button:0,clientX:240});
 fireEvent.pointerMove(handle,{clientX:280});
 expect(handle).toHaveAttribute('aria-valuenow','280');
 fireEvent.pointerMove(handle,{clientX:2000});
 expect(handle).toHaveAttribute('aria-valuenow','320');
 fireEvent.pointerUp(handle);
 expect(localStorage.getItem('aksharam.sidebar-width')).toBe('320');
 expect(handle).not.toHaveAttribute('data-dragging');
 vi.unstubAllGlobals();
});
