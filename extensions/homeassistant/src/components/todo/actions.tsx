import { EntityStandardActionSections } from "@components/entity";
import { State } from "@lib/haapi";
import { Action, ActionPanel, List, Toast, showToast } from "@raycast/api";
import { TodoList } from "./list";
import { TodoItem, markTodoItemAsCompleted, markTodoItemAsUncompleted } from "./utils";
import { getErrorMessage } from "@lib/utils";

export function ShowTodoListAction(props: { state: State }) {
  return <Action.Push title="Show Todos" target={<TodoList state={props.state} />} />;
}

interface TodoActionProps {
  state: State;
  todo: TodoItem;
}

function TodoMarkCompleted(props: TodoActionProps) {
  const t = props.todo;
  if (!t.summary || !t.status || t.status === "completed") {
    return null;
  }
  const onAction = async () => {
    try {
      await markTodoItemAsCompleted(props.state, props.todo);
    } catch (error) {
      showToast({ style: Toast.Style.Failure, title: "Error", message: getErrorMessage(error) });
    }
  };
  return (
    <Action title="Mark As Completed" shortcut={{ modifiers: ["opt", "cmd"], key: "enter" }} onAction={onAction} />
  );
}

function TodoMarkUncompleted(props: TodoActionProps) {
  const t = props.todo;
  if (!t.summary || !t.status || t.status === "needs_action") {
    return null;
  }
  const onAction = async () => {
    try {
      await markTodoItemAsUncompleted(props.state, props.todo);
    } catch (error) {
      showToast({ style: Toast.Style.Failure, title: "Error", message: getErrorMessage(error) });
    }
  };
  return <Action title="Mark As Uncompleted" onAction={onAction} />;
}

function TodoShowDetail(props: TodoActionProps) {
  const t = props.todo;
  if (!t.summary || !t.status) {
    return null;
  }
  return (
    <Action.Push
      title="Show Detail"
      target={
        <List>
          <List.Item title={"TODO"} />
        </List>
      }
    />
  );
}

export function TodoListItemActionPanel(props: { state: State; todo: TodoItem }) {
  const state = props.state;
  return (
    <ActionPanel>
      <ActionPanel.Section title="Controls">
        <TodoShowDetail state={state} todo={props.todo} />
      </ActionPanel.Section>
      <ActionPanel.Section>
        <TodoMarkCompleted state={state} todo={props.todo} />
        <TodoMarkUncompleted state={state} todo={props.todo} />
      </ActionPanel.Section>
    </ActionPanel>
  );
}

export function TodoListActionPanel(props: { state: State }) {
  const state = props.state;
  return (
    <ActionPanel>
      <ActionPanel.Section title="Controls">
        <ShowTodoListAction state={state} />
      </ActionPanel.Section>
      <EntityStandardActionSections state={state} />
    </ActionPanel>
  );
}
