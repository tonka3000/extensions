import { getHAWSConnection } from "@lib/common";
import { getErrorMessage } from "@lib/utils";
import { useEffect, useState } from "react";
import { State } from "@lib/haapi";
import { Todos } from "./utils";

export function useHATodos(state: State): {
  error?: string;
  isLoading: boolean;
  todos?: Todos;
} {
  const [todos, setTodos] = useState<Todos>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let didUnmount = false;

    async function fetchData() {
      if (didUnmount) {
        return;
      }

      setIsLoading(true);
      setError(undefined);

      try {
        const con = await getHAWSConnection();
        const data: Todos | undefined = await con.sendMessagePromise({
          type: "todo/item/list",
          entity_id: state.entity_id,
        });
        if (!didUnmount) {
          setTodos(data);
        }
      } catch (error) {
        if (!didUnmount) {
          setError(getErrorMessage(error));
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
  }, [state]);

  return { error, isLoading, todos };
}
