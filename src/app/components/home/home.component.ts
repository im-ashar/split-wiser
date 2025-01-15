import {lucideCheck, lucideChevronDown, lucideChevronUp, lucideCirclePlus} from '@ng-icons/lucide';
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
  providers: [provideIcons({lucideCheck, lucideChevronDown, lucideChevronUp, lucideCirclePlus})],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  persons: Person[] = [];
  numberOfPersons: number | undefined;
  shouldShowBillCards: boolean = false;
  shouldShowInputs: boolean = false;
  enableGenerateCardButton: boolean = false;
  gstPercentage: number | undefined;
  totalBill: number = 0;
  selectedPersons: Person[] = [];
  itemPrice: number | undefined;

  generateNameInput(): void {
    if (this.numberOfPersons === undefined || this.numberOfPersons <= 1) {
      alert("Please enter a valid count of persons");
      return;
    }

    if (this.numberOfPersons && this.numberOfPersons > this.persons.length) {
      // Add new inputs
      for (let i = this.persons.length; i < this.numberOfPersons; i++) {
        this.persons.push({
          id: i,
          name: '',
          totalAmount: 0,
          listOfAmounts: [],
        });
      }
    } else if (this.numberOfPersons && this.numberOfPersons < this.persons.length) {
      // Remove extra inputs
      this.persons.splice(this.numberOfPersons);
    }

    this.shouldShowInputs = true;
    this.verifyInputs();
  }

  generateBillCards() {
    this.shouldShowBillCards = true;
  }

  generateAvatar(userName: string): string {
    return `https://avatar.iran.liara.run/public/boy?username=${userName}`;
  }

  verifyInputs(): void {
    const names = this.persons.map(person => person.name.trim());
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
        this.totalBill += person.totalAmount;
      });
    } else {
      this.persons.forEach(person => {
        person.totalAmount = person.listOfAmounts.reduce((sum, amount) => sum + (amount.amount ?? 0), 0);
        this.totalBill += person.totalAmount;
      });
    }
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
      const amountPerPerson = Number((this.itemPrice / this.selectedPersons.length).toFixed(2));
      this.selectedPersons.forEach(person => {
        const personToUpdate = this.persons.find(p => p.id === person.id);
        if (personToUpdate) {
          personToUpdate.listOfAmounts.push({id: Math.random(), amount: amountPerPerson});
          personToUpdate.totalAmount += amountPerPerson;
        }
      });
      this.totalBill += this.itemPrice;
      this.itemPrice = undefined;
      this.selectedPersons = []
    }
  }
}
