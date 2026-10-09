"use client";

import { MoreHorizontal } from "lucide-react";
import {
  Children,
  Fragment,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type MenuPlace = { top?: number; bottom?: number; right: number };

const ActionMenuContext = createContext(false);

export function useInActionMenu() {
  return useContext(ActionMenuContext);
}

function flattenActions(children: ReactNode): ReactNode[] {
  const items: ReactNode[] = [];
  Children.forEach(children, (child) => {
    if (child == null || typeof child === "boolean") return;
    if (
      isValidElement<{ children?: ReactNode }>(child) &&
      child.type === Fragment
    ) {
      items.push(...flattenActions(child.props.children));
      return;
    }
    items.push(child);
  });
  return items;
}

/** Shows the first two actions. Extra actions stay mounted inside a ⋯ menu so dialogs still open. */
export function ActionOverflow({ children }: { children: ReactNode }) {
  const items = flattenActions(children);
  const visible = items.slice(0, 2);
  const overflow = items.slice(2);
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<MenuPlace>({ right: 8, top: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  function placeMenu() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const right = Math.max(8, window.innerWidth - rect.right);
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < 56) {
      setPlace({
        bottom: window.innerHeight - rect.top + 6,
        right,
      });
    } else {
      setPlace({ top: rect.bottom + 6, right });
    }
  }

  useEffect(() => {
    if (!open) return;
    placeMenu();
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("scroll", placeMenu, true);
    window.addEventListener("resize", placeMenu);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", placeMenu, true);
      window.removeEventListener("resize", placeMenu);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const menuStyle: CSSProperties = {
    position: "fixed",
    right: place.right,
    top: place.top,
    bottom: place.bottom,
    zIndex: 50,
  };

  return (
    <div
      ref={rootRef}
      className="relative flex w-full flex-nowrap items-center justify-end gap-1.5"
    >
      {visible}
      {overflow.length > 0 ? (
        <>
          <button
            ref={buttonRef}
            type="button"
            aria-label="More actions"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => {
              if (!open) placeMenu();
              setOpen((value) => !value);
            }}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-600 shadow-none transition-colors hover:bg-slate-200"
          >
            <MoreHorizontal className="size-4" strokeWidth={2.25} />
          </button>
          <ActionMenuContext.Provider value>
            <div
              id={menuId}
              role="menu"
              style={open ? menuStyle : undefined}
              onClick={() => setOpen(false)}
              className={cn(
                "min-w-40 flex-col items-stretch gap-0.5 rounded-xl border border-border/70 bg-background p-1.5 shadow-lg",
                open ? "flex" : "hidden",
              )}
            >
              {overflow}
            </div>
          </ActionMenuContext.Provider>
        </>
      ) : null}
    </div>
  );
}
