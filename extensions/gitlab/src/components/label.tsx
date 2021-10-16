import { ActionPanel, Color, CopyToClipboardAction, Detail, Icon, List, PushAction } from "@raycast/api";
import { Label } from "../gitlabapi";
import { GitLabIcons } from "../icons";

export function LabelDetail(props: { label: Label }) {
  const l = props.label;
  let md = `## Color\n${l.color}`;
  if (l.description) {
    md += `\n## Description\n${l.description}`;
  }
  return <Detail markdown={md} />;
}

export function LabelListItem(props: { label: Label }) {
  const l = props.label;
  return (
    <List.Item
      key={l.id.toString()}
      title={l.name}
      icon={{ source: Icon.Circle, tintColor: l.color }}
      actions={
        <ActionPanel>
          <PushAction
            title="Show Details"
            target={<LabelDetail label={l} />}
            icon={{ source: GitLabIcons.show_details, tintColor: Color.PrimaryText }}
          />
          <CopyToClipboardAction title="Copy Color" content={l.color} />
        </ActionPanel>
      }
    />
  );
}

export function LabelList(props: {
  labels: Label[];
  title?: string | undefined;
  onSearchTextChange?: ((text: string) => void) | undefined;
  isLoading?: boolean | undefined;
  throttle?: boolean | undefined;
}) {
  return (
    <List
      searchBarPlaceholder="Search labels by name"
      onSearchTextChange={props.onSearchTextChange}
      isLoading={props.isLoading}
      throttle={props.throttle}
    >
      <List.Section title={props.title}>
        {props.labels.map((l) => (
          <LabelListItem key={l.id.toString()} label={l} />
        ))}
      </List.Section>
    </List>
  );
}
