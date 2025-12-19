import { List, getPreferenceValues } from "@raycast/api";
import { useState } from "react";
import { gitlab } from "../common";
import { ProjectListEmptyView, ProjectListItem, ProjectScope } from "./project";
import { showFailureToast, usePromise } from "@raycast/utils";

function activeProjects(): boolean {
  const prefs = getPreferenceValues();
  return (prefs.active as boolean) || false;
}

export function ProjectSearchList() {
  const [searchText, setSearchText] = useState<string>();
  const [scope, setScope] = useState<string>(ProjectScope.membership);
  const active = activeProjects();
  const {
    data: projects,
    error,
    isLoading,
  } = usePromise(
    async (searchText, scope, active) => {
      const membership = scope === ProjectScope.membership ? "true" : "false";
      const glProjects = await gitlab.getProjects({
        searchText: searchText || "",
        searchIn: "title",
        membership,
        active,
      });
      return glProjects;
    },
    [searchText, scope, active],
  );

  if (error) {
    showFailureToast(error);
  }

  return (
    <List
      searchBarPlaceholder="Filter Projects by Name..."
      onSearchTextChange={setSearchText}
      isLoading={isLoading}
      throttle={true}
      searchBarAccessory={
        <List.Dropdown tooltip="Scope" onChange={setScope} storeValue>
          <List.Dropdown.Item title="My Projects" value={ProjectScope.membership} />
          <List.Dropdown.Item title="All" value={ProjectScope.all} />
        </List.Dropdown>
      }
    >
      <List.Section title="Projects" subtitle={`${projects?.length}`}>
        {projects?.map((project) => (
          <ProjectListItem key={project.id} project={project} />
        ))}
      </List.Section>
      <ProjectListEmptyView />
    </List>
  );
}
