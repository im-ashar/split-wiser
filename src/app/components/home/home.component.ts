import {lucideCheck, lucideChevronDown, lucideCirclePlus} from '@ng-icons/lucide';
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
import {HlmCommandImports} from '@spartan-ng/ui-command-helm';
import {HlmIconComponent, provideIcons} from '@spartan-ng/ui-icon-helm';
import {HlmInputDirective} from '@spartan-ng/ui-input-helm';
import {HlmLabelDirective} from '@spartan-ng/ui-label-helm';
import {FormsModule} from '@angular/forms';
import {Person} from '../../interfaces/person';
import {HlmCheckboxComponent} from '@spartan-ng/ui-checkbox-helm';
import {HlmBadgeDirective} from '@spartan-ng/ui-badge-helm';
import {NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'home-component',
  standalone: true,
  imports: [
    HlmCommandImports,
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
    HlmCheckboxComponent,
    HlmBadgeDirective,
    NgOptimizedImage
  ],
  providers: [provideIcons({lucideCheck, lucideChevronDown, lucideCirclePlus})],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  persons: Person[] = [];
  numberOfPersons: number = 0;
  shouldShowBillCards: boolean = false;
  shouldShowInputs: boolean = false;
  enableGenerateCardButton: boolean = false;
  gstPercentage: number = 0;
  amountToBeDividedToEveryone: number = 0;
  totalBill: number = 0;

  generateNameInput(): void {
    if (this.numberOfPersons <= 1) {
      alert("Please enter a valid count of persons");
      return;
    }

    if (this.numberOfPersons > this.persons.length) {
      // Add new inputs
      for (let i = this.persons.length; i < this.numberOfPersons; i++) {
        this.persons.push({
          id: i,
          name: '',
          totalAmount: 0,
          listOfAmounts: [{id: Math.random(), amount: 0}],
          isIncludedInDividedAmount: true
        });
      }
    } else if (this.numberOfPersons < this.persons.length) {
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
    this.enableGenerateCardButton = this.persons.every(person => person.name.trim() !== '');
  }

  addNewAmountInput(id: number): void {
    const person = this.persons.find(p => p.id === id);
    if (person) {
      person.listOfAmounts.push({id: Math.random(), amount: 0});
    }
  }

  calculateBill(): void {
    // Calculate total bill with GST applied
    this.persons.forEach(person => {
      person.totalAmount = person.listOfAmounts.reduce((sum, amount) => {
        const gstAmount = amount.amount * this.gstPercentage / 100;
        const amountWithGST = this.gstPercentage > 0 ? amount.amount + gstAmount : amount.amount;
        return sum + amountWithGST;
      }, 0);
      this.totalBill += person.totalAmount;
    });

    // Calculate the amount to be added to each person
    if (this.amountToBeDividedToEveryone > 0) {
      const excludedPersons = this.persons.filter(person => !person.isIncludedInDividedAmount);
      const includedPersons = this.persons.filter(person => person.isIncludedInDividedAmount);
      const amountPerPerson = this.amountToBeDividedToEveryone / includedPersons.length;
      // Add the divided amount to each included person's total amount
      includedPersons.forEach(person => {
        person.totalAmount += amountPerPerson;
      });
      this.totalBill += this.amountToBeDividedToEveryone;
      this.persons = [...excludedPersons, ...includedPersons];
    }
    this.persons.sort((a, b) => a.id - b.id);
  }

  resetEverything(): void {
    this.persons = [];
    this.numberOfPersons = 0;
    this.shouldShowBillCards = false;
    this.shouldShowInputs = false;
    this.enableGenerateCardButton = false;
    this.gstPercentage = 0;
    this.amountToBeDividedToEveryone = 0;
    this.totalBill = 0;
  }
}
