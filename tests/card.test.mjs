// Unit tests for the pure helpers of the card: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  tempRole, angleFor, tempFromPoint, scheduleCalls, heaterView, deviceEntities, DAYS,
  pickLang, cardSupported, errorView, numberLocale, wallClock, focusKey, durationSeconds, formatCurrent,
  CELSIUS, showerScale, hasSchedule, formatShowers,
} from "../tesy-boiler-card.js";

test("temperature roles", () => {
  assert.equal(tempRole(null), "empty");
  assert.equal(tempRole(14), "off");
  assert.equal(tempRole(15), "t20");
  assert.equal(tempRole(50), "t55");
  assert.equal(tempRole(75), "t75");
});

test("dial angle and drag point round-trip", () => {
  assert.equal(angleFor(14), -135);
  assert.equal(angleFor(75), 135);
  for (const t of [15, 40, 60, 75]) {
    const a = (angleFor(t) * Math.PI) / 180;
    const x = 140 + 116 * Math.sin(a), y = 140 - 116 * Math.cos(a);
    assert.equal(tempFromPoint(x, y), t);
  }
  // the gap at the bottom clamps to the nearer end, never below 15
  assert.equal(tempFromPoint(100, 279), 15);
  assert.equal(tempFromPoint(180, 279), 75);
});

test("schedule calls group identical days and skip unchanged ones", () => {
  const p1 = [14,14,50,50,50,50,25,25,25,25,40,40,75,75,75,75,50,50,50,50,50,50,14,14];
  const orig = { 1: Object.fromEntries(DAYS.map((d) => [d, p1.slice()])) };
  const edit = JSON.parse(JSON.stringify(orig));
  const mo = p1.slice(); mo[6] = 60;
  for (const d of ["mo", "tu", "we"]) edit[1][d] = mo.slice();
  edit[1].su[0] = 20;
  assert.deepEqual(scheduleCalls(orig, edit), [
    { program: 1, days: ["mo", "tu", "we"], temperatures: mo },
    { program: 1, days: ["su"], temperatures: [20, ...p1.slice(1)] },
  ]);
  assert.deepEqual(scheduleCalls(orig, orig), []);
});

test("heater view from the water_heater state", () => {
  const st = (state, attrs) => ({ state, attributes: attrs });
  // P1 at night: 14 °C = heating off
  let v = heaterView(st("p1", { temperature: 14, current_temperature: 42.3, is_heating: false }), false);
  assert.equal(v.status, "heatOff"); assert.equal(v.off, true); assert.equal(v.manual, false);
  // manual, heating, Boost
  v = heaterView(st("performance", { temperature: 75, current_temperature: 42.3, is_heating: true }), true);
  assert.equal(v.status, "heatingBoost"); assert.equal(v.manual, true);
  // powered off / unavailable
  assert.equal(heaterView(st("off", {}), false).status, "off");
  assert.equal(heaterView(st("unavailable", {}), false).status, "unavailable");
  assert.equal(heaterView(undefined, false).available, false);
});

test("device entities by translation key with entity_id fallback", () => {
  const hass = {
    entities: {
      "water_heater.b_heater": { entity_id: "water_heater.b_heater", device_id: "d1", platform: "tesy" },
      "switch.b_boost": { entity_id: "switch.b_boost", device_id: "d1", translation_key: "boost" },
      "sensor.b_energy_consumed_resettable": { entity_id: "sensor.b_energy_consumed_resettable", device_id: "d1" },
      "sensor.b_energy_consumed": { entity_id: "sensor.b_energy_consumed", device_id: "d1" },
      "switch.other_boost": { entity_id: "switch.other_boost", device_id: "d2", translation_key: "boost" },
    },
    devices: { d1: { name: "Boiler", model: "ModEco 2" } },
  };
  const e = deviceEntities(hass, "water_heater.b_heater");
  assert.equal(e.boost, "switch.b_boost");
  assert.equal(e.energy_consumed, "sensor.b_energy_consumed");
  assert.equal(e.energy_consumed_resettable, "sensor.b_energy_consumed_resettable");
  assert.equal(e.device.model, "ModEco 2");
});

test("card language follows the HA UI language, English otherwise", () => {
  assert.equal(pickLang("ru"), "ru");
  assert.equal(pickLang("uk"), "uk");
  assert.equal(pickLang("en-GB"), "en");
  assert.equal(pickLang("uk_UA"), "uk");
  assert.equal(pickLang("de"), "en");
  assert.equal(pickLang("zh-Hans"), "en");
  assert.equal(pickLang(undefined), "en");
  assert.equal(pickLang("constructor"), "en");
});

