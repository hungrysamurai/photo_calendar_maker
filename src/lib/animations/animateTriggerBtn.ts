import gsap from 'gsap';

export default function animateTriggerBtn(e: Event) {
  const target = e.currentTarget as HTMLElement;
  const svg = target.querySelector('svg');

  const easeIn = 'power3.in';
  const easeOut = 'power3.out';

  const tl = gsap.timeline();

  if (e.type === 'mouseenter') {
    tl.to(
      target,
      {
        rotation: 45,
        borderRadius: 25,
        backgroundColor: '#272727',
        duration: 0.3,
        ease: easeIn,
      },
      0,
    );

    if (svg) {
      tl.to(
        svg,
        {
          rotation: -45,
          duration: 0.3,
          scale: 1.25,
          ease: easeIn,
        },
        0,
      );
    }
  } else {
    tl.to(
      target,
      {
        rotation: 0,
        borderRadius: 50,
        backgroundColor: '#efd09e',
        duration: 0.75,
        ease: easeOut,
      },
      0,
    );

    if (svg) {
      tl.to(
        svg,
        {
          rotation: 0,
          duration: 0.75,
          scale: 1,
          ease: easeOut,
        },
        0,
      );
    }
  }
}
