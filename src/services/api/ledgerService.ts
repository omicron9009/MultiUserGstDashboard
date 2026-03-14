import { buildUrl, request } from "./http";

export const ledgerService = {
  getCashItcBalance: (gstin: string, year: string, month: string) =>
    request(`/ledgers/ledgers/${gstin}/${year}/${month}/balance`),

  getCashLedger: (gstin: string, from: string, to: string) =>
    request(buildUrl(`/ledgers/ledgers/${gstin}/cash`, { from, to })),

  getItcLedger: (gstin: string, from: string, to: string) =>
    request(buildUrl(`/ledgers/ledgers/${gstin}/itc`, { from, to })),

  getTaxLiabilityLedger: (gstin: string, year: string, month: string, range?: { from?: string; to?: string }) =>
    request(buildUrl(`/ledgers/ledgers/${gstin}/tax/${year}/${month}`, range)),
};
