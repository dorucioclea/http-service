import axios, { AxiosInstance, AxiosPromise, AxiosRequestConfig } from "axios";
import { RetryOptions, retryAsync } from "./retry";

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

  private _httpClient: AxiosInstance;

  constructor(public options: ApiServiceConfig = ApiService.DefaultConfig) {
    this._httpClient = axios.create(options);
  }

  public async get<T>(url: string, queryParams?: object): Promise<T> {
    const getOperationResponse =  await retryAsync(async () => {
      return await this._makeRequest<T>(HttpOperations.GET, url, queryParams);
    }, this.getRetryConfiguration());

    return getOperationResponse;
  }

  public async post<T>(
    url: string,
    body: object,
    queryParams?: object
  ): Promise<T> {
    const postOperationResponse = await retryAsync(async () => {
      return await this._makeRequest<T>(HttpOperations.POST, url, queryParams, body);
    }, this.getRetryConfiguration());

    return postOperationResponse;
  }

  public async put<T>(
    url: string,
    body: object,
    queryParams?: object
  ): Promise<T> {
    const putOperationResponse = await retryAsync(async () => {
      return await this._makeRequest<T>(HttpOperations.PUT, url, queryParams, body);
    }, this.getRetryConfiguration());

    return putOperationResponse;
  }

  public async patch<T>(
    url: string,
    body: object,
    queryParams?: object
  ): Promise<T> {
    const patchOperationResponse = await retryAsync(async () => {
      return await this._makeRequest<T>(HttpOperations.PATCH, url, queryParams, body);
    }, this.getRetryConfiguration());

    return patchOperationResponse;
  }

  public async delete(url: string, queryParams?: object): Promise<void> {
    const deleteOperationResponse = await retryAsync(async () => {
      return await this._makeRequest<void>(HttpOperations.DELETE, url, queryParams);
    }, this.getRetryConfiguration());

    return deleteOperationResponse;
  }

  private async _makeRequest<T>(
    method: HttpOperations,
    url: string,
    queryParams?: object,
    body?: object
  ): Promise<T> {
    let request: AxiosPromise<T>;
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

    const response = await request;

    const data: T = response.data;

    return data;
  }

  private getRetryConfiguration(): RetryOptions {
    const options = this.options.retryOptions;

    // In case we don't have a retry policy setup, just return no retry
    //
    return options || ApiService.noRetry;
  }
}
