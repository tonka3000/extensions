import {
  ActionPanel,
  Color,
  ColorLike,
  CopyToClipboardAction,
  Icon,
  ImageLike,
  List,
  OpenInBrowserAction,
  popToRoot,
  PushAction,
  showToast,
  ToastStyle,
} from "@raycast/api";
import { State } from "../haapi";
import { useState, useEffect } from "react";
import { createHomeAssistantClient, shouldDisplayEntityID } from "../common";
import { EntityAttributesList } from "./attributes";
import { useHAStates } from "../hooks";

export const ha = createHomeAssistantClient();

export function ShowAttributesAction(props: { state: State }): JSX.Element | null {
  if (props.state.attributes) {
    return (
      <PushAction
        title="Show Attributes"
        target={<EntityAttributesList state={props.state} />}
        shortcut={{ modifiers: ["cmd", "shift"], key: "a" }}
        icon={{ source: Icon.List, tintColor: Color.PrimaryText }}
      />
    );
  } else {
    return null;
  }
}

const PrimaryIconColor = Color.Blue;

const lightColor: Record<string, ColorLike> = {
  on: Color.Yellow,
  off: Color.Blue,
};

const coverStateIconSource: Record<string, string> = {
  opening: "cover-up.png",
  closing: "cover-down.png",
  open: "cover-open.png",
  closed: "cover-close.png",
};

const deviceClassIconSource: Record<string, string> = {
  temperature: "temperature.png",
  power: "power.png",
  update: "update.png",
  connectivity: "connectivity.png",
  carbon_dioxide: "carbon-dioxide.png",
  pressure: "pressure.png",
  humidity: "humidity.png",
};

const batterLevelIcons: string[] = [
  "battery-00.png",
  "battery-10.png",
  "battery-20.png",
  "battery-30.png",
  "battery-40.png",
  "battery-50.png",
  "battery-60.png",
  "battery-70.png",
  "battery-80.png",
  "battery-90.png",
  "battery-100.png",
];

function getDeviceClassIcon(state: State): ImageLike | undefined {
  if (state.attributes.device_class) {
    const dc = state.attributes.device_class;
    if (dc === "battery") {
      const v = parseFloat(state.state);
      let src = "battery-100.png";
      if (!isNaN(v)) {
        const level = Math.floor(v / 10);
        const levelIcon = batterLevelIcons[level];
        if (levelIcon) {
          src = levelIcon;
        }
      }
      let tintColor = PrimaryIconColor;
      if (v <= 20) {
        tintColor = Color.Red;
      } else if (v <= 30) {
        tintColor = Color.Yellow;
      }
      return { source: src, tintColor: tintColor };
    }
    const src = deviceClassIconSource[dc] || "entity.png";
    return { source: src, tintColor: PrimaryIconColor };
  } else {
    return undefined;
  }
}

function getIcon(state: State): ImageLike | undefined {
  const e = state.entity_id;
  const attr = state.attributes;
  if (e.startsWith("light")) {
    const sl = state.state.toLocaleLowerCase();
    const color = sl === "unavailable" ? "#bdbdbd" : lightColor[sl] || PrimaryIconColor;
    const source = attr.icon && attr.icon === "mdi:lightbulb-group" ? "lightbulb-group.png" : "lightbulb.png";
    return { source: source, tintColor: color };
  } else if (e.startsWith("person")) {
    return { source: "person.png", tintColor: PrimaryIconColor };
  } else if (e.startsWith("cover")) {
    const source = coverStateIconSource[`${state.state}`] || coverStateIconSource.open;
    return { source: source, tintColor: PrimaryIconColor };
  } else if (e.startsWith("automation")) {
    return { source: "automation.png", tintColor: PrimaryIconColor };
  } else if (e.startsWith("climate")) {
    return { source: "climate.png", tintColor: PrimaryIconColor };
  } else if (e.startsWith("media_player")) {
    return { source: "mediaplayer.png", tintColor: PrimaryIconColor };
  } else {
    const di = getDeviceClassIcon(state);
    return di ? di : { source: "entity.png", tintColor: PrimaryIconColor };
  }
}

