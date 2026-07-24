import gsap from 'gsap';

export default function animateControlsContainer(
  controlsContainer: HTMLDivElement,
  direction: AnimationDirection,
) {
  const tl = gsap.timeline();

  if (direction === 'in') {
    tl.fromTo(controlsContainer, { bottom: '-4rem' }, { bottom: '2rem', ease: 'power.in' });
  } else {
    tl.to(controlsContainer, { bottom: '-4rem', ease: 'power.out' });
  }
}
