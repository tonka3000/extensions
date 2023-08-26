import fetch, { Response } from "node-fetch";
import { UnitSystem, getTemperatureUnit, getUnitSystem, getWindUnit, getWttrWindPostfix } from "./unit";
import { getWindDirectionIcon } from "./icons";

export interface Hourly {
  DewPointC: string;
  DewPointF: string;
  FeelsLikeC: string;
  FeelsLikeF: string;
  HeatIndexC: string;
  HeatIndexF: string;
  WindChillC: string;
  WindChillF: string;
  WindGustKmph: string;
  WindGustMiles: string;
  chanceoffog: string;
  chanceoffrost: string;
  chanceofhightemp: string;
  chanceofovercast: string;
  chanceofrain: string;
  chanceofremdry: string;
  chanceofsnow: string;
  chanceofsunshine: string;
  chanceofthunder: string;
  chanceofwindy: string;
  cloudcover: string;
  humidity: string;
  precipInches: string;
  precipMM: string;
  pressure: string;
  pressureInches: string;
  tempC: string;
  tempF: string;
  time: string;
  uvIndex: string;
  visibility: string;
  visibilityMiles: string;
  weatherCode: string;
  weatherDesc: Array<WeatherDesc>;
  winddir16Point: string;
  winddirDegree: string;
  windspeedKmph: string;
  windspeedMiles: string;
}

export interface WeatherDesc {
  value: string;
}

export interface WeatherConditions {
  humidity: string;
  temp_C: string;
  temp_F: string;
  pressure: string;
  cloudcover: string;
  FeelsLikeC: string;
  FeelsLikeF: string;
  uvIndex: string;
  visibility: string;
  visibilityMiles: string;
  weatherCode: string;
  weatherDesc: Array<WeatherDesc>;
  winddir16Point: string;
  winddirDegree: string;
  windspeedKmph: string;
  windspeedMiles: string;
}

export interface AreaName {
  value: string;
}

export interface CountryName {
  value: string;
}

export interface RegionName {
  value: string;
}

export interface Area {
  areaName: Array<AreaName>;
  country: Array<CountryName>;
  region: Array<RegionName>;
  latitude: string | undefined;
  longitude: string | undefined;
  population: string | undefined;
}

export interface WeatherData {
  avgtempC: string;
  avgtempF: string;
  mintempC: string;
  mintempF: string;
  maxtempC: string;
  maxtempF: string;
  sunHour: string;
  totalSnow_cm: string;
  uvIndex: string;
  date: string;
  hourly: Array<Hourly>;
}

export interface Weather {
  current_condition: Array<WeatherConditions>;
  nearest_area: Array<Area>;
  weather: Array<WeatherData>;
}

function paramString(params: { [key: string]: string }): string {
  const p: string[] = [];
  for (const k in params) {
    const v = encodeURI(params[k]);
    p.push(`${k}=${v}`);
  }
  let prefix = "";
  if (p.length > 0) {
    prefix = "?";
  }
  return prefix + p.join("&");
}

async function toJsonOrError(response: Response): Promise<any> {
  const s = response.status;
  const getJson = async (): Promise<any> => {
    try {
      return await response.json();
    } catch (e: any) {
      throw Error(`Server-side issue at wttr.in (${s} - invalid json). Please try again later`);
    }
  };
  console.log(`status code: ${s}`);
  if (s >= 200 && s < 300) {
    const json = await getJson();
    return json;
  } else if (s == 401) {
    throw Error("Unauthorized");
  } else if (s == 403) {
    const json = await getJson();
    let msg = "Forbidden";
    if (json.error && json.error == "insufficient_scope") {
      msg = "Insufficient API token scope";
    }
    console.log(msg);
    throw Error(msg);
  } else if (s == 404) {
    throw Error("Not found");
  } else if (s >= 400 && s < 500) {
    const json = await getJson();
    console.log(json);
    const msg = json.message;
    throw Error(msg);
  } else if (s >= 500 && s < 600) {
    throw Error(`Server-side issue at wttr.in (${s}). Please try again later`);
  } else {
    console.log("unknown error");
    throw Error(`http status ${s}`);
  }
}

