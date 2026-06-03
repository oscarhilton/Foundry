/**
 * ATtiny841 Dial cube — I2C slave exposing pot position.
 * Register 0x10: uint16 0–1000
 *
 * Build with avr-gcc / Arduino core for ATtiny (e.g. SpenceKonde ATTinyCore).
 * Wire to pot: PA7 (ADC7), I2C: SDA/SCL per board pinout.
 */
#include <Wire.h>

static const uint8_t I2C_ADDR = 0x20;
static const uint8_t REG_POSITION = 0x10;

static uint16_t position = 500;
static uint8_t regPointer = 0;

static uint16_t readPot() {
  analogRead(0); // dummy
  return (uint16_t)analogRead(0); // 0–1023
}

void onRequest() {
  if (regPointer == REG_POSITION) {
    Wire.write(position & 0xFF);
    Wire.write((position >> 8) & 0xFF);
  } else {
    Wire.write(0x02); // WHOAMI = Dial
  }
}

void onReceive(int len) {
  if (len < 1) return;
  regPointer = Wire.read();
}

void setup() {
  pinMode(A7, INPUT);
  Wire.begin(I2C_ADDR);
  Wire.onRequest(onRequest);
  Wire.onReceive(onReceive);
}

void loop() {
  uint16_t raw = readPot();
  position = map(raw, 0, 1023, 0, 1000);
  delay(20);
}
