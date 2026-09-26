export class Lazy<T> {
  #value: T | undefined;

  constructor(private readonly factory: () => T) {}

  get value(): T {
    return (this.#value ??= this.factory());
  }
}
