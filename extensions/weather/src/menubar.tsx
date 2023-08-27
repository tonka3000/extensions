import {
  getPreferenceValues,
  Icon,
  Image,
  launchCommand,
  LaunchType,
  MenuBarExtra,
  open,
  openCommandPreferences,
} from "@raycast/api";
import {
  getCurrentTemperature,
  getMetaData,
  getDefaultQuery,
  getDayWeatherIcon,
  getWeekday,
  getDayTemperature,
} from "./components/weather";
import { getWeatherCodeIcon, WeatherIcons } from "./icons";
import {
  Area,
  getAreaValues,
  getCurrentFeelLikeTemperature,
  getCurrentHumidity,
  getCurrentMoon,
  getCurrentObservationTime,
  getCurrentPressure,
  getCurrentSun,
  getCurrentUVIndex,
  getCurrentVisibility,
  getCurrentWindConditions,
  Weather,
  WeatherConditions,
} from "./wttr";
import { useWeather } from "./components/hooks";
import { convertToRelativeDate, getUVIndexIcon } from "./utils";

function launchWeatherCommand() {
  launchCommand({ name: "index", type: LaunchType.UserInitiated });
}

function getAppearancePreferences(): { showMenuIcon: boolean; showMenuText: boolean } {
  const prefs = getPreferenceValues();
  const showMenuText = prefs.showmenutext as boolean | true;
  const showMenuIcon = prefs.showmenuicon as boolean | true;
  return {
    showMenuIcon,
    showMenuText,
  };
}

function getWeatherMenuIcon(curcon: WeatherConditions | undefined): Image.ImageLike | undefined {
  const { showMenuIcon, showMenuText } = getAppearancePreferences();
  if (!showMenuIcon && !showMenuText) {
    return Icon.Cloud;
  }
  if (!showMenuIcon) {
    return undefined;
  }
  return curcon ? getWeatherCodeIcon(curcon.weatherCode) : "weather.png";
}

function FeelsLikeMenuItem(props: { curcon: WeatherConditions | undefined }) {
  const feelsLike = getCurrentFeelLikeTemperature(props.curcon);
  if (!feelsLike) {
    return null;
  }
  return (
    <MenuBarExtra.Item
      title="Feels Like"
      subtitle={feelsLike.valueAndUnit}
      icon={WeatherIcons.FeelsLike}
      onAction={launchWeatherCommand}
    />
  );
}

function UVIndexMenuItem(props: { curcon: WeatherConditions | undefined }) {
  const uvIndex = getCurrentUVIndex(props.curcon);
  if (!uvIndex) {
    return null;
  }
  return (
    <MenuBarExtra.Item
      title="UV Index"
      subtitle={uvIndex}
      icon={getUVIndexIcon(uvIndex)}
      onAction={launchWeatherCommand}
    />
  );
}

function HumidityMenuItem(props: { curcon: WeatherConditions | undefined }) {
  const hum = getCurrentHumidity(props.curcon);
  if (!hum) {
    return null;
  }
  return (
    <MenuBarExtra.Item
      title="Humidity"
      subtitle={hum.valueAndUnit}
      icon={WeatherIcons.Humidity}
      onAction={launchWeatherCommand}
    />
  );
}

function WeatherMenuBarExtra(props: {
  children: React.ReactNode;
  data: Weather | undefined;
  isLoading?: boolean;
  title?: string;
  icon?: Image.ImageLike | undefined;
  tooltip?: string;
  error?: string | undefined;
}): JSX.Element {
  const error = props.error;
  return (
    <MenuBarExtra
      title={!error ? props.title : undefined}
      icon={error ? Icon.Cloud : props.icon}
      isLoading={props.isLoading}
      tooltip={error ? `Error: ${error}` : props.tooltip}
    >
      {error ? <MenuBarExtra.Item title={`Error: ${error}`} /> : props.children}
    </MenuBarExtra>
  );
}

