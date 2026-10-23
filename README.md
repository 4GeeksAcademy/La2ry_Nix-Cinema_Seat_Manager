# Cinema Seat Manager

Movie cards show live availability, single-seat-only, or sold-out badges.
Sold-out screenings disable group search. Booking confirmations include the
movie, showtime, and seat labels.

Use **Find adjacent seats** for the first group and **Find next group** to cycle
through other horizontal groups (wrapping to the first group at the end).
**Manage cancellations** switches to a separate mode: select reserved seats
marked ×, then click **Cancel reservation for…** and confirm. Exiting this mode
or switching movies clears the selection. Cancellations update counts and saved
bookings just like reservations.

### Demonstrating the four room scenarios

Each movie on the website has its own assigned scenario. Click a movie to
demonstrate it; **Reset movie scenario** restores its original layout after confirmation.

| Movie | Scenario | Reserved | Available | Adjacent pair |
| --- | --- | --- | --- | --- |
| The Last Garden | Empty | 0 | 80 | Yes |
| Blue Hour Express | Partially filled | 46 | 34 | Yes |
| Little Giants of Nova | Nearly full, scattered single seats | 72 | 8 | No |
| Midnight Premiere | Full | 80 | 0 | No |

These assigned scenarios use a new browser-storage namespace, so previous demo
bookings do not override them. Old saved data is left untouched. New bookings
persist separately for each movie until its scenario is reset.

## Cinema Seat Manager CLI

Run the interactive seat reservation program with:

```bash
npm run console
```

The program manages an 8-row, 10-seat theater. You can display the seat map,
reserve an available seat, count available seats, and find adjacent seats.
The seat map uses `L` for available seats and `X` for occupied seats, with
1-based row and column numbers. Seats are stored only in an 8-by-10 numeric
matrix: `0` = available, `1` = occupied. Both interfaces share this representation.

## Assignment requirements and scenario checks

```bash
npm run scenarios
npm run build
```

The scenario command verifies and prints empty, partially filled, nearly full
with isolated single seats, and full rooms. It also checks duplicate reservations,
invalid coordinates, first-pair ordering, and that adjacent searches never cross
a row boundary.

Core functions in [src/seat-manager.ts](./src/seat-manager.ts):
- `createSeatMap()` initializes all 80 seats.
- `displaySeats(seats)` prints the numbered L/X matrix.
- `reserveSeat(seats, row, column)` validates 1-based coordinates, checks
  occupancy, and returns a success/failure message.
- `countSeats(seats)` returns `[occupied, available]`.
- `findAdjacentPair(seats)` returns the first horizontal pair as
  `[[row, column], [row, column]]`, or `[]` when none exists.
- `findAdjacentSeats(seats, size)` also supports larger groups for the website.

Application data uses arrays and functions, not custom objects or classes.
The optional website uses browser DOM/storage APIs and JSON persistence;
old boolean bookings are converted to numeric matrices without losing seats.
The CLI is the evaluated prototype; the website is an optional enhancement.

## Cinema Seat Manager Website

Start the website with:

```bash
npm run start
```

Use the seat map to select and reserve seats, or enter a group size to find
adjacent seats. The browser app and CLI use the same seat-management functions.
Browser reservations are saved locally on that device. In the seat map, use
arrow keys to move between available seats and Space or Enter to select one.
The website includes four fictional sample films with photographic sample
artwork and showtimes. Seat reservations are stored separately for each screening
in the browser, starting with the assigned scenarios above. Use **Reset movie
scenario** and confirm to restore the selected screening. The CLI still starts empty.

Sample photography is downloaded locally from Unsplash:
[forest](https://images.unsplash.com/photo-1441974231531-c6227db76b6e),
[train](https://images.unsplash.com/photo-1474487548417-781cb71495f3),
[space](https://images.unsplash.com/photo-1446776811953-b23d57bd21aa),
and [cinema](https://images.unsplash.com/photo-1489599849927-2ee91cede3ba).
The images are illustrative, not official posters for actual films.

The selection summary lists seat labels (such as A7); click a label to remove
it. The occupancy meter updates after each reservation. Reservations are kept
in memory when browser storage is blocked, including when switching films;
these session-only reservations do not survive a reload. Saved booking changes
from another tab refresh the active seating map automatically.
Reserve and Clear are enabled only when seats are selected. Use **Choose seats
on map** to focus an available seat, then click it or press Space/Enter; you can
also use **Find adjacent seats** to populate your selection.

<!-- hide -->
> By [@ehiber](https://github.com/ehiber) and contributors at [4Geeks Academy](https://4geeksacademy.com/)

[![build by developers](https://img.shields.io/badge/build_by-Developers-blue)](https://4geeks.com)
[![twitter](https://img.shields.io/twitter/follow/4geeksacademy?style=social&logo=twitter)](https://twitter.com/4geeksacademy)

*Estas instrucciones estan disponibles en [espanol](./README.es.md).*
<!-- endhide -->
Start coding a TypeScript/HTML/CSS website in 30 seconds by opening this template using 4Geeks' [One-Click Coding](https://s.4geeks.com/start?repo=https://github.com/4GeeksAcademy/typescript-hello) or locally on your computer.

## Before you begin

Install the packages by typing:

```bash
npm install
```

## How do I run my website to see live changes?

Type on the command line:

```bash
npm run start
```

Then open your local URL in the browser (usually `http://localhost:5173`).

## How do I run this in GitHub Codespaces?

Run the same development server:

```bash
npm run start
```

Vite is configured to listen on `0.0.0.0`, so Codespaces can detect and forward port `5173` automatically.

## How do I run only the TypeScript check?

Use this command to validate only TypeScript without starting Vite:

```bash
npm run typecheck
```

## How do I run `main.ts` from the terminal?

If you want to execute `./src/main.ts` directly and see `console.log` output in the terminal, run:

```bash
npm run console
```

This command is already wired to `./src/main.ts`.

## Where do I write my code?

It depends on the language:

- `./src/main.ts` for TypeScript logic.
- `./src/style.css` for styles (Tailwind CSS v4 is already imported).
- `./index.html` for the HTML shell.

You can add more files as needed, just make sure to import them from `main.ts`.

Note: if you can see the "Hello Rigo" card and the message "If you can see this, Tailwind is working.", Tailwind is configured correctly.

## Troubleshooting

### I don't see my changes...

Every time you change any file inside `./src`, the website refreshes automatically (hot reload).

If changes still don't appear, refresh clearing cache:

- Mac: `Cmd + Shift + R`
- Windows/Linux: `Ctrl + Shift + R`

## How do I include more images in my project?

Add them inside `./public` and reference them in HTML using `/your-image-name.ext`.

Example:

```html
<img src="/rigo-baby.jpg" alt="Rigo" />
```

## How do I include more TypeScript files?

Add files into `./src` and import them from `main.ts`.

Example:

```ts
import { myVar } from "./file2";
```

## How do I publish the website?

This boilerplate is compatible with Vercel in one step.

<!-- hide -->
## Contributors

This template was built as part of the [4Geeks Academy Coding Bootcamp](https://4geeksacademy.com/us/coding-bootcamp) by [ehiber](https://github.com/ehiber) and contributors. Find out more about our [AI Engineering Course](https://4geeksacademy.com/us/coding-bootcamps/ai-engineering), [Full Stack Developer Course](https://4geeksacademy.com/us/coding-bootcamps/part-time-full-stack-developer), and [Data Science Bootcamp](https://4geeksacademy.com/us/coding-bootcamps/datascience-machine-learning).

You can find other templates and resources like this at the [school's GitHub page](https://github.com/4geeksacademy/).
<!-- endhide -->
