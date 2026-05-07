import { BASE_URL } from "@/constants";
import { ApiErrorResponse } from "./contracts";
import axios, { AxiosError, AxiosResponse, Method, ResponseType } from "axios";

interface IDownloadOptions {
  filename: string;
}

type QueryParamPrimitive = string | number | boolean | null | undefined;
type QueryParamValue = QueryParamPrimitive | QueryParamPrimitive[];
type QueryParams = Record<string, QueryParamValue>;

type JsonBody = object | unknown[] | string | number | boolean | null;
type JsonMethod = "GET" | "POST" | "PATCH" | "DELETE";
type BlobMethod = "GET" | "POST";

const isApiErrorResponse = (payload: unknown): payload is ApiErrorResponse => {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Partial<ApiErrorResponse>;

  return (
    typeof candidate.status === "number" &&
    typeof candidate.code === "string" &&
    typeof candidate.message === "string"
  );
};

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(payload: ApiErrorResponse) {
    super(payload.message);
    this.name = "ApiError";
    this.status = payload.status;
    this.code = payload.code;
    this.details = payload.details;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}



const createHttpError = (
  status: number,
  payload: unknown,
  fallback: string,
): ApiError => {
  const fallbackPayload: ApiErrorResponse = {
    status,
    code: status >= 500 ? "INTERNAL_ERROR" : "REQUEST_FAILED",
    message: fallback,
  };

  if (isApiErrorResponse(payload)) {
    return new ApiError(payload);
  }

  if (
    payload &&
    typeof payload === "object" &&
    typeof (payload as { message?: unknown }).message === "string"
  ) {
    return new ApiError({
      ...fallbackPayload,
      message: (payload as { message: string }).message,
      details: (payload as { details?: unknown }).details,
    });
  }

  return new ApiError(fallbackPayload);
};

const normalizeEndpoint = (endpoint: string): string => endpoint.replace(/^\/+/, "");

const normalizeParams = (params?: QueryParams): QueryParams | undefined => {
  if (!params) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
};

const resolveError = (
  error: unknown,
  method: Method,
  endpoint: string,
): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status ?? 0;
    const fallback = `${method} ${endpoint} failed ${status || axiosError.message}`;

    return createHttpError(status, axiosError.response?.data, fallback);
  }

  return new ApiError({
    status: 0,
    code: "REQUEST_FAILED",
    message: error instanceof Error ? error.message : `${method} ${endpoint} failed`,
  });
};

const requestJson = async <
  TResponse,
  TBody extends JsonBody | undefined = undefined,
  TParams extends QueryParams = QueryParams,
>(
  method: JsonMethod,
  endpoint: string,
  options: {
    body?: TBody;
    params?: TParams;
  } = {},
): Promise<TResponse> => {
  try {
    const response = await v1api.request<TResponse>({
      method,
      url: normalizeEndpoint(endpoint),
      data: options.body,
      params: normalizeParams(options.params),
    });

    return response.data;
  } catch (error) {
    throw resolveError(error, method, endpoint);
  }
};

const requestBlob = async <
  TBody extends JsonBody | undefined = undefined,
  TParams extends QueryParams = QueryParams,
>(
  method: BlobMethod,
  endpoint: string,
  options: {
    body?: TBody;
    params?: TParams;
  } = {},
): Promise<Blob> => {
  try {
    const response = await v2api.request<Blob>({
      method,
      url: normalizeEndpoint(endpoint),
      data: options.body,
      params: normalizeParams(options.params),
      responseType: "blob" as ResponseType,
    });

    return response.data;
  } catch (error) {
    throw resolveError(error, method, endpoint);
  }
};

const downloadBlob = (blob: Blob, options: IDownloadOptions) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = options.filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 0);
};

export const createApiClient = () => {
  const get = <TResponse, TParams extends QueryParams = QueryParams>(
    endpoint: string,
    params?: TParams,
  ) => requestJson<TResponse, undefined, TParams>("GET", endpoint, { params });

  const post = <
    TResponse,
    TBody extends JsonBody = JsonBody,
    TParams extends QueryParams = QueryParams,
  >(
    endpoint: string,
    body: TBody,
    params?: TParams,
  ) =>
    requestJson<TResponse, TBody, TParams>("POST", endpoint, {
      body,
      params,
    });

  const patch = <
    TResponse,
    TBody extends JsonBody | undefined = JsonBody | undefined,
    TParams extends QueryParams = QueryParams,
  >(
    endpoint: string,
    body?: TBody,
    params?: TParams,
  ) =>
    requestJson<TResponse, TBody, TParams>("PATCH", endpoint, {
      body,
      params,
    });

  const remove = <TResponse, TParams extends QueryParams = QueryParams>(
    endpoint: string,
    params?: TParams,
  ) =>
    requestJson<TResponse, undefined, TParams>("DELETE", endpoint, {
      params,
    });

  const getBlob = <TParams extends QueryParams = QueryParams>(
    endpoint: string,
    params?: TParams,
  ) => requestBlob<undefined, TParams>("GET", endpoint, { params });

  const postBlob = <TBody extends JsonBody = JsonBody>(
    endpoint: string,
    body: TBody,
  ) => requestBlob<TBody>("POST", endpoint, { body });

  return {
    get,
    post,
    patch,
    delete: remove,
    getBlob,
    postBlob,
    downloadBlob,
  };
};

export const api = createApiClient();

export const v1api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const v2api = axios.create({
  baseURL: "http://localhost:5000/api/v2",
  headers: {
    "Content-Type": "application/json",
  }
})



v2api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response) {
      if (!originalRequest._retry) {

        originalRequest._retry = true;
        console.log(`пися попа`);

        originalRequest.baseURL = "http://localhost:5000/api/v1";

        try {
          return await v2api.request(originalRequest);
        } catch (e) {
          return Promise.reject(e);
        }
      }
    }

    return Promise.reject(error);
  }
);