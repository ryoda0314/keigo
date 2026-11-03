import assert from "node:assert/strict";
import { test } from "node:test";
import { countsHere, platformOf } from "../src/lib/usage.ts";

const SITE = "https://keigo-green.vercel.app";

test("counted on the public address of a production build", () => {
  assert.equal(countsHere("https://keigo-green.vercel.app", SITE, true), true);
  assert.equal(countsHere("https://keigo-green.vercel.app", `${SITE}/`, true), true);
  assert.equal(countsHere("https://keigo-green.vercel.app", `${SITE}/app?x=1`, true), true);
});

test("not counted while developing, on a preview, or elsewhere", () => {
  assert.equal(countsHere("https://keigo-green.vercel.app", SITE, false), false);
  assert.equal(countsHere("http://localhost:3230", SITE, true), false);
  assert.equal(countsHere("https://keigo-git-main-someone.vercel.app", SITE, true), false);
  assert.equal(countsHere("http://keigo-green.vercel.app", SITE, true), false);
});

test("not counted when an address cannot be read", () => {
  assert.equal(countsHere("", SITE, true), false);
  assert.equal(countsHere("null", SITE, true), false);
  assert.equal(countsHere("https://keigo-green.vercel.app", "", true), false);
  assert.equal(countsHere("https://keigo-green.vercel.app", "keigo-green.vercel.app", true), false);
  assert.equal(countsHere("https://keigo-green.vercel.app", "not a url", true), false);
});

const UA = {
  iphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
  ipad: "Mozilla/5.0 (iPad; CPU OS 16_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
  ipod: "Mozilla/5.0 (iPod touch; CPU iPhone OS 15_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1",
  mac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
  android: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  windows: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  chromebook: "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  linux: "Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0",
};

test("an iPhone, iPad or iPod is ios, and so is an iPad that says it is a Mac", () => {
  assert.equal(platformOf(UA.iphone, 5), "ios");
  assert.equal(platformOf(UA.ipad, 5), "ios");
  assert.equal(platformOf(UA.ipod, 5), "ios");
  assert.equal(platformOf(UA.mac, 5), "ios");
});

test("Android is android, though it also says Linux", () => {
  assert.equal(platformOf(UA.android, 5), "android");
});

test("Windows, a Mac without touch, a Chromebook and Linux are pc", () => {
  assert.equal(platformOf(UA.windows, 0), "pc");
  assert.equal(platformOf(UA.windows, 10), "pc");
  assert.equal(platformOf(UA.mac, 0), "pc");
  assert.equal(platformOf(UA.mac, 1), "pc");
  assert.equal(platformOf(UA.chromebook, 0), "pc");
  assert.equal(platformOf(UA.linux, 0), "pc");
});

test("anything else, or nothing readable, is other", () => {
  assert.equal(platformOf("Mozilla/5.0 (PlayStation; PlayStation 5/6.50) AppleWebKit/605.1.15", 0), "other");
  assert.equal(platformOf("", 0), "other");
  assert.equal(platformOf(undefined, 0), "other");
  assert.equal(platformOf(null, 5), "other");
  assert.equal(platformOf(UA.mac, undefined), "pc");
  assert.equal(platformOf(UA.mac, Number.NaN), "pc");
});
