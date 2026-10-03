import React, { useId } from 'react';

export function PlanetMedallion({ x=0, y=0, color, transit=false }: { x?:number; y?:number; color:string; transit?:boolean }) {
  const id=useId();
  const face=`${id}-face`,rim=`${id}-rim`,shadow=`${id}-shadow`;
  return <g transform={`translate(${x} ${y})`}>
    <defs>
      <radialGradient id={face} cx="28%" cy="22%" r="85%">
        <stop offset="0" stopColor="#fffaf0"/>
        <stop offset=".36" stopColor="#f0e7ce"/>
        <stop offset=".75" stopColor="#d3c5a5"/>
        <stop offset="1" stopColor="#9c8b69"/>
      </radialGradient>
      <linearGradient id={rim} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#d4e7ed"/>
        <stop offset=".4" stopColor={color}/>
        <stop offset="1" stopColor="#14222e"/>
      </linearGradient>
      <filter id={shadow} x="-25%" y="-25%" width="150%" height="160%" colorInterpolationFilters="sRGB">
        <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#08121b" floodOpacity=".65"/>
      </filter>
    </defs>
    <circle r="24" fill={`url(#${face})`} filter={`url(#${shadow})`}/>
    <circle r="23.5" fill={color} fillOpacity=".09" stroke={`url(#${rim})`} strokeWidth="1.3" strokeDasharray={transit?'3 3':undefined}/>
    <circle r="21.5" fill="none" stroke="#fff8e4" strokeOpacity=".5" strokeWidth=".7"/>
    <path d="M -18 -7 A 19 19 0 0 1 7 -18" fill="none" stroke="#ffffff" strokeOpacity=".7" strokeWidth="1" strokeLinecap="round"/>
    <path d="M -7 19 A 20 20 0 0 0 19 -7" fill="none" stroke="#07131d" strokeOpacity=".42" strokeWidth="1.1"/>
  </g>;
}
