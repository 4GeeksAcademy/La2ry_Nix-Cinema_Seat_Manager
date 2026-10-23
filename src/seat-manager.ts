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

// Creates independent rows of available seats using the requested dimensions.
export function createSeatingMatrix(rows: number, columns: number): SeatMap {
  if (!Number.isInteger(rows) || !Number.isInteger(columns) || rows < 1 || columns < 1) {
    throw new RangeError("Rows and columns must be positive whole numbers.");
  }
  const matrix: SeatMap = [];
  for (let row = 0; row < rows; row += 1) {
    const seats: (0 | 1)[] = [];
    for (let column = 0; column < columns; column += 1) {
      seats.push(0);
    }
    matrix.push(seats);
  }
  return matrix;
}

// Keeps the CLI and website fixed at the assignment's 8-by-10 room.
export function createSeatMap(): SeatMap {
  return createSeatingMatrix(ROW_COUNT, SEATS_PER_ROW);
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
  return countSeats(seats)[1];
}

// Returns both counts as [occupied, available], without an object.
export function countSeats(seats: SeatMap): [occupied: number, available: number] {
  let occupied = 0;
  let available = 0;
  for (let row = 0; row < seats.length; row += 1) {
    for (let column = 0; column < seats[row].length; column += 1) {
      if (seats[row][column] === 1) {
        occupied += 1;
      } else {
        available += 1;
      }
    }
  }
  return [occupied, available];
}

// Reserves one seat using staff-facing 1-based row and column numbers.
export function reserveSeat(seats: SeatMap, row: number, column: number): string {
  if (
    !Number.isInteger(row) || !Number.isInteger(column) ||
    row < 1 || row > seats.length || column < 1 || column > seats[row - 1].length
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
export function printSeating(seats: SeatMap): void {
  console.log("\nSeat map (L = available, X = occupied)");
  const columns = seats[0]?.length ?? 0;
  let header = "    ";
  for (let column = 0; column < columns; column += 1) {
    header += String(column + 1).padStart(2) + (column + 1 < columns ? " " : "");
  }
  console.log(header);
  for (let row = 0; row < seats.length; row += 1) {
    let line = `${String(row + 1).padStart(2)}  `;
    for (let column = 0; column < seats[row].length; column += 1) {
      line += seats[row][column] === 1 ? " X" : " L";
      if (column + 1 < seats[row].length) {
        line += " ";
      }
    }
    console.log(line);
  }
}

export { printSeating as displaySeats };

// Finds the first horizontal group; seat numbers are flattened, zero-based indices.
export function findAdjacentSeats(
  seats: SeatMap,
  seatCount = 2,
  startAfter = -1,
): number[] {
  if (!Number.isInteger(seatCount) || seatCount < 1 || seatCount > SEATS_PER_ROW) {
    throw new RangeError(`Group size must be a whole number from 1 to ${SEATS_PER_ROW}.`);
  }
  const columns = seats[0]?.length ?? 0;
  const total = seats.length * columns;
  for (let step = 1; step <= total; step += 1) {
    const position = (startAfter + step) % total;
    const rowIndex = Math.floor(position / columns);
    const startSeat = position % columns;
    if (startSeat > seats[rowIndex].length - seatCount) {
      continue;
    }
    const availableRun = seats[rowIndex]
      .slice(startSeat, startSeat + seatCount)
      .every((occupied) => !occupied);

    if (availableRun) {
      return Array.from(
        { length: seatCount },
        (_, offset) => rowIndex * columns + startSeat + offset,
      );
    }
  }

  return [];
}

// Returns the first pair as [[row, column], [row, column]], using 1-based positions.
export function findAdjacentPair(seats: SeatMap): number[][] {
  const columns = seats[0]?.length ?? 0;
  return findAdjacentSeats(seats, 2).map((seat) => [
    Math.floor(seat / columns) + 1,
    seat % columns + 1,
  ]);
}
