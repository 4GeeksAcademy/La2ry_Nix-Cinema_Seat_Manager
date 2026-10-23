import "./style.css";
import {
  countAvailableSeats,
  createSeatMap,
  createSampleSeatMap,
  findAdjacentSeats,
  isSeatMap,
  reserveSeat,
  ROW_COUNT,
  SEAT_STORAGE_KEY,
  SEATS_PER_ROW,
  type SeatMap,
} from "./seat-manager.js";

type Screening = [
  id: string, title: string, genre: string, runtime: string,
  rating: string, showtime: string, poster: string, description: string,
];

const screenings: Screening[] = [
  ["last-garden", "The Last Garden", "Sci-fi · Drama", "1h 52m",
    "PG-13", "6:30 PM", "/posters/last-garden.jpg",
    "A botanist searches for the last seed on a quiet orbital station."],
  ["blue-hour", "Blue Hour Express", "Romance · Drama", "1h 44m",
    "PG", "7:15 PM", "/posters/blue-hour-express.jpg",
    "Two strangers share a midnight train ride along the coast."],
  ["little-giants", "Little Giants of Nova", "Adventure · Family", "1h 38m",
    "PG", "8:00 PM", "/posters/little-giants.jpg",
    "A tiny crew discovers that courage comes in every size."],
];

let storageAvailable = true;
let startupNotice = "";
const sessionSeatMaps: (SeatMap | undefined)[] = [];

function storageKeyFor(screening: Screening): string {
  return `${SEAT_STORAGE_KEY}:${screening[0]}`;
}

function sampleReservedCount(screening: Screening): number {
  return screening[0] === "little-giants" ? 17 : 46;
}

function loadSeatMap(screening: Screening): SeatMap {
  startupNotice = "";
  const sessionMap = sessionSeatMaps[screenings.indexOf(screening)];
  if (sessionMap) {
    if (!storageAvailable) {
      startupNotice = "Browser storage is unavailable; reservations will last only for this session.";
    }
    return sessionMap;
  }
  let saved: string | null;
  try {
    saved =
      window.localStorage.getItem(storageKeyFor(screening)) ??
      (screening === screenings[0]
        ? window.localStorage.getItem(SEAT_STORAGE_KEY)
        : null);
  } catch (error) {
    if (!(error instanceof DOMException)) {
      throw error;
    }
    storageAvailable = false;
    startupNotice = "Browser storage is unavailable; reservations will last only for this session.";
    return createSeatMap();
  }

  if (saved === null) {
    return createSampleSeatMap(sampleReservedCount(screening));
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(saved);
  } catch (error) {
    if (!(error instanceof SyntaxError)) {
      throw error;
    }
    startupNotice = "Saved seat data could not be read; starting with an empty theater.";
    return createSeatMap();
  }

  // Preserve reservations saved before the required numeric representation.
  if (
    Array.isArray(parsed) && parsed.length === ROW_COUNT &&
    parsed.every((row) => Array.isArray(row) && row.length === SEATS_PER_ROW &&
      row.every((seat) => typeof seat === "boolean"))
  ) {
    return parsed.map((row: boolean[]) => row.map((seat) => seat ? 1 : 0));
  }

  if (!isSeatMap(parsed)) {
    startupNotice = "Saved seat data was invalid; starting with an empty theater.";
    return createSeatMap();
  }

  return parsed;
}

let activeScreening = screenings[0];
let seatMap = loadSeatMap(activeScreening);
let selectedSeats: number[] = [];
let activeSeatNumber = Math.max(
  0,
  seatMap.flat().findIndex((occupied) => !occupied),
);
const seatButtons: HTMLButtonElement[] = [];

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`The cinema seat manager page is missing ${selector}.`);
  }
  return element;
}

