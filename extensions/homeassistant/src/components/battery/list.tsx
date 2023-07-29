import { List, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { useHAStates } from "../../hooks";
import { StateListItem } from "../states/list";
import { sortBatteries } from "./utils";
import { useStateSearch } from "../states/hooks";

export function BatteryList(): JSX.Element {
  const [searchText, setSearchText] = useState<string>();
  const { states: allStates, error, isLoading } = useHAStates();
  const { states } = useStateSearch(searchText, "", "battery", allStates);

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

  const sortedStates = sortBatteries(states);
  return (
    <List searchBarPlaceholder="Filter by name or ID..." isLoading={isLoading} onSearchTextChange={setSearchText}>
      {sortedStates?.map((state) => <StateListItem key={state.entity_id} state={state} />)}
    </List>
  );
}
