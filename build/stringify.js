export function stringify(value) {
    return doStringify(value, 0);
}
function doStringify(value, level) {
    if (typeof value === 'string') {
        return JSON.stringify(value);
    }
    else if (typeof value === 'number') {
        return `${value}`;
    }
    else if (typeof value === 'bigint') {
        return `${value}`;
    }
    else if (typeof value === 'boolean') {
        return `${value}`;
    }
    else if (value === null || typeof value === 'undefined') {
        return `null`;
    }
    else if (Array.isArray(value)) {
        if (value.length === 0) {
            return `[]`;
        }
        const items = value
            .map((v) => getIndent(level + 1) + doStringify(v, level + 1))
            .join('\n');
        return '[' + '\n' + items + '\n' + getIndent(level) + ']';
    }
    else if (typeof value === 'object') {
        const keys = Object.keys(value);
        if (keys.length === 0) {
            return '{}';
        }
        const entries = keys
            .map((key) => getIndent(level + 1) +
            doKeyStringify(key) +
            ': ' +
            doStringify(value[key], level + 1))
            .join('\n');
        return '{' + '\n' + entries + '\n' + getIndent(level) + '}';
    }
    throw new Error(`Unsupported value type: ${typeof value}`);
}
function doKeyStringify(key) {
    if (/^[A-Za-z0-9_-]+$/.test(key)) {
        return key;
    }
    else {
        return JSON.stringify(key);
    }
}
function getIndent(level) {
    return ' '.repeat(2 * level);
}