function WindMenubarItem(props: { curcon: WeatherConditions | undefined }) {
  const windCon = getCurrentWindConditions(props.curcon);
  if (!windCon) {
    return null;
  }
  const wind = `${windCon.speed} ${windCon.unit} ${windCon.dirIcon} (${windCon.dirText})`;
  return <MenuBarExtra.Item icon={WeatherIcons.Wind} title="Wind" subtitle={wind} onAction={launchWeatherCommand} />;
}

function VisibilityMenubarItem(props: { curcon: WeatherConditions | undefined }) {
  const vis = getCurrentVisibility(props.curcon);
  if (!vis) {
    return null;
  }
  return (
    <MenuBarExtra.Item
      icon={WeatherIcons.Visibility}
      title="Visibility"
      subtitle={vis.distanceAndUnit}
      onAction={launchWeatherCommand}
    />
  );
}

function PressureMenubarItem(props: { curcon: WeatherConditions | undefined }) {
  const p = getCurrentPressure(props.curcon);
  if (!p) {
    return null;
  }
  return (
    <MenuBarExtra.Item
      icon={WeatherIcons.Pressure}
      title="Pressure"
      subtitle={p.valueAndUnit}
      onAction={launchWeatherCommand}
    />
  );
}

function LocationMenubarSection(props: { area: Area | undefined }) {
  const a = getAreaValues(props.area);
  if (!a) {
    return null;
  }
  return (
    <MenuBarExtra.Section title="Location">
      {a.areaName && (
        <MenuBarExtra.Item
          title="Area"
          icon={WeatherIcons.Area}
          subtitle={a.areaName}
          onAction={launchWeatherCommand}
        />
      )}
      {a.region && (
        <MenuBarExtra.Item
          title="Region"
          subtitle={a.region}
          icon={WeatherIcons.Region}
          onAction={launchWeatherCommand}
        />
      )}
      {a.country && (
        <MenuBarExtra.Item
          title="Country"
          subtitle={a.country}
          icon={WeatherIcons.Country}
          onAction={launchWeatherCommand}
        />
      )}
      {a.latitude && a.longitude && (
        <MenuBarExtra.Item
          title="Lon, Lat"
          subtitle={`${a.longitude},${a.latitude}`}
          icon={WeatherIcons.Coordinate}
          onAction={launchWeatherCommand}
        />
      )}
    </MenuBarExtra.Section>
  );
}

function SunMenubarSection(props: { data: Weather | undefined }) {
  const sun = getCurrentSun(props.data);
  if (!sun) {
    return null;
  }
  const { curcon } = getMetaData(props.data);
  return (
    <MenuBarExtra.Section title="Sun">
      <UVIndexMenuItem curcon={curcon} />
      <MenuBarExtra.Item
        title="Sunrise"
        subtitle={sun.sunrise}
        icon={WeatherIcons.Sunrise}
        onAction={launchWeatherCommand}
      />
      <MenuBarExtra.Item
        title="Sunset"
        subtitle={sun.sunset}
        icon={WeatherIcons.Sunset}
        onAction={launchWeatherCommand}
      />
    </MenuBarExtra.Section>
  );
}

function MoonMenubarSection(props: { data: Weather | undefined }) {
  const moon = getCurrentMoon(props.data);
  if (!moon) {
    return null;
  }
  const phase = `Phase: ${moon.moonPhase}`;
  return (
    <MenuBarExtra.Section title="Moon">
      <MenuBarExtra.Item
        title="Moonrise"
        subtitle={moon.moonrise}
        tooltip={phase}
        icon={WeatherIcons.Moonrise}
        onAction={launchWeatherCommand}
      />
      <MenuBarExtra.Item
        title="Moonset"
        subtitle={moon.moonset}
        tooltip={phase}
        icon={WeatherIcons.Moonset}
        onAction={launchWeatherCommand}
      />
    </MenuBarExtra.Section>
  );
}

