
import React from "react";

/*
  DEWATAMOVE 2041
  SIMPLE MODELING DROPDOWN

  100% Tailwind CSS
  - Light mode
  - No external CSS
  - No video preview
  - No numbering
  - Clean & responsive
*/

export function ModelingDropdown({
  links = [],
  activePage,
  onSelect,
}) {
  return (
    <div
      className="
        relative z-[9999]
        w-[220px]
        max-w-[calc(100vw-32px)]
        overflow-hidden
        rounded-2xl
        border border-slate-200
        bg-white
        p-2
        shadow-[0_16px_40px_rgba(15,23,42,0.10)]
      "
    >
      <div className="flex flex-col gap-1">
        {links.map((link) => {
          const active = activePage === link.id;

          return (
            <button
              key={link.id}
              type="button"
              onClick={() => onSelect?.(link.id)}
              aria-current={active ? "page" : undefined}
              className={`
                flex min-h-[43px]
                w-full items-center
                rounded-xl
                px-4 py-3
                text-left
                text-[13px]
                font-semibold
                transition-colors
                duration-150
                focus-visible:outline
                focus-visible:outline-2
                focus-visible:outline-[#B91C1C]
                ${
                  active
                    ? "bg-red-50 text-[#B91C1C]"
                    : "bg-white text-slate-700 hover:bg-slate-50 hover:text-[#B91C1C]"
                }
              `}
            >
              {link.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/*
  MOBILE MODELING MENU
*/

export function ModelingMobileLinks({
  links = [],
  activePage,
  onSelect,
}) {
  return (
    <div className="ml-3 border-l-2 border-slate-100 pl-3">
      <div className="flex flex-col gap-1 py-1">
        {links.map((link) => {
          const active = activePage === link.id;

          return (
            <button
              key={link.id}
              type="button"
              onClick={() => onSelect?.(link.id)}
              aria-current={active ? "page" : undefined}
              className={`
                flex min-h-11
                w-full items-center
                rounded-xl
                px-4 py-3
                text-left
                text-[13px]
                font-medium
                transition-colors
                duration-150
                focus-visible:outline
                focus-visible:outline-2
                focus-visible:outline-[#B91C1C]
                ${
                  active
                    ? "bg-red-50 font-semibold text-[#B91C1C]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-[#B91C1C]"
                }
              `}
            >
              {link.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