const seatGrid = requireElement<HTMLDivElement>("#seat-grid");
const availableCount = requireElement<HTMLElement>("#available-count");
const reservedCount = requireElement<HTMLElement>("#reserved-count");
const selectedCount = requireElement<HTMLElement>("#selected-count");
const groupSizeInput = requireElement<HTMLInputElement>("#group-size");
const reserveButton = requireElement<HTMLButtonElement>("#reserve-button");
const clearButton = requireElement<HTMLButtonElement>("#clear-button");
const findButton = requireElement<HTMLButtonElement>("#find-button");
const statusMessage = requireElement<HTMLElement>("#status-message");
const movieList = requireElement<HTMLDivElement>("#movie-list");
const movieTitle = requireElement<HTMLElement>("#movie-title");
const movieDetails = requireElement<HTMLElement>("#movie-details");
const movieDescription = requireElement<HTMLElement>("#movie-description");
const sampleButton = requireElement<HTMLButtonElement>("#sample-button");
const sampleNote = requireElement<HTMLElement>(".sample-note");
const chooseSeatsButton = requireElement<HTMLButtonElement>("#choose-seats-button");
const selectionHint = requireElement<HTMLElement>("#selection-hint");
const selectionList = requireElement<HTMLDivElement>("#selection-list");
const occupancy = requireElement<HTMLProgressElement>("#occupancy");
const occupancyLabel = requireElement<HTMLElement>("#occupancy-label");

function saveSeatMap(updatedMap: SeatMap): boolean {
  sessionSeatMaps[screenings.indexOf(activeScreening)] = updatedMap;
  if (!storageAvailable) {
    return false;
  }
  try {
    window.localStorage.setItem(
      storageKeyFor(activeScreening),
      JSON.stringify(updatedMap),
    );
    return true;
  } catch (error) {
    if (!(error instanceof DOMException)) {
      throw error;
    }
    storageAvailable = false;
    return false;
  }
}

function renderScreenings(): void {
  movieList.replaceChildren();

  for (const screening of screenings) {
    const card = document.createElement("button");
    const poster = document.createElement("img");
    const details = document.createElement("span");
    const title = document.createElement("span");
    const metadata = document.createElement("span");
    const showtime = document.createElement("span");

    card.type = "button";
    card.className = "movie-card";
    card.dataset.screening = screening[0];
    card.setAttribute("aria-pressed", String(screening === activeScreening));
    card.setAttribute("aria-label", `${screening[1]}, ${screening[5]}`);
    card.classList.toggle("is-active", screening === activeScreening);
    poster.className = "movie-poster";
    poster.src = screening[6];
    poster.alt = `Photographic sample artwork for ${screening[1]}`;
    poster.width = 120;
    poster.height = 160;
    details.className = "movie-card-details";
    title.className = "movie-card-title";
    title.textContent = screening[1];
    metadata.className = "movie-card-meta";
    metadata.textContent = `${screening[2]} · ${screening[3]}`;
    showtime.className = "movie-showtime";
    showtime.textContent = screening[5];

    details.append(title, metadata, showtime);
    card.append(poster, details);
    movieList.append(card);
  }

  movieTitle.textContent = activeScreening[1];
  movieDetails.textContent =
    `${activeScreening[5]} · ${activeScreening[3]} · ${activeScreening[4]}`;
  movieDescription.textContent = activeScreening[7];
  const reserved = sampleReservedCount(activeScreening);
  sampleNote.textContent =
    `Demo layout: ${reserved} reserved / 80 seats (${(reserved / 80 * 100).toFixed(2)}%). Saved bookings are preserved.`;
}

function createSeatButtons(): void {
  for (let rowIndex = 0; rowIndex < ROW_COUNT; rowIndex += 1) {
    const rowLabel = document.createElement("span");
    rowLabel.className = "row-label";
    rowLabel.textContent = String.fromCharCode(65 + rowIndex);
    rowLabel.setAttribute("aria-hidden", "true");
    seatGrid.append(rowLabel);

    for (let seatIndex = 0; seatIndex < SEATS_PER_ROW; seatIndex += 1) {
      const seatNumber = rowIndex * SEATS_PER_ROW + seatIndex;
      const occupied = seatMap[rowIndex][seatIndex] === 1;
      const selected = selectedSeats.includes(seatNumber);
      const seat = document.createElement("button");

      seat.type = "button";
      seat.className = "seat";
      seat.dataset.seat = String(seatNumber);
      seat.tabIndex = seatNumber === activeSeatNumber ? 0 : -1;
      seat.setAttribute(
        "aria-label",
        `Row ${String.fromCharCode(65 + rowIndex)}, seat ${seatIndex + 1}, ${
          occupied ? "reserved" : selected ? "selected" : "available"
        }`,
      );
      seat.title = `Row ${String.fromCharCode(65 + rowIndex)}, seat ${seatIndex + 1}`;
      seatGrid.append(seat);
      seatButtons.push(seat);
    }
  }
}

