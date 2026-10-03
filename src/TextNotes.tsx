import { CHART_THEME } from './chartTheme';
import React, { useEffect, useRef, useState } from 'react';

export type BoardText = { id: string; text: string; x: number; y: number; width: number; fontSize: number };
export type Scene = { x: number; y: number; width: number; height: number };
export function screenPoint(svg: SVGSVGElement | null, x: number, y: number) {
  const matrix = svg?.getScreenCTM();
  return matrix ? new DOMPoint(x,y).matrixTransform(matrix.inverse()) : null;
}
export function wrapNote(text: string, width: number, fontSize: number) {
  const capacity = Math.max(1, Math.floor(width / (fontSize * .62)));
  return text.split('\n').flatMap(paragraph => {
    const lines: string[] = [];
    let remaining = paragraph;
    while (remaining.length > capacity) {
      const space = remaining.lastIndexOf(' ', capacity);
      const end = space > 0 ? space : capacity;
      lines.push(remaining.slice(0,end));
      remaining = remaining.slice(end + (space > 0 ? 1 : 0));
    }
    return [...lines,remaining];
  });
}
type Props = { note: BoardText; scene: Scene; svgRef: React.RefObject<SVGSVGElement | null>; selected: boolean; editing: boolean; presentation: boolean; onSelect: () => void; onEdit: () => void; onFinish: () => void; onChange: (note: BoardText) => void; onRemove: () => void };
export function TextNote({note,scene,svgRef,selected,editing,presentation,onSelect,onEdit,onFinish,onChange,onRemove}: Props) {
  const [draft,setDraft] = useState(note.text);
  const [preview,setPreview] = useState<BoardText | null>(null);
  const previewRef = useRef<BoardText | null>(null);
  const handled = useRef(false);
  const drag = useRef<{ start: DOMPoint; note: BoardText; resize: boolean; height: number; moved: boolean } | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if(editing) { setDraft(note.text); handled.current=false; textarea.current?.focus(); } }, [editing,note.text]);
  useEffect(() => {
    if(presentation)return;
    const move = (event: PointerEvent) => {
      const d = drag.current; const point = screenPoint(svgRef.current,event.clientX,event.clientY);
      if (!d || !point) return;
      const dx = point.x-d.start.x, dy = point.y-d.start.y;
      if (Math.hypot(dx,dy)>3) d.moved=true;
      if (!d.moved) return;
      if (d.resize) {
        const scale = Math.max(12/d.note.fontSize,Math.min(64/d.note.fontSize,1+(dx+dy)/(d.note.width+d.height)));
        previewRef.current = {...d.note,fontSize:d.note.fontSize*scale,width:Math.max(40,Math.min(1500,d.note.width*scale))};
      } else {
        previewRef.current = {...d.note,x:Math.max(0,Math.min(1,d.note.x+dx/scene.width)),y:Math.max(0,Math.min(1,d.note.y+dy/scene.height))};
      }
      setPreview(previewRef.current);
    };
    const up = () => { if(drag.current?.moved && previewRef.current) onChange(previewRef.current); drag.current=null;previewRef.current=null;setPreview(null); };
    const cancel = () => { drag.current=null;previewRef.current=null;setPreview(null); };
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',cancel);
    return () => {window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',cancel);};
  }, [scene,svgRef,onChange,presentation]);
  const value = preview ?? note;
  const width = Math.min(value.width,scene.width-20);
  const lines = wrapNote(editing ? draft : value.text,width,value.fontSize);
  const height = Math.max(value.fontSize*1.4,lines.length*value.fontSize*1.4);
  const x = scene.x+Math.min(value.x*scene.width,Math.max(8,scene.width-width-12));
  const y = scene.y+Math.min(value.y*scene.height,Math.max(8,scene.height-height-12));
  const handleY = Math.min(y+height,scene.y+scene.height-12);
  const startDrag = (event: React.PointerEvent<SVGElement>, resize: boolean) => {
    event.stopPropagation();if(presentation||editing||event.button!==0)return;
    const point = screenPoint(svgRef.current,event.clientX,event.clientY);if(!point)return;
    onSelect();event.currentTarget.setPointerCapture(event.pointerId);
    drag.current={start:point,note:{...note,x:(x-scene.x)/scene.width,y:(y-scene.y)/scene.height},resize,height:handleY-y,moved:false};
  };
  const finish = (cancel = false) => {
    if(handled.current)return;handled.current=true;
    if(cancel) { if(!note.text.trim())onRemove(); }
    else if(!draft.trim())onRemove();
    else if(draft!==note.text)onChange({...note,text:draft});
    onFinish();
  };
  return <g data-board-item="true" onClick={e=>e.stopPropagation()}>
    <g role={presentation?undefined:'button'} tabIndex={presentation?-1:0} aria-label={`Nota: ${note.text || 'Novo texto'}`} onPointerDown={e=>startDrag(e,false)} onDoubleClick={()=>{if(!presentation)onEdit();}} onKeyDown={e=>{if(presentation)return;if(e.key==='Enter'){e.preventDefault();onEdit();}if(e.key==='Delete'){e.stopPropagation();onRemove();}if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const step=e.shiftKey?20:5;onChange({...note,x:Math.max(0,Math.min(1,note.x+(e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0)/scene.width)),y:Math.max(0,Math.min(1,note.y+(e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0)/scene.height))});}}} style={{cursor:presentation?'default':'move'}}>
      <rect x={x-4} y={y-4} width={width+8} height={height+8} fill="transparent" />
      <text x={x} y={y} fill={CHART_THEME.text} fontSize={value.fontSize} fontFamily="Segoe UI, Arial, sans-serif" dominantBaseline="hanging" pointerEvents="none">{lines.map((line,i)=><tspan key={i} x={x} dy={i===0?0:value.fontSize*1.4}>{line||'\u00a0'}</tspan>)}</text>
    </g>
    {!presentation&&selected&&!editing&&<g data-editor="true">
      <rect x={x-5} y={y-5} width={width+10} height={height+10} rx="3" fill="none" stroke={CHART_THEME.gold} strokeWidth="1.5" strokeDasharray="4 3" pointerEvents="none"/>
      <g role="button" tabIndex={0} aria-label="Apagar nota" onPointerDown={e=>e.stopPropagation()} onClick={onRemove} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();onRemove();}}} style={{cursor:'pointer'}}><circle cx={x+width} cy={y-5} r="11" fill="#fffdf8" stroke="#b4473b"/><path d={`M ${x+width-4} ${y-9} l 8 8 M ${x+width+4} ${y-9} l -8 8`} stroke="#b4473b" strokeWidth="2"/></g>
      <rect role="button" tabIndex={0} aria-label="Redimensionar nota" x={x+width-6} y={handleY-6} width="12" height="12" rx="2" fill={CHART_THEME.gold} stroke={CHART_THEME.background} onPointerDown={e=>startDrag(e,true)} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();e.stopPropagation();const fontSize=Math.max(12,Math.min(64,note.fontSize+(e.key==='ArrowRight'?2:-2)));onChange({...note,fontSize,width:Math.max(40,Math.min(1500,note.width*fontSize/note.fontSize))});}}} style={{cursor:'nwse-resize'}}/>
    </g>}
    {!presentation&&editing&&<foreignObject data-editor="true" x={x-5} y={y-5} width={width+12} height={Math.max(40,Math.min(scene.height-(y-scene.y)-8,height+40))} onPointerDown={e=>e.stopPropagation()}>
      <textarea ref={textarea} className="note-editor" aria-label="Texto da nota" value={draft} maxLength={4000} style={{fontSize:value.fontSize,lineHeight:1.4}} onChange={e=>setDraft(e.target.value)} onBlur={()=>finish()} onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();finish(true);}if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();finish();}}}/>
    </foreignObject>}
  </g>;
}
