// Pure calculation helpers — kept side-effect free so they're easy to unit test.

export const computeLineTotal = (quantity, unitPrice) => round2(quantity * unitPrice);

export const computeInvoiceTotals = (items, { taxRate = 0, discount = 0 } = {}) => {
  const itemsWithTotals = items.map((item) => ({
    ...item,
    total: computeLineTotal(item.quantity, item.unitPrice),
  }));

  const subtotal = round2(itemsWithTotals.reduce((sum, item) => sum + item.total, 0));
  const tax = round2(subtotal * taxRate);
  const totalAmount = round2(Math.max(0, subtotal + tax - discount));

  return { items: itemsWithTotals, subtotal, tax, discount: round2(discount), totalAmount };
};

export const computePaymentStatus = (totalAmount, paidAmount) => {
  if (paidAmount <= 0) return "unpaid";
  if (paidAmount >= totalAmount) return "paid";
  return "partial";
};

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
