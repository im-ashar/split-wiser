export interface Person {
  id: number;
  name: string;
  totalAmount: number;
  listOfAmounts: Amount[];
  isIncludedInDividedAmount: boolean;
}

export interface Amount {
  id: number;
  amount: number;
}
