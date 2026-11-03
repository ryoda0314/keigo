import assert from "node:assert/strict";
import { test } from "node:test";
import { countsHere } from "../src/lib/usage.ts";

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
