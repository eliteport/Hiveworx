/* Line icons used on cards and session pages (stroke styles come from the CSS). */
export const ICON = {
  date: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  time: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  loc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  fmt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h2l2-6 3 12 3-9 2 5 2-2h4"/></svg>',
  level: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19v-5M12 19V9M19 19V5"/></svg>',
  duration: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/></svg>',
  person: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.8"/><path d="M4.5 20c.6-4.4 3.5-7 7.5-7s6.9 2.6 7.5 7"/></svg>',
};

/* icons for the practical notes section */
export const INC: Record<string, string> = {
  mentor: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="17" cy="15" r="6"/><path d="M6 40c1-9 5-14 11-14s10 5 11 14"/><path d="M29 8h13v10h-6l-4 4v-4h-3Z"/></svg>',
  tools: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 38 30 18M26 14l8 8M34 6l8 8-6 6-8-8Z"/><path d="M38 38 18 18M12 10l-4 4 6 6 4-4Z"/></svg>',
  materials: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 6 41 15v18L24 42 7 33V15Z"/><path d="M7 15l17 9 17-9M24 24v18"/></svg>',
  notes: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="10" y="6" width="28" height="36" rx="2"/><path d="M16 16h16M16 23h16M16 30h10"/><path d="M6 12h6M6 20h6M6 28h6M6 36h6"/></svg>',
  sound: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 28v-8M15 34V14M22 40V8M29 32V16M36 26v-4M42 25v-2"/></svg>',
  headphones: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 30v-6a16 16 0 0 1 32 0v6"/><rect x="6" y="28" width="9" height="13" rx="2"/><rect x="33" y="28" width="9" height="13" rx="2"/></svg>',
  takehome: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 16h28l-3 26H13Z"/><path d="M18 20v-6a6 6 0 0 1 12 0v6"/></svg>',
  coffee: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 18h26v12a10 10 0 0 1-10 10h-6A10 10 0 0 1 8 30Z"/><path d="M34 22h3a5 5 0 0 1 0 10h-4M16 6c-2 3 2 5 0 8M24 6c-2 3 2 5 0 8"/></svg>',
  community: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="14" r="5"/><circle cx="10" cy="20" r="4"/><circle cx="38" cy="20" r="4"/><path d="M14 40c0-8 4-13 10-13s10 5 10 13M3 38c0-6 3-9 7-9M45 38c0-6-3-9-7-9"/></svg>',
  type: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 40 22 8h4l12 32M15 28h18"/><path d="M6 40h10M32 40h10"/></svg>',
  print: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="14" width="36" height="20" rx="2"/><path d="M14 14V6h20v8M14 28h20v14H14Z"/><path d="M8 20h6"/></svg>',
  idea: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M17 30a12 12 0 1 1 14 0c-2 2-3 4-3 6h-8c0-2-1-4-3-6ZM19 40h10M21 44h6"/></svg>',
  laptop: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="9" y="10" width="30" height="20" rx="2"/><path d="M4 36h40l-3 4H7Z"/></svg>',
  clock: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="17"/><path d="M24 14v10l7 5"/></svg>',
  phone: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="14" y="5" width="20" height="38" rx="3"/><path d="M21 37h6M8 8l32 32"/></svg>',
  quiet: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 19h8l10-8v26l-10-8H8Z"/><path d="M33 19l10 10M43 19 33 29"/></svg>',
  steps: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 38h10V28h10V18h10V8h6"/><path d="M36 8h6v6"/></svg>',
  calm: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M4 20c5-5 9-5 14 0s9 5 14 0 9-5 14 0M4 30c5-5 9-5 14 0s9 5 14 0 9-5 14 0"/></svg>',
};

/* thin outline hexagon for the session hero, drawn at 1px whatever its size */
export const hex = (cls: string, speed: number) =>
  `<svg class="sd-hex ${cls} plx" data-speed="${speed}" viewBox="0 0 100 115" aria-hidden="true"><path d="M50 1 99 29v57L50 114 1 86V29Z" vector-effect="non-scaling-stroke"/></svg>`;
