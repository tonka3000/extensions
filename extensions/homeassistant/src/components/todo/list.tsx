import { StatesList } from "@components/state/list";
import { State } from "@lib/haapi";
import { Icon, List, Toast, showToast } from "@raycast/api";
import { useHATodos } from "./hooks";
import { TodoItem } from "./utils";

export function TodoEntityList() {
  return <StatesList domain="todo" />;
}

function TodoListItem(props: { todo: TodoItem }) {
  const t = props.todo;
  if (!t.uid || !t.status) {
    return null;
  }
  const iconSource = t.status === "completed" ? Icon.CheckCircle : Icon.Circle;
  const due = t.due ? new Date(t.due) : undefined;
  return (
    <List.Item
      title={t.summary ?? "?"}
      icon={iconSource}
      accessories={[{ date: due ? due : undefined, tooltip: due ? due.toLocaleString() : undefined }]}
    />
  );
}

export function TodoList(props: { state: State }) {
  const { todos, isLoading, error } = useHATodos(props.state);
  if (error) {
    showToast({ style: Toast.Style.Failure, title: "Error", message: error });
  }
  const uncompleted = todos?.items?.filter((t) => t.status === "needs_action");
  const completed = todos?.items?.filter((t) => t.status === "completed");
  return (
    <List isLoading={isLoading}>
      <List.Section title="Todo">{uncompleted?.map((t) => <TodoListItem key={t.uid} todo={t} />)}</List.Section>
      <List.Section title="Completed">{completed?.map((t) => <TodoListItem key={t.uid} todo={t} />)}</List.Section>
    </List>
  );
}