function renderSeatMap(): void {
  if (seatMap.flat()[activeSeatNumber]) {
    activeSeatNumber = Math.max(
      0,
      seatMap.flat().findIndex((occupied) => !occupied),
    );
  }
  for (let rowIndex = 0; rowIndex < ROW_COUNT; rowIndex += 1) {
    for (let seatIndex = 0; seatIndex < SEATS_PER_ROW; seatIndex += 1) {
      const seatNumber = rowIndex * SEATS_PER_ROW + seatIndex;
      const occupied = seatMap[rowIndex][seatIndex] === 1;
      const selected = selectedSeats.includes(seatNumber);
      const seat = seatButtons[seatNumber];

      seat.disabled = occupied;
      seat.tabIndex = seatNumber === activeSeatNumber && !occupied ? 0 : -1;
      seat.classList.toggle("is-occupied", occupied);
      seat.classList.toggle("is-selected", selected);
      seat.setAttribute(
        "aria-label",
        `Row ${String.fromCharCode(65 + rowIndex)}, seat ${seatIndex + 1}, ${
          occupied ? "reserved" : selected ? "selected" : "available"
        }`,
      );
      seat.setAttribute("aria-pressed", String(selected));
      seat.textContent = occupied ? "×" : String(seatIndex + 1);
    }
  }

  const available = countAvailableSeats(seatMap);
  availableCount.textContent = String(available);
  reservedCount.textContent = String(ROW_COUNT * SEATS_PER_ROW - available);
  selectedCount.textContent = String(selectedSeats.length);
  reserveButton.disabled = selectedSeats.length === 0;
  clearButton.disabled = selectedSeats.length === 0;
  chooseSeatsButton.hidden = selectedSeats.length > 0 || available === 0;
  selectionHint.textContent = available === 0
    ? "This screening is sold out. Choose another movie to find available seats."
    : selectedSeats.length === 0
      ? "No seats selected. Choose a numbered green seat or find adjacent seats to enable Reserve and Clear."
      : `${selectedSeats.length} ${selectedSeats.length === 1 ? "seat is" : "seats are"} selected. Reserve below, remove a seat label, or clear your selection.`;
  occupancy.value = ROW_COUNT * SEATS_PER_ROW - available;
  occupancyLabel.textContent = `${(occupancy.value / occupancy.max * 100).toFixed(1)}% reserved`;
  selectionList.replaceChildren();
  for (const seatNumber of [...selectedSeats].sort((a, b) => a - b)) {
    const label =
      `${String.fromCharCode(65 + Math.floor(seatNumber / SEATS_PER_ROW))}${seatNumber % SEATS_PER_ROW + 1}`;
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "selection-chip";
    chip.dataset.removeSeat = String(seatNumber);
    chip.textContent = `${label} ×`;
    chip.setAttribute("aria-label", `Remove seat ${label} from selection`);
    selectionList.append(chip);
  }
  reserveButton.textContent = selectedSeats.length
    ? `Reserve ${selectedSeats.length} ${selectedSeats.length === 1 ? "seat" : "seats"}`
    : "Reserve selected seats";
}

function showMessage(message: string, isError = false): void {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("is-error", isError);
}

chooseSeatsButton.addEventListener("click", () => {
  const availableSeat = seatButtons.find((seat) => !seat.disabled);
  if (!availableSeat) {
    showMessage("This screening is sold out. Please choose another movie.", true);
    return;
  }
  activeSeatNumber = Number(availableSeat.dataset.seat);
  renderSeatMap();
  availableSeat.focus();
  availableSeat.scrollIntoView({ block: "center", inline: "nearest" });
  showMessage("Choose a numbered green seat. Press Space or Enter to select it; use arrow keys to move.");
});

