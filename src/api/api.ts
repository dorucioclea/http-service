import axios, { AxiosInstance, AxiosPromise, AxiosRequestConfig } from "axios";
import { ILogger } from "./logging/iLogger";
import { RetryOptions, Retry } from "./retry";
import { Guard } from "./utils/guard";
import { Guid } from "guid-typescript";

export interface ApiServiceConfig extends AxiosRequestConfig {
  localCache?: boolean;
  retryOptions?: RetryOptions;
}

enum HttpOperations {
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  GET = 'GET'
}

/**
 * Simple http service class with built-in retry support
 */
export class ApiService {

  /**
   * No retry object
   */
  private static noRetry: RetryOptions = {
    delayBetweenRetries: 0,
    maxRetryCount: 1
  };

  /**
   * Minimal default configuration for `Http Service`
   */
  private static DefaultConfig: ApiServiceConfig = {
    retryOptions: ApiService.noRetry
  };

  /**
   * Axios Http client
   */
  private readonly _httpClient: AxiosInstance;

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
    public options: ApiServiceConfig = ApiService.DefaultConfig,
    public logger: ILogger<string>
  ) {

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
    const getOperationResponse = await this._makeRequest<T>(HttpOperations.GET, url, queryParams);

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
    body: object,
    queryParams?: object
  ): Promise<T> {
    const postOperationResponse = await this._makeRequest<T>(HttpOperations.POST, url, queryParams, body);

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
    body: object,
    queryParams?: object
  ): Promise<T> {
    const putOperationResponse = await this._makeRequest<T>(HttpOperations.PUT, url, queryParams, body);

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
    body: object,
    queryParams?: object
  ): Promise<T> {
    const patchOperationResponse = await this._makeRequest<T>(HttpOperations.PATCH, url, queryParams, body);

    return patchOperationResponse;
  }

  /**
   * Execute a `Delete operation`
   * @param url URL to call - it's relative to the `BaseURL` passed into the configuration
   * @param queryParams Query parameters to pass to the `HTTP call`
   */
  public async delete(url: string, queryParams?: object): Promise<void> {
    const deleteOperationResponse = await this._makeRequest<void>(HttpOperations.DELETE, url, queryParams);

    return deleteOperationResponse;
  }

  private async _makeRequest<T>(
    method: HttpOperations,
    url: string,
    queryParams?: object,
    body?: object
  ): Promise<T> {
    let request: AxiosPromise<T>;

    const retryConfiguration = this.getRetryConfiguration();

    switch (method) {
      case HttpOperations.GET:
        request = this._httpClient.get<T>(url, { params: queryParams });
        break;
      case HttpOperations.POST:
        request = this._httpClient.post<T>(url, body, { params: queryParams });
        break;
      case HttpOperations.PUT:
        request = this._httpClient.put<T>(url, body, { params: queryParams });
        break;
      case HttpOperations.PATCH:
        request = this._httpClient.patch<T>(url, body, { params: queryParams });
        break;
      case HttpOperations.DELETE:
        request = this._httpClient.delete(url, { params: queryParams });
        break;

      default:
        throw new Error("Method not supported");
    }

    const requestId = this.getRequestId();

    const operationResponse = await this._retry.retryAsync(requestId, async () => {
      const response = await request;
      const data: T = response.data;
      return data;
    }, retryConfiguration);

    return operationResponse;
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
  private getRetryConfiguration(): RetryOptions {
    const options = this.options.retryOptions;

    // In case we don't have a retry policy setup, just return no retry
    //
    return options || ApiService.noRetry;
  }
}
