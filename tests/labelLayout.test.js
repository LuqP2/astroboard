import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutLabels } from '../src/labelLayout.js';

const planets = (angles, ring = 'base') => angles.map((angle, i) => ({ id: `${ring}-${i}`, kind: 'sun', angle, ring }));
const options = { degrees: true, formatDegree: angle => `${(angle % 30).toFixed(3)}°` };
function assertSeparated(layout) {
  const positions = [...layout.values()];
  for (let i = 0; i < positions.length; i++) {
    const a = positions[i].box;
    assert.ok(Number.isFinite(positions[i].x) && Number.isFinite(positions[i].y));
    for (const { box: b } of positions.slice(i + 1)) {
      assert.ok(!(a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top), 'label boxes overlap');
    }
  }
}
test('close planets across zero remain separated and input longitudes stay intact', () => {
  const input = planets([359, 0, 1, 2, 3, 4, 5, 6, 7, 8]);
  const before = structuredClone(input);
  assertSeparated(layoutLabels(input, options));
  assert.deepEqual(input, before);
});
test('layout is deterministic even when input order changes', () => {
  const input = planets([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const first = layoutLabels(input, options);
  assertSeparated(first);
  assert.deepEqual(first, layoutLabels([...input].reverse(), options));
});
test('base and transit labels avoid each other with the largest center', () => {
  const input = [...planets([359, 0, 1, 2, 3, 4, 5, 6, 7, 8]), ...planets([359, 0, 1, 2, 3, 4, 5, 6, 7, 8], 'transit')];
  assertSeparated(layoutLabels(input, { ...options, biwheel: true, center: 140 }));
});
test('visibility preference suppresses all degree labels', () => {
  const input = planets([10, 50, 100, 200, 300]);
  const layout = layoutLabels(input, { degrees: false });
  assertSeparated(layout);
  assert.ok([...layout.values()].every(p => !p.showDegree));
});
test('maximum supported board still returns every selectable label', () => {
  const input = planets(Array.from({length: 200}, () => 0));
  const layout = layoutLabels(input, options);
  assert.equal(layout.size, 200);
  assert.ok([...layout.values()].every(p => Number.isFinite(p.x) && Number.isFinite(p.y)));
});
test('planet size changes label bounds without changing input longitudes', () => {
  const input = planets([0, 72, 144, 216, 288]);
  const original = structuredClone(input);
  const small = layoutLabels(input, {...options,scale:.6});
  const large = layoutLabels(input, {...options,scale:1.6});
  assertSeparated(small);assertSeparated(large);
  for (const planet of input) {
    const a=small.get(planet.id).box,b=large.get(planet.id).box;
    assert.ok(b.right-b.left > a.right-a.left);
  }
  assert.deepEqual(input,original);
});
test('individual sizes multiply the global scale and preserve proportions', () => {
  const input=[{id:'small',angle:0,ring:'base',scale:.6},{id:'large',angle:180,ring:'base',scale:1.6},{id:'legacy',angle:90,ring:'base'}];
  const original=structuredClone(input);
  const normal=layoutLabels(input,{degrees:false,scale:1});
  const enlarged=layoutLabels(input,{degrees:false,scale:1.5});
  const width=(layout,id)=>{const box=layout.get(id).box;return box.right-box.left;};
  for(const p of input) assert.ok(Math.abs(width(enlarged,p.id)/width(normal,p.id)-1.5)<1e-9);
  assert.ok(Math.abs(width(normal,'large')/width(normal,'small')-1.6/.6)<1e-9);
  assert.ok(Math.abs(width(normal,'legacy')-54)<1e-9);
  assert.deepEqual(input,original);
});
