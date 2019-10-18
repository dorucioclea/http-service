import { wait } from './utils/wait';
import { ILogger } from './logging/iLogger';
import { Guard } from './utils/guard';
import { Guid } from 'guid-typescript';
import { logFormatter } from './utils/log-formatter';

export interface RetryOptions {
    maxRetryCount: number;
    delayBetweenRetries: number;
}

export interface RetryResult<T> {
    retryOptions: Partial<RetryOptions>;
    result: T;
}

export class Retry {


    private readonly _logger: ILogger<string>;

    public constructor(
        public logger: ILogger<string>
    ) {
        Guard.throwIfNullOrEmpty(logger, 'logger');

        this._logger = logger;
    }


    public async retryAsync<T>(guid: Guid, operationToExecute: () => Promise<T>, { maxRetryCount, delayBetweenRetries }: RetryOptions): Promise<RetryResult<T>> {
        try {
            const result = await operationToExecute();

            this._logger.debug(guid, 'Successfully fetched result in retry', undefined, logFormatter);

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
                const newFunctionArguments: RetryOptions = {
                    delayBetweenRetries,
                    maxRetryCount: maxRetryCount - 1
                };


                this._logger.debug(guid, `Starting retry ${newFunctionArguments.maxRetryCount}`, undefined, logFormatter);
                return await this.retryAsync(guid, operationToExecute, newFunctionArguments);
            }

            // After the maximum retry has been exhausted just throw the error
            //
            throw err;
        }
    }
}
