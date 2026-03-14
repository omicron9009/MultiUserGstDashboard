import { buildUrl, request } from "./http";

export const gstr1Service = {
  getAdvanceTax: (gstin: string, year: string, month: string) =>
    request(buildUrl(`/gstr1/advance-tax/${gstin}/${year}/${month}`)),

  getB2B: (gstin: string, year: string, month: string, params?: Record<string, unknown>) =>
    request(buildUrl(`/gstr1/b2b/${gstin}/${year}/${month}`, params)),

  getSummary: (gstin: string, year: string, month: string, summaryType: "short" | "long" = "short") =>
    request(buildUrl(`/gstr1/summary/${gstin}/${year}/${month}`, { summary_type: summaryType })),

  getB2CSA: (gstin: string, year: string, month: string) =>
    request(`/gstr1/b2csa/${gstin}/${year}/${month}`),

  getB2CS: (gstin: string, year: string, month: string) =>
    request(`/gstr1/b2cs/${gstin}/${year}/${month}`),

  getCDNR: (gstin: string, year: string, month: string, params?: Record<string, unknown>) =>
    request(buildUrl(`/gstr1/cdnr/${gstin}/${year}/${month}`, params)),

  getDocIssue: (gstin: string, year: string, month: string) =>
    request(`/gstr1/doc-issue/${gstin}/${year}/${month}`),

  getHSN: (gstin: string, year: string, month: string) =>
    request(`/gstr1/hsn/${gstin}/${year}/${month}`),

  getNil: (gstin: string, year: string, month: string) =>
    request(`/gstr1/nil/${gstin}/${year}/${month}`),

  getB2CL: (gstin: string, year: string, month: string, params?: Record<string, unknown>) =>
    request(buildUrl(`/gstr1/b2cl/${gstin}/${year}/${month}`, params)),

  getCDNUR: (gstin: string, year: string, month: string) =>
    request(`/gstr1/cdnur/${gstin}/${year}/${month}`),

  getExp: (gstin: string, year: string, month: string) =>
    request(`/gstr1/exp/${gstin}/${year}/${month}`),
};