export function StatesList(props: { domain: string }): JSX.Element {
  const [searchText, setSearchText] = useState<string>();
  const { states: allStates, error, isLoading } = useHAStates();
  const { states } = useStateSearch(searchText, props.domain, undefined, allStates);

  if (error) {
    showToast(ToastStyle.Failure, "Cannot search Home Assistant states.", error.message);
  }

  if (!states) {
    return <List isLoading={true} searchBarPlaceholder="Loading" />;
  }

  return (
    <List searchBarPlaceholder="Filter by name or ID..." isLoading={isLoading} onSearchTextChange={setSearchText}>
      {states?.map((state) => (
        <StateListItem key={state.entity_id} state={state} />
      ))}
    </List>
  );
}

export function StateListItem(props: { state: State }): JSX.Element {
  const state = props.state;
  const extraTitle = (state: State): string => {
    try {
      const e = state.entity_id;
      if (e.startsWith("cover") && "current_position" in state.attributes) {
        const p = state.attributes.current_position;
        if (p > 0 && p < 100) {
          return `${p}% | `;
        }
      } else if (e.startsWith("climate") && "current_temperature" in state.attributes) {
        return `${state.attributes.current_temperature} | `;
      }
    } catch (e) {
      // ignore
    }
    return "";
  };
  const stateValue = (state: State): string | undefined => {
    if (state.entity_id.startsWith("light") && state.state === "on") {
      const b = state.attributes.brightness || undefined;
      if (b !== undefined) {
        const bv = parseInt(b);
        if (!isNaN(bv)) {
          const percent = (bv / 255) * 100;
          return `${Math.round(percent)}%`;
        }
      }
    } else if (state.entity_id.startsWith("sensor")) {
      const unit = (state.attributes.unit_of_measurement as string) || undefined;
      const sl = state.state?.toLocaleLowerCase();
      if (unit && sl && sl !== "unknown" && sl !== "unavailable") {
        return `${state.state} ${unit}`;
      }
    } else if (state.entity_id.startsWith("media_player")) {
      const v = state.attributes.volume_level as number;
      if (v && typeof v === "number" && !Number.isNaN(v)) {
        const vr = Math.round(v * 100);
        return `🔉 ${vr}% | ${state.state}`;
      }
    }
    return state.state;
  };

  let icon: ImageLike | undefined;
  const subtitle = (state: State): string | undefined => {
    let extra: string | undefined;
    if (state.entity_id.startsWith("media_player")) {
      const title = state.attributes.media_title;
      const artist = state.attributes.media_artist;
      const parts = [];
      if (title && artist) {
        parts.push(`${artist} - ${title}`);
      }
      const channel = state.attributes.media_channel;
      if (channel) {
        parts.push(channel);
      }
      extra = parts.join(" | ");

      const ep = state.attributes.entity_picture;
      if (ep) {
        icon = ha.urlJoin(ep);
      }
    }
    if (shouldDisplayEntityID()) {
      return extra;
    }
    if (extra) {
      return `${state.entity_id} | ${extra}`;
    }
    return state.entity_id;
  };

  return (
    <List.Item
      key={state.entity_id}
      title={state.attributes.friendly_name || state.entity_id}
      subtitle={subtitle(state)}
      accessoryTitle={extraTitle(state) + stateValue(state)}
      actions={<StateActionPanel state={state} />}
      icon={icon || getIcon(state)}
    />
  );
}

function CopyStateValueAction(props: { state: State }): JSX.Element {
  return (
    <CopyToClipboardAction
      title="Copy State Value"
      content={props.state.state}
      shortcut={{ modifiers: ["cmd", "shift"], key: "v" }}
    />
  );
}

