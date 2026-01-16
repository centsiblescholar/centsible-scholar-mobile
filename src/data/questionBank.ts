export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
}

export const questionBank: Record<string, Question[]> = {
  '7': [
    {
      id: '7-1',
      question: 'What is the most important thing to do with money you earn?',
      options: ['Spend it all immediately', 'Save some of it', 'Give it all away', 'Hide it under your bed'],
      correctAnswer: 1,
      explanation: 'Saving some of your money helps you prepare for future needs and builds good financial habits.',
      topic: 'Basic Saving'
    },
    {
      id: '7-2',
      question: 'Which of these is a "need" versus a "want"?',
      options: ['Video games', 'Food', 'Candy', 'Toys'],
      correctAnswer: 1,
      explanation: 'Food is essential for survival, making it a need. The others are wants that we enjoy but can live without.',
      topic: 'Needs vs Wants'
    },
    {
      id: '7-3',
      question: 'If you have $10 and want to save 20%, how much should you save?',
      options: ['$1', '$2', '$5', '$10'],
      correctAnswer: 1,
      explanation: '20% of $10 is $2. This means saving $2 and having $8 to spend.',
      topic: 'Opportunity Cost'
    }
  ],
  '8': [
    {
      id: '8-1',
      question: 'What is interest in a savings account?',
      options: ['Money you pay the bank', 'Money the bank pays you', 'A bank fee', 'Money you lose'],
      correctAnswer: 1,
      explanation: 'Interest is money the bank pays you for keeping your money in their savings account.',
      topic: 'Simple Interest'
    },
    {
      id: '8-2',
      question: 'What does FDIC insurance protect?',
      options: ['Your car', 'Your bank deposits up to $250,000', 'Your credit score', 'Your house'],
      correctAnswer: 1,
      explanation: 'FDIC insurance protects your bank deposits up to $250,000 per depositor, per bank, if the bank fails.',
      topic: 'FDIC Insurance'
    }
  ],
  '9': [
    {
      id: '9-1',
      question: 'What happens if you only pay the minimum on a credit card?',
      options: ['You pay less overall', 'You pay more in interest', 'Nothing happens', 'Your credit improves'],
      correctAnswer: 1,
      explanation: 'Paying only the minimum means you carry a balance longer and pay more interest over time.',
      topic: 'Credit vs Debit'
    },
    {
      id: '9-2',
      question: 'What factor has the biggest impact on your credit score?',
      options: ['Your age', 'Payment history', 'Your income', 'Where you live'],
      correctAnswer: 1,
      explanation: 'Payment history accounts for about 35% of your credit score and is the most important factor.',
      topic: 'Credit Scores'
    }
  ],
  '10': [
    {
      id: '10-1',
      question: 'What is the main difference between stocks and bonds?',
      options: ['Stocks are safer', 'Bonds represent ownership, stocks represent debt', 'Stocks represent ownership, bonds represent debt', 'There is no difference'],
      correctAnswer: 2,
      explanation: 'Stocks represent ownership in a company, while bonds represent debt (you loan money to the issuer).',
      topic: 'Stocks & Bonds'
    },
    {
      id: '10-2',
      question: 'What is the main benefit of diversification?',
      options: ['Guaranteed profits', 'Reduced risk', 'Higher fees', 'More paperwork'],
      correctAnswer: 1,
      explanation: 'Diversification helps reduce risk by spreading investments across different types of assets.',
      topic: 'Diversification'
    }
  ],
  '11': [
    {
      id: '11-1',
      question: 'What is a 529 plan used for?',
      options: ['Buying a car', 'College expenses', 'Retirement', 'Buying a house'],
      correctAnswer: 1,
      explanation: '529 plans are tax-advantaged savings accounts specifically designed for education expenses.',
      topic: '529 Plans'
    },
    {
      id: '11-2',
      question: 'How does compound interest differ from simple interest?',
      options: ["It's the same thing", 'Compound interest earns interest on interest', 'Simple interest is better', 'Compound interest is only for loans'],
      correctAnswer: 1,
      explanation: 'Compound interest earns interest on both the original amount and previously earned interest, making money grow faster.',
      topic: 'Compound Interest'
    }
  ],
  '12': [
    {
      id: '12-1',
      question: 'When comparing renting vs buying a home, what is a key advantage of renting?',
      options: ['Building equity', 'Lower upfront costs', 'Tax deductions', 'Complete control over property'],
      correctAnswer: 1,
      explanation: 'Renting typically requires much lower upfront costs compared to buying (no down payment, closing costs, etc.).',
      topic: 'Rent vs Buy'
    },
    {
      id: '12-2',
      question: 'What is the standard deduction on tax returns?',
      options: ['A penalty for filing late', 'A fixed amount you can subtract from income', 'Interest on unpaid taxes', 'A type of tax credit'],
      correctAnswer: 1,
      explanation: "The standard deduction is a fixed dollar amount that reduces the income you're taxed on.",
      topic: 'Tax Basics'
    }
  ],
  '13': [
    {
      id: '13-1',
      question: 'As a college student, what should be your top budgeting priority?',
      options: ['Entertainment expenses', 'Essential needs like food and housing', 'Latest technology', 'Spring break trips'],
      correctAnswer: 1,
      explanation: 'College students should prioritize essential needs in their budget before considering discretionary spending.',
      topic: 'Student Budgeting'
    },
    {
      id: '13-2',
      question: 'What is the best way to build credit as a college student?',
      options: ['Take out multiple loans', 'Get a student credit card and pay it off monthly', 'Avoid all credit products', 'Only use debit cards'],
      correctAnswer: 1,
      explanation: 'A student credit card used responsibly (paying off the full balance monthly) helps build positive credit history.',
      topic: 'Credit Building'
    }
  ],
  '14': [
    {
      id: '14-1',
      question: 'What does asset allocation mean in investing?',
      options: ['Buying only one type of investment', 'Dividing investments among different asset classes', 'Selling all investments', 'Only investing in real estate'],
      correctAnswer: 1,
      explanation: 'Asset allocation involves dividing your investments among different asset classes like stocks, bonds, and cash to manage risk.',
      topic: 'Asset Allocation'
    },
    {
      id: '14-2',
      question: 'What does "beta" measure in stock investing?',
      options: ['Company profits', 'Stock volatility relative to market', 'Dividend payments', 'Stock price'],
      correctAnswer: 1,
      explanation: "Beta measures how much a stock's price moves compared to the overall market. A beta of 1 means it moves with the market.",
      topic: 'Beta & Alpha'
    }
  ],
  '15': [
    {
      id: '15-1',
      question: 'How does Federal Reserve policy affect personal investments?',
      options: ['It has no effect', 'Interest rate changes affect bond and stock prices', 'Only affects government bonds', 'Only affects international investments'],
      correctAnswer: 1,
      explanation: 'Federal Reserve interest rate decisions directly impact bond yields and indirectly affect stock valuations and market conditions.',
      topic: 'Federal Reserve Policy'
    },
    {
      id: '15-2',
      question: 'What is the main advantage of ETFs over mutual funds?',
      options: ['Higher returns guaranteed', 'Lower expense ratios and more trading flexibility', 'No risk involved', 'Government backing'],
      correctAnswer: 1,
      explanation: 'ETFs typically have lower expense ratios than mutual funds and can be traded throughout the day like stocks.',
      topic: 'ETFs vs Mutual Funds'
    }
  ],
  '16': [
    {
      id: '16-1',
      question: 'When evaluating a job offer, what should you consider besides salary?',
      options: ['Only the salary amount', 'Benefits, 401(k) match, health insurance, and growth opportunities', 'Just the company name', 'Only the location'],
      correctAnswer: 1,
      explanation: 'Total compensation includes salary, benefits, retirement matching, health insurance, and career development opportunities.',
      topic: 'Job Offer Analysis'
    },
    {
      id: '16-2',
      question: 'What is the typical employer 401(k) matching strategy?',
      options: ['Match 100% of all contributions', 'Match a percentage up to a certain limit', 'No matching ever', 'Match only after 10 years'],
      correctAnswer: 1,
      explanation: 'Most employers match a percentage of your contribution up to a certain percentage of your salary (like 50% match up to 6%).',
      topic: '401(k) Strategy'
    }
  ],
  '17': [
    {
      id: '17-1',
      question: 'What is NPV (Net Present Value) used for?',
      options: ['Calculating taxes', 'Evaluating investment profitability', 'Determining credit scores', 'Setting budgets'],
      correctAnswer: 1,
      explanation: 'NPV helps evaluate whether an investment will be profitable by calculating the present value of future cash flows minus the initial investment.',
      topic: 'NPV & IRR'
    },
    {
      id: '17-2',
      question: 'What is a REIT?',
      options: ['Real Estate Investment Trust', 'Retirement Equity Investment Tool', 'Risk Evaluation Index Test', 'Regional Economic Improvement Tax'],
      correctAnswer: 0,
      explanation: 'A REIT is a Real Estate Investment Trust that allows you to invest in real estate without directly owning property.',
      topic: 'REITs'
    }
  ],
  '18': [
    {
      id: '18-1',
      question: 'What are multi-factor models used for in finance?',
      options: ['Simple addition', 'Analyzing investment performance and risk', 'Calculating basic interest', 'Personal budgeting'],
      correctAnswer: 1,
      explanation: 'Multi-factor models help explain investment returns and assess risk by considering multiple economic factors simultaneously.',
      topic: 'Multi-factor Models'
    },
    {
      id: '18-2',
      question: 'What does ESG stand for in investing?',
      options: ['Economic Stability Guidelines', 'Environmental, Social, and Governance', 'Emergency Savings Goals', 'Equity Sharing Guidelines'],
      correctAnswer: 1,
      explanation: 'ESG investing considers Environmental, Social, and Governance factors alongside financial returns when making investment decisions.',
      topic: 'ESG Investing'
    }
  ]
};
