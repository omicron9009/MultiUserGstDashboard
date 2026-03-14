import { buildUrl, request } from "./http";

export const returnStatusService = {
  getStatus: (gstin: string, year: string, month: string, referenceId: string) =>
    request(buildUrl(`/return_status/returns/${gstin}/${year}/${month}/status`, { reference_id: referenceId })),
};
