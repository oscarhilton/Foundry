import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { getTrayWordCube } from "@foundry/cube-defs";
import { WordDieView } from "./WordDie";
import { DiePool } from "./DiePool";
import { STARTER_CUBES } from "@foundry/cube-defs";

describe("WordDieView", () => {
  const phenomenon = getTrayWordCube("phenomenon")!;
  const home = getTrayWordCube("home")!;

  afterEach(() => {
    cleanup();
  });

  it("renders only the primary label at default orientation", () => {
    render(<WordDieView die={phenomenon} activeModeId="wind" />);
    expect(screen.getByText("WIND")).toBeInTheDocument();
    expect(screen.queryByText("wind")).not.toBeInTheDocument();
  });

  it("rotated phenomenon shows RAIN large when rain mode active", () => {
    render(<WordDieView die={phenomenon} activeModeId="rain" />);
    expect(screen.getByText("RAIN")).toBeInTheDocument();
    expect(screen.getByText("wind")).toBeInTheDocument();
  });

  it("shows OUTSIDE large when home die is rotated to outside", () => {
    render(<WordDieView die={home} activeModeId="outside" />);
    expect(screen.getByText("OUTSIDE")).toBeInTheDocument();
    expect(screen.getByText("home")).toBeInTheDocument();
  });
});

describe("DiePool", () => {
  it("shows TIMER in the pool rather than a bare duration value", () => {
    render(<DiePool dice={STARTER_CUBES} silent />);
    expect(screen.getByText("TIMER")).toBeInTheDocument();
    expect(screen.queryByText(/^5$/)).not.toBeInTheDocument();
  });
});
