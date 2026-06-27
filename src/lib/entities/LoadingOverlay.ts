import { icons } from '../../assets/icons';
import { createHTMLElement } from '../utils/DOM/createElement/createHTMLElement';

class LoadingOverlay {
  private loaderEl: HTMLDivElement | null = null;
  private controlsContainer: HTMLDivElement | null = null;

  mount(parentContainer: HTMLElement, controlsContainer: HTMLDivElement): void {
    if (this.loaderEl) return;
    this.controlsContainer = controlsContainer;

    this.loaderEl = createHTMLElement({
      elementName: 'div',
      className: 'loading-screen hide',
      content: icons.loader,
      insertTo: {
        element: parentContainer,
        position: 'beforebegin',
      },
    });
  }

  show(): void {
    this?.loaderEl?.classList.remove('hide');
    if (this.controlsContainer) {
      this.controlsContainer.style.pointerEvents = 'none';
    }
  }

  hide(): void {
    this?.loaderEl?.classList.add('hide');
    if (this.controlsContainer) {
      this.controlsContainer.style.pointerEvents = 'auto';
    }
  }
}

export default new LoadingOverlay();
