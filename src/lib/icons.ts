export type IconDef = {
  path: string;
  strokeWidth?: number;
};

export const ICONS = {
  calendar: {
    path:
      'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    strokeWidth: 2
  } satisfies IconDef,
  plus: {
    path: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
    strokeWidth: 2
  } satisfies IconDef,
  checkSquare: {
    path: 'M9 12l2 2 4-4M7 7h10v10H7z',
    strokeWidth: 2
  } satisfies IconDef
} as const;
