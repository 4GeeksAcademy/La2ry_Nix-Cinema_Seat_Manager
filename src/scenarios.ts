import assert from "node:assert/strict";
import {
  countSeats,
  createSeatMap,
  createSampleSeatMap,
  createScenarioSeatMap,
  displaySeats,
  findAdjacentPair,
  findAdjacentSeats,
  isSeatMap,
  reserveSeat,
  type SeatMap,
} from "./seat-manager.js";

// Checks a room's counts and first adjacent pair, then prints the staff view.
function checkScenario(
  label: string,
  seats: SeatMap,
  expectedCounts: number[],
  expectedPair: number[][],
): void {
  assert.equal(isSeatMap(seats), true);
  assert.deepEqual(countSeats(seats), expectedCounts);
  assert.deepEqual(findAdjacentPair(seats), expectedPair);
  console.log(`\n${label}`);
  displaySeats(seats);
  const [occupied, available] = countSeats(seats);
  console.log(`Occupied: ${occupied}; available: ${available}.`);
  console.log(expectedPair.length ? `First adjacent pair: ${JSON.stringify(expectedPair)}` : "No adjacent seats available.");
}

const empty = createSeatMap();
checkScenario("Empty room", empty, [0, 80], [[1, 1], [1, 2]]);

assert.equal(reserveSeat(empty, 1, 1), "Reserved row 1, seat 1.");
assert.equal(reserveSeat(empty, 1, 1), "That seat is already reserved.");
for (const row of [0, 9, 1.5, NaN]) {
  assert.equal(reserveSeat(empty, row, 1), "That row or seat is outside the theater.");
}
for (const column of [0, 11, 1.5, NaN]) {
  assert.equal(reserveSeat(empty, 1, column), "That row or seat is outside the theater.");
}
checkScenario("Partially filled room", empty, [1, 79], [[1, 2], [1, 3]]);

const scattered = createScenarioSeatMap("scattered");
checkScenario("Nearly full room: scattered single seats", scattered, [72, 8], []);

const full = createScenarioSeatMap("full");
checkScenario("Full room", full, [80, 0], []);
assert.equal(reserveSeat(full, 8, 10), "That seat is already reserved.");

const boundary: SeatMap = full.map((row) => [...row]);
boundary[0][9] = 0;
boundary[1][0] = 0;
assert.deepEqual(findAdjacentPair(boundary), []);
assert.deepEqual(countSeats(createSampleSeatMap()), [46, 34]);
assert.throws(() => findAdjacentSeats(empty, 0), RangeError);
assert.throws(() => findAdjacentSeats(empty, 11), RangeError);
assert.equal(isSeatMap([[true]]), false);
console.log("\nAll required scenarios and reservation validations passed.");
