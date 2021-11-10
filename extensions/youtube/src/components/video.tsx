import {
  ActionPanel,
  Color,
  Detail,
  Icon,
  List,
  OpenInBrowserAction,
  PushAction,
  showHUD,
  showToast,
  ToastStyle,
} from "@raycast/api";
import React from "react";
import { compactNumberFormat, formatDate } from "../lib/utils";
import { getPrimaryActionPreference, PrimaryAction, Video } from "../lib/youtubeapi";
import { OpenChannelInBrowser } from "./actions";
import { ChannelListItemDetailFetched } from "./channel";
import fs from "fs";
import { spawnSync } from "child_process";

function videoUrl(videoId: string | null | undefined): string | undefined {
  if (videoId) {
    return `https://youtube.com/watch?v=${videoId}`;
  }
  return undefined;
}

function OpenVideoInBrowser(props: { videoId: string | null | undefined }): JSX.Element | null {
  const videoId = props.videoId;
  if (videoId) {
    return <OpenInBrowserAction title="Open Video in Browser" url={`https://youtube.com/watch?v=${videoId}`} />;
  }
  return null;
}

function OpenWithIINAAction(props: { videoId: string | null | undefined }): JSX.Element | null {
  const url = videoUrl(props.videoId);
  if (url) {
    const iinaAppPath = "/Applications/IINA.app";
    const handle = async () => {
      const w = spawnSync("/usr/bin/open", ["-a", "iina", "--args", url], { shell: false });
      if (w.status !== undefined && w.status !== 0) {
        await showToast(ToastStyle.Failure, "Could not open IINA");
        return;
      }
      await showHUD("Open IINA");
    };
    if (fs.existsSync(iinaAppPath)) {
      return (
        <ActionPanel.Item
          title="Open with IINA"
          icon={{ fileIcon: iinaAppPath }}
          onAction={handle}
          shortcut={{ modifiers: ["cmd", "shift"], key: "i" }}
        />
      );
    }
  }
  return null;
}

function OpenWithVLCAction(props: { videoId: string | null | undefined }): JSX.Element | null {
  const url = videoUrl(props.videoId);
  if (url) {
    const appPath = "/Applications/VLC.app";
    const handle = async () => {
      const w = spawnSync("/usr/bin/open", ["-a", "vlc", "--args", url], { shell: false });
      if (w.status !== undefined && w.status !== 0) {
        await showToast(ToastStyle.Failure, "Could not open VLC");
        return;
      }
      await showHUD("Open VLC");
    };
    if (fs.existsSync(appPath)) {
      return (
        <ActionPanel.Item
          title="Open with VLC"
          icon={{ fileIcon: appPath }}
          onAction={handle}
          shortcut={{ modifiers: ["cmd", "shift"], key: "v" }}
        />
      );
    }
  }
  return null;
}

function ShowVideoDetails(props: { video: Video }): JSX.Element {
  const video = props.video;
  return (
    <PushAction
      title="Show Details"
      target={<VideoListItemDetail video={video} />}
      icon={{ source: Icon.List, tintColor: Color.PrimaryText }}
    />
  );
}

function ShowChannelAction(props: { channelId: string | undefined }): JSX.Element | null {
  const cid = props.channelId;
  if (cid) {
    return (
      <PushAction
        title="Show Channel"
        target={<ChannelListItemDetailFetched channelId={cid} />}
        icon={{ source: Icon.Person, tintColor: Color.PrimaryText }}
        shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
      />
    );
  }
  return null;
}

export function VideoListItemDetail(props: { video: Video }): JSX.Element {
  const video = props.video;
  const videoId = video.id;
  const desc = video.description || "<no description>";
  const title = video.title;
  const thumbnailUrl = video.thumbnails?.high?.url || undefined;
  const thumbnailMd = (thumbnailUrl ? `![thumbnail](${thumbnailUrl})` : "") + "\n\n";
  const channel = video.channelTitle;
  const meta: string[] = [`- Channel: ${channel}  `, `- Published: ${formatDate(video.publishedAt)}`];
  const md = `# ${title}\n\n${thumbnailMd}${desc}\n\n${meta.join("\n")}`;
  return (
    <Detail
      markdown={md}
      actions={
        <ActionPanel>
          <OpenVideoInBrowser videoId={videoId} />
          <ShowChannelAction channelId={video.channelId} />
          <OpenChannelInBrowser channelId={video.channelId} />
        </ActionPanel>
      }
    />
  );
}

export function VideoListItem(props: { video: Video }): JSX.Element {
  const video = props.video;
  const videoId = video.id;
  let parts: string[] = [];
  if (video.statistics) {
    parts = [`${compactNumberFormat(parseInt(video.statistics.viewCount))} 👀`];
  }
  const thumbnail = video.thumbnails?.high?.url || "";

  const maxLength = 70;
  const rawTitle = video.title;
  const title = rawTitle.slice(0, maxLength) + (rawTitle.length > maxLength ? " ..." : "");

  const mainActions = () => {
    const showDetail = <ShowVideoDetails video={video} />;
    const openBrowser = <OpenVideoInBrowser videoId={videoId} />;

    if (getPrimaryActionPreference() === PrimaryAction.Browser) {
      return (
        <React.Fragment>
          {openBrowser}
          {showDetail}
        </React.Fragment>
      );
    } else {
      return (
        <React.Fragment>
          {showDetail}
          {openBrowser}
        </React.Fragment>
      );
    }
  };

  return (
    <List.Item
      key={videoId}
      title={title}
      icon={{ source: thumbnail }}
      accessoryTitle={parts.join(" ")}
      actions={
        <ActionPanel>
          {mainActions()}
          <ShowChannelAction channelId={video.channelId} />
          <OpenWithVLCAction videoId={videoId} />
          <OpenWithIINAAction videoId={videoId} />
        </ActionPanel>
      }
    />
  );
}
