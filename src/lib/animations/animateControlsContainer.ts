import gsap from 'gsap';

export default function animateControlsContainer(
  controlsContainer: HTMLDivElement,
  direction: AnimationDirection,
) {
  const navButtons = controlsContainer.querySelectorAll('.nav-btn');

  const tl = gsap.timeline();

  if (direction === 'in') {
    tl.fromTo(controlsContainer, { bottom: '-4rem' }, { bottom: '2rem', ease: 'power.in' });

    if (navButtons.length) {
      const arr = Array.from(navButtons);
      const prevBtn = arr.find((el) => el.id === 'prev-month') as HTMLElement;
      const nextBtn = arr.find((el) => el.id === 'next-month') as HTMLElement;

      tl.fromTo(prevBtn, { translateX: '-12rem' }, { translateX: '-8rem', ease: 'power.in' }, '<');
      tl.fromTo(nextBtn, { translateX: '12rem' }, { translateX: '8rem', ease: 'power.in' }, '<');
    }
  } else {
    tl.fromTo(controlsContainer, { bottom: '2rem', ease: 'power1.out' }, { bottom: '-4rem' });

    if (navButtons.length) {
      const arr = Array.from(navButtons);
      const prevBtn = arr.find((el) => el.id === 'prev-month') as HTMLElement;
      const nextBtn = arr.find((el) => el.id === 'next-month') as HTMLElement;

      tl.fromTo(
        prevBtn,
        { translateX: '-8rem' },
        { translateX: '-12rem', ease: 'power1.out' },
        '<',
      );
      tl.fromTo(nextBtn, { translateX: '8rem' }, { translateX: '12rem', ease: 'power1.out' }, '<');
    }
  }
}
