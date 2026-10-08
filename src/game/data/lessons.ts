import type { SkillKey } from "../types";

// Mode Academy: the ModeQuest learning layer. Lessons live in the in-game
// phone and reward skill XP plus a one-off grant on first pass.

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  explain: string;
}

export interface SortCard {
  label: string;
  emoji: string;
  bucket: 0 | 1;
  why: string;
}

export interface Lesson {
  id: string;
  title: string;
  emoji: string;
  topic: "Money" | "Safety" | "Business" | "Coding";
  skill: SkillKey;
  xp: number;
  grant: number;
  kind: "quiz" | "sort" | "code";
  intro: string[];
  questions?: QuizQuestion[];
  sort?: { buckets: [string, string]; cards: SortCard[] };
  puzzle?: string; // puzzle id
}

export const LESSONS: Lesson[] = [
  {
    id: "budget", title: "The 50/30/20 Budget", emoji: "🧮", topic: "Money", skill: "finance", xp: 40, grant: 3000, kind: "quiz",
    intro: [
      "A budget is a plan for your money before you spend it.",
      "A simple rule: 50% on NEEDS (rent, food, transport), 30% on WANTS (fun, new clothes), 20% on SAVINGS and paying debt.",
      "Tip: rent is due every Saturday in this game. Put rent money aside the moment you get paid.",
    ],
    questions: [
      { q: "You earn ₦40,000 a week. Using 50/30/20, how much should you save?", options: ["₦4,000", "₦8,000", "₦12,000", "₦20,000"], answer: 1, explain: "20% of ₦40,000 is ₦8,000." },
      { q: "Which of these is a NEED?", options: ["Weekly rent", "New sneakers", "Cinema ticket", "Gaming credit"], answer: 0, explain: "Shelter is a need. The rest are wants." },
      { q: "Your friend says 'save whatever is left at the end of the month.' What's the problem?", options: ["Nothing, it works", "Usually nothing is left — save FIRST, then spend", "Saving is only for rich people", "You should never save"], answer: 1, explain: "'Pay yourself first': move savings out as soon as you're paid." },
    ],
  },
  {
    id: "wants_needs", title: "Wants vs Needs", emoji: "⚖️", topic: "Money", skill: "finance", xp: 35, grant: 2000, kind: "sort",
    intro: ["Needs keep you alive, safe and able to work. Wants make life nicer.", "Some things depend on your situation — a laptop is a need for a developer, a want for most others."],
    sort: {
      buckets: ["Need", "Want"],
      cards: [
        { label: "Clean drinking water", emoji: "💧", bucket: 0, why: "Essential for health." },
        { label: "Latest iPhone", emoji: "📱", bucket: 1, why: "A cheaper phone does the job." },
        { label: "Transport to work", emoji: "🚌", bucket: 0, why: "No transport, no job." },
        { label: "Designer sneakers", emoji: "👟", bucket: 1, why: "Nice, not necessary." },
        { label: "Weekly rent", emoji: "🏠", bucket: 0, why: "Shelter is a basic need." },
        { label: "Owambe aso-ebi", emoji: "👗", bucket: 1, why: "Fun, but optional." },
        { label: "Malaria medicine", emoji: "💊", bucket: 0, why: "Health comes first." },
        { label: "Movie night", emoji: "🍿", bucket: 1, why: "Entertainment is a want." },
      ],
    },
  },
  {
    id: "phishing", title: "Spot the Scam", emoji: "🎣", topic: "Safety", skill: "finance", xp: 45, grant: 3000, kind: "quiz",
    intro: [
      "Phishing = fake messages that trick you into giving away passwords, OTPs or money.",
      "Red flags: URGENCY ('24 hours!'), strange links, asking for OTP/PIN/BVN, too-good-to-be-true offers, 'new number' friends asking for money.",
      "Your bank will NEVER ask for your OTP, PIN or password. Ever.",
    ],
    questions: [
      { q: "A message says your account will be blocked unless you send your OTP. You should:", options: ["Send the OTP quickly", "Ignore it and contact the bank through the official app/number", "Reply asking if it's real", "Forward it to friends"], answer: 1, explain: "Never share OTPs. Verify through official channels you already trust." },
      { q: "Which link is most likely fake for 'Marina Bank'?", options: ["marinabank.com", "marina-bank-verify.ng.co", "The bank's official app", "The number on your ATM card"], answer: 1, explain: "Odd domains like .ng.co with 'verify' are a classic trick." },
      { q: "A 'friend' on a new number says they're stranded and need money but can't talk. Best move?", options: ["Send it — friends help friends", "Call their old number to check", "Send half", "Ask for their BVN"], answer: 1, explain: "Verify through a channel you already know is theirs." },
      { q: "You get an alert screenshot saying someone sent you ₦50k by mistake. First step?", options: ["Refund immediately", "Check your actual balance in your bank app", "Block your bank", "Send them your PIN"], answer: 1, explain: "Screenshots and SMS can be faked. Only your bank app is the truth." },
    ],
  },
  {
    id: "ponzi", title: "Ponzi Schemes", emoji: "🎪", topic: "Money", skill: "finance", xp: 40, grant: 3000, kind: "quiz",
    intro: [
      "A Ponzi scheme pays old 'investors' with new investors' money. There is no real business.",
      "It ALWAYS collapses when new money slows down. Nigeria saw this with MMM in 2016 — millions lost savings.",
      "Warning signs: guaranteed high returns (e.g. 30%+ a month), pressure to recruit friends, vague 'trading' explanations.",
    ],
    questions: [
      { q: "'Double your money in 14 days, guaranteed!' This is most likely:", options: ["A great bank deal", "A Ponzi scheme", "Treasury bills", "A savings account"], answer: 1, explain: "Real investments can't guarantee 100% in two weeks." },
      { q: "Why do early members of a Ponzi often get paid?", options: ["The business is profitable", "New members' money pays them, to build trust", "The government backs it", "Luck"], answer: 1, explain: "Early payouts are bait to attract bigger deposits." },
      { q: "A realistic long-term return for a diversified stock index fund is closer to:", options: ["100% a month", "10–20% a year", "1000% a year", "Guaranteed 50% a week"], answer: 1, explain: "Real markets grow slowly, with ups and downs." },
    ],
  },
  {
    id: "compound", title: "The Magic of Compound Interest", emoji: "🌱", topic: "Money", skill: "finance", xp: 45, grant: 3000, kind: "quiz",
    intro: [
      "Compound interest = earning interest on your interest.",
      "₦100,000 at 10% a year becomes ₦110,000, then ₦121,000, then ₦133,100... it snowballs.",
      "The earlier you start, the more time works for you. Debt compounds too — against you.",
    ],
    questions: [
      { q: "₦100,000 earns 10% a year, compounded. After 2 years you have:", options: ["₦120,000", "₦121,000", "₦110,000", "₦200,000"], answer: 1, explain: "Year 1: ₦110,000. Year 2: ₦110,000 × 1.1 = ₦121,000." },
      { q: "Who usually ends up with more: someone who starts saving at 18 or at 35 (same monthly amount)?", options: ["The one who starts at 35", "The one who starts at 18", "Same", "Nobody"], answer: 1, explain: "More years of compounding means much more growth." },
      { q: "A loan shark app charges 50% interest. Compounding here works:", options: ["For you", "Against you", "It doesn't apply", "Only on weekends"], answer: 1, explain: "On debt, compounding grows what you owe." },
    ],
  },
  {
    id: "inflation", title: "Inflation: Why ₦ Buys Less", emoji: "🎈", topic: "Money", skill: "finance", xp: 40, grant: 2500, kind: "quiz",
    intro: [
      "Inflation means prices rise over time, so the same naira buys less.",
      "If inflation is 20% a year and your savings earn 8%, you're actually LOSING buying power.",
      "In this game, prices rise a little every week. Watch your amala price!",
    ],
    questions: [
      { q: "A plate of food costs ₦1,000. With 20% inflation, next year it costs about:", options: ["₦800", "₦1,000", "₦1,200", "₦2,000"], answer: 2, explain: "₦1,000 × 1.20 = ₦1,200." },
      { q: "Keeping all your money as cash under the mattress during high inflation means:", options: ["It grows", "It loses value", "It stays exactly the same in value", "The government doubles it"], answer: 1, explain: "Same number of naira, but each buys less." },
      { q: "Which can help protect against inflation over the long term?", options: ["Spending everything immediately", "Investments that grow faster than inflation", "Ponzi schemes", "Hiding cash"], answer: 1, explain: "Assets that grow faster than prices protect your buying power." },
    ],
  },
  {
    id: "debt", title: "Borrowing Wisely", emoji: "🏧", topic: "Money", skill: "finance", xp: 40, grant: 2500, kind: "quiz",
    intro: [
      "A loan lets you use money now and pay it back later — with interest.",
      "Good debt can help you earn more (e.g. tools for a business). Bad debt pays for things that lose value.",
      "Instant loan apps can charge huge interest and harass you. Read the total repayment, not just the weekly amount.",
    ],
    questions: [
      { q: "Borrow ₦50,000, repay ₦15,000 a week for 5 weeks. Total interest paid?", options: ["₦5,000", "₦15,000", "₦25,000", "₦75,000"], answer: 2, explain: "₦75,000 total − ₦50,000 borrowed = ₦25,000 interest (50%!)." },
      { q: "Which is more likely to be 'good debt'?", options: ["Loan for party clothes", "Loan to buy a freezer for your food business", "Loan for a holiday", "Loan to gamble"], answer: 1, explain: "Debt that helps you earn more can pay for itself." },
      { q: "Before taking any loan, you should check:", options: ["Only the weekly payment", "The total amount you'll repay and whether your budget can handle it", "The app's colour", "Nothing"], answer: 1, explain: "Total cost and affordability matter most." },
    ],
  },
  {
    id: "passwords", title: "Passwords & 2FA", emoji: "🔐", topic: "Safety", skill: "coding", xp: 40, grant: 2500, kind: "quiz",
    intro: [
      "A strong password is long and unique. A short sentence like 'Jollof-Wins-Every-Sunday!' beats 'password123'.",
      "Never reuse one password everywhere: one leak unlocks all your accounts.",
      "Two-factor authentication (2FA) adds a second check, like a code from an app. Turn it on for email, banking and social media.",
    ],
    questions: [
      { q: "Which password is strongest?", options: ["password123", "Tunde2004", "Suya&Rain-at-Elegushi-9!", "qwerty"], answer: 2, explain: "Long, unique, mixed characters." },
      { q: "Why turn on 2FA?", options: ["It makes your phone faster", "Even if someone steals your password, they still can't log in", "It's required by law", "It gives free data"], answer: 1, explain: "The second factor blocks most account takeovers." },
      { q: "Someone 'from Instagram support' DMs asking for your 2FA code. You:", options: ["Send it", "Never share it — support never asks for codes", "Send half of it", "Post it publicly"], answer: 1, explain: "Codes are for you only." },
    ],
  },
  {
    id: "footprint", title: "Your Digital Footprint", emoji: "👣", topic: "Safety", skill: "charisma", xp: 35, grant: 2000, kind: "quiz",
    intro: [
      "Everything you post online can be saved, shared and found — by friends, employers and scammers.",
      "Don't post your live location, home address, or photos of your ID/ATM card.",
      "Be kind online. Screenshots last forever.",
    ],
    questions: [
      { q: "Best time to post that beach selfie with location?", options: ["While you're there", "After you've left", "Never post anything", "With your house address"], answer: 1, explain: "Real-time location tells strangers where you are." },
      { q: "An employer is likely to:", options: ["Never check social media", "Search your name before hiring", "Only read your CV", "Ignore old posts"], answer: 1, explain: "Many recruiters look you up online." },
      { q: "Posting a photo of your new ATM card is:", options: ["Fine", "Dangerous — card details can be stolen", "Required", "Good for credit score"], answer: 1, explain: "Never share card numbers or IDs online." },
    ],
  },
  {
    id: "business101", title: "Revenue, Cost & Profit", emoji: "🏪", topic: "Business", skill: "business", xp: 45, grant: 3000, kind: "quiz",
    intro: [
      "Revenue = money customers pay you. Cost = money you spend running the business. Profit = Revenue − Cost.",
      "A busy business can still lose money if costs are too high (e.g. diesel during NEPA outages).",
      "Reinvest profit to grow, and keep business and personal money separate.",
    ],
    questions: [
      { q: "Your Mama Put stall makes ₦60,000 revenue, costs ₦42,000. Profit?", options: ["₦102,000", "₦18,000", "₦42,000", "₦60,000"], answer: 1, explain: "₦60,000 − ₦42,000 = ₦18,000." },
      { q: "Fuel prices double and you run a generator. Your profit will likely:", options: ["Go up", "Go down", "Stay the same", "Double"], answer: 1, explain: "Higher costs reduce profit unless you raise prices." },
      { q: "Why separate business and personal money?", options: ["It's illegal not to", "So you know if the business is truly profitable", "Banks give free money", "No reason"], answer: 1, explain: "Mixing them hides whether the business works." },
    ],
  },
  {
    id: "negotiation", title: "Market Negotiation", emoji: "🤝🏾", topic: "Business", skill: "business", xp: 35, grant: 2000, kind: "quiz",
    intro: [
      "In Nigerian markets, the first price is an opening move, not the final price.",
      "Know the fair price before you go. Be polite, be ready to walk away.",
      "Win-win deals keep good sellers happy to see you again.",
    ],
    questions: [
      { q: "A trader says ₦20,000 for fabric you think is worth ₦12,000. A good opening offer:", options: ["₦25,000", "₦10,000", "₦20,000", "₦19,500"], answer: 1, explain: "Start below your target so you can meet in the middle." },
      { q: "Your strongest negotiating tool is:", options: ["Shouting", "Being willing to walk away", "Paying immediately", "Showing all your cash"], answer: 1, explain: "If you must buy, you lose leverage." },
      { q: "Why build a relationship with a good trader?", options: ["Better prices and honesty next time", "No reason", "To borrow money", "To avoid paying"], answer: 0, explain: "Repeat customers get better deals." },
    ],
  },
  {
    id: "tax", title: "Tax & Your Payslip", emoji: "🧾", topic: "Money", skill: "finance", xp: 40, grant: 2500, kind: "quiz",
    intro: [
      "Gross pay is what you earn before deductions. Net pay is what lands in your account.",
      "In Nigeria, PAYE (Pay As You Earn) income tax and pension contributions are usually deducted by your employer.",
      "Taxes fund roads, schools, hospitals and security. Keeping honest records protects you.",
    ],
    questions: [
      { q: "Your gross salary is ₦100,000 and ₦12,000 is deducted. Your net pay is:", options: ["₦112,000", "₦100,000", "₦88,000", "₦12,000"], answer: 2, explain: "Net = gross − deductions = ₦88,000." },
      { q: "PAYE stands for:", options: ["Pay As You Earn", "Pay After Year End", "Personal Allowance Yearly Estimate", "Pay All Your Expenses"], answer: 0, explain: "Tax is taken from each paycheck as you earn." },
      { q: "Why keep records of your income?", options: ["To show off", "To prove what you earned and paid if questions come up", "Because banks require selfies", "No reason"], answer: 1, explain: "Records protect you in disputes and applications." },
    ],
  },
  {
    id: "insurance", title: "Insurance Basics", emoji: "☂️", topic: "Money", skill: "finance", xp: 40, grant: 2500, kind: "quiz",
    intro: [
      "Insurance means paying a small, regular amount (a premium) so a big, unexpected cost is covered.",
      "Health insurance (like NHIA plans) can cover hospital bills that would wipe out savings.",
      "Insurance is for risks you can't afford to carry alone — not for small, predictable costs.",
    ],
    questions: [
      { q: "The regular amount you pay for insurance is called the:", options: ["Premium", "Interest", "Dividend", "Profit"], answer: 0, explain: "You pay a premium to stay covered." },
      { q: "Which risk is most worth insuring?", options: ["Losing a ₦200 pen", "A hospital stay costing ₦500,000", "Buying lunch", "A cinema ticket"], answer: 1, explain: "Insure big costs you couldn't pay yourself." },
      { q: "A 'policy' is:", options: ["The insurance contract with its rules", "A government tax", "A type of loan", "A bank account"], answer: 0, explain: "Read the policy to know what's covered." },
    ],
  },
  {
    id: "misinfo", title: "Fake News & Misinformation", emoji: "📰", topic: "Safety", skill: "charisma", xp: 40, grant: 2500, kind: "quiz",
    intro: [
      "Misinformation spreads fastest when it makes people angry or scared.",
      "Before you forward: check the source, check the date, and search if trusted news outlets report it.",
      "Edited photos and voice notes can be fake. 'Forwarded many times' is not proof.",
    ],
    questions: [
      { q: "A WhatsApp broadcast says the government is giving ₦50,000 to everyone who clicks a link. First step?", options: ["Click quickly", "Forward to all groups", "Check official government websites/news before believing it", "Send your BVN"], answer: 2, explain: "Verify with official sources first." },
      { q: "Which is a red flag for fake news?", options: ["Named, reputable source", "ALL CAPS, urgency and 'share before they delete this!'", "A recent date", "Several outlets reporting it"], answer: 1, explain: "Emotional urgency is a manipulation tactic." },
      { q: "A shocking photo is going viral. You can check if it's old or edited by:", options: ["Reverse image search", "Asking in the comments", "Zooming in", "Sharing it"], answer: 0, explain: "Reverse image search shows where it appeared before." },
    ],
  },
  {
    id: "kindness", title: "Cyberbullying & Online Kindness", emoji: "💛", topic: "Safety", skill: "charisma", xp: 35, grant: 2000, kind: "quiz",
    intro: [
      "Cyberbullying is repeated harm online: insults, threats, spreading rumours or sharing private photos.",
      "If it happens to you: don't reply in anger, screenshot evidence, block, report, and tell a trusted adult.",
      "If you see it: don't share it. Support the person being targeted.",
    ],
    questions: [
      { q: "Someone keeps posting insults about you. Best first steps?", options: ["Insult them back", "Screenshot, block, report and tell someone you trust", "Delete your phone", "Ignore your feelings"], answer: 1, explain: "Keep evidence and get support." },
      { q: "A friend shares an embarrassing photo of a classmate in your group chat. You:", options: ["Forward it", "Laugh and say nothing", "Don't share it and ask them to delete it", "Add a caption"], answer: 2, explain: "Not spreading it protects the victim." },
      { q: "Is sharing someone's private photo without consent okay as a joke?", options: ["Yes", "No — it can be harmful and even illegal", "Only on weekends", "If it's funny"], answer: 1, explain: "Consent matters online too." },
    ],
  },
  {
    id: "ajo", title: "Ajo, Esusu & Cooperatives", emoji: "🤲🏾", topic: "Money", skill: "finance", xp: 40, grant: 2500, kind: "quiz",
    intro: [
      "Ajo (Yoruba), Esusu, Isusu (Igbo) and Adashe (Hausa) are rotating savings groups: everyone contributes each week, and one member collects the pot in turn.",
      "They build discipline and give lump sums without interest. The risk: a member who collects early and stops paying.",
      "Cooperatives are registered groups that save, lend and buy in bulk together. Choose people you trust and keep written records.",
    ],
    questions: [
      { q: "10 people contribute ₦5,000 weekly in an ajo. Each payout is:", options: ["₦5,000", "₦10,000", "₦50,000", "₦500,000"], answer: 2, explain: "10 × ₦5,000 = ₦50,000 to one member each week." },
      { q: "The biggest risk in an informal ajo is:", options: ["High interest", "A member collects and then stops contributing", "Inflation of 100%", "No risk"], answer: 1, explain: "Trust and records are everything." },
      { q: "A good safeguard for a savings group is:", options: ["No records", "Written records and members you know", "Letting strangers join online", "Paying in cash to anyone"], answer: 1, explain: "Records and trust protect everyone." },
    ],
  },
  {
    id: "pricing", title: "Pricing Your Product", emoji: "🏷️", topic: "Business", skill: "business", xp: 45, grant: 3000, kind: "quiz",
    intro: [
      "Your price must cover your costs (materials, transport, power) and leave a profit.",
      "Cost-plus pricing: total cost per item + a markup. Example: ₦800 cost + 25% markup = ₦1,000.",
      "Watch competitors and value: people pay more for quality, speed and trust.",
    ],
    questions: [
      { q: "A plate of food costs you ₦1,200 to make. With a 25% markup, you sell at:", options: ["₦1,225", "₦1,500", "₦2,400", "₦1,000"], answer: 1, explain: "₦1,200 × 1.25 = ₦1,500." },
      { q: "Fuel prices rise and your delivery cost doubles. You should:", options: ["Ignore it", "Review your prices so you still make profit", "Close forever", "Give everything free"], answer: 1, explain: "Prices must track costs." },
      { q: "Why might customers pay more at one shop than another?", options: ["They like losing money", "Better quality, trust or convenience", "It's illegal to compare", "No reason"], answer: 1, explain: "Value isn't only price." },
    ],
  },
  { id: "code1", title: "Code Lab 1: First Steps", emoji: "🤖", topic: "Coding", skill: "coding", xp: 30, grant: 1500, kind: "code", puzzle: "p1", intro: ["Programs are instructions a computer follows exactly, in order.", "Guide ByteBot to the ⭐ using MOVE and TURN blocks."] },
  { id: "code2", title: "Code Lab 2: Turning Corners", emoji: "🤖", topic: "Coding", skill: "coding", xp: 35, grant: 1500, kind: "code", puzzle: "p2", intro: ["TURN LEFT and TURN RIGHT rotate ByteBot without moving.", "Order matters — turn, then move."] },
  { id: "code3", title: "Code Lab 3: Loops", emoji: "🔁", topic: "Coding", skill: "coding", xp: 40, grant: 2000, kind: "code", puzzle: "p3", intro: ["A LOOP repeats a block. Tap a placed block to change ×1 to ×2, ×3...", "You have a block limit — use repeats to stay under it."] },
  { id: "code4", title: "Code Lab 4: Collect the Coins", emoji: "🪙", topic: "Coding", skill: "coding", xp: 45, grant: 2000, kind: "code", puzzle: "p4", intro: ["Collect every 🪙 before reaching the ⭐.", "Plan the whole route before you run."] },
  { id: "code5", title: "Code Lab 5: The City Maze", emoji: "🧱", topic: "Coding", skill: "coding", xp: 55, grant: 2500, kind: "code", puzzle: "p5", intro: ["Walls 🧱 block your path. Hit one and the program crashes.", "Debugging = finding the step where it went wrong."] },
  { id: "code6", title: "Code Lab 6: Efficient Routes", emoji: "⚡", topic: "Coding", skill: "coding", xp: 65, grant: 3000, kind: "code", puzzle: "p6", intro: ["Good code is correct AND efficient.", "Get every coin with the fewest blocks."] },
  { id: "code7", title: "Code Lab 7: Plan the Path", emoji: "🧭", topic: "Coding", skill: "coding", xp: 70, grant: 3000, kind: "code", puzzle: "p7", intro: ["Algorithms are plans. Trace the whole route on the grid before placing a single block.", "Exactly 7 blocks. No room for waste."] },
  { id: "code8", title: "Code Lab 8: Loop Limits", emoji: "♾️", topic: "Coding", skill: "coding", xp: 80, grant: 3500, kind: "code", puzzle: "p8", intro: ["A block can repeat at most 5 times. Longer roads need two blocks.", "Real programs have limits too — memory, time, battery."] },
];

export const getLesson = (id: string) => LESSONS.find((l) => l.id === id);
