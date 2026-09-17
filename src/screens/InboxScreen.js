import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../theme/ThemeContext";

import { isSignedIn, signIn, getAccessToken } from "../auth/googleAuth";
import { fetchRecentEmails } from "../api/gmailApi";
import { getConfig } from "../storage/configStore";
import { cleanEmailBody } from "../logic/emailUtils";
import { evaluate } from "../logic/rules";
import { summarize } from "../logic/summarizer";
import EmailCard from "../components/EmailCard";

export default function InboxScreen() {
  const { colors } = useTheme();
  const [signedIn, setSignedIn] = useState(null); // null = checking
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const runPipeline = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const config = await getConfig();
      const accessToken = await getAccessToken();
      const rawEmails = await fetchRecentEmails(accessToken, { maxResults: 30, days: 7 });

      const results = [];
      for (const email of rawEmails) {
        const cleanedBody = cleanEmailBody(email.body, config.cleaning?.footer_markers || []);
        const cleanedEmail = { ...email, body: cleanedBody };
        const { isImportant, score, reasons } = evaluate(cleanedEmail, config);
        if (!isImportant) continue;
        const summary = summarize(cleanedBody, config.output.max_summary_sentences);
        results.push({ ...cleanedEmail, score, reasons, summary });
      }
      results.sort((a, b) => b.score - a.score);
      setEmails(results);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const checkSignInAndLoad = useCallback(async () => {
    const signedInNow = await isSignedIn();
    setSignedIn(signedInNow);
    if (signedInNow) {
      await runPipeline();
    }
  }, [runPipeline]);

  useFocusEffect(
    useCallback(() => {
      checkSignInAndLoad();
    }, [checkSignInAndLoad])
  );

  const handleSignIn = async () => {
    try {
      await signIn();
      setSignedIn(true);
      await runPipeline();
    } catch (e) {
      setError(e.message);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    runPipeline();
  };

  if (signedIn === null) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!signedIn) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.signInTitle, { color: colors.text }]}>Sign in to scan your inbox</Text>
        <Text style={[styles.signInSubtitle, { color: colors.textSecondary }]}>
          Read-only access — this app can never send, delete, or modify your emails.
        </Text>
        <TouchableOpacity style={[styles.signInButton, { backgroundColor: colors.accent }]} onPress={handleSignIn}>
          <Text style={styles.signInButtonText}>Sign in with Google</Text>
        </TouchableOpacity>
        {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}
      </View>
    );
  }

  if (loading && !refreshing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Scanning your inbox...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorTitle, { color: colors.danger }]}>Something went wrong</Text>
        <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryButton, { borderColor: colors.accent }]} onPress={runPipeline}>
          <Text style={[styles.retryButtonText, { color: colors.accent }]}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={emails}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <EmailCard email={item} />}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingVertical: 10, flexGrow: 1 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No important emails found in the last 7 days. Pull down to refresh.
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    marginTop: 80,
  },
  loadingText: { marginTop: 12 },
  signInTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  signInSubtitle: { fontSize: 13, textAlign: "center", marginBottom: 24 },
  signInButton: { borderRadius: 10, paddingVertical: 14, paddingHorizontal: 28 },
  signInButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  errorTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  errorText: { fontSize: 12, textAlign: "center", marginTop: 12 },
  retryButton: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: { fontWeight: "600" },
  emptyText: { textAlign: "center" },
});
