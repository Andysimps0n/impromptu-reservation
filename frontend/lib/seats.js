// Venue layout: rows A–L. A is staff-only, B–K have 12 seats (6 + aisle + 6), L has 8 (4 + aisle + 4).
export const SEAT_ROWS = Array.from({ length: 12 }, (_, i) => String.fromCharCode(65 + i));
export const STAFF_ROW = 'A';
export const MAX_SELECTED_SEATS = 4;
export const BOOKABLE_SEATS = 128;

export const seatCount = row => (row === 'L' ? 8 : 12);
export const seatId = (row, number) => `${row}${String(number).padStart(2, '0')}`;
export const seatNumber = seat => Number(seat.slice(1));
export const seatRow = seat => seat[0];

/** Index (1-based) of the first seat after the aisle. */
export const aisleBefore = row => (seatCount(row) === 8 ? 5 : 7);

/** All bookable seat ids (rows B–L). */
export const ALL_BOOKABLE = SEAT_ROWS.filter(r => r !== STAFF_ROW).flatMap(row =>
  Array.from({ length: seatCount(row) }, (_, i) => seatId(row, i + 1))
);

/** "B01" → "B열 1번" */
export const seatLabel = seat => `${seatRow(seat)}열 ${seatNumber(seat)}번`;

export const sortSeats = seats => [...seats].sort((a, b) => a.localeCompare(b));
