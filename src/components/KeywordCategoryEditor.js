import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";

export default function KeywordCategoryEditor({
  category,
  keywords,
  weight,
  isLowPriority,
  onChangeKeywords,
  onChangeWeight,
  onToggleLowPriority,
}) {
  const { colors } = useTheme();
  const [newKeyword, setNewKeyword] = useState("");

  const addKeyword = () => {
    const trimmed = newKeyword.trim().toLowerCase();
    if (!trimmed || keywords.includes(trimmed)) {
      setNewKeyword("");
      return;
    }
    onChangeKeywords([...keywords, trimmed]);
    setNewKeyword("");
  };

  const removeKeyword = (kw) => {
    onChangeKeywords(keywords.filter((k) => k !== kw));
  };

  return (
    <View style={[styles.container, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.categoryName, { color: colors.text }]}>
          {category.replace(/_/g, " ")}
        </Text>
        <View style={styles.weightRow}>
          <Text style={[styles.weightLabel, { color: colors.textSecondary }]}>weight</Text>
          <TextInput
            style={[
              styles.weightInput,
              { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg },
            ]}
            value={String(weight)}
            onChangeText={(v) => onChangeWeight(parseInt(v, 10) || 0)}
            keyboardType="numeric"
          />
        </View>
      </View>

      <TouchableOpacity style={styles.lowPriorityRow} onPress={() => onToggleLowPriority(!isLowPriority)}>
        <View
          style={[
            styles.checkbox,
            { borderColor: colors.border },
            isLowPriority && { backgroundColor: colors.accent, borderColor: colors.accent },
          ]}
        >
          {isLowPriority && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={[styles.lowPriorityLabel, { color: colors.textSecondary }]}>
          Low priority (needs another signal to count as important)
        </Text>
      </TouchableOpacity>

      <View style={styles.chipsWrap}>
        {keywords.map((kw) => (
          <TouchableOpacity
            key={kw}
            style={[styles.chip, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
            onPress={() => removeKeyword(kw)}
          >
            <Text style={[styles.chipText, { color: colors.text }]}>{kw} ✕</Text>
          </TouchableOpacity>
        ))}
        {keywords.length === 0 && (
          <Text style={[styles.noKeywords, { color: colors.textSecondary }]}>No keywords yet</Text>
        )}
      </View>

      <View style={styles.addRow}>
        <TextInput
          style={[
            styles.addInput,
            { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBg },
          ]}
          value={newKeyword}
          onChangeText={setNewKeyword}
          placeholder="add keyword..."
          placeholderTextColor={colors.textSecondary}
          onSubmitEditing={addKeyword}
          autoCapitalize="none"
        />
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.accent }]} onPress={addKeyword}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  categoryName: { fontSize: 14, fontWeight: "700", textTransform: "capitalize" },
  weightRow: { flexDirection: "row", alignItems: "center" },
  weightLabel: { fontSize: 11, marginRight: 6 },
  weightInput: { width: 44, borderWidth: 1, borderRadius: 6, padding: 6, textAlign: "center" },
  lowPriorityRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderRadius: 4,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: { color: "#fff", fontSize: 12, fontWeight: "700" },
  lowPriorityLabel: { fontSize: 11, flex: 1 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  chipText: { fontSize: 12 },
  noKeywords: { fontSize: 12, fontStyle: "italic" },
  addRow: { flexDirection: "row" },
  addInput: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 8, fontSize: 13, marginRight: 8 },
  addButton: { borderRadius: 8, paddingHorizontal: 16, justifyContent: "center" },
  addButtonText: { color: "#fff", fontWeight: "600" },
});