test("card support follows the tesy_features attribute", () => {
  assert.equal(cardSupported({ state: "performance", attributes: { tesy_features: ["readback", "schedule", "timezone"] } }), true);
  assert.equal(cardSupported({ state: "performance", attributes: { tesy_features: ["schedule"] } }), true);
  assert.equal(cardSupported({ state: "performance", attributes: { tesy_features: ["timezone"] } }), false);
  assert.equal(cardSupported({ state: "performance", attributes: {} }), false);
  assert.equal(cardSupported({ state: "unavailable", attributes: {} }), null);
  assert.equal(cardSupported(undefined), null);
});

test("error sensor: no data is not a fault", () => {
  for (const s of [undefined, null, "", "unavailable", "unknown"]) assert.deepEqual(errorView(s), { kind: "unknown", code: null });
  assert.deepEqual(errorView("00"), { kind: "ok", code: "00" });
  assert.deepEqual(errorView("0"), { kind: "ok", code: "00" });
  assert.deepEqual(errorView("03"), { kind: "error", code: "03" });
  assert.deepEqual(errorView("3"), { kind: "error", code: "03" });
});

test("number locale accepts HA language codes", () => {
  assert.equal(numberLocale("uk_UA"), "uk-UA");
  assert.equal(numberLocale("ru"), "ru");
  assert.equal(numberLocale("en-GB"), "en-GB");
  for (const bad of [undefined, "", "not a locale!", "x_"]) assert.equal(numberLocale(bad), "en");
  assert.doesNotThrow(() => new Intl.NumberFormat(numberLocale("uk_UA")).format(42.5));
});

test("heater wall clock is read without the browser time zone", () => {
  // 2026-03-08 02:30 does not exist in America/New_York; the heater shows it anyway.
  assert.deepEqual(wallClock("2026-03-08T02:30:00"), { day: 6, hour: 2, minute: 30 }); // Sunday
  assert.deepEqual(wallClock("2026-10-14T09:05:00"), { day: 2, hour: 9, minute: 5 }); // Wednesday
  assert.deepEqual(wallClock("2026-10-14 23:59:59"), { day: 2, hour: 23, minute: 59 });
  for (const bad of [undefined, null, "", "garbage", "2026-02-30T10:00:00", "2026-10-14T24:00:00"]) assert.equal(wallClock(bad), null);
});

test("focus key identifies a control across re-renders", () => {
  const el = (dataset, role) => ({ dataset, getAttribute: (n) => (n === "role" ? role ?? null : null) });
  assert.equal(focusKey(el({ action: "mode", mode: "p1" })), "mode|p1|");
  assert.notEqual(focusKey(el({ action: "mode", mode: "p1" })), focusKey(el({ action: "mode", mode: "p2" })));
  assert.equal(focusKey(el({}, "slider")), "||slider");
  assert.equal(focusKey(null), null);
});

test("uptime in seconds whatever unit HA displays it in", () => {
  assert.equal(durationSeconds("17640", "s"), 17640);
  assert.equal(durationSeconds("17640", undefined), 17640);
  assert.equal(durationSeconds("12", "h"), 43200);
  assert.equal(durationSeconds("4.9", "h"), 17640);
  assert.equal(durationSeconds("294", "min"), 17640);
  assert.equal(durationSeconds("2", "d"), 172800);
  for (const [v, u] of [["unavailable", "s"], ["", "s"], [undefined, "s"], ["5", "fortnight"]]) assert.equal(durationSeconds(v, u), null);
});

test("water temperature has no forced decimal", () => {
  const ru = { locale: { language: "ru" } };
  assert.equal(formatCurrent(59, ru), "59");
  assert.equal(formatCurrent(42.3, ru), "42,3");
  assert.equal(formatCurrent(42.3, { locale: { language: "en" } }), "42.3");
  assert.equal(formatCurrent(null, ru), "—");
});

// ---- shower models (BelliSlimo): a Target Showers number, values in showers

const number = (max, min = 0) => ({ state: "2", attributes: { min, max, step: 1 } });

test("shower scale from the Target Showers number", () => {
  assert.deepEqual(showerScale(number(4)), {
    showers: true, min: 0, max: 4, setMin: 0, setMax: 4, slotMin: 1, slotMax: 4, off: null,
  });
  assert.equal(showerScale(number(5)).max, 5);
  assert.equal(showerScale(undefined).max, 4); // number not loaded yet
  assert.equal(showerScale({ attributes: { max: 0 } }).max, 4);
});

test("dial maps 0..max showers and snaps to whole showers", () => {
  const sc = showerScale(number(4));
  assert.equal(angleFor(0, sc), -135);
  assert.equal(angleFor(4, sc), 135);
  for (const n of [0, 1, 2, 3, 4]) {
    const a = (angleFor(n, sc) * Math.PI) / 180;
    assert.equal(tempFromPoint(140 + 116 * Math.sin(a), 140 - 116 * Math.cos(a), sc), n);
  }
  assert.equal(tempFromPoint(100, 279, sc), 0);
  assert.equal(tempFromPoint(180, 279, sc), 4);
  // °C stays the default
  assert.equal(angleFor(14), angleFor(14, CELSIUS));
});

