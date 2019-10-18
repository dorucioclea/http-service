
/**
 * Waiting function
 * @param duration How much to wait - in `milliseconds`
 */
export function wait(duration: number) {
    return new Promise((resolve) => setTimeout(resolve, duration));
}