selectionList.addEventListener("click", (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement) || target.dataset.removeSeat === undefined) {
    return;
  }
  const seatNumber = Number(target.dataset.removeSeat);
  selectedSeats = selectedSeats.filter((selected) => selected !== seatNumber);
  activeSeatNumber = seatNumber;
  renderSeatMap();
  seatButtons[seatNumber].focus();
  showMessage("Seat removed from your selection.");
});

seatGrid.addEventListener("click", (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement) || target.dataset.seat === undefined) {
    return;
  }

  const seatNumber = Number(target.dataset.seat);
  if (!Number.isInteger(seatNumber) || seatNumber < 0 || seatNumber >= ROW_COUNT * SEATS_PER_ROW) {
    showMessage("That seat could not be selected.", true);
    return;
  }

  activeSeatNumber = seatNumber;
  if (selectedSeats.includes(seatNumber)) {
    selectedSeats = selectedSeats.filter((selected) => selected !== seatNumber);
  } else {
    selectedSeats = [...selectedSeats, seatNumber];
  }

  showMessage("Choose seats and reserve them, or find adjacent seats for your group.");
  renderSeatMap();
  seatButtons[seatNumber].focus();
});

seatGrid.addEventListener("keydown", (event: KeyboardEvent) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement) || target.dataset.seat === undefined) {
    return;
  }

  const seatNumber = Number(target.dataset.seat);
  const rowIndex = Math.floor(seatNumber / SEATS_PER_ROW);
  const seatIndex = seatNumber % SEATS_PER_ROW;
  const arrowKeys = ["ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp"];
  const directions = [[1, 0], [0, -1], [0, 1], [-1, 0]];
  const direction = directions[arrowKeys.indexOf(event.key)];
  if (direction) {
    event.preventDefault();
    let nextRow = rowIndex + direction[0];
    let nextSeat = seatIndex + direction[1];

    while (
      nextRow >= 0 &&
      nextRow < ROW_COUNT &&
      nextSeat >= 0 &&
      nextSeat < SEATS_PER_ROW
    ) {
      if (!seatMap[nextRow][nextSeat]) {
        activeSeatNumber = nextRow * SEATS_PER_ROW + nextSeat;
        renderSeatMap();
        seatButtons[activeSeatNumber].focus();
        return;
      }
      nextRow += direction[0];
      nextSeat += direction[1];
    }
  } else if (event.key === "Home" || event.key === "End") {
    event.preventDefault();
    const candidates =
      event.key === "Home"
        ? Array.from({ length: SEATS_PER_ROW }, (_, i) => i)
        : Array.from({ length: SEATS_PER_ROW }, (_, i) => SEATS_PER_ROW - i - 1);
    const nextSeat = candidates.find((candidate) => !seatMap[rowIndex][candidate]);
    if (nextSeat !== undefined) {
      activeSeatNumber = rowIndex * SEATS_PER_ROW + nextSeat;
      renderSeatMap();
      seatButtons[activeSeatNumber].focus();
    }
  }
});

reserveButton.addEventListener("click", () => {
  if (selectedSeats.length === 0) {
    showMessage("Select at least one available seat first.", true);
    return;
  }

  const reservation = [...selectedSeats];
  const updatedMap = seatMap.map((row) => [...row]);
  for (const seatNumber of reservation) {
    const rowIndex = Math.floor(seatNumber / SEATS_PER_ROW);
    const seatIndex = seatNumber % SEATS_PER_ROW;
    const message = reserveSeat(updatedMap, rowIndex + 1, seatIndex + 1);
    if (!message.startsWith("Reserved row")) {
      showMessage(message, true);
      return;
    }
  }

  const saved = saveSeatMap(updatedMap);

  const focusWasOnSeat = seatGrid.contains(document.activeElement);
  const focusWasOnReserve = document.activeElement === reserveButton;
  seatMap = updatedMap;
  selectedSeats = [];
  showMessage(
    saved
      ? `${reservation.length} ${reservation.length === 1 ? "seat" : "seats"} reserved.`
      : `${reservation.length} ${reservation.length === 1 ? "seat" : "seats"} reserved for this session only; browser storage is unavailable.`,
  );
  renderSeatMap();
  if (focusWasOnSeat || focusWasOnReserve) {
    findButton.focus();
  }
});

