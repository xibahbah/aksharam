import React from 'react';
import {renderToString} from 'react-dom/server';
import {render, screen} from '@testing-library/react';
import {expect, it, vi} from 'vitest';
import {Shell} from '@/components/shell';
const state=vi.hoisted(()=>({ready:false,path:'/'}));
vi.mock('next/navigation',()=>({usePathname:()=>state.path}));
vi.mock('@/hooks/use-progress',()=>({
 ProgressProvider:({children}:{children:React.ReactNode})=>children,
 useProgress:()=>({ready:state.ready,progress:{introduced:[]},error:'',dismissError:()=>{}}),
}));
vi.mock('@/components/study-pet',()=>({StudyPet:()=> <div>Companion</div>}));
it('server-renders an opaque entry screen instead of the workspace',()=>{
 state.ready=false;state.path='/';
 const html=renderToString(<Shell><div>Workspace content</div></Shell>);
 expect(html).toContain('Loading Aksharam');
 expect(html).toContain('background:#1a1a1a');
 expect(html).not.toContain('Workspace content');
 expect(html).not.toContain('Main navigation');
 expect(html).not.toContain('Companion');
});
it('reveals the selected home view only after progress hydration',()=>{
 state.ready=false;state.path='/';
 const {rerender}=render(<Shell><div role="dialog">Intro</div></Shell>);
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 state.ready=true;
 rerender(<Shell><div role="dialog">Intro</div></Shell>);
 expect(screen.getByRole('dialog')).toHaveTextContent('Intro');
 expect(screen.queryByRole('status',{name:'Loading Aksharam'})).not.toBeInTheDocument();
});
it('does not gate direct learning routes behind the landing screen',()=>{
 state.ready=false;state.path='/practice';
 render(<Shell><div>Practice</div></Shell>);
 expect(screen.queryByRole('status',{name:'Loading Aksharam'})).not.toBeInTheDocument();
 expect(screen.getByRole('navigation',{name:'Main navigation'})).toBeInTheDocument();
});