function CopyEntityIDAction(props: { state: State }): JSX.Element {
  return (
    <CopyToClipboardAction
      title="Copy Entity ID"
      content={props.state.entity_id}
      shortcut={{ modifiers: ["cmd", "shift"], key: "e" }}
    />
  );
}

function OpenEntityHistoryAction(props: { state: State }): JSX.Element {
  const historyUrl = ha.urlJoin(`history?entity_id=${props.state.entity_id}`);
  return (
    <OpenInBrowserAction
      title="Open History in Browser"
      icon={{ source: Icon.Text, tintColor: Color.PrimaryText }}
      url={historyUrl}
      shortcut={{ modifiers: ["cmd"], key: "h" }}
    />
  );
}

function BrightnessControlAction(props: { state: State }): JSX.Element | null {
  const state = props.state;
  const modes = state.attributes.supported_color_modes;

  const handle = async (bvalue: number) => {
    await ha.callService("light", "turn_on", { entity_id: state.entity_id, brightness_pct: `${bvalue}` });
  };

  if (modes && Array.isArray(modes) && modes.includes("brightness")) {
    const brightnessValues = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];
    return (
      <ActionPanel.Submenu
        title="Brightness"
        icon={{ source: "lightbulb.png", tintColor: Color.PrimaryText }}
        shortcut={{ modifiers: ["cmd"], key: "b" }}
      >
        {brightnessValues.map((value) => (
          <ActionPanel.Item title={`${value} %`} onAction={() => handle(value)} />
        ))}
      </ActionPanel.Submenu>
    );
  }
  return null;
}

