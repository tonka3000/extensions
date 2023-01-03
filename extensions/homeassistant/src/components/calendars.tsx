import { List, showToast, Toast } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useState } from "react";
import { HACalendarEvent, State } from "../haapi";
import { useHAStates } from "../hooks";
import { StateListItem, useStateSearch } from "./states";
import { ha } from "../common";
import { getErrorMessage } from "../utils";

export function CalendarsScheduleList(): JSX.Element {
  const [searchText, setSearchText] = useState<string>();
  const { states: allStates, error, isLoading } = useHAStates();
  const { states } = useStateSearch(searchText, "calendar", undefined, allStates);
  const { events } = useCalendarEvents(states);

  if (error) {
    showToast({
      style: Toast.Style.Failure,
      title: "Cannot search Home Assistant Batteries",
      message: error.message,
    });
  }

  if (!states) {
    return <List isLoading={true} searchBarPlaceholder="Loading" />;
  }

  const sortedStates = states?.sort((s1, s2) => {
    const s1v = parseFloat(s1.state);
    const s2v = parseFloat(s2.state);
    if (s1v === s2v) {
      return 0;
    }
    return s1v < s2v ? -1 : 1;
  });
  return (
    <List searchBarPlaceholder="Filter by name or ID..." isLoading={isLoading} onSearchTextChange={setSearchText}>
      {sortedStates?.map((state) => (
        <StateListItem key={state.entity_id} state={state} />
      ))}
    </List>
  );
}

interface CalendarEvent {
  summary: string;
  description: string | null | undefined;
  entity_id: string;
  entity_alias: string;
}

function toDateString(date: Date): string {
  const y = date.getFullYear().toString().padStart(4, "0");
  const m = date.getMonth().toString().padStart(2, "0");
  const d = date.getDay().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function getAllEvents(entityIDs: string[] | undefined): Promise<void> {
  console.log(entityIDs);
  if (!entityIDs) {
    return;
  }
  //const result: Record<string, HACalendarEvent[]> = {};
  const result: Record<string, HACalendarEvent[]> = {};
  const push_event = (keydate: Date, ev: HACalendarEvent) => {
    const kds = toDateString(keydate);
    const vals = result[kds] || [];
    vals.push(ev);
    result[kds] = vals;
  };
  for (const eid of entityIDs) {
    try {
      const events = await ha.getCalenderEvents(eid);
      for (const e of events) {
        const sd = e.start.date;
        const sdt = e.start.dateTime;
        if (sd) {
          const m = sd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (m) {
            const keydate = new Date(Number(m[1]), Number(m[2]), Number(m[3]));
            push_event(keydate, e);
          }
        } else if (sdt) {
          const start = new Date(sdt);
          push_event(start, e);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
  console.log(result);
}

function useCalendarEvents(states?: State[] | undefined): {
  events?: any[];
  error?: Error;
  isLoading: boolean;
} {
  const { isLoading, data, error } = useCachedPromise(
    async (states: State[] | undefined) => {
      await getAllEvents(["calendar.mike_aigner2000_gmail_com"] /*states?.map((e) => e.entity_id)*/);
      const d: string[] = [];
      return d;
    },
    [states],
    {
      initialData: undefined,
      keepPreviousData: false,
      onError: async (error) => {
        await showToast(Toast.Style.Failure, "Error", getErrorMessage(error));
      },
    }
  );
  return { isLoading, error, events: data };
}
