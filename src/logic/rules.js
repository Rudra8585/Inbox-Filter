/**
 * Scores a message and decides whether it is worth surfacing.
 *
 * Three things feed the score:
 *  1. Category keywords, each category carrying its own weight.
 *  2. Eligibility matching. Bulk recruitment mail usually names the
 *     courses it is open to; when yours is not among them the message is
 *     pushed far below the threshold instead of being shown.
 *  3. Audience matching. Notices addressed only to residents, or only to
 *     commuters, are skipped for whoever they do not apply to.
 *
 * All keywords, weights and thresholds come from config, so none of this
 * is tied to a particular institution's vocabulary.
 */

// Words a sender might use to introduce the list of eligible courses.
const ELIGIBILITY_LABELS = "eligible branches|eligible courses|eligibility|open to|applicable to";

// Words that tend to follow the list and mark where it ends.
const ELIGIBILITY_TERMINATORS =
  "eligibility criteria|criteria|ctc|salary|package|registration\\s*:|last date|deadline|website|job location|job profile";

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Pulls out the text listing which courses a message is open to, or null
 * when the message does not say.
 */
function findEligibilityText(body) {
  const re = new RegExp(
    `(?:${ELIGIBILITY_LABELS})\\s*[:\\-]?([\\s\\S]*?)(?:${ELIGIBILITY_TERMINATORS}|$)`,
    "i"
  );
  const match = re.exec(body);
  if (!match) return null;

  const section = match[1].trim().replace(/\s+/g, " ");
  if (!section) return null;
  return section.slice(0, 300);
}

/**
 * True when any spelling of the user's course appears in the eligibility
 * text. Comparison ignores punctuation and spacing so "M.C.A", "M C A"
 * and "MCA" are treated alike.
 */
function courseMatches(eligibilityText, courseAliases) {
  const haystack = normalize(eligibilityText);
  return courseAliases
    .filter((alias) => alias && alias.trim())
    .some((alias) => haystack.includes(normalize(alias)));
}

function keywordPresent(keyword, textLower) {
  const kw = keyword.toLowerCase().trim();
  if (!kw) return false;
  // Multi-word phrases are matched as-is; single words get word boundaries
  // so short keywords do not match inside unrelated longer words.
  if (kw.includes(" ") || kw.includes("-")) {
    return textLower.includes(kw);
  }
  return new RegExp(`\\b${escapeRegex(kw)}\\b`).test(textLower);
}

function categorize(text, categoryKeywords) {
  const textLower = text.toLowerCase();
  const hits = {};
  for (const [category, keywords] of Object.entries(categoryKeywords || {})) {
    const found = (keywords || []).filter((kw) => keywordPresent(kw, textLower));
    if (found.length > 0) hits[category] = found;
  }
  return hits;
}

const COMMUTER_TERMS = ["day scholar", "day-scholar", "commuting student", "non-resident student"];
const RESIDENT_TERMS = ["hostel", "warden", "mess ", "residential student", "campus accommodation"];

function audienceMismatch(body, livesOnCampus) {
  const textLower = body.toLowerCase();
  const mentionsCommuters = COMMUTER_TERMS.some((t) => textLower.includes(t));
  const mentionsResidents = RESIDENT_TERMS.some((t) => textLower.includes(t));

  // Only treat it as a mismatch when the message speaks to one group and
  // not the other; anything addressed to both is left alone.
  if (mentionsCommuters && !mentionsResidents && livesOnCampus === true) {
    return "addressed to commuting students, you live on campus";
  }
  if (mentionsResidents && !mentionsCommuters && livesOnCampus === false) {
    return "addressed to residents, you commute";
  }
  return null;
}

/**
 * @param {{subject?: string, body?: string, sender?: string}} email
 * @param {object} config  full config object ({ profile, rules, ... })
 * @returns {{isImportant: boolean, score: number, reasons: string[]}}
 */
function evaluate(email, config) {
  const rules = config.rules || {};
  const profile = config.profile || {};
  const fullText = `${email.subject || ""} ${email.body || ""}`;

  const reasons = [];
  let score = 0;

  // 1. Category keywords
  const categoryHits = categorize(fullText, rules.category_keywords);
  const weights = rules.category_weights || {};
  const lowPriority = new Set(rules.low_priority_categories || []);

  const matchedCategories = [];
  for (const [category, keywordsFound] of Object.entries(categoryHits)) {
    const weight = weights[category] !== undefined ? weights[category] : 1;
    score += weight;
    matchedCategories.push(category);
    reasons.push(`${category} match: ${keywordsFound.slice(0, 4).join(", ")}`);
  }

  // 2. Course eligibility
  const eligibilityText = findEligibilityText(email.body || "");
  if (eligibilityText) {
    const aliases = (profile.course_aliases && profile.course_aliases.length
      ? profile.course_aliases
      : [profile.course]
    ).filter(Boolean);

    if (aliases.length === 0) {
      reasons.push("lists eligible courses, but no course set in your profile");
    } else if (courseMatches(eligibilityText, aliases)) {
      score += 3;
      reasons.push(`course match (${profile.course}) in: "${eligibilityText.slice(0, 80)}"`);
    } else {
      score += rules.branch_mismatch_penalty !== undefined ? rules.branch_mismatch_penalty : -100;
      reasons.push(`course not eligible — open to: "${eligibilityText.slice(0, 80)}"`);
    }
  }

  // 3. Audience
  if (profile.lives_on_campus !== undefined) {
    const mismatch = audienceMismatch(email.body || "", profile.lives_on_campus);
    if (mismatch) {
      score += rules.audience_mismatch_penalty !== undefined ? rules.audience_mismatch_penalty : -10;
      reasons.push(mismatch);
    }
  }

  // 4. Nothing but low-priority categories
  if (matchedCategories.length > 0 && matchedCategories.every((c) => lowPriority.has(c))) {
    score -= 1;
    reasons.push("only low-priority categories matched");
  }

  const threshold = rules.min_match_score !== undefined ? rules.min_match_score : 2;
  return { isImportant: score >= threshold, score, reasons };
}

module.exports = { evaluate, findEligibilityText, courseMatches };
