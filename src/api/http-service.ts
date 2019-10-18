import axios, { AxiosInstance, AxiosPromise, AxiosRequestConfig } from "axios";
import { ILogger } from "./logging/iLogger";
import { RetryOptions, Retry, RetryOperationOptions } from "./utils/retry";
import { Guard } from "./utils/guard";
import { Guid } from "guid-typescript";
import { logFormatter } from "./utils/log-formatter";

/**
 * Configuration object that sets `Global options` to the axios layer
 */
export interface ApiServiceConfig extends AxiosRequestConfig {
  localCache?: boolean;
  retryOptions?: RetryOptions;
}

/**
 * Http operations
 */
enum HttpOperations {
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  GET = 'GET'
}

/**
 * Request options for the internal request method
 */
interface RequestOptions<T> {
  method: HttpOperations;
  url: string;
  queryParams?: object;
  body?: Partial<T>;
}

/**
 * Simple http service class with built-in retry support
 */
export class HttpService {

  /**
   * No retry object
   */
  private static noRetry: Readonly<RetryOptions> = {
    delayBetweenRetries: 0,
    maxRetryCount: 1
  };

  /**
   * Minimal default configuration for `Http Service`
   */
  private static DefaultConfig: Readonly<ApiServiceConfig> = {
    retryOptions: HttpService.noRetry
  };

  /**
   * Axios Http client
   */
  private readonly _httpClient: Readonly<AxiosInstance>;

  /**
   * Logger instance
   */
  private readonly _logger: ILogger<string>;

  /**
   * We use this to be able to retry our `HTTP operations`
   */
  private readonly _retry: Retry;

  /**
   * Ctor
   * @param options `Axios options`
   * @param logger Logger instance
   */
  constructor(
    public options: ApiServiceConfig = HttpService.DefaultConfig,
    public logger: ILogger<string>
  ) {

    // Parameter validation
    //
    Guard.throwIfNullOrEmpty(logger, 'logger');

    this._httpClient = axios.create(options);
    this._logger = logger;

    this._retry = new Retry(this._logger);
  }

  /**
   * Execute a `Get operation`
   * @param url URL to call - it's relative to the `BaseURL` passed into the configuration
   * @param queryParams Query parameters to pass to the `HTTP call`
   */
  public async get<T>(url: string, queryParams?: object): Promise<T> {

    // Parameters validation
    //
    Guard.throwIfNullOrEmpty(url, 'url');

    const options: RequestOptions<T> = {
      url,
      method: HttpOperations.GET,
      queryParams
    };

    const getOperationResponse = await this._makeRequest<T>(options);

    return getOperationResponse;
  }

  /**
   * Execute a `Post operation`
   * @param url URL to call - it's relative to the `BaseURL` passed into the configuration
   * @param body Payload to include
   * @param queryParams Query parameters to pass to the `HTTP call`
   */
  public async post<T>(
    url: string,
    body: T,
    queryParams?: object
  ): Promise<T> {

    // Parameters validation
    //
    Guard.throwIfNullOrEmpty(url, 'url');
    Guard.throwIfNullOrEmpty(body, 'body');

    const options: RequestOptions<T> = {
      url,
      body,
      method: HttpOperations.POST,
      queryParams
    };

    const postOperationResponse = await this._makeRequest<T>(options);

    return postOperationResponse;
  }

  /**
   * Execute a `Put operation`
   * @param url URL to call - it's relative to the `BaseURL` passed into the configuration
   * @param body Payload to include
   * @param queryParams Query parameters to pass to the `HTTP call`
   */
  public async put<T>(
    url: string,
    body: T,
    queryParams?: object
  ): Promise<T> {

    // Parameter validation
    //
    Guard.throwIfNullOrEmpty(url, 'url');
    Guard.throwIfNullOrEmpty(body, 'body');

    const options: RequestOptions<T> = {
      url,
      body,
      method: HttpOperations.PUT,
      queryParams
    };

    const putOperationResponse = await this._makeRequest<T>(options);

    return putOperationResponse;
  }

