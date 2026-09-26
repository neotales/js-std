export declare class Lazy<T> {
    #private;
    private readonly factory;
    constructor(factory: () => T);
    get value(): T;
}