test("shower roles: no off value, empty is anti-freeze", () => {
  const sc = showerScale(number(4));
  assert.equal(tempRole(null, sc), "empty");
  assert.deepEqual([1, 2, 3, 4].map((n) => tempRole(n, sc)), ["t30", "t45", "t65", "t75"]);
  assert.equal(tempRole(14), "off"); // °C unchanged
});

test("card support: shower models with or without programs", () => {
  const st = (features) => ({ state: "eco", attributes: features ? { tesy_features: features } : {} });
  assert.equal(cardSupported(st(), true), true); // 1.7.0 without programs for the BelliSlimo
  assert.equal(cardSupported(st(["readback", "timezone"]), true), true);
  assert.equal(cardSupported(st(["readback", "schedule", "timezone"]), true), true);
  assert.equal(cardSupported({ state: "unavailable", attributes: {} }, true), true);
  // °C heaters still need the programs
  assert.equal(cardSupported(st(["readback", "timezone"]), false), false);
  assert.equal(hasSchedule(st(["schedule"])), true);
  assert.equal(hasSchedule(st(["readback"])), false);
  assert.equal(hasSchedule(st()), false);
});

test("heater view of a shower model reads its sensors", () => {
  const heater = (state, attrs = {}) => ({ state, attributes: { temperature: null, current_temperature: null, ...attrs } });
  let v = heaterView(heater("performance", { is_heating: true }), false, { current: "1", target: "3" });
  assert.equal(v.current, 1); assert.equal(v.target, 3); assert.equal(v.status, "heating");
  // an empty program hour reports 0 showers: nothing to heat
  v = heaterView(heater("p2"), false, { current: "2", target: "0" });
  assert.equal(v.off, true); assert.equal(v.status, "heatOff");
  // Boost heats regardless
  v = heaterView(heater("p2", { is_heating: true }), true, { current: "2", target: "0" });
  assert.equal(v.off, false); assert.equal(v.status, "heatingBoost");
  // sensors not loaded yet
  v = heaterView(heater("eco"), false, { current: undefined, target: "unknown" });
  assert.equal(v.current, null); assert.equal(v.target, null); assert.equal(v.status, "idle");
  // 0 showers in the tank is a value, not missing
  assert.equal(heaterView(heater("eco"), false, { current: "0", target: "1" }).current, 0);
});

test("showers with the plural form of each card language", () => {
  assert.deepEqual([0, 1, 2, 4].map((n) => formatShowers(n, "en")), ["0 showers", "1 shower", "2 showers", "4 showers"]);
  assert.deepEqual([0, 1, 2, 4].map((n) => formatShowers(n, "uk")), ["0 душів", "1 душ", "2 душі", "4 душі"]);
  assert.deepEqual([0, 1, 2, 4].map((n) => formatShowers(n, "ru")), ["0 душей", "1 душ", "2 душа", "4 душа"]);
});

test("device entities include the shower entities", () => {
  const hass = {
    entities: {
      "water_heater.b_heater": { entity_id: "water_heater.b_heater", device_id: "d1", platform: "tesy" },
      "number.b_target_showers": { entity_id: "number.b_target_showers", device_id: "d1", translation_key: "target_showers" },
      "sensor.b_hot_water": { entity_id: "sensor.b_hot_water", device_id: "d1", translation_key: "hot_water" },
      "sensor.b_active_target": { entity_id: "sensor.b_active_target", device_id: "d1", translation_key: "active_target" },
    },
    devices: { d1: { name: "Boiler", model: "BelliSlimo" } },
  };
  const e = deviceEntities(hass, "water_heater.b_heater");
  assert.equal(e.target_showers, "number.b_target_showers");
  assert.equal(e.hot_water, "sensor.b_hot_water");
  assert.equal(e.active_target, "sensor.b_active_target");
});

test("shower program days go to set_schedule with null for anti-freeze hours", () => {
  const empty = Array(24).fill(null);
  const orig = { 1: Object.fromEntries(DAYS.map((d) => [d, empty.slice()])) };
  const edit = JSON.parse(JSON.stringify(orig));
  edit[1].mo[0] = 1; edit[1].mo[8] = 2; edit[1].mo[16] = 3;
  const mo = empty.slice(); mo[0] = 1; mo[8] = 2; mo[16] = 3;
  assert.deepEqual(scheduleCalls(orig, edit), [{ program: 1, days: ["mo"], temperatures: mo }]);
});
