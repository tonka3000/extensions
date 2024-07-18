import { ha } from "@lib/common";
import { HAServiceCall } from "./hooks";

export interface HAServiceFieldSelectorNumber {
  min?: number | null;
  max?: number | null;
  unit_of_measurement?: string;
}

export interface HAServiceFieldSelectorIcon {
  placeholder?: string | null;
}

export interface HAServiceFieldSelectorLabel {
  multiple?: boolean | null;
}

export interface HAServiceFieldSelectorEntity {
  multiple?: boolean | null;
}

export interface HAServiceFieldSelectorDevice {
  integration?: string | null;
}

export interface HAServiceFieldSelectorSelectOption {
  label: string;
  value: string;
}

export interface HAServiceFieldSelectorSelect {
  options?: HAServiceFieldSelectorSelectOption[] | string[] | null;
}

export interface HAServiceFieldSelector {
  text?: string | null;
  area?: string | null;
  floor?: string | null;
  config_entry?: string | null;
  object?: string | null;
  number?: HAServiceFieldSelectorNumber | null;
  icon?: HAServiceFieldSelectorIcon | null;
  label?: HAServiceFieldSelectorLabel | null;
  entity?: HAServiceFieldSelectorEntity | null;
  device?: HAServiceFieldSelectorDevice | null;
  boolean?: boolean | null;
  select?: HAServiceFieldSelectorSelect | null;
  theme?: string | null;
}

export interface HAServiceField {
  required?: boolean;
  name?: string;
  description: string;
  collapsed?: boolean; // don't show in the UI mode
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  example: any;
  selector?: HAServiceFieldSelector;
}

export interface HAServiceTargetEntity {}

export interface HAServiceTarget {
  entity?: HAServiceTargetEntity[] | null;
}

export interface HAServiceMeta {
  name: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: Record<string, HAServiceField>;
  target?: HAServiceTarget;
}

export interface HAService {
  domain: string;
  services: Record<string, HAServiceMeta> | undefined;
}

export async function getHomeAssistantServices() {
  const response = await ha.fetch("services");
  return response as HAService[] | undefined;
}

export function fullHAServiceName(serviceCall: HAServiceCall) {
  return `${serviceCall.domain}.${serviceCall.service}`;
}

export function getNameOfHAServiceField(field: HAServiceField, fallback: string) {
  if (field.name !== undefined && field.name !== null && field.name.trim().length > 0) {
    return field.name;
  }
  return fallback;
}

export interface HAServiceCallPayload {
  domain: string;
  service: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export function getHAServiceQuicklink(payload: HAServiceCallPayload) {
  console.log(JSON.stringify(payload));
  const encoded = encodeURI(JSON.stringify(payload));
  return `raycast://extensions/tonka3000/homeassistant/runService?context=${encoded}`;
}
