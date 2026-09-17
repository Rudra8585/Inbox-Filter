/**
 * Default profile + rules config.
 *
 * Everything here is a starting point, not a fixed rule set. It is copied
 * into device storage on first launch and is fully editable from the
 * Profile and Settings screens afterwards.
 *
 * Nothing in this file is specific to any particular school, employer or
 * mail provider. Institution-specific terms (portal names, internal
 * acronyms, department abbreviations) are deliberately left out: add the
 * ones your own inbox uses via Settings -> Category Keywords.
 */
module.exports = {
  profile: {
    name: "",
    // Your own identifiers, kept on-device and shown for quick reference
    // when a message asks for them. Add or rename these on the Profile screen.
    custom_fields: [
      { label: "Student ID", value: "" },
      { label: "Portal ID", value: "" },
    ],
    // Your single programme of study, e.g. "MCA", "MSc Physics", "BA History".
    course: "",
    // Spelling variants your mail actually uses, so matching is not thrown
    // off by punctuation or abbreviation, e.g. ["MCA", "M.C.A"].
    course_aliases: [],
    // Used to skip notices addressed only to the group you are not in.
    // true = you live in campus accommodation, false = you commute.
    lives_on_campus: true,
  },

  // Text that marks the start of the repeated signature/footer block many
  // institutions append to every message (rankings, accreditations, legal
  // disclaimers). Everything from the first match onwards is ignored when
  // scoring and summarising, which stops footer words from matching on
  // every single message. Add your own under Settings -> Email Footer.
  cleaning: {
    footer_markers: ["disclaimer:", "confidentiality notice"],
  },

  rules: {
    category_keywords: {
      placement_internship: [
        "internship", "placement", "recruitment", "interview",
        "pre-placement", "online test", "shortlisted", "selection list",
        "eligible branches", "stipend", "mock interview", "selection process",
        "job description", "hiring",
      ],
      academic_exam: [
        "exam", "examination", "attendance", "hall ticket", "result",
        "internal marks", "revaluation", "debarred", "exam registration",
        "course registration", "assessment test", "semester",
      ],
      academic_opportunity: [
        "information session", "graduate program", "graduate programs",
        "research opportunity", "exchange program", "semester abroad",
        "study abroad", "scholarship", "fellowship", "phd program",
        "phd programs", "phd research", "capstone", "credit transfer",
        "orientation programme", "orientation program",
      ],
      important_notice: [
        "alert", "beware", "fake", "caution", "warning", "phishing", "scam",
        "urgent", "deadline extended",
      ],
      accommodation: [
        "hostel", "mess", "dining hall", "warden", "accommodation",
        "circular", "room allocation",
      ],
      club_event: [
        "club", "chapter", "workshop", "webinar", "meetup",
        "prize distribution", "fest",
      ],
      industry_talk: [
        "vice president", "senior vice president", "chief executive", "ceo",
        "cto", "guest lecture", "distinguished speaker", "industry expert",
        "industry leader", "corporate visit", "eminent",
      ],
    },

    // How much each category contributes to a message's importance score.
    category_weights: {
      placement_internship: 3,
      academic_exam: 3,
      academic_opportunity: 3,
      important_notice: 4,
      accommodation: 2,
      industry_talk: 3,
      club_event: 1,
    },

    // Categories that only count as important when something else also
    // matches, so purely social announcements stay out of the way.
    low_priority_categories: ["club_event"],

    // A message is shown when its score reaches this number. Raise it to
    // see fewer messages, lower it to see more.
    min_match_score: 2,

    // Applied when a message names the courses it is open to and yours is
    // not among them. Large and negative so it overrides keyword matches.
    branch_mismatch_penalty: -100,

    // Applied when a message is addressed only to the residence group you
    // are not part of.
    audience_mismatch_penalty: -10,
  },

  output: {
    max_summary_sentences: 2,
  },
};
