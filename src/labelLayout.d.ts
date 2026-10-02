type LabelPlanet = { id: string; angle: number; ring: string };
type LabelPosition = { x: number; y: number; showDegree: boolean; box: { left: number; right: number; top: number; bottom: number } };
export function layoutLabels(planets: LabelPlanet[], options?: { biwheel?: boolean; center?: number; degrees?: boolean; formatDegree?: (angle: number) => string }): Map<string, LabelPosition>;
