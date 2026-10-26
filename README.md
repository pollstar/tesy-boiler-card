# Tesy Boiler Card

A thermostat card for Tesy water heaters in Home Assistant: a dial with the water temperature and the active target, operation modes, Boost and power, and dialogs for the weekly programs (P1–P3) and for energy and diagnostics.

<img src="https://raw.githubusercontent.com/pollstar/tesy-boiler-card/main/docs/card.png" alt="Tesy boiler card" width="420">

## Requirements

- The [Tesy integration](https://github.com/krasnoukhov/homeassistant-tesy) with weekly program support. The card reads the programs and writes them through its `tesy.set_schedule` action. That support is merged ([#45](https://github.com/krasnoukhov/homeassistant-tesy/pull/45), [#46](https://github.com/krasnoukhov/homeassistant-tesy/pull/46)) and comes with the first release after 1.6.1; until then it is in the fork [pollstar/homeassistant-tesy](https://github.com/pollstar/homeassistant-tesy).
- A heater with weekly programs enabled in that integration. So far that is the **ModEco 2** (id 2004). On another model the card shows a notice instead of the controls; use the standard thermostat card there.
- Home Assistant 2024.8 or newer.

## Installation

### HACS

1. HACS → ⋮ → **Custom repositories** → add `https://github.com/pollstar/tesy-boiler-card`, type **Dashboard**.
2. Find **Tesy Boiler Card** in HACS and download it.
3. Reload the browser.

HACS adds the dashboard resource itself, with a version tag in the URL, so an update is picked up after a browser reload.

### Manual

Copy `tesy-boiler-card.js` to `config/www/`, then add `/local/tesy-boiler-card.js` as a JavaScript module under Settings → Dashboards → ⋮ → **Resources** (Advanced mode must be on in your user profile).

## Configuration

Add it from **Add card → Tesy boiler**, or with YAML:

```yaml
type: custom:tesy-boiler-card
entity: water_heater.boiler_modeco_2_heater
# optional
name: Boiler
subtitle: ModEco 2 · 100 L
animation: auto     # auto (off when the system asks for reduced motion) | always | off
```

Related entities (Boost switch, energy and diagnostic sensors, clock sensor, time zone button) are found automatically on the same device.

## Features

- **Dial** with the current water temperature and the active target. In manual mode a handle on the dial sets the setpoint (15–75 °C); other modes show the target they work to.
- **Power** button at the top right of the dial; **modes** Manual, P1–P3, Eco Smart/Comfort/Night; **Boost**, **schedule** and **statistics** as icon buttons.
- Heating status (heating / target reached / heating off / off) with a subtle animation while the element heats.
- The clock line under the buttons shows the heater's own time; a warning appears when its time zone or clock is off.
- Follows the Home Assistant light/dark theme and UI language: English, Ukrainian and Russian; any other language gets English (numbers keep the UI language format).

### Schedule

The calendar button opens the weekly programs P1–P3. Each cell is one hour of one day, by the heater's clock.

<img src="https://raw.githubusercontent.com/pollstar/tesy-boiler-card/main/docs/schedule.png" alt="Weekly programs dialog: 7×24 grid" width="720">

- **Program tabs** P1–P3; the badge shows which program the heater runs now, and a frame marks the current heater hour.
- **Brush**: pick a temperature (15–75 °C, step 1) or ❄ *Off* (heating off for that hour, stored as 14 °C on the heater), then tap cells to paint them. Empty cells have no entry.
- **Copy**: choose a source day and copy it to other days, weekdays or the whole week.
- **Write to heater** saves only the changed days through `tesy.set_schedule` and returns to the card. While nothing is edited, the dialog follows changes made on the heater panel or in MyTESY.

On phones and portrait screens (narrower than 720 px) the same editor works day by day:

<img src="https://raw.githubusercontent.com/pollstar/tesy-boiler-card/main/docs/schedule-phone.png" alt="Weekly programs on a phone: one day at a time" width="300">

A mini-map of the week sits on top, then the day buttons and the 24 hours of the selected day as 4×6 tiles. The brush and *Copy &lt;day&gt; to* work as on the wide grid.

### Statistics

The chart button opens energy and diagnostics.

<img src="https://raw.githubusercontent.com/pollstar/tesy-boiler-card/main/docs/statistics.png" alt="Energy and diagnostics dialog" width="420">

- **Energy**: total consumption and the resettable counter (since its last reset).
- **Errors**: current error code with a description (E01/E02 lower sensor open/short, E03/E04 upper sensor open/short).
- **Wi-Fi** signal in dBm, marked *weak* below −67 dBm.
- **Module uptime**, **clock** state (heater time and time zone compared with Home Assistant) and **firmware** versions.

## Development

The card is a single file with no dependencies or build step. The pure helpers have unit tests:

```sh
node --test tests/card.test.mjs
```

## License

MIT
