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
