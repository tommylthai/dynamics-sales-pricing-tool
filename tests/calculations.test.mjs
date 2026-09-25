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

const {
  calculateEstimate,
  calculateCapacity,
  formatStorage,
  normalizeQuantity,
  SKU_DATA,
} = context.module.exports;

const quantities = (overrides = {}) => ({
  professional: 0,
  enterprise: 0,
  premium: 0,
  relationship: 0,
  enterpriseAttach: 0,
  ...overrides,
});

const officialEstimate = (selected, overrides = {}) => calculateEstimate({
  quantities: selected,
  customMode: false,
  customPrices: {},
  discountPercent: 0,
  attachConfirmed: false,
  ...overrides,
});

assert.equal(normalizeQuantity(""), null);
assert.equal(normalizeQuantity("-1"), null);
assert.equal(normalizeQuantity("1.5"), null);
assert.equal(normalizeQuantity("1,000"), null);
assert.equal(normalizeQuantity("abc"), null);
assert.equal(normalizeQuantity("1000000"), 1000000);
assert.equal(normalizeQuantity("1000001"), null);
assert.equal(normalizeQuantity("12"), 12);

const zeroEstimate = officialEstimate(quantities());
assert.equal(zeroEstimate.monthly, 0);
assert.equal(zeroEstimate.annual, 0);
assert.equal(zeroEstimate.credits, 0);

for (const [key, unitPrice, credits] of [
  ["professional", 65, 0],
  ["enterprise", 105, 0],
  ["premium", 150, 1000],
  ["enterpriseAttach", 20, 0],
]) {
  for (const quantity of [1, 10, 100]) {
    const result = officialEstimate(
      quantities({ [key]: quantity }),
      { attachConfirmed: key === "enterpriseAttach" },
    );
    assert.equal(result.monthly, unitPrice * quantity, `${key} monthly at ${quantity}`);
    assert.equal(result.annual, unitPrice * quantity * 12, `${key} annual at ${quantity}`);
    assert.equal(result.credits, credits * quantity, `${key} credits at ${quantity}`);
  }
}

for (const [key, perUser, base] of [
  ["professional", { databaseMb: 0, fileMb: 0, logMb: 0 }, { databaseMb: 30000, fileMb: 40000, logMb: 2000 }],
  ["enterprise", { databaseMb: 250, fileMb: 2000, logMb: 0 }, { databaseMb: 30000, fileMb: 40000, logMb: 2000 }],
  ["premium", { databaseMb: 500, fileMb: 2000, logMb: 0 }, { databaseMb: 45000, fileMb: 60000, logMb: 2000 }],
  ["enterpriseAttach", { databaseMb: 0, fileMb: 0, logMb: 0 }, { databaseMb: 0, fileMb: 0, logMb: 0 }],
]) {
  for (const quantity of [1, 10, 100]) {
    const result = calculateCapacity({
      quantities: quantities({ [key]: quantity }),
      includeBase: true,
      baseSource: "auto",
    });
    assert.deepEqual(
      { ...result.license },
      {
        databaseMb: perUser.databaseMb * quantity,
        fileMb: perUser.fileMb * quantity,
        logMb: perUser.logMb * quantity,
      },
      `${key} capacity at ${quantity}`,
    );
    assert.deepEqual({ ...result.base }, base, `${key} base at ${quantity}`);
  }
}

for (const quantity of [10, 100]) {
  const result = calculateCapacity({
    quantities: quantities({ relationship: quantity }),
    includeBase: true,
    baseSource: "auto",
  });
  assert.deepEqual(
    { ...result.license },
    { databaseMb: 250 * quantity, fileMb: 2000 * quantity, logMb: 0 },
  );
  assert.deepEqual(
    { ...result.base },
    { databaseMb: 30000, fileMb: 40000, logMb: 2000 },
  );
}

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

const oneOfEachPriced = officialEstimate(
  quantities({
    professional: 1,
    enterprise: 1,
    premium: 1,
    enterpriseAttach: 1,
  }),
  { attachConfirmed: true },
);
assert.equal(oneOfEachPriced.monthly, 340);
assert.equal(oneOfEachPriced.annual, 4080);
assert.equal(oneOfEachPriced.credits, 1000);

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
assert.equal(custom.officialMonthly, 280);
assert.equal(custom.comparableMonthly, 234);
assert.equal(custom.savingsMonthly, 46);

