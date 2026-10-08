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
      { q: "You earn ₦40,000 a week. Under 50/30/20, how much is for NEEDS?", options: ["₦10,000", "₦20,000", "₦25,000", "₦30,000"], answer: 1, explain: "50% of ₦40,000 is ₦20,000." },
      { q: "Which of these is a WANT?", options: ["Transport to work", "Weekly rent", "Basic food", "A new owambe outfit"], answer: 3, explain: "Nice to have — but you can live and work without it." },
      { q: "You overspent on wants this week. Best fix?", options: ["Skip rent", "Cut back on wants next week and stick to the plan", "Borrow from a loan app", "Stop eating"], answer: 1, explain: "Adjust wants, never your essentials." },
      { q: "An emergency fund is for:", options: ["A phone on sale", "Unexpected costs like hospital bills or losing your job", "Weekend parties", "Betting"], answer: 1, explain: "It's a cushion for surprises, not for shopping." },
      { q: "A good emergency fund target is about:", options: ["One day of expenses", "3–6 months of expenses", "Ten years of salary", "Nothing — just borrow"], answer: 1, explain: "Enough to survive a few months without income." },
      { q: "Writing down every naira you spend for a week helps you:", options: ["Waste time", "See where your money actually goes", "Get a loan", "Pay less tax"], answer: 1, explain: "You can't fix leaks you can't see." },
      { q: "You earn ₦60,000 and your needs cost ₦45,000. That means:", options: ["Needs are under budget", "Needs are 75% — well over the 50% guide", "It's exactly right", "Budgets don't matter"], answer: 1, explain: "₦45,000 ÷ ₦60,000 = 75%. Find cheaper needs or more income." },
      { q: "Your hustle income changes every week. Best budgeting approach?", options: ["Spend big in good weeks", "Budget for your lowest normal week and save the extra in good weeks", "Don't budget at all", "Borrow in bad weeks"], answer: 1, explain: "Plan for the floor; good weeks build your buffer." },
      { q: "You spend ₦20,000 a month on data and airtime and earn ₦80,000. What share is that?", options: ["2.5%", "20%", "25%", "40%"], answer: 2, explain: "₦20,000 ÷ ₦80,000 = 25% — a big chunk for a want." },
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
        { label: "School fees", emoji: "🎒", bucket: 0, why: "Education builds your future income." },
        { label: "Soap & toothpaste", emoji: "🧼", bucket: 0, why: "Hygiene keeps you healthy." },
        { label: "Premium streaming plan", emoji: "📺", bucket: 1, why: "Free options exist — this is a treat." },
        { label: "Shawarma every day", emoji: "🌯", bucket: 1, why: "Food is a need; daily shawarma is a want." },
        { label: "Basic phone for work calls", emoji: "☎️", bucket: 0, why: "Customers and bosses need to reach you." },
        { label: "Gold chain", emoji: "📿", bucket: 1, why: "Looks good, but you can live without it." },
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
      { q: "A 'bank' email comes from marina.bank.support@gmail.com. Red flag?", options: ["Nothing wrong", "Banks use their own domain, not free email addresses", "Gmail is safer", "It has the logo, so it's real"], answer: 1, explain: "Logos are easy to copy. Check the sender's real address." },
      { q: "You 'won' a raffle you never entered and must pay a release fee. This is:", options: ["Your lucky day", "A scam — real prizes don't charge fees", "Normal", "A tax"], answer: 1, explain: "If you didn't enter, you didn't win." },
      { q: "A buyer shows you a transfer SMS. When should you hand over the goods?", options: ["When they show the SMS", "When the money shows in your own bank app", "When they look honest", "When they promise"], answer: 1, explain: "Fake alerts are common. Confirm in your own account." },
      { q: "A job offer asks you to pay ₦15,000 for a 'training form' before the interview. This is:", options: ["Standard", "A big red flag for a job scam", "A tax", "A bonus"], answer: 1, explain: "Real employers don't charge you to apply." },
      { q: "'Smishing' means:", options: ["Phishing by SMS text message", "A new dance", "A type of bank", "Safe browsing"], answer: 0, explain: "Scam texts with links or fake alerts are smishing." },
      { q: "A caller from 'your bank' already knows your name and last 4 card digits. That means:", options: ["They must be real", "Scammers can get partial details — hang up and call the bank yourself", "Give them your PIN", "Give them your BVN"], answer: 1, explain: "Knowing a few details proves nothing. Never share OTP or PIN." },
      { q: "Someone asks to send money into your account so you can forward it on for a fee. This is:", options: ["Easy money", "Being used as a 'money mule' — it's a crime", "Fine if they're a friend", "Fine once"], answer: 1, explain: "Moving stolen money makes you part of the fraud." },
      { q: "You clicked a bad link and typed your password. First thing to do?", options: ["Wait and see", "Change that password now, turn on 2FA, and call your bank if it was banking", "Delete the app", "Tell no one"], answer: 1, explain: "Act fast to lock the scammer out." },
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
      { q: "A scheme pays you mainly for recruiting people, not for selling real products. It's a:", options: ["Pyramid scheme", "Savings account", "Registered cooperative", "Government bond"], answer: 0, explain: "Money from recruits, not real sales, is the giveaway." },
      { q: "The scheme says withdrawals are 'paused for maintenance' for weeks. This usually means:", options: ["Normal upgrades", "New money is drying up and it may collapse", "Profits are rising", "A bank holiday"], answer: 1, explain: "Frozen withdrawals are a classic collapse sign." },
      { q: "In Nigeria, you can check if an investment firm is registered with the:", options: ["SEC (Securities and Exchange Commission)", "NFF", "JAMB", "NYSC"], answer: 0, explain: "The SEC regulates investment businesses." },
      { q: "An Instagram 'trader' shows off a Lamborghini and promises 5% a day. Best response?", options: ["Invest quickly", "Be very sceptical — a flashy lifestyle is not proof", "Borrow to invest", "Recruit friends first"], answer: 1, explain: "Show-off photos are marketing, not evidence." },
      { q: "'Guaranteed 30% a month' would grow ₦10,000 to over ₦200,000 in a year. Is that realistic?", options: ["Yes", "No — no real business grows that fast for long", "Only in crypto", "Only in Lagos"], answer: 1, explain: "1.3¹² ≈ 23×. Real businesses can't promise that." },
      { q: "Your uncle got paid by a scheme and says 'it's legit!' This proves:", options: ["It's safe", "Nothing — early payouts are how Ponzis attract people", "It's government-backed", "You'll be paid too"], answer: 1, explain: "Early winners are the bait." },
      { q: "Before investing, the smartest question is:", options: ["How fast will I double?", "How exactly does this business make money?", "What colour is the logo?", "How many people joined?"], answer: 1, explain: "If nobody can explain the real business, walk away." },
      { q: "When a Ponzi collapses, who usually loses the most?", options: ["The founders", "People who joined late", "The government", "The earliest members"], answer: 1, explain: "Late joiners' money was used to pay others." },
      { q: "Diversification means:", options: ["Putting everything into one scheme", "Spreading money across different investments to reduce risk", "Spending all your money", "Hiding cash at home"], answer: 1, explain: "Don't put all your eggs in one basket." },
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
      { q: "Rule of 72: at 12% a year, money roughly doubles in about:", options: ["3 years", "6 years", "12 years", "72 years"], answer: 1, explain: "72 ÷ 12 = 6 years." },
      { q: "₦50,000 earns 20% a year, compounded. After 2 years you have:", options: ["₦70,000", "₦72,000", "₦60,000", "₦100,000"], answer: 1, explain: "₦50,000 → ₦60,000 → ₦72,000." },
      { q: "Simple interest is paid on:", options: ["Only the original amount", "The original amount plus past interest", "Nothing", "Withdrawals"], answer: 0, explain: "Compound interest is the one that pays interest on interest." },
      { q: "₦10,000 at 10% SIMPLE interest for 3 years earns:", options: ["₦3,000", "₦3,310", "₦1,000", "₦30,000"], answer: 0, explain: "₦1,000 a year × 3 years = ₦3,000." },
      { q: "What helps compounding the most?", options: ["Withdrawing the interest every month", "Leaving the money to grow for many years", "Checking your balance daily", "Opening many apps"], answer: 1, explain: "Time is compounding's best friend." },
      { q: "A ₦20,000 loan at 10% a month, unpaid for 2 months, becomes:", options: ["₦22,000", "₦24,000", "₦24,200", "₦40,000"], answer: 2, explain: "₦20,000 → ₦22,000 → ₦24,200. Debt snowballs too." },
      { q: "Rule of 72: at 24% a year, money doubles in about:", options: ["3 years", "6 years", "24 years", "1 year"], answer: 0, explain: "72 ÷ 24 = 3 years." },
      { q: "Ada saves from 18 to 28 then stops. Chidi saves the same amount from 28 to 38. At 60, who likely has more?", options: ["Ada — her money compounded for longer", "Chidi", "They have the same", "Neither has anything"], answer: 0, explain: "Starting early often beats saving more later." },
      { q: "Your savings earn 10% but inflation is 15%. Your real return is about:", options: ["+25%", "+10%", "−5%", "0%"], answer: 2, explain: "10% − 15% ≈ −5%: your money buys less each year." },
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
      { q: "Inflation is usually measured with the:", options: ["Consumer Price Index (CPI)", "Stock market", "Transfer market", "Weather report"], answer: 0, explain: "CPI tracks the price of a basket of everyday goods." },
      { q: "Who publishes Nigeria's official inflation figures?", options: ["National Bureau of Statistics (NBS)", "INEC", "NYSC", "WAEC"], answer: 0, explain: "The NBS releases the CPI and inflation rate." },
      { q: "When the Central Bank raises interest rates, it usually aims to:", options: ["Slow inflation down", "Push inflation up", "Print more money", "Cut salaries directly"], answer: 0, explain: "Higher rates make borrowing costlier and cool spending." },
      { q: "Your salary rises 10% while prices rise 25%. Your real income:", options: ["Rose", "Fell", "Stayed the same", "Doubled"], answer: 1, explain: "Prices grew faster than your pay." },
      { q: "When the naira weakens against the dollar, imported goods usually:", options: ["Get cheaper", "Get more expensive", "Stay the same", "Disappear"], answer: 1, explain: "Importers need more naira to buy the same dollars." },
      { q: "Savings earn 8% a year and inflation is 20%. Your real return is roughly:", options: ["+28%", "+12%", "−12%", "+8%"], answer: 2, explain: "8% − 20% ≈ −12%." },
      { q: "Buying in bulk before an expected price rise can:", options: ["Save money — if the goods keep and you can afford it", "Always lose money", "Is illegal", "Causes deflation"], answer: 0, explain: "Smart for rice or soap, not for tomatoes that spoil." },
      { q: "Deflation means:", options: ["Prices are falling overall", "Prices are rising faster", "Tyres losing air", "Taxes going up"], answer: 0, explain: "The opposite of inflation." },
      { q: "Bread costs ₦2,000. With 10% inflation for 2 years it costs about:", options: ["₦2,200", "₦2,400", "₦2,420", "₦4,000"], answer: 2, explain: "₦2,000 → ₦2,200 → ₦2,420. Inflation compounds too." },
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
      { q: "5% interest a month is roughly how much a year (ignoring compounding)?", options: ["5%", "20%", "60%", "500%"], answer: 2, explain: "5% × 12 months = 60% a year." },
      { q: "A loan app threatens to message all your contacts. In Nigeria you can report it to:", options: ["FCCPC (consumer protection)", "NFF", "WAEC", "Nobody"], answer: 0, explain: "The FCCPC regulates digital lenders and their conduct." },
      { q: "Taking a new loan to repay an old one often leads to:", options: ["A debt trap — what you owe keeps growing", "Free money", "Lower interest", "Nothing"], answer: 0, explain: "Each new loan adds more interest and fees." },
      { q: "Your credit history shows lenders:", options: ["How reliably you repay debts", "Your football skills", "Only your salary", "Your age"], answer: 0, explain: "Repaying on time builds a good record." },
      { q: "With several debts, which should you usually pay off first?", options: ["The one with the highest interest rate", "The one with the lowest rate", "Any random one", "None of them"], answer: 0, explain: "High-interest debt grows fastest." },
      { q: "A friend asks you to be the guarantor for their loan. That means:", options: ["You may have to pay if they don't", "Nothing at all", "You get paid", "You become their boss"], answer: 0, explain: "Only guarantee what you could afford to repay." },
      { q: "You borrow ₦20,000 and a ₦2,000 'processing fee' is deducted upfront. You receive:", options: ["₦22,000", "₦20,000", "₦18,000", "₦2,000"], answer: 2, explain: "Fees taken upfront make a loan more expensive than it looks." },
      { q: "Before borrowing for a want, a better first option is:", options: ["Save up for it over a few weeks", "Borrow from three apps", "Gamble for it", "Use your rent money"], answer: 0, explain: "Saving costs nothing extra; borrowing costs interest." },
      { q: "Missing loan repayments usually leads to:", options: ["Extra fees and a damaged credit record", "Free money", "Lower interest", "Nothing"], answer: 0, explain: "Late payments make future borrowing harder and dearer." },
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
      { q: "A password manager is:", options: ["An app that safely stores unique passwords for you", "A hacker", "A bank", "A virus"], answer: 0, explain: "It remembers strong passwords so you don't have to." },
      { q: "Why is your EMAIL password the most important?", options: ["Email can reset the passwords of your other accounts", "It isn't important", "It holds your photos", "No reason"], answer: 0, explain: "Whoever controls your email can take over everything else." },
      { q: "Which second factor is generally the strongest?", options: ["Codes from an authenticator app", "Password written on your phone case", "SMS to a shared phone", "No second factor"], answer: 0, explain: "App codes are harder to intercept than SMS." },
      { q: "Using your birthday as your PIN is risky because:", options: ["It's easy to guess from social media", "PINs must have letters", "Banks ban numbers", "It isn't risky"], answer: 0, explain: "Your birthday is probably already public." },
      { q: "On a cyber café computer you should:", options: ["Log out and never save passwords", "Tick 'remember me'", "Leave it logged in", "Give the attendant your password"], answer: 0, explain: "The next person could open your account." },
      { q: "Which is risky on unknown public Wi‑Fi?", options: ["Logging into your bank", "Reading the news", "Checking football scores", "Checking the weather"], answer: 0, explain: "Do sensitive things on your own data or a trusted network." },
      { q: "An unexpected email says 'change your password now — click here'. You:", options: ["Open the app or type the website address yourself", "Click the link", "Reply with your password", "Forward it to friends"], answer: 0, explain: "Go in through the front door, not the email's link." },
      { q: "Data-breach checking sites tell you:", options: ["If your email appeared in known data leaks", "Your BVN", "Your exam results", "Your location"], answer: 0, explain: "If you're in a leak, change that password everywhere you used it." },
      { q: "A screen lock on your phone matters because:", options: ["A lost phone opens your banking, chats and email to anyone", "It saves battery", "It looks nice", "It doesn't matter"], answer: 0, explain: "Your phone is the key to your whole digital life." },
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
      { q: "Your social media privacy settings should be:", options: ["Checked so only people you choose see your posts", "Ignored", "Fully public always", "Shared with everyone"], answer: 0, explain: "Review them every few months." },
      { q: "A fun quiz asks your mother's maiden name and your first pet. The danger?", options: ["These are common security questions — scammers collect them", "None, it's fun", "It's required", "It improves memory"], answer: 0, explain: "Fun quizzes can be data harvesting." },
      { q: "When you delete a post:", options: ["It may still exist in screenshots or archives", "It's gone forever everywhere", "It's illegal", "Your followers get paid"], answer: 0, explain: "Think before you post, not after." },
      { q: "Before posting a photo with friends in it you should:", options: ["Ask if they're okay with it", "Post anyway", "Tag their home address", "Make it public"], answer: 0, explain: "Respect other people's footprints too." },
      { q: "Your school uniform or crest in public photos can reveal:", options: ["Where you are most days", "Nothing", "Your bank balance", "Your grades"], answer: 0, explain: "Small details add up to a location." },
      { q: "A positive digital footprint looks like:", options: ["Sharing your projects, skills and helpful posts", "Insulting people", "Posting your ID card", "Spreading rumours"], answer: 0, explain: "Make your search results work for you." },
      { q: "An app wants your contacts and location but doesn't need them. You:", options: ["Deny the permissions it doesn't need", "Always allow", "Allow everything", "Throw away your phone"], answer: 0, explain: "Give apps only what they need." },
      { q: "Location data saved inside photos (geotags) can:", options: ["Reveal exactly where a photo was taken", "Only change the colours", "Do nothing", "Make it HD"], answer: 0, explain: "Turn off location tagging for your camera." },
      { q: "An online friend you've never met wants to meet you alone. Best move?", options: ["Tell a trusted adult; only ever meet in public with someone you trust", "Go alone in secret", "Send your address", "Send them money"], answer: 0, explain: "People online aren't always who they say they are." },
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
      { q: "Which is a FIXED cost?", options: ["Monthly shop rent", "Flour for each loaf", "Packaging for each item", "Fuel per delivery"], answer: 0, explain: "Fixed costs stay the same however much you sell." },
      { q: "Which is a VARIABLE cost?", options: ["Ingredients for each plate", "Shop rent", "Yearly permit", "Signboard"], answer: 0, explain: "Variable costs rise with each sale." },
      { q: "You sell 100 plates at ₦1,500. Each costs ₦1,000 to make and rent is ₦20,000. Profit?", options: ["₦50,000", "₦30,000", "₦150,000", "₦20,000"], answer: 1, explain: "₦150,000 − ₦100,000 − ₦20,000 = ₦30,000." },
      { q: "'Break-even' means:", options: ["Revenue equals costs — no profit, no loss", "The shop is broken", "Maximum profit", "Bankruptcy"], answer: 0, explain: "Sell past break-even to start making profit." },
      { q: "A cash flow problem is when:", options: ["You're profitable on paper but have no cash now because customers still owe you", "You have too much cash", "It's raining", "You get a tax refund"], answer: 0, explain: "Profit and cash in hand are different things." },
      { q: "Customers often buy on credit and don't pay. Best practice?", options: ["Keep records and set clear credit limits", "Give unlimited credit", "Keep no records", "Shout at them"], answer: 0, explain: "Unpaid credit can sink a profitable business." },
      { q: "You sell at ₦2,000 and make ₦500 profit per item. Profit margin?", options: ["25%", "50%", "10%", "400%"], answer: 0, explain: "₦500 ÷ ₦2,000 = 25%." },
      { q: "The most sustainable way to grow a small business is to:", options: ["Reinvest part of the profit", "Spend all profit on a car", "Borrow for parties", "Raise prices tenfold"], answer: 0, explain: "Growth from profit keeps you in control." },
      { q: "Why register your business with the CAC?", options: ["Legal recognition, a business bank account and more customer trust", "It's useless", "To avoid customers", "Free money"], answer: 0, explain: "Registration opens doors to contracts and loans." },
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
      { q: "Before going to the market you should:", options: ["Find out typical prices", "Bring all your savings", "Arrive angry", "Never ask anything"], answer: 0, explain: "Knowledge is leverage." },
      { q: "Buying 10 items instead of 1 lets you:", options: ["Ask for a bulk discount", "Pay more per item", "Nothing", "Skip paying"], answer: 0, explain: "Bigger orders deserve better prices." },
      { q: "The trader won't drop the price. A smart alternative ask:", options: ["Ask for something extra, like free delivery or an extra item", "Insult them", "Walk off with it", "Cry"], answer: 0, explain: "Value can be added without cutting the price." },
      { q: "Staying polite while negotiating:", options: ["Makes the trader more willing to deal", "Shows weakness", "Is illegal", "Raises the price"], answer: 0, explain: "Respect gets better deals." },
      { q: "Your 'walk-away price' is:", options: ["The highest you'll pay before leaving", "The first price you hear", "The trader's cost", "Zero"], answer: 0, explain: "Decide it before you start." },
      { q: "Negotiating pay for your first job, the best approach is:", options: ["Research typical pay for the role and ask politely with reasons", "Accept anything", "Demand double", "Refuse to discuss"], answer: 0, explain: "Evidence plus politeness works." },
      { q: "The trader quickly says 'last price!'. You:", options: ["Can still make one polite offer or walk away", "Must pay it", "Must leave immediately", "Should shout"], answer: 0, explain: "'Last price' is often still a move in the game." },
      { q: "A 'win-win' deal means:", options: ["Both sides feel it was fair", "You cheat them", "They cheat you", "There's no deal"], answer: 0, explain: "Fair deals bring repeat business." },
      { q: "Showing too much excitement about an item:", options: ["Can make the seller hold a higher price", "Lowers the price", "Has no effect", "Gets it free"], answer: 0, explain: "Keep a calm face until the deal is done." },
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
      { q: "Under Nigeria's contributory pension scheme, an employee contributes at least:", options: ["8% of pay", "50% of pay", "0%", "100% of pay"], answer: 0, explain: "Employees put in at least 8%." },
      { q: "Under the same pension scheme, the employer adds at least:", options: ["10% of pay", "1% of pay", "50% of pay", "Nothing"], answer: 0, explain: "Employers contribute at least 10%." },
      { q: "A Tax Identification Number (TIN) is:", options: ["Your unique number for paying tax", "Your bank PIN", "Your phone number", "Your exam number"], answer: 0, explain: "Businesses and workers use it for tax records." },
      { q: "Gross pay ₦150,000. PAYE ₦15,000 and pension ₦12,000 are deducted. Net pay?", options: ["₦123,000", "₦135,000", "₦138,000", "₦177,000"], answer: 0, explain: "₦150,000 − ₦15,000 − ₦12,000 = ₦123,000." },
      { q: "Self-employed traders and freelancers:", options: ["Still need to declare income and pay tax where it applies", "Never pay tax", "Pay their employer's tax", "Only pay in December"], answer: 0, explain: "Tax isn't only for salaried workers." },
      { q: "VAT is:", options: ["A tax added to the price of many goods and services", "Income tax", "Pension", "A traffic fine"], answer: 0, explain: "Value Added Tax is paid when you buy." },
      { q: "Nigeria's standard VAT rate is:", options: ["7.5%", "50%", "1%", "25%"], answer: 0, explain: "Many goods and services carry 7.5% VAT." },
      { q: "Taxes help pay for:", options: ["Roads, schools, hospitals and security", "The tax officer's car", "Nothing", "Only parties"], answer: 0, explain: "Public services run on tax." },
      { q: "Pension savings are meant for:", options: ["Income when you retire", "Weekend fun", "This month's rent", "Your employer"], answer: 0, explain: "Your future self will thank you." },
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
      { q: "The 'excess' (deductible) on a claim is:", options: ["The part of the loss you pay yourself before insurance pays", "The premium", "The insurer's profit", "A bonus"], answer: 0, explain: "A higher excess usually means a lower premium." },
      { q: "Third-party motor insurance in Nigeria is:", options: ["Required by law for vehicles on the road", "Just decoration", "Illegal", "Only for phones"], answer: 0, explain: "It covers damage you cause to other people." },
      { q: "'Making a claim' means:", options: ["Asking the insurer to pay for a covered loss", "Paying your premium", "Cancelling the policy", "Suing your neighbour"], answer: 0, explain: "Keep receipts and report quickly." },
      { q: "Insurance works because:", options: ["Many people pay small premiums and the few with losses get paid", "The government prints money", "Banks lose money", "Magic"], answer: 0, explain: "Risk is shared across many people." },
      { q: "Lying on an insurance form can:", options: ["Cancel your cover, so claims are refused", "Lower your premium safely", "Do nothing", "Win prizes"], answer: 0, explain: "Honesty keeps your cover valid." },
      { q: "Emergency fund vs insurance:", options: ["The fund handles small shocks; insurance handles big ones", "They're the same", "You need neither", "Insurance is for small costs"], answer: 0, explain: "Use both together." },
      { q: "'Exclusions' in a policy are:", options: ["Things the policy does NOT cover", "Bonuses", "Discounts", "Payments to you"], answer: 0, explain: "Read them before you buy." },
      { q: "Microinsurance is:", options: ["Low-cost cover for people with small or irregular incomes", "Insurance for microphones", "Very expensive cover", "Illegal"], answer: 0, explain: "It brings protection to market traders and gig workers." },
      { q: "Drivers with many accidents usually pay:", options: ["Higher premiums", "Lower premiums", "Nothing", "The same as everyone"], answer: 0, explain: "More risk, higher price." },
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
      { q: "Satire websites:", options: ["Publish jokes that can look like real news", "Are always true", "Are run by government", "Are banks"], answer: 0, explain: "Check the site's 'About' page." },
      { q: "A 'deepfake' is:", options: ["AI-made video or audio faking someone's words or actions", "A deep swimming pool", "A bank", "A cartoon"], answer: 0, explain: "Seeing and hearing is no longer proof." },
      { q: "A headline is shocking. Before sharing you should:", options: ["Read the full story, not just the headline", "Only read the comments", "Do nothing", "Add emojis"], answer: 0, explain: "Headlines are written to grab clicks." },
      { q: "Fact-checking organisations:", options: ["Investigate viral claims and publish what's true", "Make fake news", "Sell phones", "Lend money"], answer: 0, explain: "Search the claim plus 'fact check'." },
      { q: "'Hot water cures malaria' is going round. The best source to check is:", options: ["A health worker or an official agency like the NCDC", "A WhatsApp aunty", "A meme", "The comments"], answer: 0, explain: "Health claims need medical sources." },
      { q: "Why check the date of a story?", options: ["Old news is often re-shared as if it's new", "Dates are always fake", "No reason", "It makes it longer"], answer: 0, explain: "Old floods, protests and photos get recycled." },
      { q: "'Confirmation bias' means:", options: ["Believing information more easily when it matches what you already think", "A camera setting", "A news channel", "A virus"], answer: 0, explain: "Be extra careful with news you WANT to be true." },
      { q: "A fake account copying a celebrity often has:", options: ["Small spelling differences in the name or handle", "A government stamp", "Always real followers", "Years of history"], answer: 0, explain: "Check the handle letter by letter." },
      { q: "You shared something false by mistake. You should:", options: ["Delete it and tell people it was false", "Ignore it", "Share more", "Blame others"], answer: 0, explain: "Correcting it stops the spread." },
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
      { q: "Being a 'bystander' online means:", options: ["Seeing bullying and doing nothing", "Helping the target", "Reporting it", "Blocking the bully"], answer: 0, explain: "Silence can feel like approval to a bully." },
      { q: "An 'upstander' is someone who:", options: ["Safely supports the target or reports the bullying", "Joins in", "Laughs", "Shares the post"], answer: 0, explain: "Small actions make a big difference." },
      { q: "Before posting a comment, ask yourself:", options: ["Would I say this to their face?", "Will it get likes?", "Is it long enough?", "Nothing"], answer: 0, explain: "There's a real person behind every screen." },
      { q: "A stranger online asks you for private photos. You:", options: ["Refuse, block, report and tell a trusted adult", "Send them", "Negotiate", "Keep it secret"], answer: 0, explain: "This is never okay — and it's not your fault." },
      { q: "Making a fake account to mock a classmate is:", options: ["Cyberbullying, with serious consequences", "Harmless fun", "Clever", "Allowed"], answer: 0, explain: "It can get you suspended or worse." },
      { q: "In Nigeria, online threats and cyberstalking can be crimes under the:", options: ["Cybercrimes Act", "Football rules", "WAEC rules", "No law"], answer: 0, explain: "Online harm can have real legal consequences." },
      { q: "A friend seems upset after mean comments. A good move:", options: ["Check in privately and listen", "Ignore it", "Tell them to toughen up", "Post about it"], answer: 0, explain: "Feeling heard matters." },
      { q: "A group chat is roasting someone who isn't laughing. You:", options: ["Change the topic or speak up — it's stopped being a joke", "Add more roasts", "Screenshot to share elsewhere", "Join in quietly"], answer: 0, explain: "A joke stops being funny when someone's hurt." },
      { q: "Mean comments about you keep you scrolling for hours. Healthy step?", options: ["Take a break from the app and talk to someone", "Read them all again", "Reply to every one", "Delete your phone"], answer: 0, explain: "Protect your peace first." },
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
      { q: "A daily alajo collects ₦1,000 a day for 31 days and keeps one day's contribution as the fee. You get back:", options: ["₦31,000", "₦30,000", "₦1,000", "₦29,000"], answer: 1, explain: "₦31,000 − ₦1,000 fee = ₦30,000." },
      { q: "In a rotating ajo, the person who collects LAST:", options: ["Has saved the longest — but earns no interest", "Gets double", "Pays nothing", "Loses everything"], answer: 0, explain: "Late collectors are effectively lending to the group." },
      { q: "The benefit of collecting early is:", options: ["A lump sum sooner, like an interest-free loan", "Paying less", "No benefit", "Earning interest"], answer: 0, explain: "Great when you need cash for stock or fees." },
      { q: "Cooperatives buying in bulk together helps because:", options: ["Large orders get lower prices", "Prices go up", "It's illegal", "It wastes money"], answer: 0, explain: "Group buying power cuts costs." },
      { q: "Which is a sign of a RISKY savings group?", options: ["No records, unclear rules and strangers joining", "Written rules", "Members who know each other", "Regular meetings"], answer: 0, explain: "Trust and paperwork go together." },
      { q: "'Adashe' is the name used mainly by:", options: ["Hausa speakers", "Igbo speakers", "Yoruba speakers", "Efik speakers"], answer: 0, explain: "Same idea, many names across Nigeria." },
      { q: "Loans from a cooperative to its members are often:", options: ["Cheaper than loan apps", "Always more expensive", "Illegal", "Free forever"], answer: 0, explain: "Members share the profit, not a stranger." },
      { q: "8 members each pay ₦10,000 weekly. How long until everyone has collected once?", options: ["8 weeks", "10 weeks", "80 weeks", "1 week"], answer: 0, explain: "One payout per week, one per member." },
      { q: "A good ajo rule is:", options: ["Agree the payout order and late-payment penalties in writing", "Keep everything secret", "Change the order randomly", "Have no rules"], answer: 0, explain: "Clear rules prevent fights." },
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
      { q: "Cost ₦600, you sell at ₦900. What's the markup?", options: ["50%", "33%", "300%", "150%"], answer: 0, explain: "₦300 ÷ ₦600 = 50%." },
      { q: "'Penetration pricing' means:", options: ["Starting low to win customers, then adjusting", "Charging the highest price", "Random prices", "Free forever"], answer: 0, explain: "Useful when entering a crowded market." },
      { q: "Premium pricing works best when:", options: ["Your quality or brand is clearly better", "You're new and unknown", "Your product is the same as others", "Never"], answer: 0, explain: "People pay more for clear extra value." },
      { q: "Selling below your cost:", options: ["Loses money on every sale", "Makes it up on volume", "Is fine forever", "Is tax-free"], answer: 0, explain: "More sales just means more losses." },
      { q: "'Bundling' means:", options: ["Selling items together, like a jollof + drink combo", "Packaging in nylon", "Cheaper rent", "Hiding prices"], answer: 0, explain: "Bundles raise the average sale." },
      { q: "Price goes from ₦1,000 to ₦1,100, sales drop from 100 to 98, cost is ₦700. Profit:", options: ["Goes up — from ₦30,000 to ₦39,200", "Goes down", "Stays the same", "Becomes zero"], answer: 0, explain: "100 × ₦300 = ₦30,000 vs 98 × ₦400 = ₦39,200." },
      { q: "Pricing at ₦1,999 instead of ₦2,000:", options: ["Often feels cheaper even though it barely differs", "Is illegal", "Feels exactly the same", "Causes a loss"], answer: 0, explain: "That's psychological pricing." },
      { q: "Costs people often forget when pricing:", options: ["Transport, packaging, their own time and spoiled stock", "None", "Only rent", "The weather"], answer: 0, explain: "Count every cost or profit disappears." },
      { q: "A competitor sells the same item ₦200 cheaper. Instead of a price war you could:", options: ["Compete on quality, service or speed", "Damage their shop", "Sell below cost", "Close down"], answer: 0, explain: "Win on value, not just price." },
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

/** Small repeatable random source (same seed, same order). */
export function seededRandom(seed: number): () => number {
  let t = seed | 0;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** Questions asked per quiz attempt (drawn from a larger pool). */
export const QUIZ_LENGTH = 8;

function shuffled<T>(items: readonly T[], rand: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** The same question with its options in a random order (answer index follows). */
export function shuffleOptions(q: QuizQuestion, rand: () => number = Math.random): QuizQuestion {
  const order = shuffled(q.options.map((_, i) => i), rand);
  return { ...q, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) };
}

/** One attempt: a random subset of the pool, with answer options shuffled. */
export function buildQuiz(lesson: Lesson, rand: () => number = Math.random): QuizQuestion[] {
  return shuffled(lesson.questions ?? [], rand)
    .slice(0, QUIZ_LENGTH)
    .map((q) => shuffleOptions(q, rand));
}

/** Sort cards in a random order for each attempt. */
export const buildSort = (lesson: Lesson, rand: () => number = Math.random): SortCard[] => shuffled(lesson.sort?.cards ?? [], rand);
