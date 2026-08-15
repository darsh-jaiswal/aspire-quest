/**
 * Core event content for Aspire Quest.
 *
 * PLACEHOLDER DATA: speaker names, partner organisations and figures below are
 * invented stand-ins so the site renders complete. Replace them with the real
 * lineup before this goes public. See README.md § Replacing the sample data.
 */

export const SITE = {
  url: "https://aspirequest.example.edu",
  email: "aspirequest@nmims.edu.in",
  phone: "+91 90000 00000",
  instagram: "https://instagram.com/",
  linkedin: "https://linkedin.com/",
} as const;

export const SUMMIT = {
  name: "Aspire Quest",
  edition: "2027",
  host: "Ambiora '27",
  institution: "MPSTME, NMIMS Shirpur",
  tagline: "The industry comes to Shirpur",
  description:
    "A two-day career and industry summit at MPSTME Shirpur. Twenty-four sessions, four tracks, one recruiter fair — and the people who do the hiring, in the room.",
  /** ISO dates, IST. */
  startsAt: "2027-02-19T09:00:00+05:30",
  endsAt: "2027-02-20T18:30:00+05:30",
  dateLabel: "19–20 February 2027",
  venue: "MPSTME Campus, Shirpur, Dhule District, Maharashtra",
  registrationClosesAt: "2027-02-08T23:59:00+05:30",
  registrationCloseLabel: "8 February 2027",
  seats: 600,
} as const;

/** Distance is the thesis of this event, so it is stated as a fact, not a boast. */
export const FACTS = [
  {
    figure: "380",
    unit: "km",
    label: "From Mumbai to this campus",
    note: "The trip our partners make so students don't have to",
  },
  {
    figure: "24",
    unit: "sessions",
    label: "Across two days",
    note: "Keynotes, panels, workshops and one-to-one clinics",
  },
  {
    figure: "30",
    unit: "+ firms",
    label: "At the recruiter fair",
    note: "Engineering, data, finance, consulting and design",
  },
  {
    figure: "600",
    unit: "seats",
    label: "Open to any student",
    note: "MPSTME and visiting colleges, free to attend",
  },
] as const;

export type TrackCode = "PE" | "DA" | "FC" | "DB";

export type Track = {
  code: TrackCode;
  name: string;
  /** Tailwind text/bg colour token stem, e.g. "platform" → bg-platform. */
  color: "platform" | "rust" | "moss" | "marigold";
  /** Whether the line colour needs light or dark type on top. */
  onColor: "chalk" | "ink";
  summary: string;
  covers: readonly string[];
};

export const TRACKS: readonly Track[] = [
  {
    code: "PE",
    name: "Product & Engineering",
    color: "platform",
    onColor: "chalk",
    summary:
      "How software actually gets built and shipped once there are users, deadlines and a payroll attached to it.",
    covers: [
      "System design interviews",
      "Life as a first-year engineer",
      "Open source as a portfolio",
      "Product sense for engineers",
    ],
  },
  {
    code: "DA",
    name: "Data & AI",
    color: "rust",
    onColor: "chalk",
    summary:
      "The gap between a model that works in a notebook and one a company will put in front of customers.",
    covers: [
      "From notebook to production",
      "Evaluating ML systems",
      "Applied AI case studies",
      "What data roles are really named",
    ],
  },
  {
    code: "FC",
    name: "Finance & Consulting",
    color: "moss",
    onColor: "chalk",
    summary:
      "Case interviews, valuation basics, and an honest account of what the first two years in the job look like.",
    covers: [
      "Live case cracking",
      "Reading a balance sheet",
      "Consulting vs. finance paths",
      "CFA, CAT and the alternatives",
    ],
  },
  {
    code: "DB",
    name: "Design & Brand",
    color: "marigold",
    onColor: "ink",
    summary:
      "Portfolio, craft and the commercial side of design work — including how design gets bought inside a company.",
    covers: [
      "Portfolio review clinic",
      "Design systems in practice",
      "Brand work for engineers",
      "Freelance to full-time",
    ],
  },
];

export const TRACK_BY_CODE: Record<TrackCode, Track> = Object.fromEntries(
  TRACKS.map((track) => [track.code, track]),
) as Record<TrackCode, Track>;

export type FaqItem = { question: string; answer: string };

export const FAQ: readonly FaqItem[] = [
  {
    question: "Who can attend?",
    answer:
      "Any current undergraduate or postgraduate student, from MPSTME or from a visiting college. Bring your institute ID to collect your pass. First and second years are explicitly welcome — several sessions are built for people who have not started applying yet.",
  },
  {
    question: "Does it cost anything?",
    answer:
      "No. Attendance is free and includes both days, all sessions and the recruiter fair. Lunch is provided on both days. There is no paid tier and no premium pass.",
  },
  {
    question: "I'm not from Shirpur. Can I get there and back?",
    answer:
      "Yes, and a lot of attendees do. The campus sits on the Mumbai–Agra highway, roughly seven hours by road from Mumbai and four from Nashik. See Getting here for stations, airports and the shuttle we run from Shirpur bus stand on both mornings.",
  },
  {
    question: "Is accommodation available?",
    answer:
      "Limited hostel space is set aside for outstation attendees on a first-come basis. Tick the accommodation box when you register and the organising team will confirm by email within four working days.",
  },
  {
    question: "Do I have to pick one track?",
    answer:
      "No. Tracks tell us what to plan capacity for, not where you are allowed to sit. You can move between rooms freely. Workshops and clinics are the only capped sessions, and those are booked at the registration desk on the day.",
  },
  {
    question: "Will companies actually hire from this?",
    answer:
      "The recruiter fair is a real hiring channel — partner firms bring open internship and graduate roles and collect CVs on the spot. It does not replace campus placements and it makes no offer guarantees. Treat it as a head start on conversations.",
  },
  {
    question: "Do I get a certificate?",
    answer:
      "Attendance certificates are issued to anyone who checks in on both days, sent by email within two weeks. Workshop completion certificates are issued separately by the session facilitator.",
  },
];

export type TravelRoute = {
  mode: string;
  origin: string;
  detail: string;
  duration: string;
};

/** Distances are approximate road distances — verify before publishing. */
export const TRAVEL: readonly TravelRoute[] = [
  {
    mode: "Road",
    origin: "Mumbai",
    detail: "NH-52 via Nashik and Dhule. Overnight buses run to Shirpur.",
    duration: "≈ 7 hr",
  },
  {
    mode: "Road",
    origin: "Pune",
    detail: "Via Nashik. State transport and private operators both run daily.",
    duration: "≈ 7 hr",
  },
  {
    mode: "Rail",
    origin: "Nardana / Amalner",
    detail: "Nearest railheads. Autos and cabs available at both stations.",
    duration: "≈ 1 hr onward",
  },
  {
    mode: "Air",
    origin: "Indore / Aurangabad",
    detail: "Closest airports. Pre-book a cab; there is no airport shuttle.",
    duration: "≈ 3.5 hr onward",
  },
];
