// ATMSystem.js

class Card {
  constructor(cardNumber, pin, accountNumber) {
    this.cardNumber = cardNumber;
    this.pin = pin;
    this.accountNumber = accountNumber;
  }

  getCardNumber() {
    return this.cardNumber;
  }

  getPin() {
    return this.pin;
  }

  getAccountNumber() {
    return this.accountNumber;
  }
}

class Account {
  constructor(accountNumber, balance = 0) {
    this.accountNumber = accountNumber;
    this.balance = balance;
  }

  getAccountNumber() {
    return this.accountNumber;
  }

  getBalance() {
    return this.balance;
  }

  debit(amount) {
    if (amount <= 0) {
      throw new Error("Amount to debit should be greater than zero.");
    }
    if (amount > this.balance) {
      throw new Error("Insufficient funds.");
    }
    this.balance -= amount;
  }

  credit(amount) {
    if (amount <= 0) {
      throw new Error("Amount to credit should be greater than zero.");
    }
    this.balance += amount;
  }
}

class Transaction {
  constructor(account, amount) {
    if (this.constructor === Transaction) {
      throw new Error("Abstract classes cannot be instantiated.");
    }
    this.account = account;
    this.amount = amount;
  }

  execute() {
    throw new Error('Method "execute()" must be implemented.');
  }
}

class WithdrawalTransaction extends Transaction {
  execute() {
    this.account.debit(this.amount);
    console.log(`Withdrawal of $${this.amount} successful.`);
  }
}

class DepositTransaction extends Transaction {
  execute() {
    this.account.credit(this.amount);
    console.log(`Deposit of $${this.amount} successful.`);
  }
}

class BankingService {
  constructor() {
    this.accounts = new Map();
    this.cards = new Map();
  }

  addAccount(account) {
    if (this.accounts.has(account.getAccountNumber())) {
      throw new Error("Account already exists.");
    }
    this.accounts.set(account.getAccountNumber(), account);
  }

  getAccount(accountNumber) {
    if (!this.accounts.has(accountNumber)) {
      throw new Error("Account not found.");
    }
    return this.accounts.get(accountNumber);
  }

  addCard(card) {
    if (this.cards.has(card.getCardNumber())) {
      throw new Error("Card already exists.");
    }
    this.cards.set(card.getCardNumber(), card);
  }

  validateCard(cardNumber, pin) {
    if (!this.cards.has(cardNumber)) {
      throw new Error("Card not found.");
    }
    const card = this.cards.get(cardNumber);
    if (card.getPin() !== pin) {
      throw new Error("Invalid PIN.");
    }
    return card;
  }

  processTransaction(transaction) {
    transaction.execute();
  }
}

class CashDispenser {
  constructor(totalCash = 10000) {
    this.totalCash = totalCash;
  }

  dispenseCash(amount) {
    if (amount <= 0) {
      throw new Error("Amount must be greater than zero.");
    }
    if (amount > this.totalCash) {
      throw new Error("ATM has insufficient cash.");
    }
    this.totalCash -= amount;
    console.log(`Dispensed $${amount}`);
  }

  addCash(amount) {
    if (amount <= 0) {
      throw new Error("Amount must be greater than zero.");
    }
    this.totalCash += amount;
  }

  getTotalCash() {
    return this.totalCash;
  }
}

class ATM {
  constructor() {
    this.bankingService = new BankingService();
    this.cashDispenser = new CashDispenser();
    this.currentCard = null;
    this.authenticated = false;
    this.currentCardNumber = null;
  }

  insertCard(cardNumber) {
    this.currentCardNumber = cardNumber;
    console.log("Card inserted.");
  }

  enterPin(pin) {
    try {
      this.currentCard = this.bankingService.validateCard(
        this.currentCardNumber,
        pin
      );
      this.authenticated = true;
      console.log("Authentication successful.");
    } catch (error) {
      throw new Error("Authentication failed.");
    }
  }

  checkBalance() {
    if (!this.authenticated) {
      throw new Error("User not authenticated.");
    }
    const account = this.bankingService.getAccount(
      this.currentCard.getAccountNumber()
    );
    console.log(`Your balance is $${account.getBalance()}`);
  }

  withdraw(amount) {
    if (!this.authenticated) {
      throw new Error("User not authenticated.");
    }
    const account = this.bankingService.getAccount(
      this.currentCard.getAccountNumber()
    );
    const transaction = new WithdrawalTransaction(account, amount);
    this.bankingService.processTransaction(transaction);
    this.cashDispenser.dispenseCash(amount);
    console.log(`Withdrawal of $${amount} completed.`);
  }

  deposit(amount) {
    if (!this.authenticated) {
      throw new Error("User not authenticated.");
    }
    const account = this.bankingService.getAccount(
      this.currentCard.getAccountNumber()
    );
    const transaction = new DepositTransaction(account, amount);
    this.bankingService.processTransaction(transaction);
    // In a real ATM, cash would be physically inserted.
    this.cashDispenser.addCash(amount);
    console.log(`Deposit of $${amount} completed.`);
  }

  ejectCard() {
    this.currentCard = null;
    this.authenticated = false;
    this.currentCardNumber = null;
    console.log("Card ejected.");
  }
}

function main() {
  const atm = new ATM();

  // Create sample accounts
  const account1 = new Account("123456789", 1000);
  const account2 = new Account("987654321", 2000);

  // Add accounts to the banking service
  atm.bankingService.addAccount(account1);
  atm.bankingService.addAccount(account2);

  // Create sample cards linked to the accounts
  const card1 = new Card("1111-2222-3333-4444", "1234", "123456789");
  const card2 = new Card("5555-6666-7777-8888", "5678", "987654321");

  // Add cards to the banking service
  atm.bankingService.addCard(card1);
  atm.bankingService.addCard(card2);

  // Simulate ATM operations for the first user
  try {
    atm.insertCard("1111-2222-3333-4444");
    atm.enterPin("1234");
    atm.checkBalance();
    atm.withdraw(500);
    atm.checkBalance();
    atm.deposit(300);
    atm.checkBalance();
    atm.ejectCard();

    // Simulate ATM operations for the second user
    atm.insertCard("5555-6666-7777-8888");
    atm.enterPin("5678");
    atm.checkBalance();
    atm.withdraw(2500); // Should throw error: Insufficient funds.
  } catch (error) {
    console.error(error.message);
    atm.ejectCard();
  }
}

main();
