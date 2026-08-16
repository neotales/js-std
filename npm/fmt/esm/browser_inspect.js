const identifier = /^[A-Za-z_$][\w$]*$/;
function quote(value, limit, escapeSequences = true) {
    if (limit !== undefined && value.length > limit)
        value = value.slice(0, limit) + "...";
    let result = "";
    for (const character of value) {
        if (character !== "'" &&
            character !== "\\" &&
            (!escapeSequences || character.charCodeAt(0) >= 32)) {
            result += character;
            continue;
        }
        switch (character) {
            case "'":
                result += "\\'";
                break;
            case "\\":
                result += "\\\\";
                break;
            case "\b":
                result += "\\b";
                break;
            case "\f":
                result += "\\f";
                break;
            case "\n":
                result += "\\n";
                break;
            case "\r":
                result += "\\r";
                break;
            case "\t":
                result += "\\t";
                break;
            case "\v":
                result += "\\v";
                break;
            default:
                result += `\\x${character.charCodeAt(0).toString(16).padStart(2, "0")}`;
        }
    }
    return `'${result}'`;
}
function key(value) {
    if (typeof value === "symbol")
        return `[${String(value)}]`;
    const text = String(value);
    return identifier.test(text) ? text : quote(text);
}
/**
 * Browser-safe, Node-like inspection for environments without a native inspector.
 */
export function inspectBrowser(value, options = {}) {
    const active = new WeakSet();
    const depth = options.depth ?? 4;
    const limit = options.iterableLimit ?? 100;
    const indent = "  ";
    const render = (current, remaining, level) => {
        switch (typeof current) {
            case "undefined":
                return "undefined";
            case "string":
                return quote(current, options.strAbbreviateSize, options.escapeSequences ?? true);
            case "boolean":
                return String(current);
            case "number":
                if (Number.isNaN(current))
                    return "NaN";
                if (current === Infinity)
                    return "Infinity";
                if (current === -Infinity)
                    return "-Infinity";
                if (Object.is(current, -0))
                    return "-0";
                return String(current);
            case "bigint":
                return `${current}n`;
            case "symbol":
                return String(current);
            case "function":
                return current.name ? `[Function: ${current.name}]` : "[Function]";
            case "object":
                break;
        }
        if (current === null)
            return "null";
        if (active.has(current))
            return "[Circular]";
        if (remaining < 0) {
            if (Array.isArray(current))
                return "[Array]";
            if (current instanceof Map)
                return "[Map]";
            if (current instanceof Set)
                return "[Set]";
            return "[Object]";
        }
        active.add(current);
        try {
            if (current instanceof Date)
                return Number.isNaN(current.valueOf()) ? "Invalid Date" : current.toISOString();
            if (current instanceof RegExp)
                return String(current);
            if (current instanceof Error)
                return `${current.name}: ${current.message}`;
            if (Array.isArray(current)) {
                const entries = [];
                let empty = 0;
                for (let index = 0; index < Math.min(current.length, limit); index++) {
                    if (!(index in current)) {
                        empty++;
                        continue;
                    }
                    if (empty) {
                        entries.push(`<${empty} empty item${empty === 1 ? "" : "s"}>`);
                        empty = 0;
                    }
                    entries.push(render(current[index], remaining - 1, level + 1));
                }
                if (empty)
                    entries.push(`<${empty} empty item${empty === 1 ? "" : "s"}>`);
                if (current.length > limit)
                    entries.push(`... ${current.length - limit} more item(s)`);
                return collection("[", "]", entries, level);
            }
            if (current instanceof Map) {
                const entries = [...current]
                    .slice(0, limit)
                    .map(([mapKey, mapValue]) => `${render(mapKey, remaining - 1, level + 1)} => ${render(mapValue, remaining - 1, level + 1)}`);
                if (current.size > limit)
                    entries.push(`... ${current.size - limit} more item(s)`);
                return `Map(${current.size}) ${collection("{", "}", entries, level)}`;
            }
            if (current instanceof Set) {
                const entries = [...current]
                    .slice(0, limit)
                    .map((item) => render(item, remaining - 1, level + 1));
                if (current.size > limit)
                    entries.push(`... ${current.size - limit} more item(s)`);
                return `Set(${current.size}) ${collection("{", "}", entries, level)}`;
            }
            let properties = options.showHidden ? Reflect.ownKeys(current) : Object.keys(current);
            if (options.sorted)
                properties = properties.sort((left, right) => String(left).localeCompare(String(right)));
            const entries = properties.slice(0, limit).map((property) => {
                const descriptor = Object.getOwnPropertyDescriptor(current, property);
                let propertyValue;
                if (!descriptor)
                    propertyValue = "undefined";
                else if (descriptor.get || descriptor.set) {
                    if (options.getters && descriptor.get) {
                        try {
                            propertyValue = render(descriptor.get.call(current), remaining - 1, level + 1);
                        }
                        catch {
                            propertyValue = "[Getter: threw]";
                        }
                    }
                    else {
                        propertyValue =
                            descriptor.get && descriptor.set
                                ? "[Getter/Setter]"
                                : descriptor.get
                                    ? "[Getter]"
                                    : "[Setter]";
                    }
                }
                else {
                    propertyValue = render(descriptor.value, remaining - 1, level + 1);
                }
                return `${key(property)}: ${propertyValue}`;
            });
            if (properties.length > limit)
                entries.push(`... ${properties.length - limit} more item(s)`);
            const constructor = current.constructor?.name;
            const prefix = constructor && constructor !== "Object" ? `${constructor} ` : "";
            return prefix + collection("{", "}", entries, level);
        }
        finally {
            active.delete(current);
        }
    };
    const collection = (open, close, entries, level) => {
        if (!entries.length)
            return open + close;
        const inline = `${open} ${entries.join(", ")} ${close}`;
        const multiline = options.compact === false ||
            (options.compact !== true && inline.length > (options.breakLength ?? 80));
        if (!multiline)
            return inline;
        const padding = indent.repeat(level + 1);
        const suffix = options.trailingComma ? "," : "";
        return `${open}\n${padding}${entries.join(`,\n${padding}`)}${suffix}\n${indent.repeat(level)}${close}`;
    };
    return render(value, depth, 0);
}
