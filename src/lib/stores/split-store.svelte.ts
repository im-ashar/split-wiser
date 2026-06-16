import type {
	Person,
	SplitwiseGroup,
	SplitwiseMember
} from '$lib/types/splitwise';
import { calculateTotals } from '$lib/split/calculate-totals';

function makeStore() {
	let persons = $state<Person[]>([]);
	let selectedGroup = $state<SplitwiseGroup | null>(null);
	let selectedGroupMembers = $state<SplitwiseMember[]>([]);
	let selectedPayer = $state<SplitwiseMember | null>(null);
	let gstPercentage = $state<number | undefined>(undefined);
	let discountOnTotalBill = $state<number | undefined>(undefined);
	let showBillCards = $state(false);

	const totals = $derived(
		calculateTotals({ persons, gstPercentage, discountOnTotalBill })
	);

	const isManualFlow = $derived(
		!(selectedGroup && selectedGroupMembers.length > 0)
	);

	function recompute() {
		const r = calculateTotals({ persons, gstPercentage, discountOnTotalBill });
		persons = r.persons;
	}

	function addAmount(personId: number) {
		const i = persons.findIndex((p) => p.id === personId);
		if (i === -1) return;
		const next = [...persons];
		next[i] = {
			...next[i]!,
			listOfAmounts: [
				...next[i]!.listOfAmounts,
				{ id: Date.now() + Math.random(), amount: undefined }
			]
		};
		persons = next;
	}

	function removeAmount(personId: number, amountId: number) {
		const i = persons.findIndex((p) => p.id === personId);
		if (i === -1) return;
		const next = [...persons];
		next[i] = {
			...next[i]!,
			listOfAmounts: next[i]!.listOfAmounts.filter((a) => a.id !== amountId)
		};
		persons = next;
		recompute();
	}

	function setAmount(personId: number, amountId: number, value: number | undefined) {
		const i = persons.findIndex((p) => p.id === personId);
		if (i === -1) return;
		const next = [...persons];
		const rows = next[i]!.listOfAmounts.map((a) =>
			a.id === amountId ? { ...a, amount: value } : a
		);
		next[i] = { ...next[i]!, listOfAmounts: rows };
		persons = next;
		recompute();
	}

	function addPersons(newPersons: Person[]) {
		persons = [...newPersons].sort((a, b) => a.name.localeCompare(b.name));
		showBillCards = true;
	}

	function addNonGroupPerson(name: string) {
		const trimmed = name.trim();
		if (!trimmed || persons.some((p) => p.name === trimmed)) return false;
		persons = [
			...persons,
			{
				id: Date.now(),
				name: trimmed,
				totalAmount: 0,
				listOfAmounts: [],
				isNonGroupMember: true
			}
		].sort((a, b) => a.name.localeCompare(b.name));
		return true;
	}

	function applyMultiPersonItemAmount(participantIds: number[], amount: number) {
		persons = persons.map((p) =>
			participantIds.includes(p.id)
				? {
						...p,
						listOfAmounts: [
							...p.listOfAmounts,
							{ id: Date.now() + Math.random(), amount }
						]
					}
				: p
		);
		recompute();
	}

	function reset() {
		persons = [];
		selectedGroup = null;
		selectedGroupMembers = [];
		selectedPayer = null;
		gstPercentage = undefined;
		discountOnTotalBill = undefined;
		showBillCards = false;
	}

	return {
		get persons() {
			return persons;
		},
		set persons(v: Person[]) {
			persons = v;
		},
		get selectedGroup() {
			return selectedGroup;
		},
		set selectedGroup(v: SplitwiseGroup | null) {
			selectedGroup = v;
			selectedGroupMembers = [];
			selectedPayer = null;
		},
		get selectedGroupMembers() {
			return selectedGroupMembers;
		},
		set selectedGroupMembers(v: SplitwiseMember[]) {
			selectedGroupMembers = v;
		},
		get selectedPayer() {
			return selectedPayer;
		},
		set selectedPayer(v: SplitwiseMember | null) {
			selectedPayer = v;
		},
		get gstPercentage() {
			return gstPercentage;
		},
		set gstPercentage(v: number | undefined) {
			gstPercentage = v;
			recompute();
		},
		get discountOnTotalBill() {
			return discountOnTotalBill;
		},
		set discountOnTotalBill(v: number | undefined) {
			discountOnTotalBill = v;
			recompute();
		},
		get showBillCards() {
			return showBillCards;
		},
		set showBillCards(v: boolean) {
			showBillCards = v;
		},
		get totalBill() {
			return totals.totalBill;
		},
		get isManualFlow() {
			return isManualFlow;
		},
		addAmount,
		removeAmount,
		setAmount,
		addPersons,
		addNonGroupPerson,
		applyMultiPersonItemAmount,
		recompute,
		reset
	};
}

export const splitStore = makeStore();
