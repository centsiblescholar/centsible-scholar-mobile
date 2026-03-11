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
      topic: 'Saving Math'
    },
    {
      id: '7-4',
      question: 'What is a budget?',
      options: ['A type of bank account', 'A plan for how to spend and save money', 'A bill you have to pay', 'A credit card limit'],
      correctAnswer: 1,
      explanation: 'A budget is a plan that helps you decide how much money to spend, save, and share.',
      topic: 'Budgeting Basics'
    },
    {
      id: '7-5',
      question: 'What is the best reason to set a financial goal?',
      options: ['To impress your friends', 'To have a clear target for saving', 'To spend more money', 'To avoid doing chores'],
      correctAnswer: 1,
      explanation: 'Financial goals give you a clear target and motivation to save your money for something important.',
      topic: 'Goal Setting'
    },
    {
      id: '7-6',
      question: 'Which is an example of earning income?',
      options: ['Finding money on the ground', 'Getting paid for mowing lawns', 'Receiving a gift card', 'Winning a contest'],
      correctAnswer: 1,
      explanation: 'Income is money earned through work or services. Mowing lawns is a job that earns income.',
      topic: 'Earning Income'
    },
    {
      id: '7-7',
      question: 'Why is it important to compare prices before buying something?',
      options: ['It wastes time', 'You can find a better deal and save money', 'The cheapest is always the best', 'It only matters for expensive items'],
      correctAnswer: 1,
      explanation: 'Comparing prices helps you find the best value and save money that can be used for other things.',
      topic: 'Smart Shopping'
    },
    {
      id: '7-8',
      question: 'What is opportunity cost?',
      options: ['The price of an item on sale', 'What you give up when you choose one thing over another', 'A fee charged by banks', 'The cost of returning an item'],
      correctAnswer: 1,
      explanation: 'Opportunity cost is what you give up when you make a choice. If you spend $5 on candy, you give up saving that $5.',
      topic: 'Opportunity Cost'
    },
    {
      id: '7-9',
      question: 'What is the safest place to keep your savings?',
      options: ['Under your mattress', 'In a piggy bank', 'In a bank or credit union', 'In your backpack'],
      correctAnswer: 2,
      explanation: 'Banks and credit unions are insured and protect your money. Keeping cash at home risks loss or theft.',
      topic: 'Banking Safety'
    },
    {
      id: '7-10',
      question: 'What does it mean to "pay yourself first"?',
      options: ['Buy yourself a treat before paying bills', 'Put money into savings before spending on wants', 'Pay your bills early', 'Borrow money from yourself'],
      correctAnswer: 1,
      explanation: 'Paying yourself first means putting money into savings as soon as you receive it, before spending on other things.',
      topic: 'Saving Strategy'
    },
    {
      id: '7-11',
      question: 'If a toy costs $15 and is 10% off, what is the sale price?',
      options: ['$5.00', '$10.00', '$13.50', '$14.50'],
      correctAnswer: 2,
      explanation: '10% of $15 is $1.50. Subtract the discount: $15 - $1.50 = $13.50.',
      topic: 'Discounts & Percentages'
    },
    {
      id: '7-12',
      question: 'What is the difference between a debit card and cash?',
      options: ['There is no difference', 'A debit card pulls money directly from your bank account', 'A debit card lets you borrow money', 'Cash is always better'],
      correctAnswer: 1,
      explanation: 'A debit card is linked to your bank account and deducts money directly when you make a purchase, just like spending cash.',
      topic: 'Payment Methods'
    },
    {
      id: '7-13',
      question: 'What is a donation?',
      options: ['Money you lend to a friend', 'Money or goods given to help others without expecting anything back', 'A type of savings account', 'Money the government gives you'],
      correctAnswer: 1,
      explanation: 'A donation is a gift of money or goods to a charity or cause without expecting repayment.',
      topic: 'Giving & Charity'
    },
    {
      id: '7-14',
      question: 'Why should you keep track of how you spend your money?',
      options: ['To show off to friends', 'To understand where your money goes and make better choices', 'Tracking money is not important', 'Only adults need to track spending'],
      correctAnswer: 1,
      explanation: 'Tracking spending helps you see patterns, avoid overspending, and make better decisions with your money.',
      topic: 'Expense Tracking'
    },
    {
      id: '7-15',
      question: 'What is an entrepreneur?',
      options: ['Someone who works for the government', 'A person who starts and runs their own business', 'A type of bank teller', 'Someone who only saves money'],
      correctAnswer: 1,
      explanation: 'An entrepreneur is someone who creates and runs their own business, taking on financial risk to earn profit.',
      topic: 'Entrepreneurship'
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
    },
    {
      id: '8-3',
      question: 'What is the difference between a checking and a savings account?',
      options: ['They are the same thing', 'Checking is for daily transactions; savings is for growing money over time', 'Savings accounts have no interest', 'Checking accounts pay higher interest'],
      correctAnswer: 1,
      explanation: 'Checking accounts are designed for frequent transactions, while savings accounts earn interest and are meant for storing money.',
      topic: 'Bank Accounts'
    },
    {
      id: '8-4',
      question: 'What is inflation?',
      options: ['When prices go down', 'When the value of money decreases and prices rise over time', 'When banks close', 'When you get a raise at work'],
      correctAnswer: 1,
      explanation: 'Inflation means prices for goods and services increase over time, so each dollar buys less than before.',
      topic: 'Inflation'
    },
    {
      id: '8-5',
      question: 'What is an emergency fund?',
      options: ['Money for vacation', 'Money set aside for unexpected expenses', 'A type of investment', 'Money you owe the bank'],
      correctAnswer: 1,
      explanation: 'An emergency fund is savings set aside to cover unexpected costs like medical bills or car repairs.',
      topic: 'Emergency Fund'
    },
    {
      id: '8-6',
      question: 'What does "direct deposit" mean?',
      options: ['Depositing cash at the bank', 'Your paycheck is automatically sent to your bank account', 'Making a deposit at an ATM', 'Saving money in a jar'],
      correctAnswer: 1,
      explanation: 'Direct deposit means your employer sends your paycheck electronically straight into your bank account.',
      topic: 'Direct Deposit'
    },
    {
      id: '8-7',
      question: 'What is a bank fee?',
      options: ['Interest earned on savings', 'A charge the bank makes for certain services', 'Money the government pays banks', 'A reward for good customers'],
      correctAnswer: 1,
      explanation: 'Banks may charge fees for services like overdrafts, ATM use, or maintaining certain account types.',
      topic: 'Banking Fees'
    },
    {
      id: '8-8',
      question: 'If you save $50 per month, how much will you have after one year?',
      options: ['$500', '$600', '$550', '$650'],
      correctAnswer: 1,
      explanation: '$50 saved each month for 12 months equals $600 (not counting any interest earned).',
      topic: 'Saving Calculations'
    },
    {
      id: '8-9',
      question: 'What is a financial institution?',
      options: ['A school that teaches math', 'An organization that provides financial services like banks and credit unions', 'A government building', 'A type of investment'],
      correctAnswer: 1,
      explanation: 'Financial institutions include banks, credit unions, and other organizations that offer financial services.',
      topic: 'Financial Institutions'
    },
    {
      id: '8-10',
      question: 'What is the main purpose of a receipt?',
      options: ['To use as a bookmark', 'To serve as proof of purchase and track spending', 'To get a discount next time', 'Receipts have no purpose'],
      correctAnswer: 1,
      explanation: 'Receipts provide proof of what you bought, when, and for how much, helping you track spending and make returns.',
      topic: 'Record Keeping'
    },
    {
      id: '8-11',
      question: 'What is a credit union?',
      options: ['A type of credit card', 'A member-owned financial institution similar to a bank', 'A government agency', 'A loan company'],
      correctAnswer: 1,
      explanation: 'Credit unions are nonprofit, member-owned institutions that offer similar services to banks, often with lower fees.',
      topic: 'Credit Unions'
    },
    {
      id: '8-12',
      question: 'What is an overdraft?',
      options: ['A type of savings plan', 'When you spend more than what is in your account', 'A bank bonus', 'Extra interest earned'],
      correctAnswer: 1,
      explanation: 'An overdraft occurs when you spend more than your account balance, often resulting in fees.',
      topic: 'Overdrafts'
    },
    {
      id: '8-13',
      question: 'Why is it risky to share your bank account information online?',
      options: ['It is not risky at all', 'Someone could steal your money through fraud', 'Banks encourage sharing', 'It helps you earn more interest'],
      correctAnswer: 1,
      explanation: 'Sharing bank information online can lead to identity theft and unauthorized withdrawals from your account.',
      topic: 'Financial Security'
    },
    {
      id: '8-14',
      question: 'What is the 50/30/20 budgeting rule?',
      options: ['Save 50%, spend 30%, donate 20%', '50% needs, 30% wants, 20% savings', 'Spend 50% on food, 30% on fun, 20% on rent', 'It only applies to adults'],
      correctAnswer: 1,
      explanation: 'The 50/30/20 rule suggests spending 50% on needs, 30% on wants, and saving 20% of your income.',
      topic: 'Budgeting Rules'
    },
    {
      id: '8-15',
      question: 'What does "living within your means" mean?',
      options: ['Only buying luxury items', 'Spending less than or equal to what you earn', 'Borrowing money to buy things', 'Having the most expensive lifestyle'],
      correctAnswer: 1,
      explanation: 'Living within your means is spending no more than you earn, avoiding unnecessary debt.',
      topic: 'Financial Discipline'
    }
  ],
  '9': [
    {
      id: '9-1',
      question: 'What happens if you only pay the minimum on a credit card?',
      options: ['You pay less overall', 'You pay more in interest over time', 'Nothing happens', 'Your credit improves faster'],
      correctAnswer: 1,
      explanation: 'Paying only the minimum means you carry a balance longer and pay more interest over time.',
      topic: 'Credit Cards'
    },
    {
      id: '9-2',
      question: 'What factor has the biggest impact on your credit score?',
      options: ['Your age', 'Payment history', 'Your income', 'Where you live'],
      correctAnswer: 1,
      explanation: 'Payment history accounts for about 35% of your credit score and is the most important factor.',
      topic: 'Credit Scores'
    },
    {
      id: '9-3',
      question: 'What is APR?',
      options: ['Annual Payment Rate', 'Annual Percentage Rate, the yearly cost of borrowing', 'Average Purchase Refund', 'Automatic Payment Request'],
      correctAnswer: 1,
      explanation: 'APR (Annual Percentage Rate) represents the yearly cost of borrowing money, including interest and fees.',
      topic: 'APR'
    },
    {
      id: '9-4',
      question: 'What is the difference between a credit card and a debit card?',
      options: ['They work the same way', 'Credit cards borrow money; debit cards use your own money', 'Debit cards charge interest', 'Credit cards have no fees'],
      correctAnswer: 1,
      explanation: 'Credit cards let you borrow money that must be repaid, while debit cards withdraw directly from your bank account.',
      topic: 'Credit vs Debit'
    },
    {
      id: '9-5',
      question: 'What is a credit report?',
      options: ['A report card from school', 'A record of your borrowing and repayment history', 'A bank statement', 'A list of your savings'],
      correctAnswer: 1,
      explanation: 'A credit report is a detailed record of your credit history, including loans, payments, and accounts.',
      topic: 'Credit Reports'
    },
    {
      id: '9-6',
      question: 'What is identity theft?',
      options: ['Losing your ID card', 'When someone uses your personal information to commit fraud', 'Changing your name legally', 'Forgetting your password'],
      correctAnswer: 1,
      explanation: 'Identity theft occurs when someone steals your personal data to open accounts, make purchases, or commit fraud in your name.',
      topic: 'Identity Theft'
    },
    {
      id: '9-7',
      question: 'What is credit utilization?',
      options: ['How many credit cards you own', 'The percentage of your available credit that you are using', 'Your total credit card debt', 'The interest rate on your card'],
      correctAnswer: 1,
      explanation: 'Credit utilization is the ratio of your credit card balance to your credit limit. Keeping it below 30% helps your score.',
      topic: 'Credit Utilization'
    },
    {
      id: '9-8',
      question: 'Why are payday loans considered risky?',
      options: ['They have low interest rates', 'They charge extremely high interest rates and fees', 'They improve your credit score', 'They are backed by the government'],
      correctAnswer: 1,
      explanation: 'Payday loans often have APRs of 300-400% or more, trapping borrowers in cycles of debt.',
      topic: 'Predatory Lending'
    },
    {
      id: '9-9',
      question: 'What does "cosigning" a loan mean?',
      options: ['Signing the loan twice', 'Agreeing to be responsible for the loan if the borrower cannot pay', 'Getting a lower interest rate', 'Splitting the loan in half'],
      correctAnswer: 1,
      explanation: 'A cosigner agrees to repay the loan if the primary borrower defaults, putting their own credit at risk.',
      topic: 'Cosigning'
    },
    {
      id: '9-10',
      question: 'How often can you get a free credit report?',
      options: ['Never', 'Once a year from each major bureau', 'Only when you apply for a loan', 'Every day'],
      correctAnswer: 1,
      explanation: 'You can request a free credit report once a year from each of the three major bureaus at AnnualCreditReport.com.',
      topic: 'Credit Monitoring'
    },
    {
      id: '9-11',
      question: 'What is a secured credit card?',
      options: ['A card with extra security features', 'A card backed by a cash deposit you make upfront', 'A card that cannot be stolen', 'A card with no spending limit'],
      correctAnswer: 1,
      explanation: 'A secured credit card requires a cash deposit as collateral, making it a good tool for building credit.',
      topic: 'Building Credit'
    },
    {
      id: '9-12',
      question: 'What is the debt snowball method?',
      options: ['Ignoring all your debts', 'Paying off the smallest debt first, then rolling that payment into the next', 'Taking out more loans to cover debt', 'Only paying minimum payments'],
      correctAnswer: 1,
      explanation: 'The debt snowball method focuses on paying off the smallest balance first for quick wins, then applying that payment to the next debt.',
      topic: 'Debt Management'
    },
    {
      id: '9-13',
      question: 'What is a grace period on a credit card?',
      options: ['Extra time to make a purchase', 'The time between your statement date and payment due date when no interest is charged', 'A penalty-free late payment period', 'A waiting period to activate the card'],
      correctAnswer: 1,
      explanation: 'The grace period lets you pay your full balance without interest charges, typically 21-25 days after your statement.',
      topic: 'Credit Card Terms'
    },
    {
      id: '9-14',
      question: 'Which type of loan typically has the lowest interest rate?',
      options: ['Payday loan', 'Credit card cash advance', 'Federal student loan', 'Store credit card'],
      correctAnswer: 2,
      explanation: 'Federal student loans generally have lower interest rates than credit cards or payday loans because they are subsidized by the government.',
      topic: 'Loan Types'
    },
    {
      id: '9-15',
      question: 'What does it mean when debt goes to "collections"?',
      options: ['You collect a reward', 'An unpaid debt is sold to a collection agency that will try to collect it', 'The debt is forgiven', 'You get extra time to pay'],
      correctAnswer: 1,
      explanation: 'When debt goes to collections, the original lender sells it to a collection agency, which then pursues payment and it severely damages your credit.',
      topic: 'Debt Collections'
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
      options: ['Guaranteed profits', 'Reduced risk by spreading investments', 'Higher fees', 'More paperwork'],
      correctAnswer: 1,
      explanation: 'Diversification helps reduce risk by spreading investments across different types of assets.',
      topic: 'Diversification'
    },
    {
      id: '10-3',
      question: 'What is a dividend?',
      options: ['A fee you pay to own stock', 'A portion of company profits paid to shareholders', 'A type of tax', 'The price of a stock'],
      correctAnswer: 1,
      explanation: 'Dividends are payments companies make to shareholders from their profits, providing income from stock ownership.',
      topic: 'Dividends'
    },
    {
      id: '10-4',
      question: 'What is an index fund?',
      options: ['A fund that only invests in one company', 'A fund that tracks a market index like the S&P 500', 'A high-risk hedge fund', 'A government savings bond'],
      correctAnswer: 1,
      explanation: 'An index fund tracks a market index, providing broad diversification at low cost.',
      topic: 'Index Funds'
    },
    {
      id: '10-5',
      question: 'What does "risk vs return" mean in investing?',
      options: ['Higher risk always means you lose money', 'Investments with higher potential returns usually carry higher risk', 'Low-risk investments always have high returns', 'Risk and return are unrelated'],
      correctAnswer: 1,
      explanation: 'Generally, investments with higher potential returns come with higher risk of losing money.',
      topic: 'Risk vs Return'
    },
    {
      id: '10-6',
      question: 'What is a bull market?',
      options: ['A market for livestock', 'A period when stock prices are rising', 'A market crash', 'A type of bond market'],
      correctAnswer: 1,
      explanation: 'A bull market is a period when stock prices are rising and investor confidence is high.',
      topic: 'Market Terms'
    },
    {
      id: '10-7',
      question: 'What is dollar-cost averaging?',
      options: ['Converting currency', 'Investing a fixed amount at regular intervals regardless of price', 'Buying only cheap stocks', 'Averaging your bank balance'],
      correctAnswer: 1,
      explanation: 'Dollar-cost averaging means investing the same amount regularly, which reduces the impact of market volatility.',
      topic: 'Investment Strategies'
    },
    {
      id: '10-8',
      question: 'What is market capitalization?',
      options: ['The total value of a stock exchange', 'The total value of a company calculated by stock price times shares outstanding', 'The maximum amount you can invest', 'A government regulation'],
      correctAnswer: 1,
      explanation: 'Market cap is calculated by multiplying the stock price by the total number of outstanding shares.',
      topic: 'Market Capitalization'
    },
    {
      id: '10-9',
      question: 'What is a brokerage account?',
      options: ['A broken bank account', 'An account used to buy and sell investments like stocks and bonds', 'A type of savings account', 'An account only for businesses'],
      correctAnswer: 1,
      explanation: 'A brokerage account lets you buy and sell investments such as stocks, bonds, and mutual funds.',
      topic: 'Brokerage Accounts'
    },
    {
      id: '10-10',
      question: 'Why is "time in the market" considered important?',
      options: ['Markets only go up', 'Historically, long-term investing tends to produce positive returns despite short-term drops', 'Short-term trading is always better', 'It makes no difference'],
      correctAnswer: 1,
      explanation: 'Over long periods, markets have historically trended upward, rewarding patient investors despite short-term volatility.',
      topic: 'Long-term Investing'
    },
    {
      id: '10-11',
      question: 'What is a bear market?',
      options: ['A market in cold weather', 'A period when stock prices fall 20% or more from recent highs', 'A market for bear-related products', 'A small market decline'],
      correctAnswer: 1,
      explanation: 'A bear market is when stock prices decline 20% or more from recent highs, often accompanied by widespread pessimism.',
      topic: 'Market Cycles'
    },
    {
      id: '10-12',
      question: 'What is a mutual fund?',
      options: ['Money you and a friend share', 'A pool of money from many investors managed by a professional', 'A type of bank account', 'A government investment program'],
      correctAnswer: 1,
      explanation: 'A mutual fund pools money from many investors to buy a diversified portfolio of stocks, bonds, or other securities.',
      topic: 'Mutual Funds'
    },
    {
      id: '10-13',
      question: 'What is a stock exchange?',
      options: ['A place to trade stocks for other items', 'A marketplace where stocks are bought and sold', 'A government office', 'A type of bank'],
      correctAnswer: 1,
      explanation: 'A stock exchange like the NYSE or NASDAQ is a regulated marketplace where buyers and sellers trade stocks.',
      topic: 'Stock Exchanges'
    },
    {
      id: '10-14',
      question: 'What does P/E ratio measure?',
      options: ['Profit and expenses', 'A stock price relative to its earnings per share', 'Performance and efficiency', 'Price and equity'],
      correctAnswer: 1,
      explanation: 'The P/E (Price-to-Earnings) ratio compares a stock price to its earnings, helping assess if it is over- or undervalued.',
      topic: 'Stock Valuation'
    },
    {
      id: '10-15',
      question: 'What is the main risk of putting all your money in one stock?',
      options: ['You earn too much money', 'If that company fails, you could lose everything', 'There is no risk', 'The stock will always go up'],
      correctAnswer: 1,
      explanation: 'Concentrating all investments in one stock means if that company performs poorly, your entire investment is at risk.',
      topic: 'Concentration Risk'
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
    },
    {
      id: '11-3',
      question: 'What is the Rule of 72?',
      options: ['A banking regulation', 'A way to estimate how long it takes to double your money', 'A credit score requirement', 'A tax rule'],
      correctAnswer: 1,
      explanation: 'Divide 72 by your interest rate to estimate years to double your money. At 6%, it takes about 12 years.',
      topic: 'Rule of 72'
    },
    {
      id: '11-4',
      question: 'What is the FAFSA?',
      options: ['A type of student loan', 'The application for federal student financial aid', 'A scholarship program', 'A college entrance exam'],
      correctAnswer: 1,
      explanation: 'The FAFSA (Free Application for Federal Student Aid) determines your eligibility for federal grants, loans, and work-study.',
      topic: 'Financial Aid'
    },
    {
      id: '11-5',
      question: 'What is the difference between a subsidized and unsubsidized student loan?',
      options: ['There is no difference', 'The government pays interest on subsidized loans while you are in school', 'Unsubsidized loans have no interest', 'Subsidized loans cost more'],
      correctAnswer: 1,
      explanation: 'With subsidized loans, the government pays interest while you are in school at least half-time, saving you money.',
      topic: 'Student Loans'
    },
    {
      id: '11-6',
      question: 'What is net worth?',
      options: ['How much money you earn', 'Your total assets minus your total liabilities', 'Your credit score', 'The value of your car'],
      correctAnswer: 1,
      explanation: 'Net worth is calculated by subtracting everything you owe (liabilities) from everything you own (assets).',
      topic: 'Net Worth'
    },
    {
      id: '11-7',
      question: 'What is the time value of money?',
      options: ['Time is more valuable than money', 'A dollar today is worth more than a dollar in the future', 'Money loses value every day', 'You should spend money quickly'],
      correctAnswer: 1,
      explanation: 'Due to earning potential and inflation, money available now is worth more than the same amount in the future.',
      topic: 'Time Value of Money'
    },
    {
      id: '11-8',
      question: 'Why is health insurance important?',
      options: ['It is required by all employers', 'It protects you from high medical costs that could cause financial hardship', 'It is free for everyone', 'It only covers doctor visits'],
      correctAnswer: 1,
      explanation: 'Health insurance protects against potentially devastating medical costs and provides access to preventive care.',
      topic: 'Health Insurance'
    },
    {
      id: '11-9',
      question: 'What is a scholarship?',
      options: ['A type of student loan', 'Free money for education that does not need to be repaid', 'A work-study program', 'A government tax credit'],
      correctAnswer: 1,
      explanation: 'Scholarships are awards based on merit, need, or other criteria that do not need to be repaid.',
      topic: 'Scholarships'
    },
    {
      id: '11-10',
      question: 'What type of insurance protects your family financially if you pass away?',
      options: ['Auto insurance', 'Life insurance', 'Health insurance', 'Renters insurance'],
      correctAnswer: 1,
      explanation: 'Life insurance provides a death benefit to your beneficiaries, helping them financially after your passing.',
      topic: 'Life Insurance'
    },
    {
      id: '11-11',
      question: 'What is a deductible in insurance?',
      options: ['Your monthly premium', 'The amount you pay out of pocket before insurance kicks in', 'A tax deduction', 'The total cost of insurance'],
      correctAnswer: 1,
      explanation: 'A deductible is the amount you must pay out of pocket before your insurance begins covering costs.',
      topic: 'Insurance Terms'
    },
    {
      id: '11-12',
      question: 'What is a premium in insurance?',
      options: ['The best insurance plan', 'The regular payment you make to maintain your insurance coverage', 'A one-time fee', 'The amount insurance pays you'],
      correctAnswer: 1,
      explanation: 'A premium is the recurring amount (monthly, quarterly, or annually) you pay to keep your insurance active.',
      topic: 'Insurance Premiums'
    },
    {
      id: '11-13',
      question: 'If you invest $1,000 at 7% annual return, roughly how much will it be worth in 10 years?',
      options: ['$1,070', '$1,700', '$2,000', '$1,500'],
      correctAnswer: 2,
      explanation: 'Using compound interest, $1,000 at 7% grows to about $1,967 in 10 years, roughly doubling (Rule of 72: 72/7 = ~10 years).',
      topic: 'Compound Growth'
    },
    {
      id: '11-14',
      question: 'What is disability insurance?',
      options: ['Insurance for disabled vehicles', 'Insurance that replaces income if you cannot work due to illness or injury', 'A type of health insurance', 'Insurance for home modifications'],
      correctAnswer: 1,
      explanation: 'Disability insurance provides income replacement if you become unable to work due to illness or injury.',
      topic: 'Disability Insurance'
    },
    {
      id: '11-15',
      question: 'What is the benefit of starting to invest early in life?',
      options: ['There is no benefit', 'More time for compound interest to grow your money', 'Young people get higher returns', 'Banks give bonuses to young investors'],
      correctAnswer: 1,
      explanation: 'Starting early gives compound interest more time to work, potentially turning small contributions into significant wealth.',
      topic: 'Early Investing'
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
      options: ['A penalty for filing late', 'A fixed amount you can subtract from income before taxes', 'Interest on unpaid taxes', 'A type of tax credit'],
      correctAnswer: 1,
      explanation: "The standard deduction is a fixed dollar amount that reduces the income you're taxed on.",
      topic: 'Tax Basics'
    },
    {
      id: '12-3',
      question: 'What is the difference between a W-2 and a 1099?',
      options: ['They are the same', 'W-2 is for employees; 1099 is for independent contractors', 'W-2 is for contractors; 1099 is for employees', '1099 means you pay no taxes'],
      correctAnswer: 1,
      explanation: 'W-2 forms report wages for employees, while 1099 forms report income for independent contractors and freelancers.',
      topic: 'Tax Forms'
    },
    {
      id: '12-4',
      question: 'What is a mortgage?',
      options: ['A type of savings account', 'A loan used to purchase a home', 'A rental agreement', 'A home insurance policy'],
      correctAnswer: 1,
      explanation: 'A mortgage is a loan from a bank or lender specifically for buying a home, paid back over 15-30 years with interest.',
      topic: 'Mortgages'
    },
    {
      id: '12-5',
      question: 'What is an IRA?',
      options: ['International Revenue Account', 'Individual Retirement Account for tax-advantaged savings', 'Immediate Return on Assets', 'Insurance Rate Adjustment'],
      correctAnswer: 1,
      explanation: 'An IRA (Individual Retirement Account) lets you save for retirement with tax advantages.',
      topic: 'Retirement Accounts'
    },
    {
      id: '12-6',
      question: 'What is the typical recommended size of an emergency fund?',
      options: ['$100', '1 month of expenses', '3-6 months of living expenses', '1 year of salary'],
      correctAnswer: 2,
      explanation: 'Financial experts recommend saving 3-6 months of living expenses to cover unexpected job loss or emergencies.',
      topic: 'Emergency Planning'
    },
    {
      id: '12-7',
      question: 'What is a down payment on a home?',
      options: ['A monthly mortgage payment', 'The upfront portion of the home price you pay in cash', 'A penalty for late payment', 'The closing cost fee'],
      correctAnswer: 1,
      explanation: 'A down payment is the upfront cash you pay toward the home price, typically 3-20%, reducing your loan amount.',
      topic: 'Home Buying'
    },
    {
      id: '12-8',
      question: 'What is Social Security?',
      options: ['A private savings account', 'A government program providing retirement and disability benefits', 'A type of life insurance', 'A stock market investment'],
      correctAnswer: 1,
      explanation: 'Social Security is a federal program funded by payroll taxes that provides retirement, disability, and survivor benefits.',
      topic: 'Social Security'
    },
    {
      id: '12-9',
      question: 'What is a Health Savings Account (HSA)?',
      options: ['A regular savings account at a hospital', 'A tax-advantaged account for medical expenses paired with high-deductible health plans', 'A health insurance plan', 'A government health program'],
      correctAnswer: 1,
      explanation: 'An HSA lets you save pre-tax money for medical expenses and offers triple tax advantages: tax-free contributions, growth, and withdrawals for qualified expenses.',
      topic: 'HSA'
    },
    {
      id: '12-10',
      question: 'What are closing costs when buying a home?',
      options: ['The cost to close your bank account', 'Fees paid at the end of a real estate transaction', 'Monthly mortgage payments', 'Moving expenses'],
      correctAnswer: 1,
      explanation: 'Closing costs include lender fees, appraisal, title insurance, and other charges, typically 2-5% of the loan amount.',
      topic: 'Closing Costs'
    },
    {
      id: '12-11',
      question: 'What is the difference between a traditional IRA and a Roth IRA?',
      options: ['They are identical', 'Traditional uses pre-tax money; Roth uses after-tax money with tax-free withdrawals', 'Roth IRA has no contribution limits', 'Traditional IRA is only for employers'],
      correctAnswer: 1,
      explanation: 'Traditional IRA contributions may be tax-deductible now, but withdrawals are taxed. Roth IRA contributions are after-tax, but qualified withdrawals are tax-free.',
      topic: 'IRA Types'
    },
    {
      id: '12-12',
      question: 'What is property tax?',
      options: ['A tax on selling property', 'A tax paid to local government based on the value of your property', 'A one-time home buying fee', 'A federal income tax'],
      correctAnswer: 1,
      explanation: 'Property tax is an annual tax paid to your local government based on the assessed value of your property.',
      topic: 'Property Taxes'
    },
    {
      id: '12-13',
      question: 'Should you lease or buy a car? What is a key advantage of buying?',
      options: ['Buying always costs less monthly', 'You own the car and can sell it later to recover value', 'Buying requires no down payment', 'Leasing gives you ownership'],
      correctAnswer: 1,
      explanation: 'Buying a car means you build equity and can sell or trade it later, unlike leasing where you return the car.',
      topic: 'Lease vs Buy'
    },
    {
      id: '12-14',
      question: 'What is a tax refund?',
      options: ['A bonus from the government', 'Money returned to you because you overpaid taxes during the year', 'A penalty for filing late', 'Free money from the IRS'],
      correctAnswer: 1,
      explanation: 'A tax refund means you paid more in taxes than you owed throughout the year, and the excess is returned to you.',
      topic: 'Tax Refunds'
    },
    {
      id: '12-15',
      question: 'What is renters insurance?',
      options: ['Insurance the landlord buys for you', 'Insurance that covers your personal belongings and liability in a rental', 'Insurance that covers the building structure', 'A required part of your rent'],
      correctAnswer: 1,
      explanation: 'Renters insurance protects your personal property against theft or damage and provides liability coverage in a rental.',
      topic: 'Renters Insurance'
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
    },
    {
      id: '13-3',
      question: 'What is a grace period on student loans?',
      options: ['Extra time to take out another loan', 'A period after graduation before repayment begins', 'A discount on your loan', 'Time to transfer your loan'],
      correctAnswer: 1,
      explanation: 'Most federal student loans have a 6-month grace period after graduation before you must start making payments.',
      topic: 'Student Loan Repayment'
    },
    {
      id: '13-4',
      question: 'What is the difference between a grant and a loan for college?',
      options: ['They are the same', 'Grants do not need to be repaid; loans do', 'Loans are free money', 'Grants charge interest'],
      correctAnswer: 1,
      explanation: 'Grants are free money based on need or merit, while loans must be repaid with interest.',
      topic: 'Financial Aid Types'
    },
    {
      id: '13-5',
      question: 'What is a good strategy for managing textbook costs?',
      options: ['Always buy new from the bookstore', 'Rent, buy used, or use digital versions to save money', 'Skip buying textbooks entirely', 'Borrow your professor copy'],
      correctAnswer: 1,
      explanation: 'Renting, buying used, or choosing digital versions can save hundreds of dollars per semester on textbooks.',
      topic: 'Cost Management'
    },
    {
      id: '13-6',
      question: 'What is income-driven repayment for student loans?',
      options: ['Paying a fixed amount regardless of income', 'A plan that sets payments based on your income and family size', 'Paying off loans before graduation', 'A plan only for high earners'],
      correctAnswer: 1,
      explanation: 'Income-driven repayment plans cap your monthly student loan payments at a percentage of your discretionary income.',
      topic: 'Loan Repayment Plans'
    },
    {
      id: '13-7',
      question: 'Why is it important to understand the total cost of attendance at college?',
      options: ['Tuition is the only cost', 'Total cost includes tuition, housing, food, books, and fees which affects borrowing needs', 'It does not matter', 'Financial aid covers everything'],
      correctAnswer: 1,
      explanation: 'Total cost of attendance includes tuition, room, board, books, supplies, and personal expenses, helping you plan accurately.',
      topic: 'College Costs'
    },
    {
      id: '13-8',
      question: 'What is a work-study program?',
      options: ['Studying while at work', 'A federal program that provides part-time jobs for students with financial need', 'An internship requirement', 'A tutoring program'],
      correctAnswer: 1,
      explanation: 'Federal work-study provides part-time employment for students with financial need, often in campus jobs related to their studies.',
      topic: 'Work-Study'
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
    },
    {
      id: '14-3',
      question: 'What is an expense ratio in a fund?',
      options: ['The fund total value', 'The annual fee charged as a percentage of your investment', 'Your personal expenses', 'The fund minimum investment'],
      correctAnswer: 1,
      explanation: 'The expense ratio is the annual fee a fund charges to cover management and operating costs, expressed as a percentage.',
      topic: 'Fund Fees'
    },
    {
      id: '14-4',
      question: 'What is a target-date fund?',
      options: ['A fund that expires on a specific date', 'A fund that automatically adjusts its asset mix as your retirement date approaches', 'A short-term savings account', 'A fund for day traders'],
      correctAnswer: 1,
      explanation: 'Target-date funds automatically shift from stocks to bonds as you approach retirement, becoming more conservative over time.',
      topic: 'Target-Date Funds'
    },
    {
      id: '14-5',
      question: 'What is capital gains tax?',
      options: ['A tax on your salary', 'A tax on the profit you make from selling an investment', 'A tax on dividends only', 'A tax for opening a brokerage account'],
      correctAnswer: 1,
      explanation: 'Capital gains tax is charged on the profit from selling an investment for more than you paid for it.',
      topic: 'Capital Gains'
    },
    {
      id: '14-6',
      question: 'What is the difference between short-term and long-term capital gains?',
      options: ['There is no difference', 'Short-term (held under 1 year) is taxed at higher rates than long-term', 'Long-term gains are not taxed', 'Short-term gains are tax-free'],
      correctAnswer: 1,
      explanation: 'Assets held less than a year are taxed at ordinary income rates, while those held longer than a year get lower long-term rates.',
      topic: 'Tax-Efficient Investing'
    },
    {
      id: '14-7',
      question: 'What is rebalancing a portfolio?',
      options: ['Selling all investments', 'Adjusting your holdings to maintain your target asset allocation', 'Only buying new investments', 'Moving to a new brokerage'],
      correctAnswer: 1,
      explanation: 'Rebalancing means periodically buying or selling assets to maintain your desired mix of investments.',
      topic: 'Portfolio Management'
    },
    {
      id: '14-8',
      question: 'What is a bond yield?',
      options: ['The bond purchase price', 'The annual return you earn from a bond expressed as a percentage', 'The bond maturity date', 'The bond credit rating'],
      correctAnswer: 1,
      explanation: 'Bond yield is the annual income (interest) from a bond divided by its current price, expressed as a percentage.',
      topic: 'Bond Investing'
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
    },
    {
      id: '15-3',
      question: 'What is quantitative easing?',
      options: ['A math tutoring program', 'When a central bank buys securities to increase money supply and lower interest rates', 'A personal budgeting method', 'A type of stock trading'],
      correctAnswer: 1,
      explanation: 'Quantitative easing is when the Federal Reserve buys government bonds and other securities to inject money into the economy.',
      topic: 'Monetary Policy'
    },
    {
      id: '15-4',
      question: 'What is a yield curve?',
      options: ['A graph of stock prices', 'A graph showing interest rates of bonds with different maturity dates', 'A savings account growth chart', 'A retirement planning tool'],
      correctAnswer: 1,
      explanation: 'The yield curve plots bond yields across different maturities. An inverted yield curve can signal a potential recession.',
      topic: 'Yield Curve'
    },
    {
      id: '15-5',
      question: 'What are Treasury bonds?',
      options: ['Bonds issued by corporations', 'Debt securities issued by the U.S. government', 'Bonds with no interest', 'Junk bonds'],
      correctAnswer: 1,
      explanation: 'Treasury bonds are debt securities issued by the U.S. government, considered among the safest investments available.',
      topic: 'Government Securities'
    },
    {
      id: '15-6',
      question: 'What is the federal funds rate?',
      options: ['The tax rate for federal employees', 'The interest rate at which banks lend to each other overnight', 'The rate of return on savings accounts', 'The rate of inflation'],
      correctAnswer: 1,
      explanation: 'The federal funds rate is the rate banks charge each other for overnight loans, set as a target by the Federal Reserve.',
      topic: 'Interest Rate Policy'
    },
    {
      id: '15-7',
      question: 'What is sector rotation in investing?',
      options: ['Rotating your financial advisor', 'Shifting investments between industry sectors based on economic cycles', 'Only investing in technology', 'Selling everything annually'],
      correctAnswer: 1,
      explanation: 'Sector rotation involves moving investments between different industries to capitalize on different phases of the economic cycle.',
      topic: 'Sector Investing'
    },
    {
      id: '15-8',
      question: 'What is a commodity?',
      options: ['A type of stock', 'A basic physical good like gold, oil, or wheat that is traded on markets', 'A corporate bond', 'A mutual fund category'],
      correctAnswer: 1,
      explanation: 'Commodities are raw materials or agricultural products that can be bought and sold, like gold, oil, corn, and natural gas.',
      topic: 'Commodities'
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
    },
    {
      id: '16-3',
      question: 'What does "vesting" mean for employer retirement contributions?',
      options: ['Wearing a vest to work', 'The process of gaining ownership of employer-contributed funds over time', 'Withdrawing money from your 401(k)', 'Choosing your investments'],
      correctAnswer: 1,
      explanation: 'Vesting determines how much of your employer matching contributions you own based on how long you have worked there.',
      topic: 'Vesting'
    },
    {
      id: '16-4',
      question: 'What is a W-4 form?',
      options: ['A tax return form', 'A form telling your employer how much tax to withhold from your pay', 'A loan application', 'A direct deposit form'],
      correctAnswer: 1,
      explanation: 'The W-4 tells your employer how much federal income tax to withhold from each paycheck based on your situation.',
      topic: 'Tax Withholding'
    },
    {
      id: '16-5',
      question: 'What is the difference between gross pay and net pay?',
      options: ['They are the same', 'Gross is before deductions; net is what you take home after taxes and deductions', 'Net pay is always higher', 'Gross pay is your hourly rate'],
      correctAnswer: 1,
      explanation: 'Gross pay is your total earnings before any deductions. Net pay is what remains after taxes, insurance, and other deductions.',
      topic: 'Paycheck Basics'
    },
    {
      id: '16-6',
      question: 'What is an employer-sponsored health plan?',
      options: ['Free health care', 'Health insurance offered through your employer, often with shared costs', 'A gym membership', 'Medicare'],
      correctAnswer: 1,
      explanation: 'Employer-sponsored health plans are insurance offered by your employer where both you and your employer share the premium costs.',
      topic: 'Employee Benefits'
    },
    {
      id: '16-7',
      question: 'What is a Flexible Spending Account (FSA)?',
      options: ['A flexible savings account at any bank', 'A pre-tax account for medical or dependent care expenses through your employer', 'A retirement account', 'A checking account with no fees'],
      correctAnswer: 1,
      explanation: 'An FSA lets you set aside pre-tax dollars for qualified medical or dependent care expenses, reducing your taxable income.',
      topic: 'FSA'
    },
    {
      id: '16-8',
      question: 'Why is it important to negotiate your salary?',
      options: ['It is rude to negotiate', 'Even a small increase compounds over your career and affects future raises', 'Employers expect you to accept the first offer', 'Negotiating will get the offer rescinded'],
      correctAnswer: 1,
      explanation: 'Negotiating even a few thousand dollars more in starting salary can compound to hundreds of thousands over a career.',
      topic: 'Salary Negotiation'
    }
  ],
  '17': [
    {
      id: '17-1',
      question: 'What is NPV (Net Present Value) used for?',
      options: ['Calculating taxes', 'Evaluating investment profitability by comparing present value of cash flows to cost', 'Determining credit scores', 'Setting budgets'],
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
    },
    {
      id: '17-3',
      question: 'What is the Sharpe Ratio?',
      options: ['A measure of stock price', 'A measure of risk-adjusted return', 'A type of dividend', 'A bond rating'],
      correctAnswer: 1,
      explanation: 'The Sharpe Ratio measures return per unit of risk, helping investors compare the efficiency of different investments.',
      topic: 'Risk Metrics'
    },
    {
      id: '17-4',
      question: 'What is a hedge fund?',
      options: ['A fund for landscaping', 'A private investment fund using advanced strategies for high-net-worth investors', 'A type of mutual fund', 'A government savings program'],
      correctAnswer: 1,
      explanation: 'Hedge funds are private investment vehicles that use complex strategies and are typically available only to accredited investors.',
      topic: 'Alternative Investments'
    },
    {
      id: '17-5',
      question: 'What is an options contract?',
      options: ['A list of investment options', 'A contract giving the right, but not obligation, to buy or sell an asset at a set price', 'A type of savings bond', 'A retirement plan choice'],
      correctAnswer: 1,
      explanation: 'Options give the holder the right to buy (call) or sell (put) an asset at a predetermined price within a specific timeframe.',
      topic: 'Options'
    },
    {
      id: '17-6',
      question: 'What is the Internal Rate of Return (IRR)?',
      options: ['The interest rate on a savings account', 'The discount rate that makes the NPV of an investment equal to zero', 'The inflation rate', 'The federal funds rate'],
      correctAnswer: 1,
      explanation: 'IRR is the rate at which the present value of future cash flows equals the initial investment cost.',
      topic: 'IRR'
    },
    {
      id: '17-7',
      question: 'What is a fiduciary?',
      options: ['A type of investment', 'A person legally required to act in your best financial interest', 'A government regulator', 'A bank manager'],
      correctAnswer: 1,
      explanation: 'A fiduciary is legally obligated to put your financial interests ahead of their own when giving advice.',
      topic: 'Financial Advisors'
    },
    {
      id: '17-8',
      question: 'What is private equity?',
      options: ['Publicly traded stocks', 'Investments in companies that are not listed on public stock exchanges', 'Personal savings', 'Government bonds'],
      correctAnswer: 1,
      explanation: 'Private equity involves investing in private companies, often with the goal of restructuring and eventually selling for profit.',
      topic: 'Private Equity'
    }
  ],
  '18': [
    {
      id: '18-1',
      question: 'What are multi-factor models used for in finance?',
      options: ['Simple addition', 'Analyzing investment performance and risk using multiple variables', 'Calculating basic interest', 'Personal budgeting'],
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
    },
    {
      id: '18-3',
      question: 'What is a derivative in finance?',
      options: ['A copy of a financial document', 'A financial contract whose value is derived from an underlying asset', 'A type of bank account', 'A tax calculation method'],
      correctAnswer: 1,
      explanation: 'Derivatives are financial instruments like options and futures whose value is based on (derived from) an underlying asset.',
      topic: 'Derivatives'
    },
    {
      id: '18-4',
      question: 'What is Modern Portfolio Theory (MPT)?',
      options: ['A way to pick the newest stocks', 'A framework for constructing portfolios that maximize return for a given level of risk', 'A social media investment strategy', 'A government regulation'],
      correctAnswer: 1,
      explanation: 'MPT, developed by Harry Markowitz, shows how to build an optimal portfolio by balancing risk and return through diversification.',
      topic: 'Portfolio Theory'
    },
    {
      id: '18-5',
      question: 'What is the efficient market hypothesis?',
      options: ['Markets are always efficient at delivering goods', 'Stock prices reflect all available information, making it hard to consistently beat the market', 'Only efficient companies are listed on exchanges', 'Markets close early on efficient days'],
      correctAnswer: 1,
      explanation: 'The efficient market hypothesis suggests that stock prices already reflect all known information, making outperformance through stock picking difficult.',
      topic: 'Market Efficiency'
    },
    {
      id: '18-6',
      question: 'What is venture capital?',
      options: ['Capital of a city', 'Funding provided to early-stage startups with high growth potential', 'A type of government grant', 'Long-term bond investing'],
      correctAnswer: 1,
      explanation: 'Venture capital is funding from investors to startups and small businesses with high growth potential in exchange for equity.',
      topic: 'Venture Capital'
    },
    {
      id: '18-7',
      question: 'What is the difference between systematic and unsystematic risk?',
      options: ['There is no difference', 'Systematic affects the whole market; unsystematic is specific to a company or industry', 'Unsystematic risk is worse', 'Systematic risk can be diversified away'],
      correctAnswer: 1,
      explanation: 'Systematic risk (market risk) affects all investments and cannot be diversified away, while unsystematic risk is company-specific and can be reduced through diversification.',
      topic: 'Risk Types'
    },
    {
      id: '18-8',
      question: 'What is behavioral finance?',
      options: ['Finance for behavioral therapists', 'The study of how psychological biases affect financial decisions', 'A type of investment strategy', 'A banking regulation'],
      correctAnswer: 1,
      explanation: 'Behavioral finance studies how cognitive biases and emotions lead to irrational financial decisions, challenging traditional economic theory.',
      topic: 'Behavioral Finance'
    }
  ]
};
