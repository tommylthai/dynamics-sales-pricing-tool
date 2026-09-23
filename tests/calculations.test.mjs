import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const match = html.match(/<script id="calculator-script">([\s\S]*?)<\/script>/);
assert.ok(match, "calculator script must exist");

const context = {
  console,
  Intl,
  module: { exports: {} },
};
vm.createContext(context);
vm.runInContext(match[1], context);

const { calculateEstimate, normalizeQuantity, SKU_DATA } = context.module.exports;

assert.equal(normalizeQuantity(""), null);
assert.equal(normalizeQuantity("-1"), null);
assert.equal(normalizeQuantity("1.5"), null);
assert.equal(normalizeQuantity("12"), 12);

const mixed = calculateEstimate({
  quantities: {
    professional: 5,
    enterprise: 3,
    premium: 2,
    relationship: 0,
    enterpriseAttach: 0,
  },
  customMode: false,
  customPrices: {},
  discountPercent: 0,
  attachConfirmed: false,
});
assert.equal(mixed.monthly, 940);
assert.equal(mixed.annual, 11280);
assert.equal(mixed.credits, 2000);
assert.equal(mixed.officialMonthly, 940);

const custom = calculateEstimate({
  quantities: {
    professional: 2,
    enterprise: 0,
    premium: 1,
    relationship: 10,
    enterpriseAttach: 0,
  },
  customMode: true,
  customPrices: {
    professional: 60,
    premium: 140,
    relationship: 120,
  },
  discountPercent: 10,
  attachConfirmed: false,
});
assert.equal(custom.monthly, 1314);
assert.equal(custom.annual, 15768);
assert.equal(custom.credits, 1000);
assert.equal(custom.unpricedRelationshipSeats, 0);

const invalidAttach = calculateEstimate({
  quantities: {
    professional: 0,
    enterprise: 0,
    premium: 0,
    relationship: 0,
    enterpriseAttach: 4,
  },
  customMode: false,
  customPrices: {},
  discountPercent: 0,
  attachConfirmed: false,
});
assert.equal(invalidAttach.monthly, 0);
assert.equal(invalidAttach.invalidAttachSeats, 4);

const validAttach = calculateEstimate({
  quantities: {
    professional: 0,
    enterprise: 0,
    premium: 0,
    relationship: 0,
    enterpriseAttach: 4,
  },
  customMode: false,
  customPrices: {},
  discountPercent: 0,
  attachConfirmed: true,
});
assert.equal(validAttach.monthly, 80);
assert.equal(validAttach.credits, 0);

const relationshipOfficial = calculateEstimate({
  quantities: {
    professional: 0,
    enterprise: 0,
    premium: 0,
    relationship: 10,
    enterpriseAttach: 0,
  },
  customMode: false,
  customPrices: {},
  discountPercent: 0,
  attachConfirmed: false,
});
assert.equal(relationshipOfficial.monthly, 0);
assert.equal(relationshipOfficial.unpricedRelationshipSeats, 10);
assert.equal(SKU_DATA.relationship.minimum, 10);

console.log("All calculation tests passed.");
