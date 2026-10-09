import type { BaseRecord, DataProvider, GetListParams, GetListResponse, HttpError } from "@refinedev/core";
import { crmApiUrl } from "./api";

type UsersResponse<TData> = {
  items: TData[];
  total: number;
  page: number;
  limit: number;
};

function unsupported(): Promise<never> {
  return Promise.reject(new Error("This operation is not available in the CRM API."));
}

export const dataProvider: DataProvider = {
  getApiUrl: () => crmApiUrl,
  getList: async <TData extends BaseRecord = BaseRecord>({
    resource,
    pagination,
    filters,
  }: GetListParams): Promise<GetListResponse<TData>> => {
    if (resource !== "users") return unsupported();

    const query = new URLSearchParams({
      page: String(pagination?.currentPage ?? 1),
      limit: String(pagination?.pageSize ?? 20),
    });
    const searchFilter = filters?.find((filter) => "field" in filter && filter.field === "search");
    if (searchFilter && "value" in searchFilter && typeof searchFilter.value === "string" && searchFilter.value.trim()) {
      query.set("search", searchFilter.value.trim());
    }

    let response: Response;
    try {
      response = await fetch(`${crmApiUrl}/users?${query}`, {
        credentials: "include",
        cache: "no-store",
      });
    } catch {
      throw { message: "Unable to reach the server.", statusCode: 0 } satisfies HttpError;
    }

    if (!response.ok) {
      throw {
        message: response.status === 401 ? "Session expired. Sign in again." : "Unable to load users.",
        statusCode: response.status,
      } satisfies HttpError;
    }

    const result = (await response.json()) as UsersResponse<TData>;
    return { data: result.items, total: result.total };
  },
  getOne: unsupported,
  create: unsupported,
  update: unsupported,
  deleteOne: unsupported,
};
