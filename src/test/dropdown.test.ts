import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Dropdown } from '../lib/utils/DOM/Dropdown';

describe('Dropdown', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
  });

  const create = (items: string[], onChange?: (item: string) => void) =>
    new Dropdown<string>({
      container,
      items,
      caption: 'Тест',
      renderItem: (item) => item,
      onChange,
    });

  const menuTexts = () =>
    [...container.querySelectorAll('.dropdown__item')].map((el) => el.textContent);

  const valueText = () => container.querySelector('.dropdown__value')?.textContent;

  const selectedText = () => container.querySelector('.dropdown__item--selected')?.textContent;

  describe('setItems', () => {
    it('re-renders the menu with the new items and selects the first one by default', () => {
      const dropdown = create(['a', 'b']);

      dropdown.setItems(['x', 'y', 'z']);

      expect(menuTexts()).toEqual(['x', 'y', 'z']);
      expect(dropdown.value).toBe('x');
      expect(valueText()).toBe('x');
      expect(selectedText()).toBe('x');
    });

    it('re-selects the given value', () => {
      const dropdown = create(['a', 'b']);

      dropdown.setItems(['x', 'y', 'z'], 'y');

      expect(dropdown.value).toBe('y');
      expect(valueText()).toBe('y');
      expect(selectedText()).toBe('y');
    });

    it('does not emit onChange', () => {
      const onChange = vi.fn();
      const dropdown = create(['a', 'b'], onChange);

      dropdown.setItems(['x', 'y'], 'y');

      expect(onChange).not.toHaveBeenCalled();
    });

    it('clicking a re-rendered item selects it and emits onChange', () => {
      const onChange = vi.fn();
      const dropdown = create(['a', 'b'], onChange);

      dropdown.setItems(['x', 'y']);
      (container.querySelectorAll('.dropdown__item')[1] as HTMLElement).click();

      expect(dropdown.value).toBe('y');
      expect(onChange).toHaveBeenCalledWith('y');
    });
  });

  describe('setDisabled', () => {
    const root = () => container.querySelector('.dropdown')!;
    const trigger = () => container.querySelector('.dropdown__trigger') as HTMLButtonElement;

    it('blocks opening and applies the modifier class', () => {
      const dropdown = create(['a', 'b']);

      dropdown.setDisabled(true);
      trigger().click();

      expect(root()).toHaveClass('dropdown--disabled');
      expect(root()).not.toHaveClass('dropdown--open');
    });

    it('closes an already open menu', () => {
      const dropdown = create(['a', 'b']);

      trigger().click();
      dropdown.setDisabled(true);

      expect(root()).not.toHaveClass('dropdown--open');
    });

    it('setDisabled(false) restores opening and removes the modifier class', () => {
      const dropdown = create(['a', 'b']);

      dropdown.setDisabled(true);
      dropdown.setDisabled(false);
      trigger().click();

      expect(root()).not.toHaveClass('dropdown--disabled');
      expect(root()).toHaveClass('dropdown--open');
    });
  });

  describe('setValue', () => {
    it('updates the value without emitting onChange', () => {
      const onChange = vi.fn();
      const dropdown = create(['a', 'b', 'c'], onChange);

      dropdown.setValue('c');

      expect(dropdown.value).toBe('c');
      expect(valueText()).toBe('c');
      expect(selectedText()).toBe('c');
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
