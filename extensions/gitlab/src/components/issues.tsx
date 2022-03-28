import { Action, ActionPanel, List, Color, showToast, Toast, Detail, Image } from "@raycast/api";
import { gql } from "@apollo/client";
import { useEffect, useState } from "react";
import { gitlab, gitlabgql } from "../common";
import { Group, Issue, Project } from "../gitlabapi";
import { GitLabIcons } from "../icons";
import {
  capitalizeFirstLetter,
  getErrorMessage,
  now,
  optimizeMarkdownText,
  Query,
  toDateString,
  tokenizeQueryText,
} from "../utils";
import { IssueItemActions } from "./issue_actions";
import { GitLabOpenInBrowserAction } from "./actions";

/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types */

export enum IssueScope {
  created_by_me = "created_by_me",
  assigned_to_me = "assigned_to_me",
  all = "all",
}

export enum IssueState {
  all = "all",
  opened = "opened",
  closed = "closed",
}

const GET_ISSUE_DETAIL = gql`
  query GetIssueDetail($id: ID!) {
    issue(id: $id) {
      description
      webUrl
    }
  }
`;

export function IssueDetailFetch(props: { project: Project; issueId: number }): JSX.Element {
  const { issue, isLoading, error } = useIssue(props.project.id, props.issueId);
  if (error) {
    showToast(Toast.Style.Failure, "Could not fetch Issue Details", error);
  }
  if (isLoading || !issue) {
    return <Detail isLoading={isLoading} />;
  } else {
    return <IssueDetail issue={issue} />;
  }
}

interface IssueDetailData {
  description: string;
  projectWebUrl?: string;
}

export function IssueDetail(props: { issue: Issue }): JSX.Element {
  const issue = props.issue;
  const { issueDetail, error, isLoading } = useDetail(props.issue.id);
  if (error) {
    showToast(Toast.Style.Failure, "Could not get issue details", error);
  }

  const desc = (issueDetail?.description ? issueDetail.description : props.issue.description) || "";

  const lines: string[] = [];
  if (issue) {
    lines.push(`# ${issue.title}`);
    lines.push(`Milestone: ${issue.milestone?.title || "<no milestone>"}`);
    if (issue.author) {
      lines.push(`Author: ${issue.author.name} [@${issue.author.username}](${issue.author.web_url})`);
    }
    lines.push(`Status: \`${capitalizeFirstLetter(issue.state)}\``);
    const labels = issue.labels.map((i) => `\`${i.name || i}\``).join(" ") + "  \n";
    lines.push(`Labels: ${labels || "<No Label>"}`);
    lines.push("## Description\n" + optimizeMarkdownText(desc, issueDetail?.projectWebUrl));
  }
  const md = lines.join("  \n");

  return (
    <Detail
      markdown={md}
      isLoading={isLoading}
      navigationTitle={`${props.issue.reference_full}`}
      actions={
        <ActionPanel>
          <GitLabOpenInBrowserAction url={props.issue.web_url} />
          <IssueItemActions issue={props.issue} />
          <Action.CopyToClipboard title="Copy Issue Description" content={issue.description} />
        </ActionPanel>
      }
    />
  );
}

function useDetail(issueID: number): {
  issueDetail?: IssueDetailData;
  error?: string;
  isLoading: boolean;
} {
  const [issueDetail, setIssueDetail] = useState<IssueDetailData>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // FIXME In the future version, we don't need didUnmount checking
    // https://github.com/facebook/react/pull/22114
    let didUnmount = false;

    async function fetchData() {
      if (issueID <= 0 || didUnmount) {
        return;
      }

      setIsLoading(true);
      setError(undefined);

      try {
        const data = await gitlabgql.client.query({
          query: GET_ISSUE_DETAIL,
          variables: { id: `gid://gitlab/Issue/${issueID}` },
        });
        const desc = data.data.issue.description || "<no description>";
        const webUrl = (data.data.issue.webUrl as string) || "";
        let projectWebUrl: string | undefined;
        const index = webUrl.indexOf("/-/");
        if (index > 1) {
          projectWebUrl = webUrl.substring(0, index);
        }
        if (!didUnmount) {
          setIssueDetail({
            description: desc,
            projectWebUrl: projectWebUrl,
          });
        }
      } catch (e) {
        if (!didUnmount) {
          setError(getErrorMessage(e));
        }
      } finally {
        if (!didUnmount) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      didUnmount = true;
    };
  }, [issueID]);

  return { issueDetail, error, isLoading };
}

