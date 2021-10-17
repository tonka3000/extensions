import { ActionPanel, List, PushAction, showToast, ToastStyle } from "@raycast/api";
import moment from "moment";
import "moment/locale/fr";
import "moment/locale/de";
import { useEffect, useState } from "react";
import { getIcon, getWindDirectionIcon } from "../icons";
import { getLanguage, getTs } from "../lang";
import { supportedLanguages, Weather, WeatherData, wttr } from "../wttr";
import { DayList } from "./day";

export function DayListItem(props: { day: WeatherData; title: string }) {
  const data = props.day;
  const wd = getWeekday(data.date);
  return (
    <List.Item
      key={data.date}
      title={wd}
      subtitle={`max: ${data.maxtempC} °C, min: ${data.mintempC} °C`}
      actions={
        <ActionPanel>
          <PushAction title="Show Details" target={<DayList day={data} title={`${props.title} - ${wd}`} />} />
        </ActionPanel>
      }
    />
  );
}

function getWeekday(date: string): string {
  const d = moment(date);
  let lang = getLanguage() || "en";
  if (!supportedLanguages.includes(lang)) {
    lang = "en";
  }
  return d.locale(lang).format("dddd");
}

export function WeatherList() {
  const lang = getLanguage();
  const [query, setQuery] = useState<string>("");
  const { data, error, isLoading } = useSearch(query, lang);
  if (error) {
    showToast(ToastStyle.Failure, "Cannot search weather", error);
  }
  if (!data) {
    return <List isLoading={true} searchBarPlaceholder="Loading" />;
  }

  const area = data.nearest_area[0];
  const curcon = data.current_condition[0];
  const curcon_data = curcon as any;

  const title = `${area.areaName[0].value}, ${area.region[0].value}, ${area.country[0].value}`;

  const getWeatherDescLang = (): string | undefined => {
    try {
      return curcon_data[`lang_${lang}`][0].value;
    } catch (error) {
      return undefined;
    }
  };

  const weatherDesc = getWeatherDescLang() || curcon.weatherDesc[0].value;

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search for other location (e.g. London)"
      onSearchTextChange={setQuery}
      throttle={true}
    >
      <List.Section title={`${getTs("Weather report")} (${title})`}>
        <List.Item
          key="_"
          title={`${curcon.temp_C}°C`}
          subtitle={weatherDesc}
          icon={getIcon(curcon.weatherCode)}
          accessoryTitle={`${getTs("humidity")}: ${curcon.humidity}% | ${getTs("wind")}: ${
            curcon.windspeedKmph
          } km/h ${getWindDirectionIcon(curcon.winddirDegree)}`}
        />
      </List.Section>
      <List.Section title={getTs("Daily Forecast")}>
        {data.weather?.map((data, index) => (
          <DayListItem key={data.date} day={data} title={title} />
        ))}
      </List.Section>
    </List>
  );
}

export function useSearch(
  query: string | undefined,
  lang: string | undefined
): {
  data: Weather | undefined;
  error?: string;
  isLoading: boolean;
} {
  const [data, setData] = useState<Weather>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  let cancel = false;

  useEffect(() => {
    async function fetchData() {
      if (query === null || cancel) {
        return;
      }

      setIsLoading(true);
      setError(undefined);

      try {
        const wdata = await wttr.getWeather(query, lang);
        if (!cancel) {
          setData(wdata);
        }
      } catch (e: any) {
        if (!cancel) {
          setError(e.message);
        }
      } finally {
        if (!cancel) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancel = true;
    };
  }, [query]);

  return { data, error, isLoading };
}
