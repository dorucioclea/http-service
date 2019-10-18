import { wait } from './wait';
import { ILogger } from '../logging/iLogger';
import { Guard } from './guard';
import { Guid } from 'guid-typescript';
import { logFormatter } from './log-formatter';

export interface RetryOptions {
    maxRetryCount: number;
    delayBetweenRetries: number;
}

export interface RetryResult<T> {
    retryOptions: Partial<RetryOptions>;
    result: T;
}

export interface RetryOperationOptions<T> {
    guid: Guid;
    retryOptions: Readonly<RetryOptions>;
    operationToExecute: () => Promise<T>;
}

export class Retry {
    private readonly _logger: ILogger<string>;

    public constructor(
        public logger: ILogger<string>
    ) {
        Guard.throwIfNullOrEmpty(logger, 'logger');

        this._logger = logger;
    }


    public async retryAsync<T>(retryOptions: RetryOperationOptions<T>): Promise<RetryResult<T>> {
        const { maxRetryCount, delayBetweenRetries } = retryOptions.retryOptions;
        
        try {
            const result = await retryOptions.operationToExecute();

            this._logger.debug(retryOptions.guid, 'Successfully fetched result in retry', undefined, logFormatter);

            return {
                result,
                retryOptions: {
                    maxRetryCount
                }
            };

        } catch (err) {
            if (maxRetryCount > 1) {
                // Wait between retries
                //
                await wait(delayBetweenRetries);

                // Pass in a decremented number of retries to the next iteration
                //
                const newRetryValues: Readonly<RetryOptions> = {
                    delayBetweenRetries,
                    maxRetryCount: maxRetryCount - 1
                };


                this._logger.debug(retryOptions.guid, `Starting retry ${newRetryValues.maxRetryCount}`, undefined, logFormatter);

                const nextRetryOptions: RetryOperationOptions<T> = {
                    guid: retryOptions.guid,
                    operationToExecute: retryOptions.operationToExecute,
                    retryOptions: newRetryValues
                }

                return await this.retryAsync(nextRetryOptions);
            }

            // After the maximum retry has been exhausted just throw the error
            //
            throw err;
        }
    }
}
