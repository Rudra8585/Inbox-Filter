/**
 * Offline check for the filtering logic. Runs with plain Node, no device
 * or mail account needed:
 *
 *     node src/logic/testOffline.js
 *
 * Every message below is invented. They are written to exercise one
 * behaviour each so a regression is easy to spot, and are deliberately
 * generic: any bulk-mail vocabulary your own inbox uses should be added
 * through Settings rather than hard-coded here.
 */

const { evaluate } = require("./rules");
const { summarize } = require("./summarizer");
const { cleanEmailBody } = require("./emailUtils");
const defaultConfig = require("./defaultConfig");

// A sample profile, so eligibility and audience rules have something to
// compare against. Your real profile lives on the device, not here.
const config = {
  ...defaultConfig,
  profile: {
    ...defaultConfig.profile,
    name: "Sample Student",
    course: "MCA",
    course_aliases: ["MCA", "M.C.A", "Master of Computer Applications"],
    lives_on_campus: true,
  },
  cleaning: {
    footer_markers: ["example university, anytown", "disclaimer:"],
  },
};

// A stand-in for the repeated footer bulk mail tends to carry.
const FOOTER =
  "\nRegards,\nA. Coordinator\nExample University, Anytown -\n" +
  "Ranked somewhere by someone (Some Ranking 2026)\n" +
  "Accredited with top grade\n" +
  "Disclaimer: This message may contain confidential information.";

const CASES = [
  {
    label: "eligibility excludes your course -> skipped",
    expectImportant: false,
    email: {
      sender: "careers@example.edu",
      subject: "Northwind Systems — Internship Registration, 2027 batch",
      body:
        "Name of the Company: Northwind Systems. Category: Internship. " +
        "Eligible Branches: All B.Tech (CSE / IT / ECE) related branches only. " +
        "Eligibility Criteria: 75% or 7.5 CGPA. Stipend 20000. " +
        "Last date for registration: 12th March." + FOOTER,
    },
  },
  {
    label: "eligibility includes your course -> shown",
    expectImportant: true,
    email: {
      sender: "careers@example.edu",
      subject: "Contoso Analytics — Internship Registration, 2027 batch",
      body:
        "Name of the Company: Contoso Analytics. Category: Internship. " +
        "Eligible Branches: All 2 year M.Tech, MCA and MSc related branches. " +
        "Eligibility Criteria: 75% or 7.5 CGPA. Stipend 25000." + FOOTER,
    },
  },
  {
    label: "shortlist with no eligibility section -> shown",
    expectImportant: true,
    email: {
      sender: "careers@example.edu",
      subject: "Selection list — Fabrikam Labs internship",
      body:
        "The following candidates have been shortlisted for the Fabrikam Labs " +
        "internship. Shortlisted students should report for the interview at " +
        "9 AM. Candidates who fail to attend the selection process will not be " +
        "considered further." + FOOTER,
    },
  },
  {
    label: "exam timetable -> shown",
    expectImportant: true,
    email: {
      sender: "academics@example.edu",
      subject: "Mid-semester assessment test — general instructions",
      body:
        "The mid-semester assessment test is scheduled from the 9th to the 16th. " +
        "Students should check the date and reporting time on their individual " +
        "portal login under Examination. As per academic regulations, 75% " +
        "attendance is mandatory; students below that will be debarred from " +
        "the test." + FOOTER,
    },
  },
  {
    label: "attendance rule change -> shown",
    expectImportant: true,
    email: {
      sender: "academics@example.edu",
      subject: "Class attendance recording from next month",
      body:
        "Students are advised to record their attendance on the device in the " +
        "classroom within 15 minutes of the scheduled slot time. Attendance " +
        "recorded after that will not be considered and the session will be " +
        "marked absent." + FOOTER,
    },
  },
  {
    label: "notice for commuters only -> skipped for a resident",
    expectImportant: false,
    email: {
      sender: "registrar@example.edu",
      subject: "Revised bus timings for day scholar students",
      body:
        "Owing to a local festival, heavy traffic is expected on the main road. " +
        "Buses will leave at 3:00 PM today. On-duty attendance will be provided " +
        "for all day scholars travelling these routes." + FOOTER,
    },
  },
  {
    label: "accommodation circular -> shown",
    expectImportant: true,
    email: {
      sender: "accommodation@example.edu",
      subject: "Online dining hall change for next month",
      body:
        "Circular: the online dining hall change window for next month is open " +
        "between the 29th and 30th. Residents can book their preferred option " +
        "through the portal and must complete payment the same day to confirm " +
        "the change." + FOOTER,
    },
  },
  {
    label: "senior industry speaker -> shown",
    expectImportant: true,
    email: {
      sender: "dean.office@example.edu",
      subject: "Invited talk by a senior vice president, Adventure Works",
      body:
        "An interaction session with the Senior Vice President of Adventure " +
        "Works has been arranged for faculty and students on Wednesday at " +
        "11:30 AM in Gallery 1. This is a chance to hear from an eminent " +
        "industry leader on where the sector is heading." + FOOTER,
    },
  },
  {
    label: "exchange programme session -> shown",
    expectImportant: true,
    email: {
      sender: "international@example.edu",
      subject: "Study abroad orientation programme, venue changed",
      body:
        "You are invited to a student information session on the semester " +
        "abroad programme, covering capstone research projects, master thesis " +
        "options and credit transfer from partner universities." + FOOTER,
    },
  },
  {
    label: "scam warning -> shown, highest weight",
    expectImportant: true,
    email: {
      sender: "careers@example.edu",
      subject: "Important alert: beware of fake internship offers",
      body:
        "Students are cautioned to beware of fake internship and placement " +
        "offers circulated by email and messaging apps claiming to be from the " +
        "careers office. Verify any such offer directly with the office before " +
        "making a payment or sharing personal details." + FOOTER,
    },
  },
  {
    label: "mandatory task from an outside sender -> shown",
    expectImportant: true,
    email: {
      sender: "noreply@practice-platform.example",
      subject: "Mock interviews now open",
      body:
        "All students are required to complete a mock interview on the practice " +
        "platform as part of placement preparation. Complete this before the " +
        "deadline to remain eligible for the selection process.",
    },
  },
  {
    label: "purely social club invite -> skipped",
    expectImportant: false,
    email: {
      sender: "studentlife@example.edu",
      subject: "Nature club: talk for conservation day",
      body:
        "Greetings from the nature club. To mark conservation day the club is " +
        "hosting a talk and discussion with a visiting practitioner. Venue: the " +
        "main auditorium. All are welcome." + FOOTER,
    },
  },
];

let passed = 0;
let shown = 0;

for (const testCase of CASES) {
  const cleanedBody = cleanEmailBody(testCase.email.body, config.cleaning.footer_markers);
  const email = { ...testCase.email, body: cleanedBody };
  const { isImportant, score, reasons } = evaluate(email, config);

  const ok = isImportant === testCase.expectImportant;
  if (ok) passed++;
  if (isImportant) shown++;

  console.log(
    `${ok ? "pass" : "FAIL"}  [${isImportant ? "shown " : "hidden"}] score=${String(score).padStart(4)}  ${testCase.label}`
  );
  for (const reason of reasons) console.log(`             - ${reason}`);
  if (isImportant) {
    console.log(`             summary: ${summarize(cleanedBody, config.output.max_summary_sentences)}`);
  }
  console.log();
}

console.log(`${passed}/${CASES.length} cases behaved as expected (${shown} messages shown).`);
process.exit(passed === CASES.length ? 0 : 1);
