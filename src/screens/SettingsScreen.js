import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getConfig, saveConfig, resetConfig } from "../storage/configStore";
import { isSignedIn, signOut } from "../auth/googleAuth";
import { useTheme } from "../theme/ThemeContext";
import KeywordCategoryEditor from "../components/KeywordCategoryEditor";

const THEME_OPTIONS = [
  { key: "system", label: "System" },
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
];

export default function SettingsScreen() {
  const { colors, preference, setPreference } = useTheme();
  const [config, setConfig] = useState(null);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const c = await getConfig();
    setConfig(c);
    setSignedIn(await isSignedIn());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const updateRule = (field, value) => {
    setConfig((prev) => ({ ...prev, rules: { ...prev.rules, [field]: value } }));
  };

  const updateCategoryKeywords = (category, keywords) => {
    setConfig((prev) => ({
      ...prev,
      rules: {
        ...prev.rules,
        category_keywords: { ...prev.rules.category_keywords, [category]: keywords },
      },
    }));
  };

  const updateCategoryWeight = (category, weight) => {
    setConfig((prev) => ({
      ...prev,
      rules: {
        ...prev.rules,
        category_weights: { ...prev.rules.category_weights, [category]: weight },
      },
    }));
  };

  const toggleLowPriority = (category, isLow) => {
    setConfig((prev) => {
      const current = new Set(prev.rules.low_priority_categories || []);
      if (isLow) current.add(category);
      else current.delete(category);
      return {
        ...prev,
        rules: { ...prev.rules, low_priority_categories: Array.from(current) },
      };
    });
  };

  const handleSaveRules = async () => {
    setSaving(true);
    try {
      await saveConfig(config);
      Alert.alert("Saved", "Rule settings updated.");
    } catch (e) {
      Alert.alert("Couldn't save", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setSignedIn(false);
    Alert.alert("Signed out", "You've been signed out of Google.");
  };

  const handleReset = () => {
    Alert.alert(
      "Reset all settings?",
      "This resets your profile and rules back to defaults. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            const fresh = await resetConfig();
            setConfig(fresh);
            Alert.alert("Reset", "Settings restored to defaults.");
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
      <View style={styles.themeRow}>
        {THEME_OPTIONS.map((opt) => {
          const active = preference === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.themeOption,
                { borderColor: colors.border },
                active && { backgroundColor: colors.accent, borderColor: colors.accent },
              ]}
              onPress={() => setPreference(opt.key)}
            >
              <Text style={[styles.themeOptionText, { color: active ? "#fff" : colors.text }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
      {signedIn ? (
        <TouchableOpacity style={[styles.dangerButton, { borderColor: colors.danger }]} onPress={handleSignOut}>
          <Text style={[styles.dangerButtonText, { color: colors.danger }]}>Sign out of Google</Text>
        </TouchableOpacity>
      ) : (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Not signed in — go to the Inbox tab to sign in.
        </Text>
      )}

      {config && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Filtering Sensitivity</Text>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Minimum score to be marked important (lower = more emails shown, higher = stricter)
          </Text>
          <TextInput
            style={[
              styles.input,
              { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text },
            ]}
            value={String(config.rules.min_match_score)}
            onChangeText={(v) => updateRule("min_match_score", parseInt(v, 10) || 0)}
            keyboardType="numeric"
          />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Email Footer</Text>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Bulk mail usually ends with the same signature block every time —
            rankings, accreditations, legal disclaimers. Anything from the first
            phrase below onwards is ignored when scoring and summarising, so
            footer words don't match on every message. One phrase per line.
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.multiline,
              { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text },
            ]}
            value={(config.cleaning?.footer_markers || []).join("\n")}
            onChangeText={(v) =>
              setConfig((prev) => ({
                ...prev,
                cleaning: {
                  ...prev.cleaning,
                  footer_markers: v.split("\n").map((s) => s.trim()).filter(Boolean),
                },
              }))
            }
            multiline
            autoCapitalize="none"
            placeholder={"disclaimer:\nconfidentiality notice"}
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Category Keywords</Text>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Tap a keyword to remove it. Add new ones per category, and adjust how much each
            category counts toward the importance score.
          </Text>
          {Object.entries(config.rules.category_keywords).map(([category, keywords]) => (
            <KeywordCategoryEditor
              key={category}
              category={category}
              keywords={keywords}
              weight={config.rules.category_weights[category] ?? 1}
              isLowPriority={(config.rules.low_priority_categories || []).includes(category)}
              onChangeKeywords={(kws) => updateCategoryKeywords(category, kws)}
              onChangeWeight={(w) => updateCategoryWeight(category, w)}
              onToggleLowPriority={(isLow) => toggleLowPriority(category, isLow)}
            />
          ))}

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.accent }]}
            onPress={handleSaveRules}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save Rule Settings"}</Text>
          </TouchableOpacity>
        </>
      )}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Advanced</Text>
      <TouchableOpacity style={[styles.dangerButton, { borderColor: colors.danger }]} onPress={handleReset}>
        <Text style={[styles.dangerButtonText, { color: colors.danger }]}>Reset to Defaults</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 24, marginBottom: 8 },
  label: { fontSize: 13, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 15 },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  themeRow: { flexDirection: "row" },
  themeOption: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  themeOptionText: { fontWeight: "600", fontSize: 13 },
  saveButton: { borderRadius: 10, padding: 14, alignItems: "center", marginTop: 8 },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  dangerButton: { borderWidth: 1, borderRadius: 10, padding: 12, alignItems: "center", marginTop: 8 },
  dangerButtonText: { fontWeight: "600" },
});
