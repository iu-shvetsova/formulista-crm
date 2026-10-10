import type {
  BaseRecord,
  CustomParams,
  CustomResponse,
  DataProvider,
  GetListParams,
  GetListResponse,
  GetOneParams,
  GetOneResponse,
  HttpError,
} from "@refinedev/core";
import { crmApiUrl } from "./api";

type ListResponse<TData> = {
  items: TData[];
  total: number;
  page: number;
  limit: number;
};

function unsupported(): Promise<never> {
  return Promise.reject(new Error("This operation is not available in the CRM API."));
}

async function getJson<TData>(url: string, failureMessage: string): Promise<TData> {
  let response: Response;
  try {
    response = await fetch(url, {
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    throw { message: "Unable to reach the server.", statusCode: 0 } satisfies HttpError;
  }

  if (!response.ok) {
    throw {
      message: response.status === 401
        ? "Session expired. Sign in again."
        : response.status === 404
          ? "User not found."
          : failureMessage,
      statusCode: response.status,
    } satisfies HttpError;
  }

  return response.json() as Promise<TData>;
}

async function mutateJson<TData>(
  url: string,
  method: "post" | "put" | "delete",
  payload: unknown,
): Promise<TData> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: method.toUpperCase(),
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {}),
    });
  } catch {
    throw { message: "Unable to reach the server.", statusCode: 0 } satisfies HttpError;
  }

  if (!response.ok) {
    const errorBody: unknown = await response.json().catch(() => null);
    const serverMessage =
      typeof errorBody === "object" &&
      errorBody !== null &&
      "error" in errorBody &&
      typeof errorBody.error === "string"
        ? errorBody.error
        : null;
    const messages: Record<number, string> = {
      401: "Session expired. Sign in again.",
      403: "This CRM origin is not allowed by the server.",
      404: "User not found.",
      409: "Lifetime access is no longer active.",
    };
    throw {
      message:
        messages[response.status] ??
        (response.status === 400 ? serverMessage : null) ??
        "Unable to update user access.",
      statusCode: response.status,
    } satisfies HttpError;
  }

  return response.json() as Promise<TData>;
}

export const dataProvider: DataProvider = {
  getApiUrl: () => crmApiUrl,
  getList: async <TData extends BaseRecord = BaseRecord>({
    resource,
    pagination,
    filters,
  }: GetListParams): Promise<GetListResponse<TData>> => {
    if (resource !== "users" && resource !== "analyses" && resource !== "unknown-ingredients") {
      return unsupported();
    }

    const query = new URLSearchParams({
      page: String(pagination?.currentPage ?? 1),
      limit: String(pagination?.pageSize ?? 20),
    });
    let url: string;
    if (resource === "analyses") {
      const userIdFilter = filters?.find((filter) => "field" in filter && filter.field === "userId");
      if (!userIdFilter || !("value" in userIdFilter) || userIdFilter.value == null) {
        return unsupported();
      }
      const statusFilter = filters?.find((filter) => "field" in filter && filter.field === "status");
      if (statusFilter && "value" in statusFilter && typeof statusFilter.value === "string" && statusFilter.value) {
        query.set("status", statusFilter.value);
      }
      url = `${crmApiUrl}/users/${encodeURIComponent(String(userIdFilter.value))}/analyses?${query}`;
    } else if (resource === "unknown-ingredients") {
      const statusFilter = filters?.find((filter) => "field" in filter && filter.field === "status");
      if (statusFilter && "value" in statusFilter && typeof statusFilter.value === "string" && statusFilter.value) {
        query.set("status", statusFilter.value);
      }
      url = `${crmApiUrl}/unknown-ingredients?${query}`;
    } else {
      const searchFilter = filters?.find((filter) => "field" in filter && filter.field === "search");
      if (searchFilter && "value" in searchFilter && typeof searchFilter.value === "string" && searchFilter.value.trim()) {
        query.set("search", searchFilter.value.trim());
      }
      url = `${crmApiUrl}/users?${query}`;
    }

    const result = await getJson<ListResponse<TData>>(
      url,
      resource === "users"
        ? "Unable to load users."
        : resource === "analyses"
          ? "Unable to load reports."
          : "Unable to load ingredients.",
    );
    return { data: result.items, total: result.total };
  },
  getOne: async <TData extends BaseRecord = BaseRecord>({
    resource,
    id,
  }: GetOneParams): Promise<GetOneResponse<TData>> => {
    if (resource !== "users") return unsupported();
    const data = await getJson<TData>(
      `${crmApiUrl}/users/${encodeURIComponent(String(id))}`,
      "Unable to load user details.",
    );
    return { data };
  },
  custom: async <TData extends BaseRecord = BaseRecord>({
    url,
    method,
    payload,
  }: CustomParams): Promise<CustomResponse<TData>> => {
    const userEndpoint = url.startsWith(`${crmApiUrl}/users/`);
    const lifetimeEndpoint = url.endsWith("/lifetime-access");
    const editableEndpoint = [
      "/paid-until",
      "/subscription-credits-reset-at",
      "/free-analysis-credits",
      "/subscription-analysis-credits",
    ].some((path) => url.endsWith(path));
    if (!userEndpoint || !(
      ((method === "post" || method === "delete") && lifetimeEndpoint) ||
      (method === "put" && editableEndpoint)
    )) {
      return unsupported();
    }
    const data = await mutateJson<TData>(url, method, payload);
    return { data };
  },
  create: unsupported,
  update: unsupported,
  deleteOne: unsupported,
};
