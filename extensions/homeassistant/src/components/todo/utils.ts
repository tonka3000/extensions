import { ha } from "@lib/common";
import { State } from "@lib/haapi";

export interface Todos {
  items?: TodoItem[];
}

export interface TodoItem {
  summary?: string;
  uid?: string;
  status?: string;
  due?: string; // date or date and time
  description?: string;
}

export async function markTodoItemAsCompleted(state: State, todo: TodoItem) {
  await ha.callService("todo", "update_item", {
    entity_id: state.entity_id,
    status: "completed",
    item: todo.summary,
  });
}

export async function markTodoItemAsUncompleted(state: State, todo: TodoItem) {
  await ha.callService("todo", "update_item", {
    entity_id: state.entity_id,
    status: "needs_action",
    item: todo.summary,
  });
}
