// Line icons on a 24px grid, 1.5px stroke, rounded caps. All inherit currentColor.

function Icon({ size = 24, children, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const XIcon = p => (
  <Icon {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
);
export const BackIcon = p => (
  <Icon {...p}>
    <path d="m15 18-6-6 6-6" />
  </Icon>
);
export const ChevronRightIcon = p => (
  <Icon {...p}>
    <path d="m9 18 6-6-6-6" />
  </Icon>
);
export const ChevronDownIcon = p => (
  <Icon {...p}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);
export const CopyIcon = p => (
  <Icon {...p}>
    <rect x="9" y="9" width="12" height="12" rx="2.5" />
    <path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" />
  </Icon>
);
export const RefreshIcon = p => (
  <Icon {...p}>
    <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
    <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
    <path d="M21 3v5h-5M3 21v-5h5" />
  </Icon>
);
export const SearchIcon = p => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icon>
);
export const CameraIcon = p => (
  <Icon {...p}>
    <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" />
    <circle cx="12" cy="13" r="3.5" />
  </Icon>
);
export const CheckIcon = p => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
);
export const AlertIcon = p => (
  <Icon {...p}>
    <path d="M12 8v5M12 16.5v.01" />
  </Icon>
);
export const MoreIcon = p => (
  <Icon {...p}>
    <circle cx="5" cy="12" r="1" fill="currentColor" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="19" cy="12" r="1" fill="currentColor" />
  </Icon>
);
export const PlusIcon = p => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const TicketIcon = p => (
  <Icon {...p}>
    <path d="M3 8a2 2 0 0 0 0 4v4a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-4a2 2 0 0 1 0-4V5a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z" transform="translate(0 1.5)" />
    <path d="M14 5.5v12" strokeDasharray="2 2" />
  </Icon>
);
export const InfoIcon = p => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8v.01" />
  </Icon>
);
export const SeatIcon = p => (
  <Icon {...p}>
    <path d="M6 11V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5" />
    <path d="M4 11h16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM7 17v3M17 17v3" />
  </Icon>
);
export const ChatIcon = p => (
  <Icon {...p}>
    <path d="M12 4c4.97 0 9 3.13 9 7s-4.03 7-9 7c-.8 0-1.57-.08-2.3-.23L5 20l1.1-3.5C4.2 15.2 3 13.2 3 11c0-3.87 4.03-7 9-7z" />
  </Icon>
);
export const InstagramIcon = p => (
  <Icon {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <path d="M17.2 6.8v.01" />
  </Icon>
);
export const KakaoIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 4C7 4 3 7.13 3 11c0 2.5 1.66 4.68 4.15 5.92l-.84 3.06c-.08.3.26.53.51.36l3.66-2.43c.5.06 1 .09 1.52.09 5 0 9-3.13 9-7s-4-7-9-7z"
    />
  </svg>
);
