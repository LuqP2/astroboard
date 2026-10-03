// Presentation coordinates only. Longitudes and aspect anchors never change.
export function layoutLabels(planets, { biwheel = false, center = 100, degrees = true, formatDegree = String, scale = 1 } = {}) {
  const placed = [];
  const result = new Map();
  const polar = (angle, radius) => ({ x: 400 + Math.cos((angle - 90) * Math.PI / 180) * radius, y: 400 + Math.sin((angle - 90) * Math.PI / 180) * radius });
  const overlaps = (box) => placed.some(b => box.left < b.right && box.right > b.left && box.top < b.bottom && box.bottom > b.top);
  for (const planet of [...planets].sort((a, b) => a.angle - b.angle || a.id.localeCompare(b.id))) {
    const planetScale = scale * (planet.scale ?? 1);
    const outer = biwheel && planet.ring === 'transit';
    const maximum = Math.min(283-27*planetScale, outer ? 260 : biwheel ? 210 : 265);
    const preferred = Math.min(maximum,biwheel ? (outer ? 243 : 200) : 253);
    const minimum = Math.max(center + 30*planetScale, outer ? Math.min(232,maximum) : 90);
    const radii = [preferred];
    for (let r = maximum; r >= minimum; r -= 64*planetScale) if (!radii.includes(r)) radii.push(r);
    const offsets = [0];
    for (let delta = 12; delta <= 180; delta += 12) offsets.push(delta, -delta);
    let chosen;
    for (const showDegree of degrees ? [true, false] : [false]) {
      const width = (showDegree ? Math.max(54, formatDegree(planet.angle).length * 11 + 10) : 54)*planetScale;
      search: for (const offset of offsets) for (const radius of radii) {
        const point = polar(planet.angle + offset, radius);
        const box = { left: point.x - width / 2, right: point.x + width / 2, top: point.y - 27*planetScale, bottom: point.y + (showDegree ? 47 : 27)*planetScale };
        // Keep the whole label inside the inner zodiac boundary.
        const corners = [[box.left, box.top], [box.right, box.top], [box.left, box.bottom], [box.right, box.bottom]];
        if (corners.some(([x,y]) => Math.hypot(x - 400, y - 400) > 283)) continue;
        const nearestX = Math.max(box.left, Math.min(400, box.right));
        const nearestY = Math.max(box.top, Math.min(400, box.bottom));
        if (Math.hypot(nearestX - 400, nearestY - 400) < center + 2) continue;
        if (!overlaps(box)) { chosen = { ...point, showDegree, box }; break search; }
      }
      if (chosen) break;
    }
    // Extreme boards may exceed physical capacity; keep every planet selectable.
    if (!chosen) {
      // Repack a crowded board without degree labels before allowing symbols to overlap.
      // This affects presentation only; the saved visibility preference stays intact.
      if (degrees) return layoutLabels(planets, { biwheel, center, degrees: false, formatDegree, scale });
      const point = polar(planet.angle, preferred);
      chosen = { ...point, showDegree: false, box: { left: point.x - 27*planetScale, right: point.x + 27*planetScale, top: point.y - 27*planetScale, bottom: point.y + 27*planetScale } };
    }
    placed.push(chosen.box);
    result.set(planet.id, chosen);
  }
  return result;
}
