#!/usr/bin/env bash
set -euo pipefail

export NEXT_PUBLIC_SIMULATOR_URL=/simulator
export VITE_BASE=/simulator/

turbo run build --filter=@foundry/marketing --filter=@foundry/simulator --force

export VITE_BASE=/tray-lab/
turbo run build --filter=@foundry/tray-lab --force

rm -rf dist
cp -R apps/marketing/out dist
mkdir -p dist/simulator dist/tray-lab
cp -R apps/simulator/dist/. dist/simulator/
cp -R apps/tray-lab/dist/. dist/tray-lab/
