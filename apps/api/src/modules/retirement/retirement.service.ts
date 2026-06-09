import { BadRequestException, Injectable } from '@nestjs/common';
import { RetirementProjectionInput } from '@finpilot/shared';

function randomNormal(mean: number, stdDev: number) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

@Injectable()
export class RetirementService {
  project(input: RetirementProjectionInput) {
    if (input.retirementAge <= input.currentAge) {
      throw new BadRequestException('Retirement age must be greater than current age');
    }

    const yearsToRetirement = input.retirementAge - input.currentAge;
    const monthsToRetirement = yearsToRetirement * 12;
    const annualReturn = input.expectedReturn;
    const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;
    const monthlyStdDev = annualReturn * 0.15 / Math.sqrt(12);

    const deterministic = this.deterministicProjection(
      input.currentSavings,
      input.monthlyContribution,
      monthlyReturn,
      monthsToRetirement,
    );

    const simulationResults: number[] = [];
    for (let sim = 0; sim < input.simulations; sim++) {
      let balance = input.currentSavings;
      for (let m = 0; m < monthsToRetirement; m++) {
        const r = randomNormal(monthlyReturn, monthlyStdDev);
        balance = balance * (1 + r) + input.monthlyContribution;
      }
      simulationResults.push(balance);
    }

    simulationResults.sort((a, b) => a - b);
    const medianIndex = Math.floor(simulationResults.length / 2);
    const medianCorpus = simulationResults[medianIndex];
    const p10 = simulationResults[Math.floor(simulationResults.length * 0.1)];
    const p90 = simulationResults[Math.floor(simulationResults.length * 0.9)];

    const safeWithdrawalAmount = medianCorpus * input.safeWithdrawalRate;
    const requiredCorpus =
      input.annualExpensesInRetirement / input.safeWithdrawalRate;
    const successProbability =
      simulationResults.filter((v) => v >= requiredCorpus).length /
      simulationResults.length;

    const inflationAdjustedExpenses =
      input.annualExpensesInRetirement *
      Math.pow(1 + input.inflationRate, yearsToRetirement);

    const yearlyProjection = [];
    let balance = input.currentSavings;
    for (let year = 0; year <= yearsToRetirement; year++) {
      yearlyProjection.push({
        age: input.currentAge + year,
        balance: Math.round(balance * 100) / 100,
      });
      for (let m = 0; m < 12; m++) {
        balance = balance * (1 + monthlyReturn) + input.monthlyContribution;
      }
    }

    return {
      yearsToRetirement,
      deterministicCorpusAtRetirement: Math.round(deterministic * 100) / 100,
      monteCarlo: {
        medianCorpus: Math.round(medianCorpus * 100) / 100,
        p10: Math.round(p10 * 100) / 100,
        p90: Math.round(p90 * 100) / 100,
        successProbability: Math.round(successProbability * 1000) / 10,
        simulations: input.simulations,
      },
      safeWithdrawal: {
        rate: input.safeWithdrawalRate,
        annualAmount: Math.round(safeWithdrawalAmount * 100) / 100,
        requiredCorpus: Math.round(requiredCorpus * 100) / 100,
        meetsGoal: medianCorpus >= requiredCorpus,
      },
      inflationAdjustedExpenses: Math.round(inflationAdjustedExpenses * 100) / 100,
      yearlyProjection,
      inputs: input,
    };
  }

  private deterministicProjection(
    savings: number,
    monthlyContribution: number,
    monthlyReturn: number,
    months: number,
  ) {
    let balance = savings;
    for (let m = 0; m < months; m++) {
      balance = balance * (1 + monthlyReturn) + monthlyContribution;
    }
    return balance;
  }
}
