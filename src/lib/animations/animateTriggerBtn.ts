import gsap from 'gsap';

export default function animateTriggerBtn(e: Event) {
  const target = e.currentTarget as HTMLElement;
  const svg = target.querySelector('svg');

  const easeIn = 'elastic.inOut(1,0.5)';
  const easeOut = 'elastic.inOut(1,0.5)';

  const tl = gsap.timeline();

  if (e.type === 'mouseenter') {
    tl.to(
      target,
      {
        rotation: 45,
        borderRadius: 25,
        backgroundColor: '#231f20',
        duration: 0.75,
        ease: easeIn,
      },
      0,
    );

    if (svg) {
      tl.to(
        svg,
        {
          rotation: -45,
          duration: 0.75,
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
        backgroundColor: '#ff0073',
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
