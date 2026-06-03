/**
 * Foundry Core — I2C chain discovery, EEPROM identity read, signal runtime.
 * Mirrors packages/runtime behaviour for London Weather Dial Light MVP.
 */
#include <Arduino.h>
#include <Wire.h>
#include <ArduinoJson.h>

static const int I2C_SDA = 4;
static const int I2C_SCL = 5;
static const uint8_t EEPROM_ADDR = 0x50;
static const uint8_t DIAL_ADDR = 0x20;
static const uint8_t LIGHT_ADDR = 0x21;

struct ChainNode {
  uint8_t address;
  char id[32];
  char label[16];
  char category[16];
};

static ChainNode chain[8];
static size_t chainLen = 0;

static float weatherTemp = 14.0f;
static float weatherRain = 0.3f;
static float dialPosition = 0.65f;
static float lightBrightness = 0.15f;
static bool hasWeather = false;
static bool hasDial = false;
static bool hasLight = false;
static bool hasPlace = false;
static char placeLabel[16] = "";

static float weatherToBrightness(float temp, float rain) {
  float tempNorm = constrain((temp + 5.0f) / 35.0f, 0.0f, 1.0f);
  float clearBoost = 1.0f - rain * 0.6f;
  return constrain(tempNorm * 0.7f + clearBoost * 0.3f, 0.05f, 1.0f);
}

static bool readEepromDescriptor(uint8_t addr, ChainNode &node) {
  uint8_t lenLo = 0, lenHi = 0;
  Wire.beginTransmission(addr);
  Wire.write(0x00);
  if (Wire.endTransmission(false) != 0) return false;

  Wire.requestFrom(addr, (uint8_t)2);
  if (Wire.available() < 2) return false;
  lenLo = Wire.read();
  lenHi = Wire.read();
  uint16_t len = lenLo | (lenHi << 8);
  if (len == 0 || len > 512) return false;

  Wire.beginTransmission(addr);
  Wire.write(0x02);
  if (Wire.endTransmission(false) != 0) return false;

  Wire.requestFrom(addr, len);
  String json;
  while (Wire.available()) json += (char)Wire.read();

  JsonDocument doc;
  if (deserializeJson(doc, json)) return false;

  node.address = addr;
  strlcpy(node.id, doc["id"] | "unknown", sizeof(node.id));
  strlcpy(node.label, doc["label"] | "?", sizeof(node.label));
  strlcpy(node.category, doc["category"] | "?", sizeof(node.category));
  return true;
}

static void discoverChain() {
  chainLen = 0;
  hasWeather = false;
  hasDial = false;
  hasLight = false;
  hasPlace = false;
  placeLabel[0] = '\0';

  for (uint8_t addr = 0x50; addr <= 0x57; addr++) {
    ChainNode node{};
    if (readEepromDescriptor(addr, node) && chainLen < 8) {
      chain[chainLen++] = node;
      if (strcmp(node.id, "identity/weather") == 0) hasWeather = true;
      if (strcmp(node.id, "identity/london") == 0) {
        hasPlace = true;
        strlcpy(placeLabel, node.label, sizeof(placeLabel));
      }
    }
  }

  Wire.beginTransmission(DIAL_ADDR);
  if (Wire.endTransmission() == 0) hasDial = true;

  Wire.beginTransmission(LIGHT_ADDR);
  if (Wire.endTransmission() == 0) hasLight = true;

  Serial.println("[chain] discovered:");
  for (size_t i = 0; i < chainLen; i++) {
    Serial.printf("  %s (%s) @ 0x%02X\n", chain[i].label, chain[i].id, chain[i].address);
  }
  Serial.printf("[chain] weather=%d dial=%d light=%d place=%s\n",
                hasWeather, hasDial, hasLight, hasPlace ? placeLabel : "-");
}

static uint16_t readRegister16(uint8_t addr, uint8_t reg) {
  Wire.beginTransmission(addr);
  Wire.write(reg);
  if (Wire.endTransmission(false) != 0) return 0;
  Wire.requestFrom(addr, (uint8_t)2);
  if (Wire.available() < 2) return 0;
  uint8_t lo = Wire.read();
  uint8_t hi = Wire.read();
  return lo | (hi << 8);
}

static void writeRegister16(uint8_t addr, uint8_t reg, uint16_t value) {
  Wire.beginTransmission(addr);
  Wire.write(reg);
  Wire.write(value & 0xFF);
  Wire.write((value >> 8) & 0xFF);
  Wire.endTransmission();
}

static void pollDial() {
  if (!hasDial) return;
  uint16_t raw = readRegister16(DIAL_ADDR, 0x10);
  dialPosition = constrain(raw / 1000.0f, 0.0f, 1.0f);
}

static void updateRecipe() {
  if (!hasLight) return;

  float brightness = 0.08f;

  if (hasWeather) {
    float base = weatherToBrightness(weatherTemp, weatherRain);
    if (hasDial) {
      brightness = base * (0.15f + dialPosition * 0.85f);
    } else {
      brightness = base;
    }
  }

  lightBrightness = brightness;
  uint16_t pwm = (uint16_t)(brightness * 1000.0f);
  writeRegister16(LIGHT_ADDR, 0x10, pwm);

  Serial.printf("[signal] output/light/brightness=%.3f dial=%.3f temp=%.1f rain=%.2f\n",
                brightness, dialPosition, weatherTemp, weatherRain);
}

static void mockWeatherTick() {
  weatherTemp = 8.0f + sin(millis() / 20000.0f) * 8.0f;
  weatherRain = constrain(0.3f + sin(millis() / 15000.0f) * 0.4f, 0.0f, 1.0f);
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("Foundry Core starting");

  Wire.begin(I2C_SDA, I2C_SCL);
  Wire.setClock(400000);

  discoverChain();
}

void loop() {
  static unsigned long lastDiscover = 0;
  static unsigned long lastWeather = 0;
  static unsigned long lastPoll = 0;

  if (millis() - lastDiscover > 5000) {
    discoverChain();
    lastDiscover = millis();
  }

  if (millis() - lastWeather > 3000) {
    mockWeatherTick();
    lastWeather = millis();
  }

  if (millis() - lastPoll > 50) {
    pollDial();
    updateRecipe();
    lastPoll = millis();
  }
}