  /**
   * Execute a `Patch operation`
   * @param url URL to call - it's relative to the `BaseURL` passed into the configuration
   * @param body Payload to include
   * @param queryParams Query parameters to pass to the `HTTP call`
   */
  public async patch<T>(
    url: string,
    body: Partial<T>,
    queryParams?: object
  ): Promise<T> {

    // Parameter validation
    //
    Guard.throwIfNullOrEmpty(url, 'url');
    Guard.throwIfNullOrEmpty(body, 'body');

    const options: RequestOptions<T> = {
      url,
      body,
      method: HttpOperations.PATCH,
      queryParams
    };

    const patchOperationResponse = await this._makeRequest<T>(options);

    return patchOperationResponse;
  }

  /**
   * Execute a `Delete operation`
   * @param url URL to call - it's relative to the `BaseURL` passed into the configuration
   * @param queryParams Query parameters to pass to the `HTTP call`
   */
  public async delete(url: string, queryParams?: object): Promise<void> {

    // Parameter validation
    //
    Guard.throwIfNullOrEmpty(url, 'url');

    const options: RequestOptions<void> = {
      url,
      method: HttpOperations.DELETE,
      queryParams
    };

    const deleteOperationResponse = await this._makeRequest<void>(options);

    return deleteOperationResponse;
  }

  /**
   * 
   * @param method `Http method` to request
   * @param url URL to call - it's relative to the `BaseURL` passed into the configuration
   * @param queryParams Query parameters to pass to the `HTTP call`
   * @param body `Payload` to include
   */
  private async _makeRequest<T>(
    options: Readonly<RequestOptions<T>>
  ): Promise<T> {

    // Parameter validation
    //
    Guard.throwIfNullOrEmpty(options, 'options');
    Guard.throwIfNullOrEmpty(options.method, 'method');
    Guard.throwIfNullOrEmpty(options.url, 'url');

    let request: AxiosPromise<T>;

    const requestId = this.getRequestId();
    const retryConfiguration = this.getRetryConfiguration();

    this.logger.debug(requestId, `Doing a ${HttpOperations.GET} operation on url ${options.url}`, undefined, logFormatter);

    switch (options.method) {
      case HttpOperations.GET:
        request = this._httpClient.get<T>(options.url, { params: options.queryParams });
        break;
      case HttpOperations.POST:
        request = this._httpClient.post<T>(options.url, options.body, { params: options.queryParams });
        break;
      case HttpOperations.PUT:
        request = this._httpClient.put<T>(options.url, options.body, { params: options.queryParams });
        break;
      case HttpOperations.PATCH:
        request = this._httpClient.patch<T>(options.url, options.body, { params: options.queryParams });
        break;
      case HttpOperations.DELETE:
        request = this._httpClient.delete(options.url, { params: options.queryParams });
        break;

      default:
        throw new Error("Method not supported");
    }

    const operationPromise = async () => {
      const response = await request;
      const data: T = response.data;
      return data;
    };

    const retryOperationConfiguration: RetryOperationOptions<T> = {
      guid: requestId,
      retryOptions: retryConfiguration,
      operationToExecute: operationPromise
    }

    const operationResponse = await this._retry.retryAsync(retryOperationConfiguration);

    const retryCountLeft = operationResponse.retryOptions.maxRetryCount;

    this.logger.debug(requestId, `Successfully fetched ${options.url} (${HttpOperations.GET} operation) after ${retryConfiguration.maxRetryCount - retryCountLeft} retries`, undefined, logFormatter);

    const data = operationResponse.result;

    return data;
  }

  /**
   * Gets a request id
   */
  private getRequestId(): Guid {
    return Guid.create();
  }

  /**
   * Get a retry configuration or default
   */
  private getRetryConfiguration(): Readonly<RetryOptions> {
    const options = this.options.retryOptions;

    // In case we don't have a retry policy setup, just return no retry
    //
    return options || HttpService.noRetry;
  }
}
