import gsap from 'gsap';

export default function animateNewProjectOverlay(
  bgElement: HTMLElement,
  sectionElement: HTMLElement,
  direction: AnimationDirection,
) {
  if (direction === 'in') {
    gsap.set(bgElement, { display: 'block' });
    gsap.set(sectionElement, { display: 'flex' });

    const modalIn = gsap.timeline();

    modalIn.fromTo(bgElement, { scale: 0 }, { scale: 100, duration: 1, ease: 'power.out' });
    modalIn.fromTo(sectionElement, { opacity: 0 }, { opacity: 1 }, '>-80%');
  } else {
    const modalOut = gsap.timeline();

    modalOut.fromTo(sectionElement, { opacity: 1 }, { opacity: 0, duration: 0.2, display: 'none' });

    modalOut.fromTo(
      bgElement,
      { scale: 100 },
      { scale: 0, display: 'none', ease: 'power.in' },
      '<-80%',
    );

    document.body.style.overflow = '';
  }
}
