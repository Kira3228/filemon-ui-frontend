import { BASE_URL } from "@/constants";
import { ApiErrorResponse } from "./contracts";

interface IDownloadOptions {
  filename: string;
}

type QueryParamValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryParamValue>;
type JsonBody =
  | object
  | unknown[]
  | string
  | number
  | boolean
  | null;
type JsonMethod = "GET" | "POST" | "PATCH";

const isApiErrorResponse = (payload: unknown): payload is ApiErrorResponse => {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Partial<ApiErrorResponse>;
  return (
    typeof candidate.status === "number"
    && typeof candidate.code === "string"
    && typeof candidate.message === "string"
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

const readHttpError = async (res: Response, fallback: string) => {
  const fallbackPayload: ApiErrorResponse = {
    status: res.status,
    code: res.status >= 500 ? "INTERNAL_ERROR" : "REQUEST_FAILED",
    message: fallback,
  };

  try {
    const payload = await res.json() as unknown;
    if (isApiErrorResponse(payload)) {
      return new ApiError(payload);
    }
    if (payload && typeof payload === "object" && typeof (payload as { message?: string }).message === "string") {
      return new ApiError({
        ...fallbackPayload,
        message: (payload as { message: string }).message,
        details: (payload as { details?: unknown }).details,
      });
    }
  } catch {
    // Ignore non-JSON error responses and use fallback below.
  }

  return new ApiError(fallbackPayload);
};

const buildUrl = (endpoint: string, params?: QueryParams): string => {
  const url = `${BASE_URL}${endpoint}`;

  if (!params) {
    return url;
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const queryString = searchParams.toString();
  return queryString ? `${url}?${queryString}` : url;
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

  if (res.status === 204) {
    return {} as TResponse;
  }

  return res.json() as Promise<TResponse>;
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
  const link = document.createElement(`a`);
  link.href = url;
  link.download = options.filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.URL.revokeObjectURL(url);
};

export const useApi = () => {
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
  ) => requestJson<TResponse, TBody, TParams>("POST", endpoint, { body, params });

  const patch = <TResponse, TBody extends JsonBody | undefined = JsonBody | undefined>(
    endpoint: string,
    body?: TBody,
  ) => requestJson<TResponse, TBody>("PATCH", endpoint, { body });

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
    getBlob,
    postBlob,
    downloadBlob,
  };
};