export class Wttr {
  private url = "https://wttr.in";

  public async fetch(city?: string, params: { [key: string]: string } = {}, all = false): Promise<any> {
    try {
      const ps = paramString(params);
      const fullUrl = this.url + "/" + (city ? city : "") + ps;
      console.log(`send GET request: ${fullUrl}`);
      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const json = await toJsonOrError(response);
      return json;
    } catch (error: any) {
      throw Error(error);
    }
  }

  public async getWeather(city?: string, language?: string | undefined): Promise<Weather> {
    // setting lang: "en" manipulate the e.g. kmph values
    const params: Record<string, string> = {
      format: "j1",
    };
    if (language && supportedLanguages.includes(language)) {
      params.lang = language;
    }
    return (await this.fetch(city, params)) as Weather;
  }
}

export const supportedLanguages: string[] = ["en", "de", "fr"];

export const wttr = new Wttr();

export function getCurrentFeelLikeTemperature(
  curcon: WeatherConditions | undefined,
): { value: string; unit: string; valueAndUnit: string } | undefined {
  if (!curcon) {
    return;
  }
  const value = getUnitSystem() === UnitSystem.Imperial ? curcon.FeelsLikeF : curcon.FeelsLikeC;
  const unit = getTemperatureUnit();
  const valueAndUnit = `${value} ${unit}`;
  return { value, unit, valueAndUnit };
}

export function getCurrentUVIndex(curcon: WeatherConditions | undefined): string | undefined {
  if (!curcon) {
    return;
  }
  return curcon.uvIndex;
}

export function getCurrentHumidity(
  curcon: WeatherConditions | undefined,
): { value: string; unit: string; valueAndUnit: string } | undefined {
  if (!curcon) {
    return;
  }
  if (!curcon.humidity) {
    return;
  }
  const unit = "%";
  return { unit, value: curcon.humidity, valueAndUnit: `${curcon.humidity} %` };
}

export function getCurrentWindConditions(
  curcon: WeatherConditions | undefined,
): { speed: string; unit: string; dirDeg: string; dirIcon: string; dirText: string } | undefined {
  if (!curcon) {
    return;
  }
  const speed: string | undefined = (curcon as any)[`windspeed${getWttrWindPostfix()}`];
  if (!speed) {
    return;
  }
  const unit = getWindUnit();
  const dirDeg = curcon.winddirDegree;
  if (!dirDeg) {
    return;
  }
  const dirIcon = getWindDirectionIcon(dirDeg) || "?";
  const dirText = curcon.winddir16Point;
  if (!dirText) {
    return;
  }
  return { speed, unit, dirDeg, dirIcon, dirText };
}

export function getCurrentVisibility(
  curcon: WeatherConditions | undefined,
): { unit: string; distance: string; distanceAndUnit: string } | undefined {
  if (!curcon) {
    return;
  }
  const us = getUnitSystem();
  const distance = us === UnitSystem.Imperial ? curcon.visibilityMiles : curcon.visibility;
  const unit = us === UnitSystem.Imperial ? "Miles" : "Km";
  const distanceAndUnit = `${distance} ${unit}`;
  return { unit, distance, distanceAndUnit };
}

export function getAreaValues(
  area: Area | undefined,
):
  | { areaName?: string; country?: string; region?: string; latitude?: string; longitude?: string; population?: string }
  | undefined {
  if (!area) {
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getStringVal = (obj: any[] | undefined): string | undefined => {
    if (obj === undefined) {
      return;
    }
    if (obj && obj.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (obj[0] as any).value;
    }
    return;
  };
  const areaName = getStringVal(area?.areaName);
  const country = getStringVal(area?.country);
  const region = getStringVal(area?.region);
  const latitude = area.latitude;
  const longitude = area.longitude;
  const population = area.population;

  return { areaName, country, region, latitude, longitude, population };
}
