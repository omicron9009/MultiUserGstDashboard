import { buildUrl, request } from "./http";

export const gstr9Service = {
  getDetails: (gstin: string, financialYear: string) =>
    request(buildUrl(`/gstr9/gstr9/${gstin}`, { financial_year: financialYear })),

  getAutoCalculated: (gstin: string, financialYear: string) =>
    request(buildUrl(`/gstr9/gstr9/${gstin}/auto-calculated`, { financial_year: financialYear })),

  getTable8A: (gstin: string, financialYear: string, fileNumber?: string) =>
    request(buildUrl(`/gstr9/gstr9/${gstin}/table-8a`, { financial_year: financialYear, file_number: fileNumber })),
};
