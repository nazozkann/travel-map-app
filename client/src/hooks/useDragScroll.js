import { useEffect } from "react";

const DRAG_THRESHOLD = 5;

// Click-and-drag horizontal scrolling for mouse users. Touch devices keep native scrolling.
// Pass `active` so the listeners attach when the element is conditionally rendered.
export default function useDragScroll(ref, active = true) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;

    let isDown = false;
    let moved = false;
    let startX = 0;
    let scrollLeft = 0;

    const mouseDown = (e) => {
      if (e.button !== 0) return;
      isDown = true;
      moved = false;
      startX = e.pageX;
      scrollLeft = el.scrollLeft;
    };

    const stop = () => {
      isDown = false;
      el.classList.remove("dragging");
    };

    const mouseMove = (e) => {
      if (!isDown) return;
      const walk = e.pageX - startX;
      if (!moved && Math.abs(walk) < DRAG_THRESHOLD) return;
      moved = true;
      el.classList.add("dragging");
      e.preventDefault();
      el.scrollLeft = scrollLeft - walk * 1.5;
    };

    // Swallow the click that ends a drag so cards don't navigate.
    const click = (e) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };

    const preventImgDrag = (e) => e.preventDefault();

    el.addEventListener("mousedown", mouseDown);
    el.addEventListener("mouseleave", stop);
    el.addEventListener("mouseup", stop);
    el.addEventListener("mousemove", mouseMove);
    el.addEventListener("click", click, true);
    el.addEventListener("dragstart", preventImgDrag);

    return () => {
      el.removeEventListener("mousedown", mouseDown);
      el.removeEventListener("mouseleave", stop);
      el.removeEventListener("mouseup", stop);
      el.removeEventListener("mousemove", mouseMove);
      el.removeEventListener("click", click, true);
      el.removeEventListener("dragstart", preventImgDrag);
    };
  }, [ref, active]);
}
