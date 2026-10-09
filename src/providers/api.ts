const apiOrigin = (
  import.meta.env.VITE_CRM_API_URL ??
  (import.meta.env.DEV ? "http://localhost:3000" : "")
).replace(/\/$/, "");

export const crmApiUrl = `${apiOrigin}/api/crm`;
