import { Action, ActionPanel, Color, Icon, List, Toast, showToast } from "@raycast/api";
import * as afs from "fs/promises";
import { useEffect, useState } from "react";
import { ensureCLI, speedtestCLIDirectory } from "./lib/cli";
import { Result, ResultProgress, runSpeedTest } from "./lib/speedtest";
import { pingToString, speedToString } from "./lib/utils";

function percentageToString(val: number | undefined): string | undefined {
  if (val === undefined) {
    return undefined;
  }
  const v = Math.round(val * 100);
  if (v === 100) {
    return undefined;
  }
  return `${v}%`;
}

function ClearCacheAction(props: { isLoading: boolean }) {
  if (props.isLoading) {
    return null;
  }
  const handle = async () => {
    try {
      const d = speedtestCLIDirectory();
      await afs.rm(d, { recursive: true });
    } catch (error) {
      // ignore
    }
  };
  return <Action title="Clear CLI Cache" icon={{ source: Icon.XMarkCircle, tintColor: Color.Red }} onAction={handle} />;
}

function ISPListItem(props: {
  url: string | undefined;
  name: string | undefined;
  summary: JSX.Element;
  isLoading: boolean;
}): JSX.Element {
  const n = props.name;
  const url = props.url;
  return (
    <List.Item
      title="Internet Service Provider"
      icon={{ source: Icon.Globe, tintColor: Color.Green }}
      actions={
        <ActionPanel>
          {props.summary}
          {n && <Action.CopyToClipboard content={n} />}
          {url && (
            <Action.OpenInBrowser
              title="Open Results in Browser"
              url={url ?? ""}
              shortcut={{ modifiers: ["opt"], key: "enter" }}
            />
          )}
          <ClearCacheAction isLoading={props.isLoading} />
        </ActionPanel>
      }
      accessories={[
        {
          text: `${n ? n : "?"}`,
        },
      ]}
    />
  );
}

function ServerListItem(props: {
  url: string | undefined;
  serverName: string | undefined;
  summary: JSX.Element;
}): JSX.Element {
  const sn = props.serverName;
  const url = props.url;
  return (
    <List.Item
      title="Server"
      icon={{ source: Icon.HardDrive, tintColor: Color.Green }}
      actions={
        <ActionPanel>
          {props.summary}
          {sn && <Action.CopyToClipboard content={sn} />}
          {url && (
            <Action.OpenInBrowser
              title="Open Results in Browser"
              url={url ?? ""}
              shortcut={{ modifiers: ["opt"], key: "enter" }}
            />
          )}
        </ActionPanel>
      }
      accessories={[
        {
          text: `${sn ? sn : "?"}`,
        },
      ]}
    />
  );
}

function PingListItem(props: {
  url: string | undefined;
  ping: number | undefined;
  progress: number | undefined;
  summary: JSX.Element;
}): JSX.Element {
  const p = props.ping;
  const url = props.url;
  return (
    <List.Item
      title="Ping"
      subtitle={percentageToString(props.progress)}
      icon={{ source: Icon.LevelMeter, tintColor: Color.Blue }}
      actions={
        <ActionPanel>
          {props.summary}
          {p && <Action.CopyToClipboard content={pingToString(p)} />}
          {url && (
            <Action.OpenInBrowser
              title="Open Results in Browser"
              url={url ?? ""}
              shortcut={{ modifiers: ["opt"], key: "enter" }}
            />
          )}
        </ActionPanel>
      }
      accessories={[
        {
          text: `${pingToString(p)}`,
        },
      ]}
    />
  );
}

function DownloadListItem(props: {
  url: string | undefined;
  download: number | undefined;
  progress: number | undefined;
  summary: JSX.Element;
}): JSX.Element {
  const d = props.download;
  const url = props.url;
  return (
    <List.Item
      title="Download"
      subtitle={percentageToString(props.progress)}
      icon={{ source: Icon.ArrowDownCircle, tintColor: Color.Blue }}
      actions={
        <ActionPanel>
          {props.summary}
          {d && <Action.CopyToClipboard content={speedToString(d)} />}
          {url && (
            <Action.OpenInBrowser
              title="Open Results in Browser"
              url={url ?? ""}
              shortcut={{ modifiers: ["opt"], key: "enter" }}
            />
          )}
        </ActionPanel>
      }
      accessories={[
        {
          text: `${speedToString(d)}`,
        },
      ]}
    />
  );
}

function UploadListItem(props: {
  url: string | undefined;
  upload: number | undefined;
  progress: number | undefined;
  summary: JSX.Element;
}): JSX.Element {
  const u = props.upload;
  const url = props.url;
  return (
    <List.Item
      title="Upload"
      subtitle={percentageToString(props.progress)}
      icon={{ source: Icon.ArrowUpCircle, tintColor: "#bf71ff" }}
      actions={
        <ActionPanel>
          {props.summary}
          {u && <Action.CopyToClipboard content={speedToString(u)} />}
          {url && (
            <Action.OpenInBrowser
              title="Open Results in Browser"
              url={url ?? ""}
              shortcut={{ modifiers: ["opt"], key: "enter" }}
            />
          )}
        </ActionPanel>
      }
      accessories={[
        {
          text: `${speedToString(u)}`,
        },
      ]}
    />
  );
}

