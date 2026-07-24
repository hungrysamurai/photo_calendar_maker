import gsap from 'gsap';

export default function animateCropControlsContainer(
  cropControlsContainer: HTMLDivElement,
  direction: AnimationDirection,
) {
  const tl = gsap.timeline();

  if (direction === 'in') {
    tl.fromTo(cropControlsContainer, { bottom: '-4rem' }, { bottom: '2rem', ease: 'power.in' });
  } else {
    tl.fromTo(cropControlsContainer, { bottom: '2rem' }, { bottom: '-4rem', ease: 'power.out' });
  }
}
