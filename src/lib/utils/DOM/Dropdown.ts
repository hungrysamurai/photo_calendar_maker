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
  private trigger!: HTMLElement;
  private valueElement!: HTMLElement;
  private menu!: HTMLElement;

  private caption: string;

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

    console.log(this.value);
  }
}
