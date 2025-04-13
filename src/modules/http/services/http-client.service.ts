import { Injectable } from '@nestjs/common';
import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  AxiosResponse,
  Method,
} from 'axios';
import { Request } from 'express';

type RequestHeaders = Record<string, string | number> | AxiosHeaders;
export type HttpClientCustomContext = {
  headers?: Record<string, string> | AxiosHeaders;
  baseURL?: string;
};
@Injectable()
export abstract class HttpClientService {
  protected context: HttpClientCustomContext;
  protected readonly axios: AxiosInstance;
  protected abstract buildHeaders(headers: RequestHeaders): AxiosHeaders;
  protected abstract handleResponse<T>(
    res: AxiosResponse<T> | AxiosError<T>,
  ): T;
  constructor(
    protected readonly options?: {
      timeout?: number;
    },
    protected readonly request?: Request,
  ) {
    this.axios = axios.create({
      headers: {},
      maxRedirects: 3,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: options?.timeout ?? 0,
    });
  }

  public setContextInfo(context: HttpClientCustomContext) {
    this.context = context;
  }
  public getContextInfo(): HttpClientCustomContext {
    return this.context;
  }

  async get<T>(
    url: string,
    params: { [k: string]: string },
    headers?: RequestHeaders,
  ): Promise<T> {
    headers = this.buildHeaders({ ...this.context?.headers, ...headers });
    const response = await this.axios
      .get<T>(url, {
        baseURL: this.context?.baseURL,
        headers,
        params,
      })
      .catch((ex) => ex);
    return this.handleResponse(response);
  }

  async post<T>(url: string, data: any, headers?: RequestHeaders): Promise<T> {
    headers = this.buildHeaders({ ...this.context?.headers, ...headers });
    const response = await this.axios
      .post<T>(url, data ?? {}, {
        baseURL: this.context?.baseURL,
        headers,
      })
      .catch((ex) => ex);
    return this.handleResponse(response);
  }

  async put<T>(url: string, data: any, headers?: RequestHeaders): Promise<T> {
    headers = this.buildHeaders({ ...this.context?.headers, ...headers });
    const response = await this.axios
      .put<T>(url, data ?? {}, {
        baseURL: this.context?.baseURL,
        headers,
      })
      .catch((ex) => ex);
    return this.handleResponse(response);
  }

  async patch<T>(url: string, data: any, headers?: RequestHeaders): Promise<T> {
    headers = this.buildHeaders({ ...this.context?.headers, ...headers });
    const response = await this.axios
      .patch<T>(url, data ?? {}, {
        baseURL: this.context?.baseURL,
        headers,
      })
      .catch((ex) => ex);
    return this.handleResponse(response);
  }

  async delete(
    url: string,
    params: { [k: string]: string },
    data: any,
    headers?: RequestHeaders,
  ) {
    headers = this.buildHeaders({ ...this.context?.headers, ...headers });
    const response = await this.axios
      .delete(url, { baseURL: this.context?.baseURL, params, headers, data })
      .catch((ex) => ex);
    return this.handleResponse(response);
  }

  async forward<T>(
    url: string,
    method: Method,
    data?: any,
    params?: any,
    headers?: any,
  ): Promise<T> {
    headers = this.buildHeaders({ ...this.context?.headers, ...headers });
    const response = await axios
      .request<T>({
        url,
        method,
        data: data ?? {},
        headers,
        params,
        baseURL: this.context?.baseURL,
      })
      .catch((ex) => ex);
    return this.handleResponse(response);
  }

  async forwardFromRequest<T>(
    url: string,
    method: Method,
    headers?: any,
  ): Promise<T> {
    headers = this.buildHeaders({ ...this.context?.headers, ...headers });
    const response = await axios
      .request<T>({
        url,
        method,
        data: await this.request?.body,
        headers,
        params: this.request?.query,
        baseURL: this.context?.baseURL,
      })
      .catch((ex) => ex);
    return this.handleResponse(response);
  }
}
