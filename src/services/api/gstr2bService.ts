import { buildUrl, request } from "./http";

export const gstr2bService = {
  get: (gstin: string, year: string, month: string, params?: Record<string, unknown>) =>
    request(buildUrl(`/gstr2B/gstr2b/${gstin}/${year}/${month}`, params)),

  getRegenerationStatus: (gstin: string, referenceId: string) =>
    request(buildUrl(`/gstr2B/gstr2b/${gstin}/regenerate/status`, { reference_id: referenceId })),
};
