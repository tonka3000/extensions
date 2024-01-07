import { EntityStandardActionSections } from "@components/entity";
import { UpdateInstallAction, UpdateSkipVersionAction } from "@components/update/actions";
import { ShowWeatherAction } from "@components/weather/list";
import { State } from "@lib/haapi";
import { Action, ActionPanel } from "@raycast/api";
import { TodoList } from "./list";

export function ShowTodoListAction(props: { state: State }) {
  return <Action.Push title="Show Todos" target={<TodoList state={props.state} />} />;
}

export function TodoListActionPanel(props: { state: State }) {
  const state = props.state;
  return (
    <ActionPanel>
      <ActionPanel.Section title="Controls">
        <ShowTodoListAction state={state} />
      </ActionPanel.Section>
      <ActionPanel.Section title="Install">
        <UpdateInstallAction state={state} />
        <UpdateSkipVersionAction state={state} />
      </ActionPanel.Section>
      <EntityStandardActionSections state={state} />
    </ActionPanel>
  );
}
