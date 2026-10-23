export const ROW_COUNT = 8;
export const SEATS_PER_ROW = 10;
export const SEAT_STORAGE_KEY = "nix-cinema-seat-map";

export type SeatMap = (0 | 1)[][];

// Validates the required 8-by-10 numeric seating matrix.
export function isSeatMap(value: unknown): value is SeatMap {
  return (
    Array.isArray(value) &&
    value.length === ROW_COUNT &&
    value.every(
      (row) =>
        Array.isArray(row) &&
        row.length === SEATS_PER_ROW &&
        row.every((occupied) => occupied === 0 || occupied === 1),
    )
  );
}

// Creates an empty theater: 0 means available and 1 means occupied.
export function createSeatMap(): SeatMap {
  return Array.from({ length: ROW_COUNT }, () =>
    Array<0 | 1>(SEATS_PER_ROW).fill(0),
  );
}

// Creates a distributed demonstration layout with the requested occupied count.
export function createSampleSeatMap(reservedCount = 46): SeatMap {
  if (!Number.isInteger(reservedCount) || reservedCount < 0 || reservedCount > ROW_COUNT * SEATS_PER_ROW) {
    throw new RangeError("Reserved count must be a whole number from 0 to 80.");
  }
  const seats = createSeatMap();
  for (let row = 0; row < ROW_COUNT; row += 1) {
    const reservedInRow = Math.floor(reservedCount / ROW_COUNT) +
      (row < reservedCount % ROW_COUNT ? 1 : 0);
    for (let offset = 0; offset < reservedInRow; offset += 1) {
      seats[row][(row * 3 + offset) % SEATS_PER_ROW] = 1;
    }
  }
  return seats;
}

// Builds one of the four required demonstration room states.
export function createScenarioSeatMap(scenario: string): SeatMap {
  if (scenario === "empty") {
    return createSeatMap();
  }
  if (scenario === "partial") {
    return createSampleSeatMap();
  }
  if (scenario === "full" || scenario === "scattered") {
    const seats = createSampleSeatMap(80);
    if (scenario === "scattered") {
      for (let row = 0; row < ROW_COUNT; row += 1) {
        seats[row][row % SEATS_PER_ROW] = 0;
      }
    }
    return seats;
  }
  throw new RangeError(`Unknown room scenario: ${scenario}`);
}

// Returns the number of available seats.
export function countAvailableSeats(seats: SeatMap): number {
  return seats.reduce(
    (total, row) => total + row.filter((occupied) => !occupied).length,
    0,
  );
}

// Returns both counts as [occupied, available], without an object.
export function countSeats(seats: SeatMap): [occupied: number, available: number] {
  const available = countAvailableSeats(seats);
  return [seats.reduce((total, row) => total + row.length, 0) - available, available];
}

// Reserves one seat using staff-facing 1-based row and column numbers.
export function reserveSeat(seats: SeatMap, row: number, column: number): string {
  if (
    !Number.isInteger(row) || !Number.isInteger(column) ||
    row < 1 || row > ROW_COUNT || column < 1 || column > SEATS_PER_ROW
  ) {
    return "That row or seat is outside the theater.";
  }
  if (seats[row - 1][column - 1] === 1) {
    return "That seat is already reserved.";
  }
  seats[row - 1][column - 1] = 1;
  return `Reserved row ${row}, seat ${column}.`;
}

// Prints numbered rows and columns, with L for available and X for occupied.
export function displaySeats(seats: SeatMap): void {
  console.log("\nSeat map (L = available, X = occupied)");
  console.log(`    ${Array.from({ length: SEATS_PER_ROW }, (_, i) => String(i + 1).padStart(2)).join(" ")}`);
  for (let row = 0; row < seats.length; row += 1) {
    console.log(`${String(row + 1).padStart(2)}  ${seats[row].map((seat) => seat === 1 ? " X" : " L").join(" ")}`);
  }
}

// Finds the first horizontal group; seat numbers are flattened, zero-based indices.
export function findAdjacentSeats(
  seats: SeatMap,
  seatCount = 2,
  startAfter = -1,
): number[] {
  if (!Number.isInteger(seatCount) || seatCount < 1 || seatCount > SEATS_PER_ROW) {
    throw new RangeError(`Group size must be a whole number from 1 to ${SEATS_PER_ROW}.`);
  }
  const total = ROW_COUNT * SEATS_PER_ROW;
  for (let step = 1; step <= total; step += 1) {
    const position = (startAfter + step) % total;
    const rowIndex = Math.floor(position / SEATS_PER_ROW);
    const startSeat = position % SEATS_PER_ROW;
    if (startSeat > SEATS_PER_ROW - seatCount) {
      continue;
    }
      const availableRun = seats[rowIndex]
        .slice(startSeat, startSeat + seatCount)
        .every((occupied) => !occupied);

      if (availableRun) {
        return Array.from(
          { length: seatCount },
          (_, offset) => rowIndex * SEATS_PER_ROW + startSeat + offset,
        );
    }
  }

  return [];
}

// Returns the first pair as [[row, column], [row, column]], using 1-based positions.
export function findAdjacentPair(seats: SeatMap): number[][] {
  return findAdjacentSeats(seats, 2).map((seat) => [
    Math.floor(seat / SEATS_PER_ROW) + 1,
    seat % SEATS_PER_ROW + 1,
  ]);
}