export function IssueListItem(props: { issue: Issue; refreshData: () => void }): JSX.Element {
  const issue = props.issue;
  const tintColor = issue.state === "opened" ? Color.Green : Color.Red;
  const extraSubtitle = issue.milestone ? `${issue.milestone.title}  |  ` : "";
  return (
    <List.Item
      id={issue.id.toString()}
      title={issue.title}
      subtitle={"#" + issue.iid}
      icon={{ source: GitLabIcons.issue, tintColor: tintColor }}
      accessoryIcon={{ source: issue.author?.avatar_url || "", mask: Image.Mask.Circle }}
      accessoryTitle={extraSubtitle + toDateString(issue.updated_at)}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.Push
              title="Show Details"
              target={<IssueDetail issue={issue} />}
              icon={{ source: GitLabIcons.show_details, tintColor: Color.PrimaryText }}
            />
            <GitLabOpenInBrowserAction url={issue.web_url} shortcut={{ modifiers: ["cmd"], key: "enter" }} />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <IssueItemActions issue={issue} onDataChange={props.refreshData} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

interface IssueListProps {
  scope: IssueScope;
  state?: IssueState;
  project?: Project;
  group?: Group;
  searchBarAccessory?:
    | boolean
    | React.ReactElement<List.Dropdown.Props, string | React.JSXElementConstructor<any>>
    | null
    | undefined;
}

function navTitle(project?: Project, group?: Group): string | undefined {
  if (group) {
    return `Group Issues ${group.full_path}`;
  }
  if (project) {
    return `Issues ${project.fullPath}`;
  }
  return undefined;
}

export function IssueList({
  scope = IssueScope.created_by_me,
  state = IssueState.all,
  project = undefined,
  group = undefined,
  searchBarAccessory = undefined,
}: IssueListProps): JSX.Element {
  const [searchText, setSearchText] = useState<string>();
  const { issues, error, isLoading, refresh } = useSearch(searchText, scope, state, project, group);

  if (error) {
    showToast(Toast.Style.Failure, "Cannot search issue", error);
  }

  if (!issues) {
    return <List isLoading={true} searchBarPlaceholder="Loading" />;
  }

  const title = scope == IssueScope.assigned_to_me ? "Your Issues" : "Created Recently";

  return (
    <List
      searchBarPlaceholder="Search issues by name..."
      onSearchTextChange={setSearchText}
      isLoading={isLoading}
      throttle={true}
      searchBarAccessory={searchBarAccessory}
      navigationTitle={navTitle(project, group)}
    >
      <List.Section title={title} subtitle={issues?.length.toString() || ""}>
        {issues?.map((issue) => (
          <IssueListItem key={issue.id} issue={issue} refreshData={refresh} />
        ))}
      </List.Section>
    </List>
  );
}

function getIssueQuery(query: string | undefined) {
  return tokenizeQueryText(query, ["label", "author", "milestone", "assignee"]);
}

function injectQueryNamedParameters(
  requestParams: Record<string, any>,
  query: Query,
  scope: IssueScope,
  isNegative: boolean
) {
  const namedParams = isNegative ? query.negativeNamed : query.named;
  for (const extraParam of Object.keys(namedParams)) {
    const extraParamVal = namedParams[extraParam];
    const prefixed = (text: string): string => {
      return isNegative ? `not[${text}]` : text;
    };
    if (extraParamVal) {
      switch (extraParam) {
        case "label":
          {
            requestParams[prefixed("labels")] = extraParamVal.join(",");
          }
          break;
        case "author":
          {
            if (scope === IssueScope.all) {
              requestParams[prefixed("author_username")] = extraParamVal.join(",");
            }
          }
          break;
        case "milestone":
          {
            requestParams[prefixed("milestone")] = extraParamVal.join(",");
          }
          break;
        case "assignee":
          {
            if (scope === IssueScope.all) {
              requestParams[prefixed("assignee_username")] = extraParamVal.join(",");
            }
          }
          break;
      }
    }
  }
}

export function useSearch(
  query: string | undefined,
  scope: IssueScope,
  state: IssueState,
  project?: Project,
  group?: Group
): {
  issues?: Issue[];
  error?: string;
  isLoading: boolean;
  refresh: () => void;
} {
  const [issues, setIssues] = useState<Issue[]>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [timestamp, setTimestamp] = useState<Date>(now());

  const refresh = () => {
    setTimestamp(now());
  };

  useEffect(() => {
    // FIXME In the future version, we don't need didUnmount checking
    // https://github.com/facebook/react/pull/22114
    let didUnmount = false;

    async function fetchData() {
      if (query === null || didUnmount) {
        return;
      }

      setIsLoading(true);
      setError(undefined);

      try {
        const qd = getIssueQuery(query);
        query = qd.query;
        const requestParams: Record<string, any> = {
          state: state,
          scope: scope,
          search: query || "",
          in: "title",
        };
        injectQueryNamedParameters(requestParams, qd, scope, false);
        injectQueryNamedParameters(requestParams, qd, scope, true);
        if (group) {
          const glIssues = await gitlab.getGroupIssues(requestParams, group.id);
          if (!didUnmount) {
            setIssues(glIssues);
          }
        } else {
          const glIssues = await gitlab.getIssues(requestParams, project);
          if (!didUnmount) {
            setIssues(glIssues);
          }
        }
      } catch (e) {
        if (!didUnmount) {
          setError(getErrorMessage(e));
        }
      } finally {
        if (!didUnmount) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      didUnmount = true;
    };
  }, [query, timestamp, project]);

  return { issues, error, isLoading, refresh };
}

export function useIssue(
  projectID: number,
  issueID: number
): {
  issue?: Issue;
  error?: string;
  isLoading: boolean;
} {
  const [issue, setIssue] = useState<Issue>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // FIXME In the future version, we don't need didUnmount checking
    // https://github.com/facebook/react/pull/22114
    let didUnmount = false;

    async function fetchData() {
      if (didUnmount) {
        return;
      }

      setIsLoading(true);
      setError(undefined);

      try {
        const glIssue = await gitlab.getIssue(projectID, issueID, {});
        if (!didUnmount) {
          setIssue(glIssue);
        }
      } catch (e) {
        if (!didUnmount) {
          setError(getErrorMessage(e));
        }
      } finally {
        if (!didUnmount) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      didUnmount = true;
    };
  }, [projectID, issueID]);

  return { issue, error, isLoading };
}
