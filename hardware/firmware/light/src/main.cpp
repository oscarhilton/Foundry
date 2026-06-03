/**
 * ATtiny841 Light cube — I2C slave, PWM output from brightness register.
 * Register 0x10: uint16 0–1000 → PWM duty
 */
#include <Wire.h>

static const uint8_t I2C_ADDR = 0x21;
static const uint8_t REG_BRIGHTNESS = 0x10;
static const uint8_t PWM_PIN = 0; // PB0

static uint16_t brightness = 150;
static uint8_t regPointer = 0;

void onRequest() {
  if (regPointer == REG_BRIGHTNESS) {
    Wire.write(brightness & 0xFF);
    Wire.write((brightness >> 8) & 0xFF);
  } else {
    Wire.write(0x03); // WHOAMI = Light
  }
}

void onReceive(int len) {
  if (len < 1) return;
  regPointer = Wire.read();
  if (len >= 3 && regPointer == REG_BRIGHTNESS) {
    uint8_t lo = Wire.read();
    uint8_t hi = Wire.read();
    brightness = lo | (hi << 8);
    analogWrite(PWM_PIN, map(brightness, 0, 1000, 0, 255));
  }
}

void setup() {
  pinMode(PWM_PIN, OUTPUT);
  Wire.begin(I2C_ADDR);
  Wire.onRequest(onRequest);
  Wire.onReceive(onReceive);
  analogWrite(PWM_PIN, map(brightness, 0, 1000, 0, 255));
}

void loop() {
  delay(50);
}