export function StateActionPanel(props: { state: State }): JSX.Element {
  const state = props.state;
  const domain = props.state.entity_id.split(".")[0];
  const entityID = props.state.entity_id;

  switch (domain) {
    case "cover": {
      return (
        <ActionPanel>
          <ActionPanel.Item
            title="Toggle"
            onAction={async () => await ha.toggleCover(props.state.entity_id)}
            icon={{ source: "toggle.png", tintColor: Color.PrimaryText }}
          />
          <ActionPanel.Item
            title="Open"
            shortcut={{ modifiers: ["cmd"], key: "o" }}
            onAction={async () => await ha.openCover(props.state.entity_id)}
            icon={{ source: Icon.ChevronUp, tintColor: Color.PrimaryText }}
          />
          <ActionPanel.Item
            title="Close"
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
            onAction={async () => await ha.closeCover(props.state.entity_id)}
            icon={{ source: Icon.ChevronDown, tintColor: Color.PrimaryText }}
          />
          <ActionPanel.Item
            title="Stop"
            shortcut={{ modifiers: ["cmd"], key: "s" }}
            onAction={async () => await ha.stopCover(props.state.entity_id)}
            icon={{ source: Icon.XmarkCircle, tintColor: Color.PrimaryText }}
          />
          <ShowAttributesAction state={state} />
          <CopyEntityIDAction state={state} />
          <CopyStateValueAction state={state} />
          <OpenEntityHistoryAction state={state} />
        </ActionPanel>
      );
    }
    case "light": {
      return (
        <ActionPanel>
          <ActionPanel.Item
            title="Toggle"
            onAction={async () => await ha.toggleLight(props.state.entity_id)}
            icon={{ source: "toggle.png", tintColor: Color.PrimaryText }}
          />
          <ActionPanel.Item
            title="Turn On"
            shortcut={{ modifiers: ["cmd"], key: "o" }}
            onAction={async () => await ha.turnOnLight(props.state.entity_id)}
            icon={{ source: "power-btn.png", tintColor: Color.Green }}
          />
          <ActionPanel.Item
            title="Turn Off"
            shortcut={{ modifiers: ["cmd"], key: "f" }}
            onAction={async () => await ha.turnOffLight(props.state.entity_id)}
            icon={{ source: "power-btn.png", tintColor: Color.Red }}
          />
          <BrightnessControlAction state={state} />
          <ShowAttributesAction state={props.state} />
          <CopyEntityIDAction state={state} />
          <CopyStateValueAction state={state} />
          <OpenEntityHistoryAction state={state} />
        </ActionPanel>
      );
    }
    case "media_player": {
      return (
        <ActionPanel>
          <ActionPanel.Item
            title="Play/Pause"
            onAction={async () => await ha.playPauseMedia(entityID)}
            icon={{ source: "play-pause.jpg", tintColor: Color.PrimaryText }}
          />
          <ActionPanel.Item
            title="Play"
            onAction={async () => await ha.playMedia(entityID)}
            icon={{ source: "play.png", tintColor: Color.PrimaryText }}
          />
          <ActionPanel.Item
            title="Pause"
            shortcut={{ modifiers: ["cmd"], key: "p" }}
            onAction={async () => await ha.pauseMedia(entityID)}
            icon={{ source: "pause.png", tintColor: Color.PrimaryText }}
          />
          <ActionPanel.Item
            title="Stop"
            shortcut={{ modifiers: ["cmd"], key: "s" }}
            onAction={async () => await ha.stopMedia(entityID)}
            icon={{ source: Icon.XmarkCircle, tintColor: Color.PrimaryText }}
          />
          <ActionPanel.Item
            title="Next"
            shortcut={{ modifiers: ["cmd"], key: "arrowRight" }}
            onAction={async () => await ha.nextMedia(entityID)}
            icon={{ source: "next.png", tintColor: Color.PrimaryText }}
          />
          <ActionPanel.Item
            title="Previous"
            shortcut={{ modifiers: ["cmd"], key: "arrowLeft" }}
            onAction={async () => await ha.previousMedia(entityID)}
            icon={{ source: "previous.png", tintColor: Color.PrimaryText }}
          />
          <ActionPanel.Item
            title="Volume Up"
            shortcut={{ modifiers: ["cmd"], key: "+" }}
            onAction={async () => await ha.volumeUpMedia(entityID)}
            icon={{ source: Icon.SpeakerArrowUp, tintColor: Color.PrimaryText }}
          />
          <ActionPanel.Item
            title="Volume Down"
            shortcut={{ modifiers: ["cmd"], key: "-" }}
            onAction={async () => await ha.volumeDownMedia(entityID)}
            icon={{ source: Icon.SpeakerArrowDown, tintColor: Color.PrimaryText }}
          />
          <ActionPanel.Item
            title="Mute"
            shortcut={{ modifiers: ["cmd"], key: "m" }}
            onAction={async () => await ha.muteMedia(entityID)}
            icon={{ source: Icon.SpeakerSlash, tintColor: Color.PrimaryText }}
          />
          <ShowAttributesAction state={props.state} />
          <CopyEntityIDAction state={state} />
          <CopyStateValueAction state={state} />
          <OpenEntityHistoryAction state={state} />
        </ActionPanel>
      );
    }
    case "climate": {
      const changeTempAllowed =
        state.state === "heat" || state.state === "cool" || state.state === "heat_cool" || state.state == "auto"
          ? true
          : false;
      const currentTempValue: number | undefined = state.attributes.temperature || undefined;
      const [currentTemp, setCurrentTemp] = useState<number | undefined>(currentTempValue);
      const upperTemp = currentTemp ? currentTemp + 0.5 : undefined;
      const lowerTemp = currentTemp ? currentTemp - 0.5 : undefined;

      const temps: number[] = [];
      for (let i = 26; i > 16; i--) {
        temps.push(i);
      }

      const currentPresetMode = state.attributes.preset_mode ? state.attributes.preset_mode : "None";
      const preset_modes = state.attributes.preset_modes;

      return (
        <ActionPanel>
          {changeTempAllowed && (
            <ActionPanel.Submenu
              title={`Temperature (${currentTemp || "?"})`}
              shortcut={{ modifiers: ["cmd"], key: "t" }}
              icon={{ source: "temperature.png", tintColor: Color.PrimaryText }}
            >
              {temps.map((t) => (
                <ActionPanel.Item
                  key={t.toString()}
                  title={t.toString()}
                  onAction={async () => {
                    await ha.setClimateTemperature(entityID, t);
                    setCurrentTemp(t);
                  }}
                />
              ))}
            </ActionPanel.Submenu>
          )}
          {state.attributes.hvac_modes && (
            <ActionPanel.Submenu
              title={`Operation (${state.state})`}
              shortcut={{ modifiers: ["cmd"], key: "o" }}
              icon={{ source: Icon.Gear, tintColor: Color.PrimaryText }}
            >
              {state.attributes.hvac_modes?.map((o: string) => (
                <ActionPanel.Item
                  key={o}
                  title={o}
                  onAction={async () => {
                    await ha.setClimateOperation(entityID, o);
                    popToRoot();
                  }}
                />
              ))}
            </ActionPanel.Submenu>
          )}

          {preset_modes && (
            <ActionPanel.Submenu
              title={`Preset (${currentPresetMode})`}
              shortcut={{ modifiers: ["cmd"], key: "p" }}
              icon={{ source: Icon.List, tintColor: Color.PrimaryText }}
            >
              {preset_modes?.map((o: string) => (
                <ActionPanel.Item
                  key={o}
                  title={o}
                  onAction={async () => {
                    await ha.setClimatePreset(entityID, o);
                    popToRoot();
                  }}
                />
              ))}
            </ActionPanel.Submenu>
          )}

          {upperTemp && changeTempAllowed && (
            <ActionPanel.Item
              title={`Increase Temp. 0.5`}
              shortcut={{ modifiers: ["cmd"], key: "+" }}
              onAction={async () => {
                await ha.setClimateTemperature(entityID, upperTemp);
                setCurrentTemp(upperTemp);
              }}
              icon={{ source: "plus.png", tintColor: Color.PrimaryText }}
            />
          )}
          {lowerTemp && changeTempAllowed && (
            <ActionPanel.Item
              title={`Decrease Temp. 0.5`}
              shortcut={{ modifiers: ["cmd"], key: "-" }}
              onAction={async () => {
                await ha.setClimateTemperature(entityID, lowerTemp);
                setCurrentTemp(lowerTemp);
              }}
              icon={{ source: "minus.png", tintColor: Color.PrimaryText }}
            />
          )}
          <ShowAttributesAction state={props.state} />
          <CopyEntityIDAction state={state} />
          <CopyStateValueAction state={state} />
          <OpenEntityHistoryAction state={state} />
        </ActionPanel>
      );
    }
    default: {
      return (
        <ActionPanel>
          <ShowAttributesAction state={props.state} />
          <CopyEntityIDAction state={state} />
          <CopyStateValueAction state={state} />
          <OpenEntityHistoryAction state={state} />
        </ActionPanel>
      );
    }
  }
}

export function useStateSearch(
  query: string | undefined,
  domain: string,
  device_class?: string,
  allStates?: State[]
): {
  states?: State[];
} {
  const [states, setStates] = useState<State[]>();

  useEffect(() => {
    if (allStates) {
      let haStates: State[] = allStates;
      if (domain) {
        haStates = haStates.filter((s) => s.entity_id.startsWith(domain));
      }
      if (device_class) {
        haStates = haStates.filter((s) => s.attributes.device_class === device_class);
      }
      if (query) {
        haStates = haStates.filter(
          (e) =>
            e.entity_id.toLowerCase().includes(query.toLowerCase()) ||
            (e.attributes.friendly_name.toLowerCase() || "").includes(query.toLowerCase())
        );
      }
      haStates = haStates.slice(0, 100);
      setStates(haStates);
    } else {
      setStates([]);
    }
  }, [query, allStates]);
  return { states };
}
