import { request } from "./http";

export const gstr3bService = {
  getDetails: (gstin: string, year: string, month: string) =>
    request(`/gstr3B/gstr3b/${gstin}/${year}/${month}`),

  getAutoLiability: (gstin: string, year: string, month: string) =>
    request(`/gstr3B/gstr3b/${gstin}/${year}/${month}/auto-liability-calc`),
};
