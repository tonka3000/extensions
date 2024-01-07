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
