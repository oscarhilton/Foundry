/** Permutations without repetition (order matters). */
export function* permutations<T>(items: readonly T[], length: number): Generator<T[]> {
  if (length === 0) {
    yield [];
    return;
  }
  if (length > items.length) return;

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    const rest = items.filter((_, j) => j !== i);
    for (const tail of permutations(rest, length - 1)) {
      yield [item, ...tail];
    }
  }
}

export function permutationCount(n: number, length: number): number {
  if (length <= 0 || length > n) return 0;
  let result = 1;
  for (let i = 0; i < length; i++) {
    result *= n - i;
  }
  return result;
}
