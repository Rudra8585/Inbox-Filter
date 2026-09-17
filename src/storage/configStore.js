import AsyncStorage from "@react-native-async-storage/async-storage";
import defaultConfig from "../logic/defaultConfig";

const CONFIG_KEY = "inbox_filter_config";
const LEGACY_CONFIG_KEY = "gmail_scanner_config";

/**
 * Fills in anything a stored config is missing from the defaults, one
 * level deep. Without this, adding a new setting in an app update would
 * leave existing installs with an undefined value for it.
 */
function withDefaults(stored) {
  const merged = { ...defaultConfig, ...stored };
  for (const key of Object.keys(defaultConfig)) {
    if (
      defaultConfig[key] &&
      typeof defaultConfig[key] === "object" &&
      !Array.isArray(defaultConfig[key])
    ) {
      merged[key] = { ...defaultConfig[key], ...(stored[key] || {}) };
    }
  }
  return merged;
}

/**
 * Carries over values saved under field names used by earlier versions,
 * so upgrading doesn't silently reset someone's profile.
 */
function migrate(config) {
  const profile = { ...(config.profile || {}) };

  if (profile.lives_in_hostel !== undefined && profile.lives_on_campus === undefined) {
    profile.lives_on_campus = profile.lives_in_hostel;
  }
  delete profile.lives_in_hostel;

  // Older builds had a fixed set of identifier fields. Any leftover
  // string field that isn't part of the current schema is carried over
  // into the freely editable list rather than being dropped.
  const KNOWN_FIELDS = new Set([
    "name",
    "course",
    "course_aliases",
    "lives_on_campus",
    "custom_fields",
  ]);

  const carriedOver = [];
  for (const [key, value] of Object.entries(profile)) {
    if (KNOWN_FIELDS.has(key)) continue;
    if (typeof value === "string" && value.trim()) {
      const label = key
        .replace(/_/g, " ")
        .replace(/^./, (c) => c.toUpperCase());
      carriedOver.push({ label, value });
    }
    delete profile[key];
  }

  if (carriedOver.length > 0) {
    const existing = (profile.custom_fields || []).filter((f) => f.label || f.value);
    profile.custom_fields = [...existing, ...carriedOver];
  }

  return { ...config, profile };
}

export async function getConfig() {
  let raw = await AsyncStorage.getItem(CONFIG_KEY);

  // Pick up data saved by an earlier version under its old key.
  if (!raw) {
    const legacy = await AsyncStorage.getItem(LEGACY_CONFIG_KEY);
    if (legacy) {
      raw = legacy;
      await AsyncStorage.setItem(CONFIG_KEY, legacy);
      await AsyncStorage.removeItem(LEGACY_CONFIG_KEY);
    }
  }

  if (!raw) {
    await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(defaultConfig));
    return defaultConfig;
  }

  // migrate first: it needs to see which keys were genuinely absent,
  // before withDefaults fills them in.
  return withDefaults(migrate(JSON.parse(raw)));
}

export async function saveConfig(config) {
  await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  return config;
}

export async function resetConfig() {
  await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(defaultConfig));
  return defaultConfig;
}
