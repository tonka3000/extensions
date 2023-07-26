import { MenuBarExtra, Icon, openCommandPreferences, Clipboard, showHUD, showToast, Toast, Image } from "@raycast/api";
import { getErrorMessage } from "../utils";
import { ReactNode } from "react";

export function MenuBarItemConfigureCommand(): JSX.Element {
  return (
    <MenuBarExtra.Item
      title="Configure Command"
      shortcut={{ modifiers: ["cmd"], key: "," }}
      icon={Icon.Gear}
      onAction={() => openCommandPreferences()}
    />
  );
}

export function CopyToClipboardMenubarItem(props: { title: string; content: string; tooltip?: string }) {
  const copyToClipboard = async () => {
    try {
      console.log(props.content);
      await Clipboard.copy(props.content);
      showHUD("Copied to Clipboard");
    } catch (error) {
      showToast({ style: Toast.Style.Failure, title: "Error", message: getErrorMessage(error) });
    }
  };
  return (
    <MenuBarExtra.Item
      title={props.title}
      icon={Icon.CopyClipboard}
      onAction={copyToClipboard}
      tooltip={props.tooltip}
    />
  );
}

function joinNonEmpty(parts?: (string | undefined)[], separator?: string | undefined): string | undefined {
  if (!parts || parts.length <= 0) {
    return undefined;
  }
  return parts.join(separator);
}

export function MenuBarSubmenu(props: {
  title: string;
  subtitle?: string;
  icon?: Image.ImageLike | undefined;
  children?: ReactNode;
  separator?: string;
}): JSX.Element {
  const sep = props.separator && props.separator.length > 0 ? props.separator : "|";
  const title =
    joinNonEmpty(
      [props.title, sep, props.subtitle].filter((e) => e),
      " ",
    ) || "";
  return (
    <MenuBarExtra.Submenu title={title} icon={props.icon}>
      {props.children}
    </MenuBarExtra.Submenu>
  );
}
