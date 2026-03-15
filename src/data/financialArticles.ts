/**
 * Financial education articles organized by age group
 * Content for the "Learn More" section of the Learn tab
 */

export interface FinancialArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  ageGroup: 'elementary' | 'middle' | 'high' | 'all';
  category: 'saving' | 'spending' | 'earning' | 'investing' | 'budgeting';
  emoji: string;
  readTimeMinutes: number;
}

export const FINANCIAL_ARTICLES: FinancialArticle[] = [
  // Elementary (Grades K-5)
  {
    id: 'wants-vs-needs',
    title: 'Wants vs. Needs',
    summary: 'Learn the difference between things you need and things you want.',
    content: `Every day, we see things we'd like to buy. But not everything is equally important!\n\n**Needs** are things you must have to live safely and healthily: food, water, a home, clothes, and school supplies.\n\n**Wants** are things that are nice to have but you can live without: toys, video games, candy, or the newest sneakers.\n\nHere's a trick: Before you buy something, ask yourself, "Can I live without this?" If the answer is yes, it's a want!\n\n**Try This:** Make two lists - one for needs and one for wants. You might be surprised which list is longer!`,
    ageGroup: 'elementary',
    category: 'spending',
    emoji: '🤔',
    readTimeMinutes: 2,
  },
  {
    id: 'saving-for-goals',
    title: 'Saving for Something Special',
    summary: 'How to save money for something you really want.',
    content: `Have you ever really wanted something but didn't have enough money? That's where saving comes in!\n\n**Step 1: Pick Your Goal**\nChoose something you really want. Write it down and put a picture of it where you can see it.\n\n**Step 2: Find Out the Price**\nHow much does it cost? This is your savings target.\n\n**Step 3: Make a Plan**\nIf you save a little bit each week, how many weeks will it take? For example, if something costs $20 and you save $5 per week, you'll have it in 4 weeks!\n\n**Step 4: Be Patient**\nSaving takes time, but the feeling when you finally buy it with YOUR money is amazing!`,
    ageGroup: 'elementary',
    category: 'saving',
    emoji: '🐷',
    readTimeMinutes: 2,
  },

  // Middle School (Grades 6-8)
  {
    id: 'intro-to-budgeting',
    title: 'Your First Budget',
    summary: 'A simple guide to tracking where your money goes.',
    content: `A budget is just a plan for your money. It helps you make sure you have enough for the things that matter.\n\n**The 50/30/20 Rule (Simplified)**\nIn Centsible Scholar, your allocation works like this:\n- 15% goes to Taxes (yes, even adults pay taxes!)\n- 10% goes to Retirement (saving for way in the future)\n- 25% goes to Savings (building your safety net)\n- 50% is Discretionary (your spending money)\n\nThis teaches you that you don't keep all the money you earn. Understanding this now gives you a huge advantage!\n\n**Why Budget?**\nWithout a budget, money just... disappears. With a budget, you're in control. You decide where every dollar goes instead of wondering where it went.`,
    ageGroup: 'middle',
    category: 'budgeting',
    emoji: '📊',
    readTimeMinutes: 3,
  },
  {
    id: 'compound-growth',
    title: 'The Magic of Compound Growth',
    summary: 'How your money can grow on its own over time.',
    content: `Here's a mind-blowing fact: if you save $10 per week starting at age 13, and it grows at 7% per year, you could have over $150,000 by age 50!\n\n**How Does It Work?**\nWhen you save or invest money, it earns interest. Then THAT interest earns interest too. It's like a snowball rolling downhill - it keeps getting bigger!\n\n**Example:**\n- Year 1: You save $100, earn $7 in interest = $107\n- Year 2: Your $107 earns $7.49 = $114.49\n- Year 3: Your $114.49 earns $8.01 = $122.50\n\nSee how the growth gets faster each year? That's compound growth!\n\n**The Secret:** Time is your superpower. The earlier you start, the more time your money has to grow. Even small amounts add up to big numbers over decades.`,
    ageGroup: 'middle',
    category: 'investing',
    emoji: '📈',
    readTimeMinutes: 3,
  },

  // High School (Grades 9-12)
  {
    id: 'understanding-taxes',
    title: 'Why We Pay Taxes',
    summary: 'What taxes are, where they go, and why they matter.',
    content: `In Centsible Scholar, 15% of your earnings go to taxes. But why?\n\n**What Are Taxes?**\nTaxes are payments made to the government. Every working person pays them.\n\n**Where Do Taxes Go?**\n- Schools and education\n- Roads, bridges, and public transportation\n- Police, fire departments, and emergency services\n- National defense\n- Healthcare programs\n- Parks and public spaces\n\n**Types of Taxes You'll Encounter:**\n- **Income Tax:** Taken from your paycheck (federal + state)\n- **Sales Tax:** Added when you buy things\n- **Property Tax:** Paid by homeowners\n- **Social Security/Medicare:** Funds retirement and healthcare\n\n**Tax Brackets:** The more you earn, the higher percentage you pay on the extra money. This is called a progressive tax system.\n\nUnderstanding taxes now means fewer surprises when you get your first real paycheck!`,
    ageGroup: 'high',
    category: 'earning',
    emoji: '🏛️',
    readTimeMinutes: 4,
  },
  {
    id: 'building-credit',
    title: 'Credit Scores Explained',
    summary: 'What a credit score is and why it matters for your future.',
    content: `A credit score is a number (300-850) that tells lenders how likely you are to pay back money you borrow.\n\n**Why It Matters:**\n- Renting an apartment\n- Getting a car loan\n- Lower interest rates on everything\n- Some employers check credit scores\n- Better insurance rates\n\n**The Five Factors:**\n1. **Payment History (35%)** - Do you pay on time? Always.\n2. **Amount Owed (30%)** - Don't max out your credit cards\n3. **Length of History (15%)** - Longer is better\n4. **New Credit (10%)** - Don't open too many accounts at once\n5. **Credit Mix (10%)** - Different types of credit\n\n**Building Good Credit Early:**\n- Become an authorized user on a parent's card\n- Get a secured credit card at 18\n- Always pay the full balance\n- Never spend more than 30% of your limit\n\nGood credit is like a financial superpower. Start building it wisely!`,
    ageGroup: 'high',
    category: 'spending',
    emoji: '💳',
    readTimeMinutes: 4,
  },

  // All Ages
  {
    id: 'emergency-fund',
    title: 'Emergency Fund Basics',
    summary: 'Why having money saved for surprises is important.',
    content: `Life is full of surprises - and not all of them are good! An emergency fund is money set aside for unexpected expenses.\n\n**What Counts as an Emergency?**\n- Your phone breaks\n- You need to fix your bike or car\n- An unexpected school expense\n- A family situation\n\n**What's NOT an Emergency?**\n- A sale on something you want\n- A new game release\n- Going out with friends\n\n**How Much to Save:**\nStart small! Even $50 saved can help in a pinch. As you get older, aim for 3-6 months of expenses.\n\n**Where to Keep It:**\nSomewhere safe and easy to access, but NOT in your wallet! A savings account is perfect.\n\nThe peace of mind from knowing you're prepared is worth more than anything you could buy!`,
    ageGroup: 'all',
    category: 'saving',
    emoji: '🛡️',
    readTimeMinutes: 3,
  },
  {
    id: 'smart-spending',
    title: 'Smart Spending Habits',
    summary: 'Tips for making your money go further.',
    content: `Being smart with money isn't about never spending - it's about spending wisely!\n\n**The 24-Hour Rule:**\nWant to buy something that costs more than $20? Wait 24 hours. If you still want it tomorrow, it might be worth it.\n\n**Compare Before You Buy:**\nDon't buy the first thing you see. Check different stores, look for sales, and read reviews.\n\n**Track Your Spending:**\nWrite down what you spend for a month. You'll be surprised where your money goes!\n\n**The Value Test:**\nBefore buying, ask: "How many hours of work does this cost me?" If your allowance is $5/hour and shoes cost $100, that's 20 hours of work. Is it worth it?\n\n**Free Fun Exists:**\nNot everything fun costs money. Parks, libraries, free events, and hanging out with friends can be just as fun as spending.`,
    ageGroup: 'all',
    category: 'spending',
    emoji: '🧠',
    readTimeMinutes: 3,
  },
];

export function getArticlesForGradeLevel(gradeLevel?: string): FinancialArticle[] {
  if (!gradeLevel) return FINANCIAL_ARTICLES;

  const lower = gradeLevel.toLowerCase();
  let ageGroup: 'elementary' | 'middle' | 'high' | 'all' = 'all';

  const num = parseInt(lower.replace(/\D/g, ''), 10);
  if (!isNaN(num)) {
    if (num <= 5) ageGroup = 'elementary';
    else if (num <= 8) ageGroup = 'middle';
    else ageGroup = 'high';
  } else if (lower.includes('k') || lower.includes('kindergarten')) {
    ageGroup = 'elementary';
  } else if (['freshman', 'sophomore', 'junior', 'senior'].some(g => lower.includes(g))) {
    ageGroup = 'high';
  }

  return FINANCIAL_ARTICLES.filter(a => a.ageGroup === ageGroup || a.ageGroup === 'all');
}
