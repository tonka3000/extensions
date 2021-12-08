import { getPreferenceValues } from "@raycast/api";
import { getClientId } from "./lib/oauth";

export function useV2API(): boolean {
  const cid = getClientId();
  if (cid && cid.length > 0) {
    return true;
  }
  return false;
}

export function shouldShowListWithDetails(): boolean {
  const pref = getPreferenceValues();
  return (pref.listwithdetail as boolean) || true;
}
