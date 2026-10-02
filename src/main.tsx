import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { layoutLabels } from './labelLayout.js';
const ELEMENT_COLORS = ['#b85e43', '#57745c', '#a27b2f', '#477f9b'];

const PLANETS = [ ['sun','☉','Sol'], ['moon','☽','Lua'], ['mercury','☿','Mercúrio'], ['venus','♀','Vênus'], ['mars','♂','Marte'], ['jupiter','♃','Júpiter'], ['saturn','♄','Saturno'], ['uranus','♅','Urano'], ['neptune','♆','Netuno'], ['pluto','⯓','Plutão'] ] as const;
const SIGNS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const SIGN_NAMES = ['Áries','Touro','Gêmeos','Câncer','Leão','Virgem','Libra','Escorpião','Sagitário','Capricórnio','Aquário','Peixes'];
const STYLES = { neutral: { name: 'Linha simples', color: '#536778', dash: '' }, conjunction: { name: 'Conjunção', color: '#7654a0', dash: '' }, sextile: { name: 'Sextil', color: '#247e70', dash: '7 5' }, square: { name: 'Quadratura', color: '#be4846', dash: '' }, trine: { name: 'Trígono', color: '#316faf', dash: '' }, opposition: { name: 'Oposição', color: '#be4846', dash: '10 5' } };
type Model = 'empty' | 'four' | 'twelve' | 'biwheel';
type Ring = 'base' | 'transit';
type AspectStyle = keyof typeof STYLES;
type Planet = { id: string; kind: string; angle: number; ring: Ring };
type Aspect = { id: string; from: string; to: string; style: AspectStyle };
type Board = { version: 1; model: Model; rotation: number; centerRadius: number; planets: Planet[]; aspects: Aspect[]; visible: { signs: boolean; houses: boolean; numbers: boolean; planets: boolean; aspects: boolean; degrees: boolean; center: boolean; planetDegrees: boolean } };
const fresh = (): Board => ({ version: 1, model: 'empty', rotation: 0, centerRadius: 100, planets: [], aspects: [], visible: { signs: false, houses: false, numbers: false, planets: true, aspects: true, degrees: false, center: true, planetDegrees: true } });
// Keep the original key so renaming the app preserves existing browser sessions.
const KEY = 'astroativo.session.v1';
const norm = (n: number) => ((n % 360) + 360) % 360;
const polar = (a: number, r: number) => ({ x: 400 + Math.cos((a - 90) * Math.PI / 180) * r, y: 400 + Math.sin((a - 90) * Math.PI / 180) * r });
const info = (kind: string) => PLANETS.find(p => p[0] === kind)!;
const degreeLabel = (angle: number) => `${(Math.floor(norm(angle) % 30 * 1000) / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 3 })}°`;
function validate(value: unknown): Board {
  const d = value as Board;
  if (!d || d.version !== 1 || !['empty','four','twelve','biwheel'].includes(d.model) || !Number.isFinite(d.rotation) || !Array.isArray(d.planets) || !Array.isArray(d.aspects) || !d.visible) throw Error('Formato de aula inválido.');
  if (d.centerRadius !== undefined && (!Number.isFinite(d.centerRadius) || d.centerRadius < 40 || d.centerRadius > 140)) throw Error('Tamanho do centro inválido.');
  if (d.planets.length > 200 || d.aspects.length > 1000 || Object.keys(fresh().visible).some(k => !(['center', 'planetDegrees'].includes(k) && d.visible[k as keyof Board['visible']] === undefined) && typeof d.visible[k as keyof Board['visible']] !== 'boolean')) throw Error('Arquivo de aula inválido.');
  const ids = new Set<string>();
  for (const p of d.planets) { if (!p || typeof p.id !== 'string' || ids.has(p.id) || !PLANETS.some(v => v[0] === p.kind) || !Number.isFinite(p.angle) || !['base','transit'].includes(p.ring)) throw Error('Planeta inválido.'); ids.add(p.id); }
  const aspectIds = new Set<string>();
  for (const a of d.aspects) { if (!a || typeof a.id !== 'string' || aspectIds.has(a.id) || !ids.has(a.from) || !ids.has(a.to) || a.from === a.to || !Object.hasOwn(STYLES,a.style)) throw Error('Aspecto inválido.'); aspectIds.add(a.id); }
  return { ...d, centerRadius: d.centerRadius ?? 100, visible: { ...fresh().visible, ...d.visible }, rotation: norm(d.rotation), planets: d.planets.map(p => ({...p, angle: norm(p.angle)})) };
}
function initial() { try { const raw = localStorage.getItem(KEY); return raw ? validate(JSON.parse(raw)) : fresh(); } catch { return fresh(); } }
function download(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
type Drag = { kind: string; id?: string; startX: number; startY: number; moved: boolean; angle?: number; ring: Ring };

function PlutoGlyph({ x = 0, y = 0, color = 'currentColor' }: { x?: number; y?: number; color?: string }) {
  return <g transform={`translate(${x} ${y})`} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="0" cy="-13" r="5"/><path d="M -10 -9 Q -10 3 0 3 Q 10 3 10 -9 M 0 3 V 18 M -7 11 H 7"/>
  </g>;
}

function AngleEditor({ angle, label, onApply }: { angle: number; label: string; onApply: (angle: number) => void }) {
  const [sign, setSign] = useState(Math.floor(norm(angle) / 30));
  const [degrees, setDegrees] = useState(String(Math.floor(norm(angle) % 30 * 1000) / 1000));
  const [error, setError] = useState('');
  return <form className="angle-editor" aria-label={label} onSubmit={e => {
    e.preventDefault();
    const value = Number(degrees.trim().replace(',', '.'));
    if (!degrees.trim() || !Number.isFinite(value) || value < 0 || value >= 30) { setError('Use um grau de 0 até menos de 30.'); return; }
    setError(''); onApply(sign * 30 + value);
  }}>
    <label>Signo<select value={sign} onChange={e => setSign(Number(e.target.value))}>{SIGN_NAMES.map((name, i) => <option key={name} value={i}>{name}</option>)}</select></label>
    <label>Graus<input type="text" inputMode="decimal" value={degrees} aria-invalid={!!error} onChange={e => { setDegrees(e.target.value); setError(''); }}/></label>
    <button type="submit">Aplicar</button>
    {error && <span className="field-error" role="alert">{error}</span>}
  </form>;
}

function TopBar({children}: {children: React.ReactNode}) { return <header className="topbar">{children}</header>; }
function ToolSidebar({tab,onTab,children}: {tab:'build'|'display';onTab:(tab:'build'|'display')=>void;children:React.ReactNode}) {
  return <aside className="sidebar"><div className="sidebar-tabs" role="tablist" aria-label="Ferramentas"><button id="build-tab" role="tab" aria-selected={tab==='build'} aria-controls="build-panel" onClick={()=>onTab('build')}>Construir</button><button id="display-tab" role="tab" aria-selected={tab==='display'} aria-controls="display-panel" onClick={()=>onTab('display')}>Exibição</button></div><div className="sidebar-body">{children}</div></aside>;
}
function MapTools({mode,style,onStyle,onMove,onAspect}: {mode:'move'|'aspect';style:AspectStyle;onStyle:(style:AspectStyle)=>void;onMove:()=>void;onAspect:()=>void}) {
  return <div className="map-tools"><div className="mode-switch"><button aria-pressed={mode==='move'} className={mode==='move'?'active':''} onClick={onMove}>↔ Mover planetas</button><button aria-pressed={mode==='aspect'} className={mode==='aspect'?'active':''} onClick={onAspect}>⚯ Ligar planetas</button></div><label className="aspect-select">Aspecto<select disabled={mode!=='aspect'} value={style} onChange={e=>onStyle(e.target.value as AspectStyle)}>{Object.entries(STYLES).map(([key,value])=><option key={key} value={key}>{value.name}</option>)}</select></label></div>;
}
function MandalaCanvas({size,children}: {size:number;children:React.ReactNode}) {return <div className="canvas-size" style={{width:size,height:size}}>{children}</div>;}
function StatusBar({text,cancel,onCancel}: {text:string;cancel:boolean;onCancel:()=>void}) {return <div className="status-bar" role="status"><span className="status-dot"/><span>{text}</span>{cancel&&<button onClick={onCancel}>Cancelar</button>}</div>;}

function App() {
  const [board,setBoard] = useState<Board>(initial);
  const [past,setPast] = useState<Board[]>([]); const [future,setFuture] = useState<Board[]>([]);
  const [pending,setPending] = useState<string | null>(null);
  const [selected,setSelected] = useState<string | null>(null);
  const [mode,setMode] = useState<'move'|'aspect'>('move');
  const [first,setFirst] = useState<string | null>(null);
  const [style,setStyle] = useState<AspectStyle>('neutral');
  const [ring,setRing] = useState<Ring>('base');
  const [preview,setPreview] = useState<{ kind: string; angle: number; ring: Ring; id?: string } | null>(null);
  const [zoom,setZoom] = useState(1); const [presentation,setPresentation] = useState(false);
  const [tab,setTab] = useState<'build'|'display'>('build');
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasExtent,setCanvasExtent] = useState(0);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const observer = new ResizeObserver(([entry]) => setCanvasExtent(Math.max(0, Math.min(entry.contentRect.width, entry.contentRect.height) - 4)));
    observer.observe(canvas); return () => observer.disconnect();
  }, []);
  useEffect(() => { if (zoom === 1 || presentation) canvasRef.current?.scrollTo(0,0); }, [zoom,presentation]);
  const [centerDraft,setCenterDraft] = useState<number | null>(null);
  const centerRadius = centerDraft ?? board.centerRadius ?? 100;
  const resizeCenter = (value: number) => { setCenterDraft(null); if (value !== (board.centerRadius ?? 100)) commit({...board,centerRadius:value}); };
  const [message,setMessage] = useState('');
  const [storageError,setStorageError] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null); const fileRef = useRef<HTMLInputElement>(null); const dragRef = useRef<Drag | null>(null);
  const commit = (next: Board) => { setPast(p => [...p.slice(-79), board]); setFuture([]); setBoard(next); };
  const clearAction = () => { setPending(null); setSelected(null); setFirst(null); setPreview(null); dragRef.current = null; };
  const undo = () => { if (!past.length) return; setFuture(f => [board,...f]); setBoard(past[past.length-1]); setPast(p => p.slice(0,-1)); clearAction(); };
  const redo = () => { if (!future.length) return; setPast(p => [...p,board]); setBoard(future[0]); setFuture(f => f.slice(1)); clearAction(); };
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(board)); setStorageError(false); } catch { setStorageError(true); } },[board]);
  const radius = (r: Ring) => board.model === 'biwheel' ? (r === 'base' ? 210 : 270) : 255;
  const point = (p: Planet) => polar(p.angle, radius(p.ring));
  const renderedPlanets = board.planets.map(p => preview?.id === p.id ? {...p,angle:preview.angle} : p);
  const labelPositions = layoutLabels(renderedPlanets, { biwheel: board.model === 'biwheel', center: board.visible.center ? centerRadius : 0, degrees: board.visible.planetDegrees, formatDegree: degreeLabel });
  function position(clientX: number, clientY: number) {
    const el = svgRef.current; if (!el) return null;
    const matrix = el.getScreenCTM(); if (!matrix) return null;
    const p = new DOMPoint(clientX,clientY).matrixTransform(matrix.inverse());
    const distance = Math.hypot(p.x-400,p.y-400);
    if (distance < 80 || distance > 350) return null;
    return norm(Math.atan2(p.y-400,p.x-400)*180/Math.PI + 90);
  }
  const addPlanet = (kind: string, angle: number, targetRing: Ring) => {
    const p: Planet = { id: crypto.randomUUID(),kind,angle,ring: targetRing };
    commit({...board,planets:[...board.planets,p],visible:{...board.visible,planets:true}}); setSelected(p.id); setPending(null); setMessage('');
  };
  const choosePlanet = (id: string) => {
    setPending(null); setSelected(id); setTab('build'); setMessage('');
    if (mode !== 'aspect') return;
    if (!first) { setFirst(id); return; }
    if (first === id) { setMessage('Escolha outro planeta para completar a ligação.'); return; }
    if (board.aspects.some(a => (a.from===first && a.to===id || a.from===id && a.to===first) && a.style===style)) { setMessage('Essa ligação já existe.'); setFirst(null); return; }
    commit({...board,aspects:[...board.aspects,{id:crypto.randomUUID(),from:first,to:id,style}],visible:{...board.visible,aspects:true}}); setFirst(null); setMessage('');
  };
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = dragRef.current; if (!d) return;
      if (Math.hypot(e.clientX-d.startX,e.clientY-d.startY)>7) d.moved=true;
      if (!d.moved) return;
      d.angle = position(e.clientX,e.clientY) ?? undefined;
      setPreview(d.angle === undefined ? null : {kind:d.kind,angle:d.angle,ring:d.ring,id:d.id});
    };
    const up = (e: PointerEvent) => {
      const d=dragRef.current; if (!d) return; dragRef.current=null; setPreview(null);
      if (!d.moved) { if (d.id) choosePlanet(d.id); else { setPending(d.kind); setSelected(null); setMode('move'); setFirst(null); } return; }
      const angle=position(e.clientX,e.clientY); if (angle===null) {setMessage('Solte dentro da mandala, próximo ao anel.');return;}
      if (d.id) commit({...board,planets:board.planets.map(p=>p.id===d.id?{...p,angle}:p)}); else addPlanet(d.kind,angle,d.ring);
    };
    const cancel = () => { dragRef.current=null;setPreview(null); };
    window.addEventListener('pointermove',move); window.addEventListener('pointerup',up); window.addEventListener('pointercancel',cancel);
    return () => { window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',cancel); };
  });
  const remove = () => { if (!selected) return; commit({...board,planets:board.planets.filter(p=>p.id!==selected),aspects:board.aspects.filter(a=>a.id!==selected && a.from!==selected && a.to!==selected)});clearAction();setMessage(''); };
  useEffect(() => {
    const key=(e:KeyboardEvent)=> { if(e.key==='Escape' && presentation){setPresentation(false);return;} if(presentation || (e.target as HTMLElement).matches('input,select,textarea')) return; if(e.key==='Escape'){if(presentation){setPresentation(false);}else{clearAction();setMode('move');}} if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();} if(e.key==='Delete')remove(); };
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  });
  const changeModel = (model: Model) => { commit({...board,model,visible:{...board.visible,houses:model==='four'||model==='twelve'||model==='biwheel',numbers:model==='twelve'||model==='biwheel'}});clearAction();setRing('base'); };
  const save = () => { download(new Blob([JSON.stringify(board,null,2)],{type:'application/json'}),'aula.astro.json');setMessage('Arquivo de aula enviado para os downloads do navegador.'); };
  async function load(file?: File) { if(!file)return;try {if(file.size>2_000_000)throw Error('Arquivo muito grande.');const next=validate(JSON.parse(await file.text()));commit(next);clearAction();setMessage('Aula aberta. Desfazer recupera o quadro anterior.');}catch{setMessage('Não foi possível abrir. Escolha um arquivo de aula salvo pelo Astroboard.');}finally{if(fileRef.current)fileRef.current.value='';} }
  const exportImage = () => {
    const svg=svgRef.current;if(!svg || preview || centerDraft!==null)return;const clone=svg.cloneNode(true) as SVGSVGElement;
    clone.removeAttribute('class'); clone.removeAttribute('style');
    clone.querySelectorAll('[data-export-stroke]').forEach(el => el.setAttribute('stroke-width', el.getAttribute('data-export-stroke')!));
    clone.setAttribute('xmlns','http://www.w3.org/2000/svg');clone.setAttribute('width','1600');clone.setAttribute('height','1600');
    clone.querySelectorAll('[data-editor]').forEach(el=>el.remove());
    const serialized=new XMLSerializer().serializeToString(clone); const url=URL.createObjectURL(new Blob([serialized],{type:'image/svg+xml'}));const img=new Image();
    img.onload=()=>{const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1600;const ctx=canvas.getContext('2d');if(!ctx){URL.revokeObjectURL(url);return;}ctx.fillStyle='#fffdf8';ctx.fillRect(0,0,1600,1600);ctx.drawImage(img,0,0);canvas.toBlob(blob=>{if(blob)download(blob,'mandala.png');else setMessage('Não foi possível exportar a imagem.');});URL.revokeObjectURL(url);};
    img.onerror=()=>{URL.revokeObjectURL(url);setMessage('Não foi possível exportar a imagem.');};img.src=url;
  };
  const selectedPlanet=board.planets.find(p=>p.id===selected);
  const instruction = pending ? (selectedPlanet ? 'Clique na nova posição.' : `Colocar ${info(pending)[2]}`) : mode==='aspect' ? first ? 'Escolha o segundo planeta.' : 'Escolha o primeiro planeta.' : '';
  return <div className={presentation?'app presenting':'app'}>
    <TopBar><div className="brand"><span className="brand-symbol">✳</span><div><h1>Astroboard</h1></div></div><nav aria-label="Arquivo e histórico">
      <button onClick={()=>{if(board.planets.length||board.aspects.length){if(!confirm('Começar um quadro vazio? Você poderá recuperar o atual com Desfazer.'))return;}commit(fresh());clearAction();setRing('base');setMessage('');}}>＋ Novo quadro</button>
      <button onClick={()=>fileRef.current?.click()}>↥ Carregar</button><button onClick={save}>↓ Salvar</button><button disabled={!!preview || centerDraft!==null} onClick={exportImage}>▧ Exportar imagem</button>
      <span className="nav-divider"/><button disabled={!past.length} onClick={undo}>↶ Desfazer</button><button disabled={!future.length} onClick={redo}>↷ Refazer</button>
      <button className="primary" onClick={()=>setPresentation(!presentation)}>{presentation?'Voltar a editar':'Apresentar'}</button>
    </nav><input ref={fileRef} type="file" accept=".json,.astro.json" hidden onChange={e=>load(e.target.files?.[0])}/></TopBar>
    <main>
    <ToolSidebar tab={tab} onTab={setTab}>
    <section id="build-panel" role="tabpanel" aria-labelledby="build-tab" hidden={tab!=='build'}>
      <div className="section-heading"><span className="eyebrow">CONSTRUIR O QUADRO</span><h2>Planetas</h2></div>
      {board.model==='biwheel'&&<div className="ring-choice"><button className={ring==='base'?'active':''} onClick={()=>setRing('base')}>Mapa-base · interno</button><button className={ring==='transit'?'active transit':''} onClick={()=>setRing('transit')}>Trânsitos · externo</button></div>}
      <div className="planet-list">{PLANETS.map(([kind,symbol,name])=><button key={kind} className={`planet-choice ${pending===kind?'active':''}`} aria-pressed={pending===kind} onPointerDown={e=>{if(e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);dragRef.current={kind,startX:e.clientX,startY:e.clientY,moved:false,ring};}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setPending(kind);setSelected(null);setMode('move');setFirst(null);}}}><span className="glyph">{kind==='pluto'?<svg className="pluto-symbol" viewBox="-20 -22 40 44" aria-hidden="true"><PlutoGlyph/></svg>:symbol}</span><span>{name}</span><span className="add-sign">+</span></button>)}</div>
      <div className="selection-heading"><span className="eyebrow">PROPRIEDADES</span></div>
      {selected?<div className="selection-bar"><strong>{selectedPlanet?info(selectedPlanet.kind)[2]:'Linha de aspecto'}</strong>{selectedPlanet&&<><AngleEditor key={`${selectedPlanet.id}:${selectedPlanet.angle}`} label={`Posição de ${info(selectedPlanet.kind)[2]}`} angle={selectedPlanet.angle} onApply={angle=>{commit({...board,planets:board.planets.map(p=>p.id===selectedPlanet.id?{...p,angle}:p)});setPending(null);setMessage('');}}/><button onClick={()=>{setPending(selectedPlanet.kind);setMode('move');setFirst(null);setMessage('');}}>Reposicionar</button></>}<button className="danger" onClick={remove}>Remover</button><button onClick={clearAction}>Concluir</button></div>:<div className="selection-empty"><span className="empty-orbit">◎</span><h3>Seu quadro, passo a passo</h3><p>Arraste um planeta para a mandala ou escolha um planeta e clique na posição desejada.</p></div>}
    </section>
    <section id="display-panel" role="tabpanel" aria-labelledby="display-tab" hidden={tab!=='display'}>
      <div className="section-heading"><span className="eyebrow">ORGANIZAR O QUADRO</span><h2>Exibição</h2></div>