const officialModeIgnoresHiddenQuoteValues = calculateEstimate({
  quantities: quantities({ professional: 2 }),
  customMode: false,
  customPrices: { professional: 1 },
  discountPercent: 99,
  attachConfirmed: false,
});
assert.equal(officialModeIgnoresHiddenQuoteValues.monthly, 130);
assert.equal(officialModeIgnoresHiddenQuoteValues.discount, 0);

const invalidCustomPrice = calculateEstimate({
  quantities: quantities({ professional: 2, premium: 1 }),
  customMode: true,
  customPrices: { professional: -5, premium: "" },
  discountPercent: 10,
  attachConfirmed: false,
});
assert.equal(invalidCustomPrice.monthly, 0);
assert.equal(invalidCustomPrice.officialMonthly, 280);
assert.equal(invalidCustomPrice.credits, 1000);
assert.deepEqual([...invalidCustomPrice.invalidCustomPriceKeys], ["professional", "premium"]);

const invalidDiscount = calculateEstimate({
  quantities: quantities({ enterprise: 2 }),
  customMode: true,
  customPrices: { enterprise: 100 },
  discountPercent: 150,
  attachConfirmed: false,
});
assert.equal(invalidDiscount.monthly, 200);
assert.equal(invalidDiscount.discount, 0);
assert.equal(invalidDiscount.invalidDiscount, true);

const fractionalDiscount = calculateEstimate({
  quantities: quantities({ enterprise: 2 }),
  customMode: true,
  customPrices: { enterprise: 100 },
  discountPercent: 12.5,
  attachConfirmed: false,
});
assert.equal(fractionalDiscount.monthly, 175);
assert.equal(fractionalDiscount.savingsMonthly, 35);

const customAboveOfficial = calculateEstimate({
  quantities: quantities({ professional: 10 }),
  customMode: true,
  customPrices: { professional: 70 },
  discountPercent: 0,
  attachConfirmed: false,
});
assert.equal(customAboveOfficial.monthly, 700);
assert.equal(customAboveOfficial.savingsMonthly, -50);

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

const invalidAttachCustom = calculateEstimate({
  quantities: quantities({ enterpriseAttach: 4 }),
  customMode: true,
  customPrices: { enterpriseAttach: 1 },
  discountPercent: 50,
  attachConfirmed: false,
});
assert.equal(invalidAttachCustom.monthly, 0);
assert.equal(invalidAttachCustom.officialMonthly, 0);
assert.equal(invalidAttachCustom.invalidAttachSeats, 4);

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

const relationshipBelowMinimum = calculateEstimate({
  quantities: quantities({ relationship: 9 }),
  customMode: true,
  customPrices: { relationship: 120 },
  discountPercent: 0,
  attachConfirmed: false,
});
assert.equal(relationshipBelowMinimum.monthly, 0);
assert.equal(relationshipBelowMinimum.invalidRelationshipSeats, 9);
assert.equal(relationshipBelowMinimum.rows[0].excluded, true);

const relationshipQuoted = calculateEstimate({
  quantities: quantities({ relationship: 10 }),
  customMode: true,
  customPrices: { relationship: 120 },
  discountPercent: 10,
  attachConfirmed: false,
});
assert.equal(relationshipQuoted.monthly, 1080);
assert.equal(relationshipQuoted.officialMonthly, 0);
assert.equal(relationshipQuoted.savingsMonthly, 0);

const zeroCapacity = calculateCapacity({
  quantities: {
    professional: 0,
    enterprise: 0,
    premium: 0,
    relationship: 0,
    enterpriseAttach: 0,
  },
  includeBase: true,
  baseSource: "auto",
});
assert.deepEqual(
  { ...zeroCapacity.combined },
  { databaseMb: 0, fileMb: 0, logMb: 0 },
);

const professionalBaseOnly = calculateCapacity({
  quantities: {
    professional: 1,
    enterprise: 0,
    premium: 0,
    relationship: 0,
    enterpriseAttach: 0,
  },
  includeBase: true,
  baseSource: "auto",
});
assert.equal(professionalBaseOnly.baseSource, "professional");
assert.deepEqual(
  { ...professionalBaseOnly.base },
  { databaseMb: 30000, fileMb: 40000, logMb: 2000 },
);
assert.deepEqual(
  { ...professionalBaseOnly.license },
  { databaseMb: 0, fileMb: 0, logMb: 0 },
);

