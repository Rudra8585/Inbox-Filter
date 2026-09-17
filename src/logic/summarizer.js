/**
 * Simple frequency-based extractive summarizer.
 * Pure JS, no dependencies — direct port of summarizer.py.
 */

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "be",
  "been", "being", "in", "on", "at", "to", "for", "of", "with", "by",
  "this", "that", "these", "those", "it", "as", "from", "you", "your",
  "we", "our", "will", "please", "if", "not", "have", "has", "had",
  "regards", "dear", "sincerely", "thanks", "thank", "hi", "hello",
  "all", "students", "student", "i", "am", "us", "can", "may", "so",
]);

function splitSentences(text) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  return normalized
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function wordFreq(sentences) {
  const freq = {};
  for (const sent of sentences) {
    const words = sent.toLowerCase().match(/[a-z]{2,}/g) || [];
    for (const w of words) {
      if (STOPWORDS.has(w)) continue;
      freq[w] = (freq[w] || 0) + 1;
    }
  }
  return freq;
}

/**
 * Return a short extractive summary of `text`.
 */
function summarize(text, maxSentences = 2) {
  if (!text || !text.trim()) return "";

  const sentences = splitSentences(text);
  if (sentences.length <= maxSentences) return sentences.join(" ");

  const freq = wordFreq(sentences);
  if (Object.keys(freq).length === 0) {
    return sentences.slice(0, maxSentences).join(" ");
  }

  const scored = sentences.map((sent, idx) => {
    const words = sent.toLowerCase().match(/[a-z]{2,}/g) || [];
    const rawScore = words.reduce((sum, w) => sum + (freq[w] || 0), 0);
    const score = rawScore / (words.length + 1);
    return { idx, score, sent };
  });

  const top = [...scored].sort((a, b) => b.score - a.score).slice(0, maxSentences);
  const topSortedByPosition = top.sort((a, b) => a.idx - b.idx);
  return topSortedByPosition.map((s) => s.sent).join(" ");
}

module.exports = { summarize };

// Quick self-test when run directly with `node summarizer.js`
if (require.main === module) {
  const sample =
    "Dear Students, This is to inform you that the end-of-term assessment " +
    "schedule has been published. All students must download their hall " +
    "tickets before the exam date. Please ensure your attendance is above 75% " +
    "to be eligible. In case of any discrepancy, contact the academics office " +
    "immediately. Thank you.";
  console.log(summarize(sample, 2));
}
