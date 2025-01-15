import {lucideCheck, lucideChevronDown, lucideChevronUp, lucideCirclePlus, lucideCircleX} from '@ng-icons/lucide';
import {HlmButtonDirective} from '@spartan-ng/ui-button-helm';
import {Component} from '@angular/core';
import {
  HlmCardContentDirective,
  HlmCardDescriptionDirective,
  HlmCardDirective,
  HlmCardFooterDirective,
  HlmCardHeaderDirective,
  HlmCardImports,
  HlmCardTitleDirective,
} from '@spartan-ng/ui-card-helm';
import {HlmIconComponent, provideIcons} from '@spartan-ng/ui-icon-helm';
import {HlmInputDirective} from '@spartan-ng/ui-input-helm';
import {HlmLabelDirective} from '@spartan-ng/ui-label-helm';
import {FormsModule} from '@angular/forms';
import {Person} from '../../interfaces/person';
import {HlmBadgeDirective} from '@spartan-ng/ui-badge-helm';
import {NgOptimizedImage} from '@angular/common';
import {BrnDialogContentDirective, BrnDialogTriggerDirective} from '@spartan-ng/brain/dialog';
import {
  HlmDialogComponent,
  HlmDialogContentComponent, HlmDialogDescriptionDirective,
  HlmDialogFooterComponent,
  HlmDialogHeaderComponent, HlmDialogTitleDirective
} from '@spartan-ng/ui-dialog-helm';
import {BrnSelectImports} from '@spartan-ng/brain/select';
import {HlmSelectImports} from '@spartan-ng/ui-select-helm';

@Component({
  selector: 'home-component',
  standalone: true,
  imports: [
    BrnDialogTriggerDirective,
    HlmDialogComponent,
    HlmDialogContentComponent,
    HlmDialogHeaderComponent,
    HlmDialogFooterComponent,
    HlmDialogTitleDirective,
    HlmDialogDescriptionDirective,
    HlmLabelDirective,
    HlmInputDirective,
    HlmButtonDirective,
    HlmCardDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    HlmCardDescriptionDirective,
    HlmInputDirective,
    HlmCardFooterDirective,
    HlmIconComponent,
    HlmButtonDirective,
    HlmCardContentDirective,
    HlmCardImports,
    HlmLabelDirective,
    FormsModule,
    HlmBadgeDirective,
    NgOptimizedImage,
    BrnSelectImports,
    HlmSelectImports,
    BrnDialogContentDirective,
  ],
  providers: [provideIcons({lucideCheck, lucideChevronDown, lucideChevronUp, lucideCirclePlus, lucideCircleX})],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  persons: Person[] = [];
  inputPersons: Person[] = [];
  numberOfPersons: number | undefined;
  shouldShowBillCards: boolean = false;
  shouldShowInputs: boolean = false;
  enableGenerateCardButton: boolean = false;
  gstPercentage: number | undefined;
  totalBill: number = 0;
  selectedPersons: Person[] = [];
  itemPrice: number | undefined;
  itemDiscount: number | undefined;
  discountOnTotalBill: number | undefined;

  generateNameInput(): void {
    if (this.numberOfPersons === undefined || this.numberOfPersons <= 1) {
      alert("Please enter a valid count of persons");
      return;
    }

    if (this.numberOfPersons && this.numberOfPersons > this.inputPersons.length) {
      // Add new inputs
      for (let i = this.inputPersons.length; i < this.numberOfPersons; i++) {
        this.inputPersons.push({
          id: i,
          name: '',
          totalAmount: 0,
          listOfAmounts: [],
        });
      }
    } else if (this.numberOfPersons && this.numberOfPersons < this.inputPersons.length) {
      // Remove extra inputs
      this.inputPersons.splice(this.numberOfPersons);
    }
    this.shouldShowInputs = true;
    this.verifyInputs();
  }

  generateBillCards() {
    this.persons = [...this.inputPersons];
    this.persons = this.persons.sort((a, b) => a.name.localeCompare(b.name));
    this.shouldShowBillCards = true;
  }

  generateAvatar(userName: string): string {
    return `https://avatar.iran.liara.run/public/boy?username=${userName}`;
  }
  capitalizeName(name: string): string {
    return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  }
  verifyInputs(): void {
    this.inputPersons.forEach(person => {
      person.name = this.capitalizeName(person.name.trim());
    });
    const names = this.inputPersons.map(person => person.name);
    const uniqueNames = new Set(names);
    this.enableGenerateCardButton = names.length === uniqueNames.size && names.every(name => name !== '');
  }
  addNewAmountInput(id: number): void {
    const person = this.persons.find(p => p.id === id);
    if (person) {
      person.listOfAmounts.push({id: Math.random(), amount: undefined});
    }
  }

  calculateBill(): void {
    // Calculate total bill with GST applied
    if (this.gstPercentage && this.gstPercentage > 0) {
      this.persons.forEach(person => {
        person.totalAmount = person.listOfAmounts.reduce((sum, amount) => {
          const gstAmount = (amount.amount ?? 0) * (this.gstPercentage! / 100);
          const amountWithGST = (amount.amount ?? 0) + gstAmount;
          return sum + amountWithGST;
        }, 0);
      });
    } else {
      this.persons.forEach(person => {
        person.totalAmount = person.listOfAmounts.reduce((sum, amount) => sum + (amount.amount ?? 0), 0);
      });
    }
    if (this.discountOnTotalBill && this.discountOnTotalBill > 0) {
      this.persons.forEach(person => {
        person.totalAmount -= person.totalAmount * (this.discountOnTotalBill! / 100);
      });
    }
    this.totalBill = this.persons.reduce((sum, person) => sum + person.totalAmount, 0);
  }

  resetEverything(): void {
    this.persons = [];
    this.numberOfPersons = undefined;
    this.shouldShowBillCards = false;
    this.shouldShowInputs = false;
    this.enableGenerateCardButton = false;
    this.gstPercentage = undefined;
    this.totalBill = 0;
    this.selectedPersons = [];
    this.itemPrice = undefined;
    this.itemDiscount = undefined;
    this.inputPersons = [];
    this.discountOnTotalBill = undefined;
  }

  selectAllPersons() {
    this.selectedPersons = [...this.persons];
  }

  addToAmountList(): void {
    if (this.itemPrice && this.itemPrice > 0 && this.selectedPersons?.length > 0) {
      this.selectedPersons = Array.from(
        new Map(
          this.selectedPersons
            .flat()
            .map(person => [person.id, person])
        ).values()
      );
      let amountPerPerson = Number((this.itemPrice / this.selectedPersons.length).toFixed(2));
      const discountPercentageOnItem = this.itemDiscount && this.itemDiscount > 0 ? this.itemDiscount : 0;
      amountPerPerson -= amountPerPerson * (discountPercentageOnItem / 100);
      this.selectedPersons.forEach(person => {
        const personToUpdate = this.persons.find(p => p.id === person.id);
        if (personToUpdate) {
          personToUpdate.listOfAmounts.push({id: Math.random(), amount: amountPerPerson});
          personToUpdate.totalAmount += amountPerPerson;
        }
      });
      this.totalBill += this.itemPrice;
      this.itemPrice = undefined;
      this.itemDiscount = undefined;
      this.selectedPersons = []
    }
  }

  removeAmountInput(personId: number, amountId: number): void {
    const person = this.persons.find(p => p.id === personId);
    if (person) {
      person.listOfAmounts = person.listOfAmounts.filter(amount => amount.id !== amountId);
      this.calculateBill();
    }
  }
}