const singleEnterpriseCapacity = calculateCapacity({
  quantities: {
    professional: 0,
    enterprise: 4,
    premium: 0,
    relationship: 0,
    enterpriseAttach: 0,
  },
  includeBase: true,
  baseSource: "enterprise",
});
assert.deepEqual(
  { ...singleEnterpriseCapacity.license },
  { databaseMb: 1000, fileMb: 8000, logMb: 0 },
);
assert.deepEqual(
  { ...singleEnterpriseCapacity.combined },
  { databaseMb: 31000, fileMb: 48000, logMb: 2000 },
);

const mixedCapacity = calculateCapacity({
  quantities: {
    professional: 5,
    enterprise: 3,
    premium: 2,
    relationship: 10,
    enterpriseAttach: 4,
  },
  includeBase: true,
  baseSource: "auto",
});
assert.equal(mixedCapacity.baseSource, "premium");
assert.deepEqual(
  { ...mixedCapacity.base },
  { databaseMb: 45000, fileMb: 60000, logMb: 2000 },
);
assert.deepEqual(
  { ...mixedCapacity.license },
  { databaseMb: 4250, fileMb: 30000, logMb: 0 },
);
assert.deepEqual(
  { ...mixedCapacity.combined },
  { databaseMb: 49250, fileMb: 90000, logMb: 2000 },
);
assert.equal(mixedCapacity.rows.find((row) => row.key === "enterpriseAttach").databaseMb, 0);

const baseExcluded = calculateCapacity({
  quantities: {
    professional: 0,
    enterprise: 4,
    premium: 0,
    relationship: 0,
    enterpriseAttach: 0,
  },
  includeBase: false,
  baseSource: "enterprise",
});
assert.deepEqual(
  { ...baseExcluded.base },
  { databaseMb: 0, fileMb: 0, logMb: 0 },
);
assert.deepEqual(
  { ...baseExcluded.combined },
  { databaseMb: 1000, fileMb: 8000, logMb: 0 },
);

for (const [baseSource, expected] of [
  ["professional", { databaseMb: 30000, fileMb: 40000, logMb: 2000 }],
  ["enterprise", { databaseMb: 30000, fileMb: 40000, logMb: 2000 }],
  ["premium", { databaseMb: 45000, fileMb: 60000, logMb: 2000 }],
]) {
  const result = calculateCapacity({
    quantities: quantities({ professional: 1, enterprise: 1, premium: 1 }),
    includeBase: true,
    baseSource,
  });
  assert.deepEqual({ ...result.base }, expected);
}

const invalidRelationshipCapacity = calculateCapacity({
  quantities: quantities({ relationship: 9 }),
  includeBase: true,
  baseSource: "auto",
});
assert.deepEqual(
  { ...invalidRelationshipCapacity.combined },
  { databaseMb: 0, fileMb: 0, logMb: 0 },
);
assert.equal(invalidRelationshipCapacity.invalidRelationshipSeats, 9);

assert.equal(formatStorage(0), "0 GB");
assert.equal(formatStorage(250), "250 MB");
assert.equal(formatStorage(750), "750 MB");
assert.equal(formatStorage(1000), "1 GB");
assert.equal(formatStorage(1250), "1.25 GB");
assert.equal(formatStorage(1000000), "1 TB");
assert.equal(formatStorage(1000250), "1.0003 TB");

const maximumQuantityEstimate = officialEstimate(quantities({ premium: 1000000 }));
assert.equal(maximumQuantityEstimate.monthly, 150000000);
assert.equal(maximumQuantityEstimate.annual, 1800000000);
assert.equal(maximumQuantityEstimate.credits, 1000000000);

const maximumQuantityCapacity = calculateCapacity({
  quantities: quantities({ premium: 1000000 }),
  includeBase: true,
  baseSource: "auto",
});
assert.deepEqual(
  { ...maximumQuantityCapacity.combined },
  { databaseMb: 500045000, fileMb: 2000060000, logMb: 2000 },
);
assert.equal(formatStorage(maximumQuantityCapacity.combined.databaseMb), "500.045 TB");
assert.equal(formatStorage(maximumQuantityCapacity.combined.fileMb), "2,000.06 TB");

console.log("All calculation tests passed.");
