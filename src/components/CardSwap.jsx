import React, { Children, cloneElement, forwardRef, isValidElement, useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import './CardSwap.css';

export const Card = forwardRef(({ customClass, ...rest }, ref) => (
  <div ref={ref} {...rest} className={`card ${customClass ?? ''} ${rest.className ?? ''}`.trim()} />
));
Card.displayName = 'Card';

const makeSlot = (i, distX, distY, total) => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i
});
const placeNow = (el, slot, skew) =>
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: 'center center',
    zIndex: slot.zIndex,
    force3D: true
  });

const CardSwap = ({
  width = 500,
  height = 400,
  cardDistance = 60,
  verticalDistance = 70,
  delay = 5000,
  pauseOnHover = false,
  onCardClick,
  onActiveChange,
  skewAmount = 6,
  easing = 'elastic',
  children
}) => {
  const config =
    easing === 'elastic'
      ? {
          ease: 'elastic.out(0.6,0.9)',
          durDrop: 2,
          durMove: 2,
          durReturn: 2,
          promoteOverlap: 0.9,
          returnDelay: 0.05
        }
      : {
          ease: 'power1.inOut',
          durDrop: 0.8,
          durMove: 0.8,
          durReturn: 0.8,
          promoteOverlap: 0.45,
          returnDelay: 0.2
        };

  const childArr = useMemo(() => Children.toArray(children), [children]);
  const refs = useMemo(
    () => childArr.map(() => React.createRef()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [childArr.length]
  );

  const order = useRef(Array.from({ length: childArr.length }, (_, i) => i));

  // Keep the latest onActiveChange without re-running the animation effect.
  const activeCbRef = useRef(onActiveChange);
  activeCbRef.current = onActiveChange;

  const tlRef = useRef(null);
  const intervalRef = useRef();
  const container = useRef(null);
  const selectRef = useRef(null); // set inside the effect; brings a clicked card to front

  useEffect(() => {
    const total = refs.length;
    refs.forEach((r, i) => placeNow(r.current, makeSlot(i, cardDistance, verticalDistance, total), skewAmount));

    // report the initial front card
    activeCbRef.current?.(order.current[0]);

    const swap = () => {
      if (order.current.length < 2) return;

      const [front, ...rest] = order.current;
      // the card promoting to the front this cycle
      activeCbRef.current?.(rest[0]);
      const elFront = refs[front].current;
      const tl = gsap.timeline();
      tlRef.current = tl;

      tl.to(elFront, {
        y: '+=500',
        duration: config.durDrop,
        ease: config.ease
      });

      tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
      rest.forEach((idx, i) => {
        const el = refs[idx].current;
        const slot = makeSlot(i, cardDistance, verticalDistance, refs.length);
        tl.set(el, { zIndex: slot.zIndex }, 'promote');
        tl.to(
          el,
          {
            x: slot.x,
            y: slot.y,
            z: slot.z,
            duration: config.durMove,
            ease: config.ease
          },
          `promote+=${i * 0.15}`
        );
      });

      const backSlot = makeSlot(refs.length - 1, cardDistance, verticalDistance, refs.length);
      tl.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);
      tl.call(
        () => {
          gsap.set(elFront, { zIndex: backSlot.zIndex });
        },
        undefined,
        'return'
      );
      tl.to(
        elFront,
        {
          x: backSlot.x,
          y: backSlot.y,
          z: backSlot.z,
          duration: config.durReturn,
          ease: config.ease
        },
        'return'
      );

      tl.call(() => {
        order.current = [...rest, front];
      });
    };

    // Bring a clicked card to the front (kills the running swap; auto-play
    // resumes on mouse-leave via the pauseOnHover handlers below).
    const goTo = (targetIdx) => {
      if (order.current[0] === targetIdx) return;
      const pos = order.current.indexOf(targetIdx);
      if (pos < 0) return;
      tlRef.current?.kill();
      const newOrder = [...order.current.slice(pos), ...order.current.slice(0, pos)];
      order.current = newOrder;
      newOrder.forEach((origIdx, p) => {
        const el = refs[origIdx].current;
        const slot = makeSlot(p, cardDistance, verticalDistance, refs.length);
        gsap.to(el, { x: slot.x, y: slot.y, z: slot.z, zIndex: slot.zIndex, duration: 0.7, ease: 'power3.out' });
      });
      activeCbRef.current?.(targetIdx);
    };
    selectRef.current = goTo;

    // scroll over the stack to step through it (front card cycles to the back)
    const prevSwap = () => {
      if (order.current.length < 2) return;
      goTo(order.current[order.current.length - 1]);
    };
    let wheelLock = false;
    const onWheel = e => {
      e.preventDefault();
      if (wheelLock || Math.abs(e.deltaY) < 4) return;
      wheelLock = true;
      if (e.deltaY > 0) swap();
      else prevSwap();
      setTimeout(() => {
        wheelLock = false;
      }, 500);
    };

    swap();
    intervalRef.current = window.setInterval(swap, delay);

    const node = container.current;
    node.addEventListener('wheel', onWheel, { passive: false });

    if (pauseOnHover) {
      const pause = () => {
        tlRef.current?.pause();
        clearInterval(intervalRef.current);
      };
      const resume = () => {
        tlRef.current?.play();
        intervalRef.current = window.setInterval(swap, delay);
      };
      node.addEventListener('mouseenter', pause);
      node.addEventListener('mouseleave', resume);
      return () => {
        node.removeEventListener('mouseenter', pause);
        node.removeEventListener('mouseleave', resume);
        node.removeEventListener('wheel', onWheel);
        clearInterval(intervalRef.current);
      };
    }
    return () => {
      node.removeEventListener('wheel', onWheel);
      clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, easing]);

  const rendered = childArr.map((child, i) =>
    isValidElement(child)
      ? cloneElement(child, {
          key: i,
          ref: refs[i],
          style: { width, height, ...(child.props.style ?? {}) },
          onClick: e => {
            child.props.onClick?.(e);
            selectRef.current?.(i);
            onCardClick?.(i);
          }
        })
      : child
  );

  return (
    <div ref={container} className="card-swap-container" style={{ width, height }}>
      {rendered}
    </div>
  );
};

export default CardSwap;
