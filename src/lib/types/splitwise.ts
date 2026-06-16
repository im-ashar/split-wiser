export interface AmountRow {
	id: number;
	amount: number | undefined;
}

export interface Person {
	id: number;
	name: string;
	totalAmount: number;
	listOfAmounts: AmountRow[];
	splitwiseUserId?: number;
	splitwiseMember?: SplitwiseMember;
	isNonGroupMember?: boolean;
}

export interface SplitwiseMember {
	id: number;
	first_name: string;
	last_name: string;
	email?: string;
	user_id?: number;
	picture?: {
		small?: string;
		medium?: string;
		large?: string;
	};
}

export interface SplitwiseGroup {
	id: number;
	name: string;
	members: SplitwiseMember[];
}

export interface SplitwiseExpense {
	id: number;
	description: string;
	cost: string;
	currencyCode: string;
	groupId: number | null;
	date: string;
	createdAt: string;
	createdBy: number | null;
	users: Array<{
		userId: number;
		paidShare: string;
		owedShare: string;
		netBalance: string;
	}>;
}

export interface SplitwiseFriend {
	id: number;
	firstName: string;
	lastName: string;
	email?: string;
	avatar?: string;
	balance: Array<{ currencyCode: string; amount: string }>;
}

export interface SplitwiseComment {
	id: number;
	content: string;
	createdAt: string;
	commentType: string;
	relationType: string;
	relationId: number;
	user: {
		id: number;
		firstName: string;
		lastName: string;
		avatar?: string;
	};
}

export interface SplitwiseNotification {
	id: number;
	type: number;
	createdAt: string;
	createdBy: number;
	source: { type: string; id: number; url?: string } | null;
	imageUrl?: string;
	imageShape?: string;
	content: string;
}

export interface SplitwiseCurrency {
	currencyCode: string;
	unit: string;
}

export interface SplitwiseCategory {
	id: number;
	name: string;
	icon?: string;
	subcategories: Array<{ id: number; name: string; icon?: string }>;
}
