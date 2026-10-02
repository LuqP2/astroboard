type Scene = { x: number; y: number; width: number; height: number };
export type SavedSlide<T> = { id: string; name: string; board: T; scene: Scene };
export const SLIDES_KEY: string;
export function readSlides<T>(storage: Pick<Storage, 'getItem'>, validate: (value: unknown) => T): { slides: SavedSlide<T>[]; nextNumber: number; error: boolean };
export function writeSlides<T>(storage: Pick<Storage, 'setItem'>, slides: SavedSlide<T>[], nextNumber: number): void;
export function snapshotSlide<T>(board: T, scene: Scene, number: number, id: string): SavedSlide<T>;