function ObservationTimeMenubarItem(props: { curcon: WeatherConditions | undefined }) {
  const obs = getCurrentObservationTime(props.curcon);
  if (!obs) {
    return null;
  }
  const relative = convertToRelativeDate(obs) || obs;
  return (
    <MenuBarExtra.Item
      title="Observation"
      subtitle={relative}
      tooltip={`Observation Time from Weather Provider: ${obs}`}
      icon={Icon.Clock}
      onAction={launchWeatherCommand}
    />
  );
}

function LastFetchTimeMenubarItem(props: { fetched: Date | undefined }) {
  const f = props.fetched;
  const relative = f ? convertToRelativeDate(f) || f?.toLocaleString() : "-";
  return (
    <MenuBarExtra.Item
      title="Fetched"
      subtitle={relative}
      tooltip={`Fetched from Weather Provider: ${f ? f.toLocaleString() : "-"}`}
      icon={Icon.Download}
      onAction={launchWeatherCommand}
    />
  );
}
//{fetchDate && <MenuBarExtra.Item title="Fetched" subtitle={convertToRelativeDate(fetchDate)}/>}

export default function MenuCommand(): JSX.Element {
  const { data, error, isLoading, fetchDate } = useWeather(getDefaultQuery());
  const { curcon, weatherDesc, area } = getMetaData(data);
  const { showMenuText } = getAppearancePreferences();

  const temp = getCurrentTemperature(curcon);

  return (
    <WeatherMenuBarExtra
      data={data}
      error={error}
      title={showMenuText ? temp : undefined}
      icon={getWeatherMenuIcon(curcon)}
      isLoading={isLoading}
      tooltip={weatherDesc}
    >
      <MenuBarExtra.Section title="Weather">
        <MenuBarExtra.Item
          icon={curcon ? getWeatherCodeIcon(curcon.weatherCode) : "weather.png"}
          title="Condition"
          subtitle={weatherDesc}
          onAction={launchWeatherCommand}
        />
      </MenuBarExtra.Section>
      <MenuBarExtra.Section title="Temperature">
        <MenuBarExtra.Item
          icon={Icon.Temperature}
          title="Temperature"
          subtitle={temp || "?"}
          onAction={launchWeatherCommand}
        />
        <FeelsLikeMenuItem curcon={curcon} />
      </MenuBarExtra.Section>
      <MenuBarExtra.Section title="Air">
        <WindMenubarItem curcon={curcon} />
        <PressureMenubarItem curcon={curcon} />
        <HumidityMenuItem curcon={curcon} />
        <VisibilityMenubarItem curcon={curcon} />
      </MenuBarExtra.Section>
      <SunMenubarSection data={data} />
      <MoonMenubarSection data={data} />
      <MenuBarExtra.Section title="Forecast">
        {data?.weather?.map((d) => (
          <MenuBarExtra.Item
            key={d.date}
            title={getWeekday(d.date)}
            icon={getDayWeatherIcon(d)}
            subtitle={`⬆${getDayTemperature(d, "max")} ⬇ ${getDayTemperature(d, "min")}`}
            onAction={launchWeatherCommand}
          />
        ))}
      </MenuBarExtra.Section>
      <LocationMenubarSection area={area} />
      <MenuBarExtra.Section>
        <MenuBarExtra.Item
          icon={Icon.Link}
          title="Source"
          subtitle="wttr.in"
          onAction={() => open("https://wttr.in")}
        />
        <ObservationTimeMenubarItem curcon={curcon} />
        <LastFetchTimeMenubarItem fetched={fetchDate} />
        <MenuBarExtra.Item
          title="Configure"
          icon={Icon.Gear}
          shortcut={{ modifiers: ["cmd"], key: "," }}
          onAction={openCommandPreferences}
        />
      </MenuBarExtra.Section>
    </WeatherMenuBarExtra>
  );
}
