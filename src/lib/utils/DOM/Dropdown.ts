export interface DropdownOptions<T> {
  container: HTMLElement;

  items: T[];

  caption: string;

  value?: T;

  renderItem(item: T): string;

  onChange?(item: T): void;
}

export class Dropdown<T> {
  private root!: HTMLElement;
  private trigger!: HTMLButtonElement;
  private valueElement!: HTMLElement;
  private menu!: HTMLElement;

  private caption: string;

  private disabled = false;

  value!: T;

  constructor(private options: DropdownOptions<T>) {
    this.value = options.value ?? options.items[0];
    this.caption = this.options.caption;

    this.render();

    this.attachEvents();

    this.select(this.value, false);
  }

  private render() {
    this.root = document.createElement('div');
    this.root.className = 'dropdown';

    this.root.innerHTML = `
    <span class="dropdown__caption">${this.caption}</span>
        <button class="dropdown__trigger" type="button">

            <span class="dropdown__value"></span>

            <svg
                class="dropdown__arrow"
                width="18"
                height="18"
                viewBox="0 0 24 24">

                <path
                    fill="currentColor"
                    d="M7 10l5 5 5-5"/>
            </svg>

        </button>

        <div class="dropdown__menu"></div>
        `;

    this.options.container.append(this.root);

    this.trigger = this.root.querySelector('.dropdown__trigger')!;
    this.valueElement = this.root.querySelector('.dropdown__value')!;
    this.menu = this.root.querySelector('.dropdown__menu')!;

    this.renderMenu();
  }

  /**
   * Replace the items list, re-render the menu and re-select `value` (or the first item).
   * Does not emit `onChange`.
   */
  setItems(items: T[], value?: T) {
    this.options.items = items;

    this.renderMenu();

    this.select(value ?? items[0], false);
  }

  get items(): readonly T[] {
    return this.options.items;
  }

  /**
   * Select `item` programmatically. Does not emit `onChange`.
   */
  setValue(item: T) {
    this.select(item, false);
  }

  /**
   * Block (or restore) opening the menu; a disabled dropdown gets the `dropdown--disabled` modifier
   */
  setDisabled(disabled: boolean) {
    this.disabled = disabled;

    this.trigger.disabled = disabled;
    this.root.classList.toggle('dropdown--disabled', disabled);

    if (disabled) {
      this.close();
    }
  }

  private renderMenu() {
    this.menu.innerHTML = '';

    this.options.items.forEach((item) => {
      const element = document.createElement('div');

      element.className = 'dropdown__item';

      element.innerHTML = this.options.renderItem(item);

      element.onclick = () => {
        this.select(item);

        this.close();
      };

      this.menu.append(element);
    });
  }

  private attachEvents() {
    this.trigger.onclick = () => {
      if (this.disabled) return;

      this.root.classList.toggle('dropdown--open');
    };

    document.addEventListener('click', (e) => {
      if (!this.root.contains(e.target as Node)) {
        this.close();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    });
  }

  private close() {
    this.root.classList.remove('dropdown--open');
  }

  private select(item: T, emit = true) {
    this.value = item;

    this.valueElement.innerHTML = this.options.renderItem(item);

    [...this.menu.children].forEach((child, index) => {
      child.classList.toggle('dropdown__item--selected', this.options.items[index] === item);
    });

    if (emit) {
      this.options.onChange?.(item);
    }
  }
}
