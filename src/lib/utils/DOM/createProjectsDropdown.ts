import { projectsDropdownContainer } from '../../DOMElements';

import { Dropdown } from './Dropdown';

import getProjectSummary from '../getProjectSummary';

/**
 * Items of the project picker: a pinned "Новый" sentinel followed by saved projects
 */
export type ProjectPickerItem = { kind: 'new' } | { kind: 'project'; project: StoredProject };

// Single sentinel instance so `Dropdown` can re-select it by identity
export const NEW_PROJECT_ITEM: ProjectPickerItem = { kind: 'new' };

export function toProjectPickerItems(projects: StoredProject[]): ProjectPickerItem[] {
  return [NEW_PROJECT_ITEM, ...projects.map((project) => ({ kind: 'project' as const, project }))];
}

// Project names are user input and get rendered via innerHTML
function escapeHTML(text: string): string {
  const span = document.createElement('span');
  span.textContent = text;
  return span.innerHTML;
}

export default function createProjectsDropdown(onChange: (item: ProjectPickerItem) => void) {
  return new Dropdown<ProjectPickerItem>({
    container: projectsDropdownContainer,
    items: [NEW_PROJECT_ITEM],
    caption: 'Проекты',
    renderItem: (item) => {
      if (item.kind === 'new') {
        return 'Новый';
      }

      return `
        <span>${escapeHTML(item.project.name)}</span>
        <span class="dropdown__item-summary">${getProjectSummary(item.project)}</span>
      `;
    },
    onChange,
  });
}
