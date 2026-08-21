import {
  computeLineTotal,
  computeInvoiceTotals,
  computePaymentStatus,
} from "../../src/services/billing.service.js";

describe("computeLineTotal", () => {
  test("multiplies quantity by unit price", () => {
    expect(computeLineTotal(3, 25.5)).toBe(76.5);
  });
});

describe("computeInvoiceTotals", () => {
  test("sums line items with no tax or discount", () => {
    const items = [
      { description: "Consultation", quantity: 1, unitPrice: 500 },
      { description: "Blood test", quantity: 2, unitPrice: 150 },
    ];
    const result = computeInvoiceTotals(items);

    expect(result.items[0].total).toBe(500);
    expect(result.items[1].total).toBe(300);
    expect(result.subtotal).toBe(800);
    expect(result.tax).toBe(0);
    expect(result.totalAmount).toBe(800);
  });

  test("applies tax rate on top of subtotal", () => {
    const items = [{ description: "Room charge", quantity: 1, unitPrice: 1000 }];
    const result = computeInvoiceTotals(items, { taxRate: 0.1 });

    expect(result.subtotal).toBe(1000);
    expect(result.tax).toBe(100);
    expect(result.totalAmount).toBe(1100);
  });

  test("subtracts a flat discount from the taxed total", () => {
    const items = [{ description: "Procedure", quantity: 1, unitPrice: 2000 }];
    const result = computeInvoiceTotals(items, { taxRate: 0.05, discount: 200 });

    expect(result.subtotal).toBe(2000);
    expect(result.tax).toBe(100);
    expect(result.totalAmount).toBe(1900);
  });

  test("never returns a negative total even if discount exceeds the taxed amount", () => {
    const items = [{ description: "Sample", quantity: 1, unitPrice: 50 }];
    const result = computeInvoiceTotals(items, { discount: 1000 });

    expect(result.totalAmount).toBe(0);
  });

  test("rounds to two decimal places", () => {
    const items = [{ description: "Item", quantity: 3, unitPrice: 10.005 }];
    const result = computeInvoiceTotals(items, { taxRate: 0.075 });

    // toBeCloseTo(x, 2) tolerates float noise past the 2nd decimal — the thing
    // that actually matters here is that we rounded, not raw binary equality.
    expect(result.subtotal).toBeCloseTo(30.02, 2);
    expect(result.tax).toBeCloseTo(2.25, 2);
    expect(result.totalAmount).toBeCloseTo(32.27, 2);
  });
});

describe("computePaymentStatus", () => {
  test("returns unpaid when nothing has been paid", () => {
    expect(computePaymentStatus(500, 0)).toBe("unpaid");
  });

  test("returns partial when paid amount is less than total", () => {
    expect(computePaymentStatus(500, 250)).toBe("partial");
  });

  test("returns paid when paid amount meets or exceeds total", () => {
    expect(computePaymentStatus(500, 500)).toBe("paid");
    expect(computePaymentStatus(500, 600)).toBe("paid");
  });
});
