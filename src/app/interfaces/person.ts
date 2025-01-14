export interface Person {
  id: number;
  name: string;
  totalAmount: number;
  listOfAmounts: Amount[];
}

export interface Amount {
  id: number;
  amount: number | undefined;
}

