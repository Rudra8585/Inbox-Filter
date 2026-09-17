import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getConfig, saveConfig } from "../storage/configStore";
import { useTheme } from "../theme/ThemeContext";

export default function ProfileScreen() {
  const { colors } = useTheme();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setConfig(await getConfig());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const updateProfile = (field, value) => {
    setConfig((prev) => ({ ...prev, profile: { ...prev.profile, [field]: value } }));
  };

  const updateCustomField = (index, key, value) => {
    setConfig((prev) => {
      const fields = [...(prev.profile.custom_fields || [])];
      fields[index] = { ...fields[index], [key]: value };
      return { ...prev, profile: { ...prev.profile, custom_fields: fields } };
    });
  };

  const addCustomField = () => {
    setConfig((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        custom_fields: [...(prev.profile.custom_fields || []), { label: "", value: "" }],
      },
    }));
  };

  const removeCustomField = (index) => {
    setConfig((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        custom_fields: (prev.profile.custom_fields || []).filter((_, i) => i !== index),
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveConfig(config);
      Alert.alert("Saved", "Your details have been updated.");
    } catch (e) {
      Alert.alert("Couldn't save", e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (error || !config) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.danger }]}>
          Couldn't load your details: {error}
        </Text>
      </View>
    );
  }

  const { profile } = config;
  const inputStyle = [
    styles.input,
    { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text },
  ];

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>Name</Text>
      <TextInput
        style={inputStyle}
        value={profile.name}
        onChangeText={(v) => updateProfile("name", v)}
        placeholder="Your name"
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Course or programme (e.g. MCA, MSc Physics)
      </Text>
      <TextInput
        style={inputStyle}
        value={profile.course}
        onChangeText={(v) => updateProfile("course", v)}
        placeholder="Your programme"
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Course spellings, comma separated — the variants your mail actually uses,
        so eligibility matching isn't thrown off by punctuation
      </Text>
      <TextInput
        style={inputStyle}
        value={(profile.course_aliases || []).join(", ")}
        onChangeText={(v) =>
          updateProfile("course_aliases", v.split(",").map((s) => s.trim()).filter(Boolean))
        }
        placeholder="MCA, M.C.A, Master of Computer Applications"
        placeholderTextColor={colors.textSecondary}
      />

      <View style={styles.switchRow}>
        <Text style={[styles.label, { color: colors.textSecondary, marginTop: 0, flex: 1 }]}>
          I live in campus accommodation
        </Text>
        <Switch
          value={!!profile.lives_on_campus}
          onValueChange={(v) => updateProfile("lives_on_campus", v)}
          trackColor={{ true: colors.accent }}
        />
      </View>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Used to hide notices meant only for the group you're not in.
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Your details</Text>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Reference numbers you get asked for often. Stored only on this device
        and never sent anywhere.
      </Text>

      {(profile.custom_fields || []).map((field, index) => (
        <View key={index} style={styles.fieldRow}>
          <TextInput
            style={[inputStyle, styles.fieldLabel]}
            value={field.label}
            onChangeText={(v) => updateCustomField(index, "label", v)}
            placeholder="Label"
            placeholderTextColor={colors.textSecondary}
          />
          <TextInput
            style={[inputStyle, styles.fieldValue]}
            value={field.value}
            onChangeText={(v) => updateCustomField(index, "value", v)}
            placeholder="Value"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.removeButton} onPress={() => removeCustomField(index)}>
            <Text style={[styles.removeButtonText, { color: colors.danger }]}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        style={[styles.addFieldButton, { borderColor: colors.accent }]}
        onPress={addCustomField}
      >
        <Text style={[styles.addFieldButtonText, { color: colors.accent }]}>+ Add a detail</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.accent }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 28, marginBottom: 6 },
  label: { fontSize: 13, fontWeight: "600", marginTop: 16, marginBottom: 6 },
  hint: { fontSize: 12, marginBottom: 10, lineHeight: 17 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 15 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20 },
  fieldRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  fieldLabel: { flex: 1, marginRight: 8 },
  fieldValue: { flex: 1.2, marginRight: 6 },
  removeButton: { padding: 8 },
  removeButtonText: { fontSize: 16, fontWeight: "700" },
  addFieldButton: { borderWidth: 1, borderRadius: 8, padding: 10, alignItems: "center", marginTop: 4 },
  addFieldButtonText: { fontWeight: "600", fontSize: 13 },
  saveButton: { borderRadius: 10, padding: 14, alignItems: "center", marginTop: 30 },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  errorText: { textAlign: "center" },
});
