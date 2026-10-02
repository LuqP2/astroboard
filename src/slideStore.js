export const SLIDES_KEY = 'astroativo.slides.v1';
export function readSlides(storage, validate) {
  try {
    const raw = storage.getItem(SLIDES_KEY);
    if (!raw) return { slides: [], nextNumber: 1, error: false };
    const saved = JSON.parse(raw);
    if (saved.version !== 1 || !Array.isArray(saved.slides) || saved.slides.length > 200 || !Number.isSafeInteger(saved.nextNumber) || saved.nextNumber < 1) throw Error('Slides inválidos.');
    const ids = new Set();
    const slides = saved.slides.map(slide => {
      if (!slide || typeof slide.id !== 'string' || ids.has(slide.id) || typeof slide.name !== 'string' || slide.name.length > 100 || !slide.scene || !['x','y','width','height'].every(key => Number.isFinite(slide.scene[key])) || slide.scene.width < 1 || slide.scene.height < 1) throw Error('Slide inválido.');
      ids.add(slide.id);
      return { id: slide.id, name: slide.name, scene: slide.scene, board: validate(slide.board) };
    });
    return { slides, nextNumber: saved.nextNumber, error: false };
  } catch { return { slides: [], nextNumber: 1, error: true }; }
}
export function writeSlides(storage, slides, nextNumber) {
  storage.setItem(SLIDES_KEY, JSON.stringify({ version: 1, slides, nextNumber }));
}
export function snapshotSlide(board, scene, number, id) {
  return { id, name: `Slide ${number}`, board: structuredClone(board), scene: { ...scene } };
}
