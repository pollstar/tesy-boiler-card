# Changelog

All notable changes to the card. Versions match `CARD_VERSION` in `tesy-boiler-card.js` and the GitHub releases, which HACS shows when updating.

## 1.1.1 (2026-11-12)

- **Narrow columns.** Sizes follow the card's own width instead of the browser window. The text in the dial scales with the dial, so the temperature and the status stay inside the arc. Below 340 px the card uses tighter spacing, smaller mode chips and buttons, and leaves out the Wi-Fi signal (it's in the statistics). Reported by @artin961.
- **Screen readers.** On shower models the dial is labelled *Target showers*, and on every model it reads its value with the unit ("3 showers", "55 °C") instead of a bare number.

## 1.1.0 (2026-11-06)

- **Shower models: BelliSlimo and BelliSlimo Lite** (#1, @RoastSlav). The card shows hot water in showers on these models, with the *Hot water* and *Active target* sensors and the *Target showers* number of the Tesy integration 1.7.0:
  - the dial, the drag handle and the keyboard steps work in showers, from 0 to the heater's maximum;
  - a target of 0 showers shows as *Heating off*;
  - the program editor works in showers, from 1 to the maximum, with `*` *Anti-freeze* for an empty hour instead of ❄ *Off*;
  - the schedule button appears only when the integration reports weekly programs for the heater;
  - the statistics dialog leaves out the ModEco's E01–E04 list.
- Nothing changes on heaters in °C.

## 1.0.0 (2026-10-26)

First release as a separate HACS repository. Before, the card was served by the Tesy integration itself.

- Dial with the water temperature and the active target; a handle sets the manual setpoint.
- Power, operation modes, Boost.
- Weekly program editor for P1–P3: a 7×24 grid on wide screens, day by day on phones, with a temperature brush and copying a day to other days.
- Statistics dialog: energy, errors, Wi-Fi, uptime, clock and firmware.
- Follows the Home Assistant theme and language: English, Ukrainian and Russian.

Licence: 1.0.0 is available under MIT. Changes after it are under PolyForm Noncommercial 1.0.0 (see `LICENSE.md`).
