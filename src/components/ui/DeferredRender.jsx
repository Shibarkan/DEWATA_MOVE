import { useEffect, useRef, useState } from "react";

export default function DeferredRender({
  children,
  placeholder,
  rootMargin = "300px 0px",
}) {
  const elementRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = elementRef.current;

    if (
      !element ||
      ready ||
      typeof IntersectionObserver === "undefined"
    ) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        setReady(true);
        observer.disconnect();
      },
      { rootMargin },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [ready, rootMargin]);

  const shouldRender =
    ready || typeof IntersectionObserver === "undefined";

  return (
    <div ref={elementRef} aria-busy={!shouldRender}>
      {shouldRender ? children : placeholder}
    </div>
  );
}