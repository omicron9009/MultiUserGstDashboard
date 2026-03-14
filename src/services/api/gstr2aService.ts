import { buildUrl, request } from "./http";

export const gstr2aService = {
  getB2B: (gstin: string, year: string, month: string, params?: Record<string, unknown>) =>
    request(buildUrl(`/gstr2A/b2b/${gstin}/${year}/${month}`, params)),

  getB2BA: (gstin: string, year: string, month: string, params?: Record<string, unknown>) =>
    request(buildUrl(`/gstr2A/b2ba/${gstin}/${year}/${month}`, params)),

  getCDN: (gstin: string, year: string, month: string, params?: Record<string, unknown>) =>
    request(buildUrl(`/gstr2A/cdn/${gstin}/${year}/${month}`, params)),

  getCDNA: (gstin: string, year: string, month: string, params?: Record<string, unknown>) =>
    request(buildUrl(`/gstr2A/cdna/${gstin}/${year}/${month}`, params)),

  getDocument: (gstin: string, year: string, month: string) =>
    request(`/gstr2A/document/${gstin}/${year}/${month}`),

  getISD: (gstin: string, year: string, month: string, params?: Record<string, unknown>) =>
    request(buildUrl(`/gstr2A/isd/${gstin}/${year}/${month}`, params)),

  getTDS: (gstin: string, year: string, month: string) =>
    request(`/gstr2A/gstr2a/${gstin}/${year}/${month}/tds`),
};
