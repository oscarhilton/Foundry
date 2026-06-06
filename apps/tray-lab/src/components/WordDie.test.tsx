import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { getTrayWordCube } from "@foundry/cube-defs";
import { WordDieView } from "./WordDie";
import { DiePool } from "./DiePool";
import { STARTER_CUBES } from "@foundry/cube-defs";

describe("WordDieView", () => {
  const weather = getTrayWordCube("weather")!;
  const home = getTrayWordCube("home")!;

  afterEach(() => {
    cleanup();
  });

  it("renders only the primary label at default orientation", () => {
    render(<WordDieView die={weather} activeModeId="full" />);
    expect(screen.getByText("WEATHER")).toBeInTheDocument();
    expect(screen.queryByText("weather")).not.toBeInTheDocument();
  });

  it("renders active face large and die word tiny when rotated", () => {
    render(<WordDieView die={weather} activeModeId="rain" />);
    expect(screen.getByText("RAIN")).toBeInTheDocument();
    expect(screen.getByText("weather")).toBeInTheDocument();
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
