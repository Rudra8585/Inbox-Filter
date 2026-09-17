import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { useTheme } from "../theme/ThemeContext";

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function senderName(sender) {
  const match = sender.match(/'([^']+)'/);
  return match ? match[1] : sender;
}

function openInGmail(id) {
  // Deep-links into the Gmail app if installed, otherwise opens Gmail web in browser
  const url = `https://mail.google.com/mail/u/0/#all/${id}`;
  Linking.openURL(url).catch(() => {});
}

export default function EmailCard({ email }) {
  const [expanded, setExpanded] = useState(false);
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.sender, { color: colors.textSecondary }]} numberOfLines={1}>
          {senderName(email.sender)}
        </Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>{formatDate(email.date)}</Text>
      </View>

      <Text style={[styles.subject, { color: colors.text }]} numberOfLines={expanded ? undefined : 2}>
        {email.subject}
      </Text>

      <Text
        style={[styles.summary, { color: colors.textSecondary }]}
        numberOfLines={expanded ? undefined : 3}
      >
        {email.summary || "(no summary available)"}
      </Text>

      {expanded && (
        <>
          <View style={[styles.fullBodyBox, { borderTopColor: colors.border }]}>
            <Text style={[styles.fullBodyLabel, { color: colors.textSecondary }]}>Full email:</Text>
            <Text style={[styles.fullBody, { color: colors.text }]}>
              {email.body || "(no body content)"}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.openButton, { borderColor: colors.accent }]}
            onPress={(e) => {
              e.stopPropagation?.();
              openInGmail(email.id);
            }}
          >
            <Text style={[styles.openButtonText, { color: colors.accent }]}>Open in Gmail ↗</Text>
          </TouchableOpacity>

          <View style={[styles.reasonsBox, { borderTopColor: colors.border }]}>
            <Text style={[styles.reasonsLabel, { color: colors.textSecondary }]}>
              Why this was flagged:
            </Text>
            {email.reasons.map((r, i) => (
              <Text key={i} style={[styles.reason, { color: colors.textSecondary }]}>
                • {r}
              </Text>
            ))}
          </View>
        </>
      )}

      <View style={styles.scoreRow}>
        <Text style={[styles.scoreBadge, { color: colors.accent, backgroundColor: colors.accentSoft }]}>
          score {email.score}
        </Text>
        <Text style={[styles.expandHint, { color: colors.textSecondary }]}>
          {expanded ? "tap to collapse" : "tap for details"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 14,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  sender: { fontSize: 12, fontWeight: "600", flexShrink: 1, marginRight: 8 },
  date: { fontSize: 12 },
  subject: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  summary: { fontSize: 13, lineHeight: 18 },
  fullBodyBox: { marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  fullBodyLabel: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
  fullBody: { fontSize: 13, lineHeight: 19 },
  openButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    marginTop: 12,
  },
  openButtonText: { fontWeight: "600", fontSize: 13 },
  reasonsBox: { marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  reasonsLabel: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
  reason: { fontSize: 12, marginBottom: 2 },
  scoreRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  scoreBadge: {
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  expandHint: { fontSize: 11 },
});
