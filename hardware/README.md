# Hardware Architecture

## System overview

Foundry hardware consists of 50mm cubic modules daisy-chained via pogo pins on East/West faces. One **Core** module contains an ESP32-S3 (Seeed XIAO ESP32-S3), USB-C power, and the runtime firmware. Passive **identity** modules contain only an AT24C256 EEPROM. Active modules (Dial, Light) contain a minimal I2C slave MCU.

```
[USB-C] → [Core ESP32-S3] ←I2C→ [Passive|EEPROM] ←I2C→ [Dial|MCU] ←I2C→ [Light|MCU]
```

## Electrical specifications

| Parameter | Value |
|-----------|-------|
| Bus voltage | 3.3V |
| I2C speed | 400 kHz max |
| Chain current budget | 300 mA @ 3.3V from Core |
| Pogo pins | 6 per face (VCC, GND, SDA, SCL, ID, IRQ) |
| EEPROM address | 0x50 (passive cubes) |
| Active register address | 0x20–0x27 (strap selectable) |

## Module summaries

### Core cube

| Component | Part | Notes |
|-----------|------|-------|
| MCU | Seeed XIAO ESP32-S3 | WiFi, USB-C native |
| Regulator | AMS1117-3.3 or onboard | If 5V from USB |
| Pogo connectors | Harwin M50-3500345 or spring pins | East + West |
| Magnets | 4× Ø6×3mm N52 | Corner pockets |
| Status LED | WS2812 or GPIO LED | Boot / WiFi status |

**PCB size:** 46×46mm (fits inside 50mm shell with 2mm wall)

### Passive identity cube

| Component | Part | Notes |
|-----------|------|-------|
| EEPROM | AT24C256 | 32KB, I2C 0x50 |
| Pass-through | SDA/SCL/VCC/GND bus | No buffer needed for ≤8 cubes |
| Address strap | 3-bit solder jumpers | Unique ID nibble in descriptor |

**BOM target:** $2–4 @ 1k units

### Dial cube (active)

| Component | Part | Notes |
|-----------|------|-------|
| MCU | ATtiny841 or XIAO ESP32-C3 | I2C slave |
| Input | 10k potentiometer | Panel-mount on top face |
| Reg map | 0x10 = position uint16 | Scale 0.001 → 0–1 |

### Light cube (active)

| Component | Part | Notes |
|-----------|------|-------|
| MCU | ATtiny841 or XIAO ESP32-C3 | I2C slave |
| Output | Warm white LED + PWM MOSFET | ~150mA peak |
| Diffuser | 3D printed dome insert | Bauhaus glow |

## Mechanical — 50mm cube shell

See [`hardware/enclosure/shell-spec.md`](enclosure/shell-spec.md) for print dimensions.

- External: 50×50×50mm
- Wall thickness: 2mm
- Pogo aperture: 4mm diameter × 6 positions per side face
- Magnet pocket: 6.2mm diameter × 3.2mm deep, 4 corners
- Label inset: 40×12mm on North face

## Firmware layout

```
hardware/firmware/
├── core/           # PlatformIO — ESP32-S3 runtime
├── dial/           # ATtiny841 I2C slave (future)
└── shared/         # Descriptor format, register map headers
```

Core firmware ports the TypeScript runtime logic from `packages/runtime` as manual C bindings for MVP.

## Prototype build order

1. Breadboard: ESP32 + EEPROM module + pot + LED
2. Pogo test jig (2 fixtures)
3. Core PCB + 1 passive + Dial + Light
4. 3D print shells, fit test — see [mockup-sprint.md](mockup-sprint.md)
5. **M6 E2E:** [London → Weather → Light](m6-e2e-london-weather-light.md) (no Dial required)
6. **M6.1:** Tokyo → Time → Display

## Power notes

- Core powered via USB-C (5V)
- Do not back-power host from chain
- Light cube is highest draw; limit to one Light per chain on MVP rail
