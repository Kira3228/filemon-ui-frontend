import { BASE_URL } from "@/constants";
import { ApiErrorResponse } from "./contracts";

interface IDownloadOptions {
  filename: string;
}

type QueryParamPrimitive = string | number | boolean | null | undefined;
type QueryParamValue = QueryParamPrimitive | QueryParamPrimitive[];
type QueryParams = Record<string, QueryParamValue>;

type JsonBody = object | unknown[] | string | number | boolean | null;
type JsonMethod = "GET" | "POST" | "PATCH" | "DELETE";

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

const readJsonSafely = async (res: Response): Promise<unknown> => {
  const text = await res.text();

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
};

const readHttpError = async (
  res: Response,
  fallback: string,
): Promise<ApiError> => {
  const fallbackPayload: ApiErrorResponse = {
    status: res.status,
    code: res.status >= 500 ? "INTERNAL_ERROR" : "REQUEST_FAILED",
    message: fallback,
  };

  const payload = await readJsonSafely(res);

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

const appendQueryParam = (
  searchParams: URLSearchParams,
  key: string,
  value: QueryParamValue,
) => {
  if (Array.isArray(value)) {
    value.forEach((item) => appendQueryParam(searchParams, key, item));
    return;
  }

  if (value === undefined || value === null || value === "") {
    return;
  }

  searchParams.append(key, String(value));
};

const buildUrl = (endpoint: string, params?: QueryParams): string => {
  const url = new URL(endpoint, BASE_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      appendQueryParam(url.searchParams, key, value);
    });
  }

  return url.toString();
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
  const url = buildUrl(endpoint, options.params);
  const hasBody = typeof options.body !== "undefined";

  const res = await fetch(url, {
    method,
    cache: "no-store",
    headers: hasBody ? { "Content-Type": "application/json" } : undefined,
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    throw await readHttpError(res, `${method} ${url} failed ${res.status}`);
  }

  const payload = await readJsonSafely(res);

  return payload as TResponse;
};

const requestBlob = async <
  TBody extends JsonBody | undefined = undefined,
  TParams extends QueryParams = QueryParams,
>(
  method: "GET" | "POST",
  endpoint: string,
  options: {
    body?: TBody;
    params?: TParams;
  } = {},
): Promise<Blob> => {
  const url = buildUrl(endpoint, options.params);
  const hasBody = typeof options.body !== "undefined";

  const res = await fetch(url, {
    method,
    cache: "no-store",
    headers: hasBody ? { "Content-Type": "application/json" } : undefined,
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    throw await readHttpError(res, `${method} ${url} failed ${res.status}`);
  }

  return res.blob();
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