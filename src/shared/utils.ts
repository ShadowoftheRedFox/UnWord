/**
 * Clamp a number between min and max.
 * @param x The number to clamp.
 * @param min The min value. Default 0.
 * @param max The max value. Default 100.
 * @returns min if `x < min`, max if `x > max`, or `x`
 */
export const clamp = (x: number, min = 0, max = 100) => {
    return Math.max(min, Math.min(x, max));
}

/**
 * Get a random float betwen 0 and max.
 * @param max The maximum value to reach included.
 * @returns A random floating value between 0 and max.
 */
export const random = (max: number) => {
    return Math.random() * max;
}
/**
 * Get a random int betwen 0 and max.
 * @param max The maximum value to reach included.
 * @returns A random int value between 0 and max.
 */
export const randomInt = (max: number) => {
    return Math.floor(random(max));
}

/**
 * Create a filled array of number.
 * @param length The length of the wanted array
 * @returns An array filled with number corresponding to it's index.
 */
export const prefilledArray = (length: number) => {
    const res: number[] = [];
    for (let index = 0; index < length; index++) {
        res.push(index);
    }
    return res;
}

/**
 * Replace a part inside a string by another string.
 * If the index is negative, or greater than the string length, does nothing.
 * @param string The string to edit.
 * @param index The index of the modification.
 * @param replacement The replacement string.
 * @returns The edited string.
 */
export const replaceAt = (string: string, index: number, replacement: string) => {
    if (index < 0 || index >= string.length) { return string; }
    return string.substring(0, index) + replacement + string.substring(index + replacement.length);
}

/**
 * Check if the value is between the boundary, included.
 * @param x The value to check.
 * @param min The minimum value.
 * @param max The maximum value.
 * @returns True if x in inside the boundary.
 */
export const inbound = (x: number, min: number, max: number): boolean => {
    if (max < min) {
        const temp = max;
        max = min;
        min = temp;
    }
    return x >= min && x <= max;
}
