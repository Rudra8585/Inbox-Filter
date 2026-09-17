/**
 * Prepares a raw message body for scoring and summarising.
 *
 * Bulk institutional mail tends to carry a lot of repeated furniture:
 * reply-quote markers, plain-text emphasis characters used for bold and
 * bullets, and a long signature/footer block appended to every single
 * message. Left in place, that footer makes its own words match on every
 * message and crowds the real content out of summaries.
 *
 * Footer markers are supplied by the caller (from config) rather than
 * hard-coded, so this works with any sender's template.
 */

function stripQuoteMarkers(body) {
  return body
    .split("\n")
    .map((line) => line.replace(/^\s*(>\s*)+/, ""))
    .join("\n");
}

function removeMarkdownEmphasis(body) {
  // Plain-text mail often uses * and _ for bold/bullets. Line wrapping can
  // drop them mid-word ("V**ellore"), so they are removed before any
  // matching is attempted.
  return body.replace(/[*_]+/g, "");
}

function removeUrls(body) {
  return body.replace(/https?:\/\/\S+/g, "");
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Finds the earliest footer marker in the text and returns its index,
 * or -1 when none of them appear.
 */
function findFooterStart(text, markers) {
  let earliest = -1;
  for (const marker of markers) {
    if (!marker || !marker.trim()) continue;
    const re = new RegExp(escapeRegex(marker.trim()), "i");
    const match = re.exec(text);
    if (match && (earliest === -1 || match.index < earliest)) {
      earliest = match.index;
    }
  }
  return earliest;
}

/**
 * Full cleaning pipeline: quote markers -> emphasis characters -> URLs ->
 * whitespace normalise -> cut everything from the first footer marker on.
 *
 * @param {string} body    raw message body
 * @param {string[]} footerMarkers  phrases that mark the start of the footer
 */
function cleanEmailBody(body, footerMarkers = []) {
  if (!body) return body;

  let text = stripQuoteMarkers(body);
  text = removeMarkdownEmphasis(text);
  text = removeUrls(text);
  text = text.replace(/\s+/g, " ").trim();

  const footerStart = findFooterStart(text, footerMarkers);
  if (footerStart > -1) {
    text = text.slice(0, footerStart).trim();
  }
  return text;
}

module.exports = { cleanEmailBody };

if (require.main === module) {
  const sample =
    "Dear Student, the mid-term timetable is now published.\n" +
    "with regards\n*A. Registrar, PhD*\nOffice of Academics\n" +
    "> quoted reply line\n" +
    "Example University, Anytown -\n" +
    "- *Ranked 1st for nothing in particular*\n" +
    "Disclaimer: This message may contain confidential information.";

  console.log("with markers:   ", JSON.stringify(
    cleanEmailBody(sample, ["example university", "disclaimer:"])
  ));
  console.log("without markers:", JSON.stringify(cleanEmailBody(sample, [])));
}
