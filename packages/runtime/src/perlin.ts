const PERM = new Uint8Array(512);

(function initPermutation() {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  let seed = 42;
  for (let i = 255; i > 0; i--) {
    seed = (seed * 16807 + 0) % 2147483647;
    const j = seed % (i + 1);
    const tmp = p[i]!;
    p[i] = p[j]!;
    p[j] = tmp;
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255]!;
})();

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

function grad1D(hash: number, x: number): number {
  return (hash & 1) === 0 ? x : -x;
}

function grad2D(hash: number, x: number, y: number): number {
  const h = hash & 3;
  const u = h < 2 ? x : y;
  const v = h < 2 ? y : x;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

/** 1D Perlin noise, approximately -1..1. */
export function perlin1D(x: number): number {
  const xi = Math.floor(x) & 255;
  const xf = x - Math.floor(x);
  const u = fade(xf);
  const a = grad1D(PERM[xi]!, xf);
  const b = grad1D(PERM[xi + 1]!, xf - 1);
  return lerp(a, b, u);
}

/** 2D Perlin noise, approximately -1..1. */
export function perlin2D(x: number, y: number): number {
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = fade(xf);
  const v = fade(yf);
  const aa = PERM[PERM[xi]! + yi]!;
  const ab = PERM[PERM[xi]! + yi + 1]!;
  const ba = PERM[PERM[xi + 1]! + yi]!;
  const bb = PERM[PERM[xi + 1]! + yi + 1]!;
  const x1 = lerp(grad2D(aa, xf, yf), grad2D(ba, xf - 1, yf), u);
  const x2 = lerp(grad2D(ab, xf, yf - 1), grad2D(bb, xf - 1, yf - 1), u);
  return lerp(x1, x2, v);
}

/** Map Perlin output to 0..1. */
export function perlinNormalized1D(x: number): number {
  return perlin1D(x) * 0.5 + 0.5;
}
