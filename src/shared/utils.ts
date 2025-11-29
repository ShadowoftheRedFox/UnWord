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