sampleButton.addEventListener("click", () => {
  const reserved = sampleReservedCount(activeScreening);
  const available = ROW_COUNT * SEATS_PER_ROW - reserved;
  if (!window.confirm(
    `Replace reservations for ${activeScreening[1]} with the sample layout (${reserved} reserved, ${available} available)?`,
  )) {
    return;
  }
  seatMap = createSampleSeatMap(reserved);
  selectedSeats = [];
  const saved = saveSeatMap(seatMap);
  renderSeatMap();
  showMessage(
    `Sample layout loaded: ${reserved} reserved (${(reserved / 80 * 100).toFixed(2)}%), ${available} available.${
      saved ? "" : " Session only: browser storage is unavailable."
    }`,
    !saved,
  );
});

movieList.addEventListener("click", (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const card = target.closest<HTMLButtonElement>("[data-screening]");
  const screening = screenings.find(
    (candidate) => candidate[0] === card?.dataset.screening,
  );
  if (!screening || screening === activeScreening) {
    return;
  }

  const shouldRestoreFocus =
    document.activeElement instanceof HTMLButtonElement &&
    document.activeElement.dataset.screening !== undefined;
  activeScreening = screening;
  seatMap = loadSeatMap(activeScreening);
  selectedSeats = [];
  activeSeatNumber = Math.max(
    0,
    seatMap.flat().findIndex((occupied) => !occupied),
  );
  renderScreenings();
  if (shouldRestoreFocus) {
    movieList
      .querySelector<HTMLButtonElement>(`[data-screening="${screening[0]}"]`)
      ?.focus();
  }
  renderSeatMap();
  showMessage(
    startupNotice ||
      `Showing ${activeScreening[1]} at ${activeScreening[5]}.`,
    Boolean(startupNotice),
  );
});

window.addEventListener("storage", (event: StorageEvent) => {
  if (event.storageArea !== window.localStorage) {
    return;
  }
  for (const screening of screenings) {
    if (
      event.key === null ||
      event.key === storageKeyFor(screening) ||
      (event.key === SEAT_STORAGE_KEY && screening === screenings[0])
    ) {
      sessionSeatMaps[screenings.indexOf(screening)] = undefined;
      if (screening === activeScreening) {
        seatMap = loadSeatMap(activeScreening);
        selectedSeats = selectedSeats.filter(
          (seat) => !seatMap[Math.floor(seat / SEATS_PER_ROW)][seat % SEATS_PER_ROW],
        );
        renderSeatMap();
        showMessage(
          startupNotice || "Reservations updated from another tab. Review your selection.",
          Boolean(startupNotice),
        );
      }
    }
  }
});

clearButton.addEventListener("click", () => {
  const focusWasOnClear = document.activeElement === clearButton;
  selectedSeats = [];
  showMessage("Selection cleared.");
  renderSeatMap();
  if (focusWasOnClear) {
    findButton.focus();
  }
});

findButton.addEventListener("click", () => {
  const groupSize = Number(groupSizeInput.value);
  if (!Number.isInteger(groupSize) || groupSize < 1 || groupSize > SEATS_PER_ROW) {
    showMessage(`Enter a whole number from 1 to ${SEATS_PER_ROW}.`, true);
    groupSizeInput.focus();
    return;
  }

  const foundSeats = findAdjacentSeats(seatMap, groupSize);
  if (foundSeats.length === 0) {
    selectedSeats = [];
    showMessage(`No group of ${groupSize} adjacent seats is available.`, true);
  } else {
    selectedSeats = foundSeats;
    const row = String.fromCharCode(65 + Math.floor(foundSeats[0] / SEATS_PER_ROW));
    const firstSeat = (foundSeats[0] % SEATS_PER_ROW) + 1;
    const lastSeat = firstSeat + groupSize - 1;
    showMessage(`Found a group in row ${row}, seats ${firstSeat}–${lastSeat}. Review and reserve.`);
  }

  renderSeatMap();
});

groupSizeInput.addEventListener("keydown", (event: KeyboardEvent) => {
  if (event.key === "Enter") {
    findButton.click();
  }
});

createSeatButtons();
renderScreenings();
renderSeatMap();
if (startupNotice) {
  showMessage(startupNotice, true);
}
