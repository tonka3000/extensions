import { Action, ActionPanel, Color, List, showToast, Toast } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState } from "react";
import {
  InstallExtensionByIDAction,
  OpenExtensionByIDInBrowserAction,
  OpenExtensionByIDInVSCodeAction,
  UninstallExtensionByIDAction,
} from "./components/actions";
import { useLocalExtensions } from "./extensions";
import { Extension } from "./lib/vscode";

function InstallExtensionAction(props: { extension: GalleryExtension; afterInstall?: () => void }): JSX.Element {
  return (
    <InstallExtensionByIDAction extensionID={getFullExtensionID(props.extension)} afterInstall={props.afterInstall} />
  );
}

function UninstallExtensionAction(props: { extension: GalleryExtension; afterUninstall?: () => void }): JSX.Element {
  return (
    <UninstallExtensionByIDAction
      extensionID={getFullExtensionID(props.extension)}
      afterUninstall={props.afterUninstall}
    />
  );
}

export interface GalleryQueryResult {
  results: Result[];
}

export interface Result {
  extensions: GalleryExtension[];
  pagingToken: any;
  resultMetadata: ResultMetadaum[];
}

export interface GalleryExtension {
  publisher: Publisher;
  extensionId: string;
  extensionName: string;
  displayName: string;
  flags: string;
  lastUpdated: string;
  publishedDate: string;
  releaseDate: string;
  shortDescription?: string;
  versions: Version[];
  deploymentType: number;
}

export interface Publisher {
  publisherId: string;
  publisherName: string;
  displayName: string;
  flags: string;
  domain?: string;
  isDomainVerified: boolean;
}

export interface Version {
  version: string;
  flags: string;
  lastUpdated: string;
  files: File[];
  properties: Property[];
  assetUri: string;
  fallbackAssetUri: string;
}

export interface File {
  assetType: string;
  source: string;
}

export interface Property {
  key: string;
  value: string;
}

export interface ResultMetadaum {
  metadataType: string;
  metadataItems: MetadataItem[];
}

function getFullExtensionID(extension: GalleryExtension): string {
  return `${extension.publisher.publisherName}.${extension.extensionName}`;
}

export interface MetadataItem {
  name: string;
  count: number;
}

function GalleryExtensionListItem(props: {
  extension: GalleryExtension;
  installedExtensions: Extension[] | undefined;
  reloadLocalExtensions: () => void;
}): JSX.Element {
  const e = props.extension;
  const ie = props.installedExtensions;
  const iconURI = (): string | undefined => {
    if (!e.versions || e.versions.length <= 0) {
      return undefined;
    }
    const files = e.versions[0].files;
    const file = files.find((f) => f.assetType === "Microsoft.VisualStudio.Services.Icons.Default");
    if (file) {
      return file.source;
    }
  };
  const newstVersion = e.versions && e.versions.length > 0 ? e.versions[0] : undefined;
  const version = newstVersion ? newstVersion.version : undefined;
  const lastUpdated = newstVersion ? new Date(newstVersion.lastUpdated) : undefined;
  const installedIDs = ie ? ie.map((ext) => ext.id.toLocaleLowerCase()) : [];
  const alreadyInstalled = installedIDs.includes(getFullExtensionID(e).toLocaleLowerCase());
  return (
    <List.Item
      title={{ value: e.displayName, tooltip: e.shortDescription }}
      subtitle={e.publisher?.displayName}
      icon={iconURI() || "icon.png"}
      accessories={[
        {
          tag: alreadyInstalled ? { value: "Installed", color: Color.Blue } : "",
          tooltip: alreadyInstalled ? "Already Installed" : "",
        },
        { tag: version, tooltip: lastUpdated ? `Last Update: ${lastUpdated?.toLocaleString()}` : "" },
      ]}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            {alreadyInstalled ? (
              <UninstallExtensionAction extension={e} afterUninstall={props.reloadLocalExtensions} />
            ) : (
              <InstallExtensionAction extension={e} afterInstall={props.reloadLocalExtensions} />
            )}
            <OpenExtensionByIDInVSCodeAction extensionID={getFullExtensionID(e)} />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <OpenExtensionByIDInBrowserAction extensionID={getFullExtensionID(e)} />
            <Action.CopyToClipboard content={getFullExtensionID(e)} title="Copy Extension ID" />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

function getTotalResultCount(data: GalleryQueryResult | undefined): number | undefined {
  if (!data || !data?.results || data.results.length <= 0) {
    return;
  }
  const result = data.results[0];
  const resultCountObject = result.resultMetadata?.find((e) => e.metadataType === "ResultCount");
  if (resultCountObject) {
    const totalCountObject = resultCountObject.metadataItems.find((e) => e.name === "TotalCount");
    if (totalCountObject) {
      return totalCountObject.count;
    }
  }
}

export default function InstallExtensionRootCommand(): JSX.Element {
  const [searchText, setSearchText] = useState("");
  const { extensions: installExtensions, refresh } = useLocalExtensions();
  const { isLoading, error, data } = useGalleryQuery(searchText);
  if (error) {
    showToast({ style: Toast.Style.Failure, title: "Error", message: error });
  }
  const extensions = data?.results ? data?.results[0].extensions : undefined;
  const totalExtensionCount = getTotalResultCount(data);
  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search in VS Code Marketplace"
      onSearchTextChange={setSearchText}
      throttle
    >
      <List.Section
        title="Found Extensions"
        subtitle={
          totalExtensionCount !== undefined ? `${extensions?.length}/${totalExtensionCount}` : `${extensions?.length}`
        }
      >
        {extensions?.map((e) => (
          <GalleryExtensionListItem
            key={e.extensionId}
            extension={e}
            installedExtensions={installExtensions}
            reloadLocalExtensions={refresh}
          />
        ))}
      </List.Section>
    </List>
  );
}

function useGalleryQuery(searchText: string): {
  data: GalleryQueryResult | undefined;
  error: string | undefined;
  isLoading: boolean;
} {
  const url = "https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery?api-version=3.0-preview.1";
  const headers = {
    "content-type": "application/json",
    "accept-encoding": "gzip",
  };
  const request = {
    filters: [
      {
        criteria: [
          {
            filterType: 8,
            value: "Microsoft.VisualStudio.Code",
          },
          {
            filterType: 10,
            value: searchText,
          },
        ],
        pageNumber: 1,
        pageSize: 100,
        sortBy: 0,
        sortOrder: 0,
      },
    ],
    assetTypes: [],
    flags: 0,
  };
  const body = JSON.stringify(request);
  const execute = searchText.length > 0;
  const { isLoading, error, data } = useFetch<GalleryQueryResult | undefined>(url, {
    headers: headers,
    body: body,
    method: "POST",
    keepPreviousData: true,
    execute: execute,
  });
  return { isLoading: execute ? isLoading : false, error: error?.message, data };
}