<div className="model-list">{([['empty','○','Círculo vazio'],['four','⊕','Quatro partes'],['twelve','✳','Doze partes'],['biwheel','◎','Dois mapas']] as const).map(([key,symbol,label])=><button key={key} className={board.model===key?'active':''} aria-pressed={board.model===key} onClick={()=>changeModel(key)}><span>{symbol}</span>{label}</button>)}</div><h2 className="visibility-title">Mostrar no quadro</h2><div className="toggles">{([['signs','Signos'],['houses','Divisões das casas'],['numbers','Números das casas'],['planets','Planetas'],['planetDegrees','Graus dos planetas'],['aspects','Aspectos'],['degrees','Marcas de graus'],['center','Centro vazio']] as const).map(([key,label])=><label key={key}><input type="checkbox" checked={board.visible[key]??true} onChange={e=>commit({...board,visible:{...board.visible,[key]:e.target.checked}})}/><span>{label}</span></label>)}</div>{board.visible.center&&<label className="center-size"><span>Tamanho do centro<output>{Math.round(centerRadius / 330 * 100)}%</output></span><input type="range" min="40" max="140" step="1" value={centerRadius} aria-label="Tamanho do círculo central" onChange={e=>setCenterDraft(Number(e.target.value))} onPointerUp={e=>resizeCenter(Number(e.currentTarget.value))} onPointerCancel={e=>resizeCenter(Number(e.currentTarget.value))} onKeyUp={e=>resizeCenter(Number(e.currentTarget.value))} onBlur={e=>resizeCenter(Number(e.currentTarget.value))}/></label>}{(board.visible.houses||board.visible.numbers)&&<div className="house-position"><h2 className="visibility-title">Início da casa 1</h2><AngleEditor key={board.rotation} label="Início da casa 1" angle={board.rotation} onApply={rotation=>commit({...board,rotation})}/><div className="house-rotation"><button aria-label="Girar casas 15 graus para a esquerda" onClick={()=>commit({...board,rotation:norm(board.rotation-15)})}>↶ 15°</button><button aria-label="Girar casas 15 graus para a direita" onClick={()=>commit({...board,rotation:norm(board.rotation+15)})}>15° ↷</button><button onClick={()=>commit({...board,rotation:0})}>Restaurar</button></div></div>}
    </section></ToolSidebar>
    <section className="workspace" aria-label="Quadro astrológico">
      <MapTools mode={mode} style={style} onStyle={setStyle} onMove={()=>{setMode('move');setFirst(null);setPending(null);}} onAspect={()=>{clearAction();setTab('build');setMode('aspect');if(!board.visible.planets)commit({...board,visible:{...board.visible,planets:true}});}} />
      <div ref={canvasRef} className={`canvas-scroll ${(presentation?1:zoom)>1?'zoomed':''}`}><MandalaCanvas size={canvasExtent*(presentation?1:zoom)}><svg className="mandala" ref={svgRef} viewBox="50 50 700 700" role="img" aria-label="Mandala" onClick={e=>{if(presentation || !pending)return;const angle=position(e.clientX,e.clientY);if(angle===null)return;if(selectedPlanet){commit({...board,planets:board.planets.map(p=>p.id===selectedPlanet.id?{...p,angle}:p)});setPending(null);setMessage('');}else addPlanet(pending,angle,ring);}}>
        <rect width="800" height="800" fill="#fffdf8"/>
        <circle cx="400" cy="400" r="330" fill="none" stroke="#223f50" strokeWidth="2"/><circle cx="400" cy="400" r="325" fill="none" stroke="#b77948" strokeWidth=".7"/>
        {board.visible.signs&&<><circle cx="400" cy="400" r="292" fill="none" stroke="#b8c3c8"/>{SIGNS.map((s,i)=>{const a=i*30;const p=polar(a,330);const q=polar(a,292);const t=polar(a+15,311);const end=polar(a+30,330);const innerEnd=polar(a+30,292);const color=ELEMENT_COLORS[i%4];return <g key={s}><path d={`M ${p.x} ${p.y} A 330 330 0 0 1 ${end.x} ${end.y} L ${innerEnd.x} ${innerEnd.y} A 292 292 0 0 0 ${q.x} ${q.y} Z`} fill={color} fillOpacity=".09"/><line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#b8c3c8"/><text x={t.x} y={t.y} textAnchor="middle" dominantBaseline="central" fontSize="28" fill={color} fontFamily="Segoe UI Symbol, DejaVu Sans, sans-serif"><title>{SIGN_NAMES[i]}</title>{s}</text></g>;})}</>}
        {board.visible.houses&&Array.from({length:board.model==='four'?4:12},(_,i)=>{const a=i*(board.model==='four'?90:30)+board.rotation;const p=polar(a,board.visible.signs?292:330);return <line key={i} x1="400" y1="400" x2={p.x} y2={p.y} stroke="#d5dcd9" strokeWidth="1"/>;})}
        {board.visible.numbers&&Array.from({length:12},(_,i)=>{const p=polar(i*30+15+board.rotation,Math.max(board.model==='biwheel'?140:170,board.visible.center?centerRadius+18:0));return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize="22" fill="#687d87" fontFamily="Segoe UI, sans-serif">{i+1}</text>;})}
        {board.visible.degrees&&Array.from({length:72},(_,i)=>{const a=i*5;const p=polar(a,330);const q=polar(a,i%6===0?342:336);return <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#82949b"/>;})}
        {board.model==='biwheel'&&<><circle cx="400" cy="400" r="240" fill="none" stroke="#b8c3c8" strokeDasharray="5 6"/><text x="400" y="76" textAnchor="middle" fill="#ad6338" fontSize="16" fontFamily="Segoe UI, sans-serif">Trânsitos · anel externo</text><text x="400" y="738" textAnchor="middle" fill="#344e5e" fontSize="16" fontFamily="Segoe UI, sans-serif">Mapa-base · anel interno</text></>}
        {board.visible.center ? <circle cx="400" cy="400" r={centerRadius} fill="#fffdf8" stroke="#d5dcd9" strokeWidth="1"/> : <circle cx="400" cy="400" r="4" fill="#b8c3c8"/>}
        {board.visible.aspects&&board.aspects.map(a=>{const from=board.planets.find(p=>p.id===a.from)!;const to=board.planets.find(p=>p.id===a.to)!;const p=point(preview?.id===from.id?{...from,angle:preview.angle}:from);const q=point(preview?.id===to.id?{...to,angle:preview.angle}:to);const s=STYLES[a.style];return <g key={a.id} role={presentation?undefined:"button"} tabIndex={presentation?-1:0} aria-label={`${s.name}: ${info(from.kind)[2]} e ${info(to.kind)[2]}`} onClick={e=>{e.stopPropagation();if(presentation)return;setSelected(a.id);setPending(null);setTab('build');setMessage('');}} onKeyDown={e=>{if(!presentation&&e.key==='Enter'){setSelected(a.id);setTab('build');}}}><line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={s.color} data-export-stroke="2.3" strokeWidth={!presentation&&selected===a.id?4:2.3} strokeDasharray={s.dash}/><line data-editor="true" x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="transparent" strokeWidth="18" style={{cursor:'pointer'}}/></g>;})}
        {board.visible.planets&&board.planets.map(original=>{const p=preview?.id===original.id?{...original,angle:preview.angle}:original;const xy=labelPositions.get(p.id)!;const exact=point(p);const color=p.ring==='transit'&&board.model==='biwheel'?'#ad6338':'#284d60';return <g key={p.id} role={presentation?undefined:"button"} tabIndex={presentation?-1:0} aria-label={`${info(p.kind)[2]}, ${p.ring==='transit'?'trânsitos':'mapa-base'}, ${Math.round(p.angle)} graus`} onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(!presentation&&(e.key==='Enter'||e.key===' ')){e.preventDefault();choosePlanet(p.id);}}} onPointerDown={e=>{e.stopPropagation();if(presentation||e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);if(mode==='aspect'){choosePlanet(p.id);return;}dragRef.current={kind:p.kind,id:p.id,startX:e.clientX,startY:e.clientY,moved:false,ring:p.ring};}} style={{cursor:presentation?'default':mode==='aspect'?'pointer':'grab',touchAction:'none'}}>
          <line x1={exact.x} y1={exact.y} x2={xy.x} y2={xy.y} stroke={color} strokeWidth="1"/><circle cx={exact.x} cy={exact.y} r="3" fill={color}/><circle cx={xy.x} cy={xy.y} r="24" fill="#fffdf8" stroke={color} strokeWidth="1.2"/>{!presentation&&(selected===p.id||first===p.id)&&<circle data-editor="true" cx={xy.x} cy={xy.y} r="28" fill="none" stroke={first===p.id?'#b77948':color} strokeWidth="3" strokeDasharray={first===p.id?'4 3':undefined}/>}{p.kind==='pluto'?<PlutoGlyph x={xy.x} y={xy.y} color={color}/>:<text x={xy.x} y={xy.y+1} textAnchor="middle" dominantBaseline="central" fontSize="33" fill={color} fontFamily="Segoe UI Symbol, DejaVu Sans, sans-serif">{info(p.kind)[1]}</text>}{xy.showDegree&&<text x={xy.x} y={xy.y+40} textAnchor="middle" fontSize="18" fontWeight="600" fill={color} stroke="#fffdf8" strokeWidth="5" strokeLinejoin="round" paintOrder="stroke" fontFamily="Segoe UI, sans-serif">{degreeLabel(p.angle)}</text>}<title>{info(p.kind)[2]}</title>
        </g>;})}
        {preview&&!preview.id&&(()=>{const p=polar(preview.angle,radius(preview.ring));return <g data-editor="true" opacity=".7" pointerEvents="none"><circle cx={p.x} cy={p.y} r="26" fill="#e9eee8" stroke="#b77948" strokeWidth="2" strokeDasharray="4 3"/>{preview.kind==='pluto'?<PlutoGlyph x={p.x} y={p.y}/>:<text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize="33" fontFamily="Segoe UI Symbol, sans-serif">{info(preview.kind)[1]}</text>}</g>;})()}
      </svg></MandalaCanvas></div>

      <StatusBar text={storageError?'A recuperação automática está indisponível. Use Salvar para guardar seu trabalho.':instruction||message||'Escolha um planeta para começar.'} cancel={!!(pending||first)} onCancel={()=>{setPending(null);setFirst(null);}} />
      <div className="zoom-tools" aria-label="Enquadramento"><button disabled={zoom<=1} aria-label="Reduzir" onClick={()=>setZoom(z=>Math.max(1,z-.25))}>−</button><span>{Math.round(zoom*100)}%</span><button disabled={zoom>=2} aria-label="Ampliar" onClick={()=>setZoom(z=>Math.min(2,z+.25))}>＋</button><button onClick={()=>setZoom(1)}>Ajustar à tela</button></div>
    </section></main>
  </div>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
