import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_PREF_KEY = "theme_preference"; // 'system' | 'light' | 'dark'

export const lightColors = {
  background: "#f7f7f8",
  card: "#ffffff",
  text: "#111111",
  textSecondary: "#666666",
  border: "#dddddd",
  inputBg: "#fafafa",
  accent: "#2a7a4f",
  accentSoft: "#e6f4ec",
  danger: "#aa3333",
};

export const darkColors = {
  background: "#121212",
  card: "#1e1e1e",
  text: "#f0f0f0",
  textSecondary: "#a0a0a0",
  border: "#333333",
  inputBg: "#2a2a2a",
  accent: "#4cbf85",
  accentSoft: "#1d3327",
  danger: "#e57373",
};

const ThemeContext = createContext({
  scheme: "light",
  colors: lightColors,
  preference: "system",
  setPreference: () => {},
});

export function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState("system");
  const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme() || "light");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(THEME_PREF_KEY);
      if (stored) setPreferenceState(stored);
      setLoaded(true);
    })();

    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme || "light");
    });
    return () => sub.remove();
  }, []);

  const setPreference = useCallback(async (pref) => {
    setPreferenceState(pref);
    await AsyncStorage.setItem(THEME_PREF_KEY, pref);
  }, []);

  const scheme = preference === "system" ? systemScheme : preference;
  const colors = scheme === "dark" ? darkColors : lightColors;

  // avoid a flash of the wrong theme before AsyncStorage loads
  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ scheme, colors, preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
