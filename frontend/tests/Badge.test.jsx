import { render, screen } from "@testing-library/react";
import { Badge } from "../src/components/common/Badge.jsx";

describe("Badge", () => {
  test("renders its label", () => {
    render(<Badge tone="confirmed">Confirmed</Badge>);
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
  });

  test("falls back to the neutral tone for an unknown status", () => {
    render(<Badge tone="not-a-real-tone">Mystery</Badge>);
    const badge = screen.getByText("Mystery");
    expect(badge.className).toMatch(/bg-black\/5/);
  });
});
