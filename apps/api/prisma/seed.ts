import {
  PrismaClient,
  AccountType,
  TransactionType,
  CurrencyCode,
  UserRole,
  GoalStatus,
  InvestmentType,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { DEFAULT_CATEGORIES, CATEGORIZATION_RULES } from '@finpilot/shared';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { slug: cat.slug, isSystem: true },
    });
    if (!existing) {
      await prisma.category.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          color: cat.color,
          isSystem: true,
        },
      });
    }
  }

  const categories = await prisma.category.findMany({ where: { isSystem: true } });
  const categoryBySlug = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  for (const rule of CATEGORIZATION_RULES) {
    const categoryId = categoryBySlug[rule.categorySlug];
    if (!categoryId) continue;

    const existing = await prisma.categorizationRule.findFirst({
      where: { pattern: rule.pattern, isSystem: true },
    });
    if (!existing) {
      await prisma.categorizationRule.create({
        data: { pattern: rule.pattern, categoryId, isSystem: true },
      });
    }
  }

  const passwordHash = await bcrypt.hash('Demo1234', 12);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@finpilot.ai' },
    update: {},
    create: {
      email: 'demo@finpilot.ai',
      passwordHash,
      firstName: 'Demo',
      lastName: 'User',
      role: UserRole.USER,
      defaultCurrency: CurrencyCode.INR,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@finpilot.ai' },
    update: {},
    create: {
      email: 'admin@finpilot.ai',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      defaultCurrency: CurrencyCode.USD,
    },
  });

  const existingAccounts = await prisma.account.count({ where: { userId: demoUser.id } });
  if (existingAccounts === 0) {
    const savings = await prisma.account.create({
      data: {
        userId: demoUser.id,
        name: 'HDFC Savings',
        type: AccountType.SAVINGS,
        institution: 'HDFC Bank',
        balance: new Decimal(450000),
        currency: CurrencyCode.INR,
      },
    });

    const current = await prisma.account.create({
      data: {
        userId: demoUser.id,
        name: 'Chase Checking',
        type: AccountType.CURRENT,
        institution: 'Chase',
        balance: new Decimal(12500),
        currency: CurrencyCode.USD,
      },
    });

    const creditCard = await prisma.account.create({
      data: {
        userId: demoUser.id,
        name: 'Amex Credit Card',
        type: AccountType.CREDIT_CARD,
        institution: 'American Express',
        balance: new Decimal(3200),
        currency: CurrencyCode.USD,
      },
    });

    const investment = await prisma.account.create({
      data: {
        userId: demoUser.id,
        name: 'Zerodha Investment',
        type: AccountType.INVESTMENT,
        institution: 'Zerodha',
        balance: new Decimal(850000),
        currency: CurrencyCode.INR,
      },
    });

    const foodCat = categoryBySlug['food'];
    const transportCat = categoryBySlug['transportation'];
    const shoppingCat = categoryBySlug['shopping'];
    const incomeCat = categoryBySlug['investments'];

    const now = new Date();
    const transactions = [
      { accountId: savings.id, amount: 850, type: TransactionType.EXPENSE, merchant: 'SWIGGY', categoryId: foodCat, daysAgo: 1 },
      { accountId: savings.id, amount: 450, type: TransactionType.EXPENSE, merchant: 'UBER', categoryId: transportCat, daysAgo: 2 },
      { accountId: savings.id, amount: 3200, type: TransactionType.EXPENSE, merchant: 'AMAZON', categoryId: shoppingCat, daysAgo: 3 },
      { accountId: savings.id, amount: 1200, type: TransactionType.EXPENSE, merchant: 'ZOMATO', categoryId: foodCat, daysAgo: 5 },
      { accountId: savings.id, amount: 75000, type: TransactionType.INCOME, merchant: 'Salary', categoryId: incomeCat, daysAgo: 10 },
      { accountId: current.id, amount: 89.99, type: TransactionType.EXPENSE, merchant: 'NETFLIX', categoryId: categoryBySlug['entertainment'], daysAgo: 4 },
      { accountId: current.id, amount: 5200, type: TransactionType.INCOME, merchant: 'Freelance', categoryId: incomeCat, daysAgo: 8 },
      { accountId: creditCard.id, amount: 156.50, type: TransactionType.EXPENSE, merchant: 'AMAZON', categoryId: shoppingCat, daysAgo: 6 },
    ];

    for (const tx of transactions) {
      const date = new Date(now);
      date.setDate(date.getDate() - tx.daysAgo);

      let merchantId: string | undefined;
      if (tx.merchant) {
        const merchant = await prisma.merchant.upsert({
          where: { name: tx.merchant.toUpperCase() },
          update: {},
          create: { name: tx.merchant.toUpperCase() },
        });
        merchantId = merchant.id;
      }

      await prisma.transaction.create({
        data: {
          userId: demoUser.id,
          accountId: tx.accountId,
          amount: new Decimal(tx.amount),
          date,
          merchantId,
          merchantName: tx.merchant,
          categoryId: tx.categoryId,
          type: tx.type,
        },
      });
    }

    console.log(`Created demo accounts and ${transactions.length} transactions`);
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const existingBudgets = await prisma.budget.count({ where: { userId: demoUser.id } });
  if (existingBudgets === 0) {
    const budgetCategories = [
      { slug: 'food', amount: 8000 },
      { slug: 'transportation', amount: 3000 },
      { slug: 'shopping', amount: 5000 },
      { slug: 'entertainment', amount: 2000 },
    ];

    for (const b of budgetCategories) {
      const catId = categoryBySlug[b.slug];
      if (!catId) continue;
      await prisma.budget.create({
        data: {
          userId: demoUser.id,
          categoryId: catId,
          amount: new Decimal(b.amount),
          month,
          year,
          currency: CurrencyCode.INR,
        },
      });
    }
    console.log('Created demo budgets');
  }

  const existingGoals = await prisma.goal.count({ where: { userId: demoUser.id } });
  if (existingGoals === 0) {
    const targetDate = new Date(now);
    targetDate.setFullYear(targetDate.getFullYear() + 2);

    await prisma.goal.create({
      data: {
        userId: demoUser.id,
        name: 'Emergency Fund',
        targetAmount: new Decimal(500000),
        currentSavings: new Decimal(180000),
        monthlyContribution: new Decimal(15000),
        targetDate,
        currency: CurrencyCode.INR,
        status: GoalStatus.ACTIVE,
      },
    });

    const houseDate = new Date(now);
    houseDate.setFullYear(houseDate.getFullYear() + 5);
    await prisma.goal.create({
      data: {
        userId: demoUser.id,
        name: 'Buy a House',
        targetAmount: new Decimal(5000000),
        currentSavings: new Decimal(850000),
        monthlyContribution: new Decimal(25000),
        targetDate: houseDate,
        currency: CurrencyCode.INR,
        status: GoalStatus.ACTIVE,
      },
    });
    console.log('Created demo goals');
  }

  const existingInvestments = await prisma.investment.count({ where: { userId: demoUser.id } });
  if (existingInvestments === 0) {
    const nifty = await prisma.investment.create({
      data: {
        userId: demoUser.id,
        name: 'Nifty 50 Index Fund',
        type: InvestmentType.MUTUAL_FUND,
        symbol: 'NIFTYBEES',
        currency: CurrencyCode.INR,
      },
    });

    await prisma.holding.create({
      data: {
        investmentId: nifty.id,
        quantity: new Decimal(150),
        averageCost: new Decimal(220),
        currentPrice: new Decimal(268),
      },
    });

    const apple = await prisma.investment.create({
      data: {
        userId: demoUser.id,
        name: 'Apple Inc.',
        type: InvestmentType.STOCK,
        symbol: 'AAPL',
        currency: CurrencyCode.USD,
      },
    });

    await prisma.holding.create({
      data: {
        investmentId: apple.id,
        quantity: new Decimal(25),
        averageCost: new Decimal(175),
        currentPrice: new Decimal(198),
      },
    });

    const gold = await prisma.investment.create({
      data: {
        userId: demoUser.id,
        name: 'Gold ETF',
        type: InvestmentType.GOLD,
        symbol: 'GOLDBEES',
        currency: CurrencyCode.INR,
      },
    });

    await prisma.holding.create({
      data: {
        investmentId: gold.id,
        quantity: new Decimal(50),
        averageCost: new Decimal(58),
        currentPrice: new Decimal(62),
      },
    });

    console.log('Created demo investments and holdings');
  }

  const existingInsights = await prisma.insight.count({ where: { userId: demoUser.id } });
  if (existingInsights === 0) {
    await prisma.insight.createMany({
      data: [
        {
          userId: demoUser.id,
          title: 'Positive savings rate',
          message: "You're saving consistently this month — great progress toward your Emergency Fund goal.",
          type: 'savings',
        },
        {
          userId: demoUser.id,
          title: 'Approaching limit: Food & Dining',
          message: "You're at 85% of your Food & Dining budget with time left this month.",
          type: 'budget_warning',
          metadata: { categoryId: categoryBySlug['food'], percentUsed: 85 },
        },
        {
          userId: demoUser.id,
          title: 'Portfolio performing well',
          message: 'Your Nifty 50 Index Fund is up 22% from cost basis. Consider rebalancing if allocation drift exceeds 5%.',
          type: 'investment',
        },
      ],
    });
    console.log('Created demo insights');
  }

  const existingNotifications = await prisma.notification.count({ where: { userId: demoUser.id } });
  if (existingNotifications === 0) {
    await prisma.notification.createMany({
      data: [
        {
          userId: demoUser.id,
          title: 'Welcome to FinPilot AI',
          message: 'Your personal CFO is ready. Try the AI Copilot or generate financial forecasts.',
          channel: 'IN_APP',
        },
        {
          userId: demoUser.id,
          title: 'Budget alert: Food & Dining',
          message: "You've used 85% of your Food & Dining budget this month.",
          channel: 'IN_APP',
          metadata: { type: 'budget_warning' },
        },
      ],
    });
    console.log('Created demo notifications');
  }

  console.log('Seed complete!');
  console.log('Demo user: demo@finpilot.ai / Demo1234');
  console.log('Admin user: admin@finpilot.ai / Demo1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
