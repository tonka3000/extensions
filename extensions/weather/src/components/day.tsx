import { List } from "@raycast/api";
import { getIcon, getWindDirectionIcon } from "../icons";
import { getLanguage, getTs } from "../lang";
import { getWindUnit, getWttrTemperaturePostfix, getWttrWindPostfix } from "../unit";
import { Hourly, WeatherData } from "../wttr";

function getTime(time: string): string {
  const h = parseInt(time) / 100.0;
  const postfix = h < 12 ? "AM" : "PM";
  return `${h} ${postfix}`;
}

export function DayList(props: { day: WeatherData; title: string }) {
  const day = props.day;

  const getWeatherDescLang = (data: any): string | undefined => {
    try {
      const lang = getLanguage();
      return data[`lang_${lang}`][0].value;
    } catch (error) {
      return undefined;
    }
  };

  const getWeatherDesc = (hour: Hourly): string => {
    const data = hour as any;
    const weatherDesc = getWeatherDescLang(data) || hour.weatherDesc[0].value;
    return weatherDesc;
  };

  const getWind = (hour: Hourly): string => {
    const data = hour as Record<string, any>;
    const key = `windspeed${getWttrWindPostfix()}`;
    let val = "?";
    if (data[key]) {
      val = data[key] || "?";
    }
    return `${val} ${getWindUnit()}`;
  };

  const getTemp = (hour: Hourly): string => {
    const data = hour as Record<string, any>;
    const key = `temp${getWttrTemperaturePostfix()}`;
    let val = "?";
    if (data[key]) {
      val = data[key] || "?";
    }
    return `${val} ${getWindUnit()}`;
  };

  return (
    <List>
      <List.Section title={props.title}>
        {day.hourly.map((data, _) => (
          <List.Item
            key={data.time.toString()}
            title={`${getTime(data.time)}`}
            subtitle={`${getTemp(data)} , ${getWeatherDesc(data)}`}
            icon={getIcon(data.weatherCode)}
            accessoryTitle={`${getTs("humidity")}: ${data.humidity}% | ${getTs("wind")}: ${getWind(
              data
            )} ${getWindDirectionIcon(data.winddirDegree)}`}
          />
        ))}
      </List.Section>
    </List>
  );
}
