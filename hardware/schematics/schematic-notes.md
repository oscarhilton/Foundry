# Core Cube — Schematic Notes

## Block diagram

```
USB-C (5V)
    │
    ▼
[3.3V LDO] ──► XIAO ESP32-S3
                    │
                    ├── GPIO/I2C ──► Pogo East (SDA,SCL,VCC,GND)
                    ├── GPIO/I2C ──► Pogo West (pass-through)
                    └── GPIO ──► Status WS2812
```

## Pogo pin assignment (Core East/West)

| Pin # | Signal | ESP32 connection |
|-------|--------|------------------|
| 1 | VCC | 3.3V (via polyfuse 300mA) |
| 2 | GND | GND |
| 3 | SDA | GPIO4 (default I2C SDA) |
| 4 | SCL | GPIO5 (default I2C SCL) |
| 5 | ID | GPIO6 (input, optional) |
| 6 | IRQ | GPIO7 (input, optional) |

## Passive cube — EEPROM only

```
VCC ──┬── AT24C256 VCC
GND ──┼── AT24C256 GND
SDA ──┼── AT24C256 SDA ── pass-through
SCL ──┼── AT24C256 SCL ── pass-through
      └── (A0,A1,A2 strapped for 0x50)
```

Descriptor stored at EEPROM offset 0x0000, length prefixed with uint16 LE.

## Dial cube — register map

| Offset | Name | Type | Description |
|--------|------|------|-------------|
| 0x00 | WHOAMI | uint8 | Device type 0x02 = Dial |
| 0x01 | STATUS | uint8 | Bit0 = changed |
| 0x10 | POSITION | uint16 | 0–1000 → 0.0–1.0 |

ADC reads 10k pot on ATtiny841 PA7, smoothed EMA, written to POSITION at 20Hz.

## Light cube — register map

| Offset | Name | Type | Description |
|--------|------|------|-------------|
| 0x00 | WHOAMI | uint8 | Device type 0x03 = Light |
| 0x01 | STATUS | uint8 | Bit0 = active |
| 0x10 | BRIGHTNESS | uint16 | 0–1000 target brightness |

PWM on ATtiny841 PB0 drives N-channel MOSFET + warm white LED.

## PCB outline

- 46 × 46 mm, 1.6 mm FR4, 2-layer for passive; 4-layer optional for Core
- Pogo pads: 2 mm diameter, 18 mm vertical pitch, 3 positions per side (VCC/GND/data group)

## BOM estimate (prototype qty 10)

| Item | Qty | ~Cost |
|------|-----|-------|
| XIAO ESP32-S3 | 1 | $8 |
| AT24C256 module | 3 | $1.50 ea |
| ATtiny841 + passives | 2 | $2 ea |
| Pogo pins (pair) | 5 sets | $3/set |
| 10k pot | 1 | $0.50 |
| High-power LED | 1 | $0.30 |

## KiCad project

Create `hardware/schematics/foundry-core/` with:
- `foundry-core.kicad_pro`
- Symbol for XIAO ESP32-S3 (from Seeed library)
- Net labels matching pogo pinout above

For MVP prototype, breadboard-first is acceptable; this document is the schematic source of truth until KiCad files land.
