import { showToast, Toast, List, Action } from "@raycast/api";
import { useState, useEffect } from "react";
import { State } from "../../haapi";
import { useHAStates } from "../../hooks";
import { StateListItem } from "../state/list";
import { useStateSearch } from "../state/hooks";

export function ZoneList(props: { state: State }): JSX.Element {
  const s = props.state;
  const { states: allStates, isLoading } = useHAStates();
  const persons = s.attributes.persons as string[] | undefined;
  const [resolvedPersons, setResolvedPersons] = useState<State[]>();

  useEffect(() => {
    if (s && allStates && allStates.length > 0 && persons && persons.length > 0) {
      const resolved: State[] = [];
      for (const eid of persons) {
        const personEntity = allStates.find((e) => e.entity_id === eid);
        if (personEntity) {
          resolved.push(personEntity);
        }
      }
      setResolvedPersons(resolved);
    }
  }, [s, allStates]);

  return (
    <List isLoading={isLoading}>
      <List.Section title="Persons in Zone" subtitle={`${persons?.length}`}>
        {resolvedPersons?.map((ps) => <StateListItem key={ps.entity_id} state={ps} />)}
      </List.Section>
    </List>
  );
}

export function ZonesList(): JSX.Element {
  const [searchText, setSearchText] = useState<string>();
  const { states: allStates, error, isLoading } = useHAStates();
  const { states } = useStateSearch(searchText, "zone", "", allStates);

  if (error) {
    showToast({
      style: Toast.Style.Failure,
      title: "Cannot fetch Home Assistant Zones",
      message: error.message,
    });
  }

  if (!states) {
    return <List isLoading={true} searchBarPlaceholder="Loading" />;
  }

  return (
    <List searchBarPlaceholder="Filter by name or ID..." isLoading={isLoading} onSearchTextChange={setSearchText}>
      {states?.map((state) => <StateListItem key={state.entity_id} state={state} />)}
    </List>
  );
}