function ResultListItem(props: { result: Result; isLoading: boolean; summary: JSX.Element }): JSX.Element {
  const url = props.result?.url;
  return (
    <List.Item
      title="Result Link"
      icon={{ source: Icon.CheckCircle, tintColor: Color.Blue }}
      actions={
        <ActionPanel>
          {props.summary}
          {!props.isLoading && <Action.CopyToClipboard content={url ?? ""} />}
          {!props.isLoading && (
            <Action.OpenInBrowser
              title="Open Results in Browser"
              url={url ?? ""}
              shortcut={{ modifiers: ["opt"], key: "enter" }}
            />
          )}
        </ActionPanel>
      }
      accessories={[
        {
          text: props.isLoading ? "?" : `${props.result.url || "?"}`,
        },
      ]}
    />
  );
}

function CopySummaryAction(props: { result: Result }): JSX.Element {
  const r = props.result;
  const parts: string[] = [
    `ISP: ${r.isp || "?"}`,
    `Server: ${r.serverName || "?"}`,
    `Ping: ${pingToString(r.ping)}`,
    `Download: ${speedToString(r.download)}`,
    `Upload: ${speedToString(r.upload)}`,
    `Result: ${r.url || "?"}`,
  ];
  return <Action.CopyToClipboard title="Copy Summary to Clipboard" content={parts.join("; ")} />;
}

function RestartAction(props: { isLoading: boolean; revalidate: () => void }) {
  if (props.isLoading) {
    return null;
  }
  return (
    <Action
      title="Restart"
      icon={Icon.RotateAntiClockwise}
      shortcut={{ modifiers: ["cmd"], key: "r" }}
      onAction={props.revalidate}
    />
  );
}

export default function SpeedtestList() {
  const { result, error, isLoading, resultProgress, revalidate } = useSpeedtest();

  if (error || result.error) {
    showToast({
      style: Toast.Style.Failure,
      title: "Speedtest failed",
      message: error,
    });
  }
  const title = isLoading ? "Speedtest running" : undefined;
  const summaryAction = (
    <>
      <CopySummaryAction result={result} />
      <RestartAction isLoading={isLoading} revalidate={revalidate} />{" "}
    </>
  );

  return (
    <List isLoading={isLoading} searchBarPlaceholder={title}>
      {result.error ? (
        <List.EmptyView icon={Icon.LevelMeter} title={result.error} />
      ) : (
        <>
          <ISPListItem url={result.url} name={result.isp} summary={summaryAction} isLoading={isLoading} />
          <ServerListItem url={result.url} serverName={result.serverName} summary={summaryAction} />
          <PingListItem url={result.url} ping={result.ping} progress={resultProgress.ping} summary={summaryAction} />
          <DownloadListItem
            url={result.url}
            download={result.download}
            progress={resultProgress.download}
            summary={summaryAction}
          />
          <UploadListItem
            url={result.url}
            upload={result.upload}
            progress={resultProgress.upload}
            summary={summaryAction}
          />
          <ResultListItem result={result} isLoading={isLoading} summary={summaryAction} />
        </>
      )}
    </List>
  );
}

function useSpeedtest(): {
  result: Result;
  error: string | undefined;
  isLoading: boolean;
  resultProgress: ResultProgress;
  revalidate: () => void;
} {
  const [result, setResult] = useState<Result>({
    isp: undefined,
    location: undefined,
    serverName: undefined,
    download: undefined,
    upload: undefined,
    ping: undefined,
    url: undefined,
    error: undefined,
  });
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [date, setDate] = useState<Date>();
  const [resultProgress, setResultProgress] = useState<ResultProgress>({
    download: undefined,
    upload: undefined,
    ping: undefined,
  });
  const revalidate = () => {
    setDate(new Date());
    setIsLoading(true);
  };
  let cancel = false;
  useEffect(() => {
    async function runTest() {
      try {
        await ensureCLI();
        runSpeedTest(
          (r: Result) => {
            if (!cancel) {
              setResult({ ...r });
            }
          },
          (r: Result) => {
            if (!cancel) {
              setResult({ ...r });
              setIsLoading(false);
            }
          },
          (err: Error) => {
            if (!cancel) {
              setError(err.message);
              setIsLoading(false);
            }
          },
          (prog: ResultProgress) => {
            if (!cancel) {
              setResultProgress(prog);
            }
          },
        );
      } catch (err) {
        if (!cancel) {
          setError(err instanceof Error ? err.message : "Unknown Error");
          setIsLoading(false);
        }
      }
    }
    runTest();
    return () => {
      cancel = true;
    };
  }, [date]);
  return { result, error, isLoading, resultProgress, revalidate };
}
