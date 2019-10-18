import axios, { AxiosInstance, AxiosPromise, AxiosRequestConfig } from "axios";

export interface ApiServiceConfig extends AxiosRequestConfig {
  localCache?: boolean;
}

enum HttpOperations {
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  GET = 'GET'
}

export class ApiService {

  private _httpClient: AxiosInstance;

  constructor(public options: ApiServiceConfig = {}) {
    this._httpClient = axios.create(options);
  }

  public async get<T>(url: string, queryParams?: object): Promise<T> {
    return await this._makeRequest<T>(HttpOperations.GET, url, queryParams);
  }

  public async post<T>(
    url: string,
    body: object,
    queryParams?: object
  ): Promise<T> {
    const postOperationResponse = await this._makeRequest<T>(HttpOperations.POST, url, queryParams, body);

    return postOperationResponse;
  }

  public async put<T>(
    url: string,
    body: object,
    queryParams?: object
  ): Promise<T> {
    const putOperationResponse = await this._makeRequest<T>(HttpOperations.PUT, url, queryParams, body);

    return putOperationResponse;
  }

  public async patch<T>(
    url: string,
    body: object,
    queryParams?: object
  ): Promise<T> {
    const patchOperationResponse = await this._makeRequest<T>(HttpOperations.PATCH, url, queryParams, body);

    return patchOperationResponse;
  }

  public async delete(url: string, queryParams?: object): Promise<void> {
    const deleteOperationResponse =  await this._makeRequest<void>(HttpOperations.DELETE, url, queryParams);

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
}
