export interface RetryOptions {
    maxRetryCount: number;
    delayBetweenRetries: number;
}


/**
 * Waiting function
 * @param duration How much to wait - in `milliseconds`
 */
function wait(duration: number) {
    return new Promise((resolve) => setTimeout(resolve, duration));
}

export async function retryAsync<T>(operationToExecute: () => Promise<T>, { maxRetryCount, delayBetweenRetries }: RetryOptions): Promise<T> {
    try {
        return await operationToExecute();
    } catch (err) {
        if (maxRetryCount > 1) {
            // Wait between retries
            //
            await wait(delayBetweenRetries);

            // Pass in a decremented number of retries to the next iteration
            //
            const newFunctionArguments: RetryOptions = {
                delayBetweenRetries,
                maxRetryCount: maxRetryCount - 1
            };

            return await retryAsync(operationToExecute, newFunctionArguments);
        }

        // After the maximum retry has been exhausted just throw the error
        //
        throw err;
    }
}
