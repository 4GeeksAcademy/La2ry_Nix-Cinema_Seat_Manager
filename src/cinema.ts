import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import {
  countSeats,
  createSeatMap,
  displaySeats,
  findAdjacentSeats,
  reserveSeat,
  ROW_COUNT,
  SEATS_PER_ROW,
} from "./seat-manager.js";

const seats = createSeatMap();

const prompt = createInterface({ input: stdin, output: stdout });
const inputLines = prompt[Symbol.asyncIterator]();

// Reads whole numbers, retrying invalid input and stopping at end-of-input.
async function readInteger(message: string): Promise<number | undefined> {
  while (true) {
    stdout.write(message);
    const answer = await inputLines.next();

    if (answer.done) {
      return undefined;
    }

    const value = Number(answer.value);

    if (answer.value.trim() !== "" && Number.isInteger(value)) {
      return value;
    }

    console.log("Enter a whole number.");
  }
}

// Runs the staff menu without coupling seat operations to user input.
async function runCinemaManager(): Promise<void> {
  console.log("Welcome to the Cinema Seat Manager");

  while (true) {
    console.log(
      "\n1. Show seats\n2. Reserve a seat\n3. Count occupied and available seats\n4. Find adjacent seats\n5. Exit",
    );
    const choice = await readInteger("Choose an option: ");

    if (choice === undefined) {
      console.log("\nGoodbye!");
      return;
    }

    if (choice === 1) {
      displaySeats(seats);
    } else if (choice === 2) {
      const rowNumber = await readInteger(`Row (1-${ROW_COUNT}): `);
      if (rowNumber === undefined) {
        console.log("\nGoodbye!");
        return;
      }

      const seatNumber = await readInteger(`Seat (1-${SEATS_PER_ROW}): `);
      if (seatNumber === undefined) {
        console.log("\nGoodbye!");
        return;
      }

      console.log(reserveSeat(seats, rowNumber, seatNumber));
    } else if (choice === 3) {
      const [occupied, available] = countSeats(seats);
      console.log(`${occupied} seats are occupied; ${available} seats are available.`);
    } else if (choice === 4) {
      const seatCount = await readInteger("How many adjacent seats? ");

      if (seatCount === undefined) {
        console.log("\nGoodbye!");
        return;
      }

      if (seatCount < 1 || seatCount > SEATS_PER_ROW) {
        console.log(`Enter a number from 1 to ${SEATS_PER_ROW}.`);
      } else {
        const foundSeats = findAdjacentSeats(seats, seatCount);

        if (foundSeats.length === 0) {
          console.log(`No group of ${seatCount} adjacent seats is available.`);
        } else {
          const rowNumber = Math.floor(foundSeats[0] / SEATS_PER_ROW) + 1;
          const firstSeatNumber = (foundSeats[0] % SEATS_PER_ROW) + 1;
          const lastSeatNumber = firstSeatNumber + seatCount - 1;
          console.log(
            `Found ${seatCount} adjacent seats in row ${rowNumber}, seats ${firstSeatNumber}-${lastSeatNumber}.`,
          );
        }
      }
    } else if (choice === 5) {
      console.log("Goodbye!");
      return;
    } else {
      console.log("Choose an option from 1 to 5.");
    }
  }
}

runCinemaManager()
  .catch((error: unknown) => {
    console.error("The cinema manager stopped unexpectedly.", error);
    process.exitCode = 1;
  })
  .finally(() => prompt.close());
