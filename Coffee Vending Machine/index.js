class Mutex {
  constructor() {
    this.queue = [];
    this.locked = false;
  }

  lock() {
    return new Promise((resolve) => {
      if (this.locked) {
        this.queue.push(resolve);
      } else {
        this.locked = true;
        resolve();
      }
    });
  }

  unlock() {
    if (this.queue.length > 0) {
      const nextResolve = this.queue.shift();
      nextResolve();
    } else {
      this.locked = false;
    }
  }
}

class Ingredient {
  constructor(name, quantity) {
    this.name = name;
    this.quantity = quantity;
    this.mutex = new Mutex();
  }

  async updateQuantity(amount) {
    await this.mutex.lock();
    this.quantity += amount;
    this.mutex.unlock();
  }

  async getQuantity() {
    await this.mutex.lock();
    const qty = this.quantity;
    this.mutex.unlock();
    return qty;
  }
}

class Coffee {
  constructor(name, price, recipe) {
    this.name = name;
    this.price = price;
    this.recipe = recipe;
  }
}

class Payment {
  constructor(amount) {
    this.amount = amount;
  }
}

class CoffeeMachine {
  constructor() {
    if (CoffeeMachine.instance) {
      return CoffeeMachine.instance;
    }

    this.ingredients = new Map();
    this.ingredients.set("water", new Ingredient("Water", 1000)); // in ml
    this.ingredients.set("milk", new Ingredient("Milk", 1000)); // in ml
    this.ingredients.set("coffeeBeans", new Ingredient("Coffee Beans", 500)); // in grams
    this.ingredients.set("sugar", new Ingredient("Sugar", 500)); // in grams

    this.menu = new Map();
    this.menu.set(
      "Espresso",
      new Coffee(
        "Espresso",
        2.5,
        new Map([
          ["water", 50],
          ["coffeeBeans", 18],
        ])
      )
    );
    this.menu.set(
      "Cappuccino",
      new Coffee(
        "Cappuccino",
        3.0,
        new Map([
          ["water", 30],
          ["milk", 60],
          ["coffeeBeans", 18],
        ])
      )
    );
    this.menu.set(
      "Latte",
      new Coffee(
        "Latte",
        3.5,
        new Map([
          ["water", 30],
          ["milk", 100],
          ["coffeeBeans", 18],
        ])
      )
    );

    CoffeeMachine.instance = this;
  }

  static getInstance() {
    if (!CoffeeMachine.instance) {
      CoffeeMachine.instance = new CoffeeMachine();
    }
    return CoffeeMachine.instance;
  }

  displayMenu() {
    console.log("Available Coffee Options:");
    for (let [name, coffee] of this.menu) {
      console.log(`${name}: $${coffee.price.toFixed(2)}`);
    }
    console.log("");
  }

  async hasEnoughIngredients(coffeeName) {
    const coffee = this.menu.get(coffeeName);
    if (!coffee) {
      return false;
    }
    const recipe = coffee.recipe;
    for (let [ingredientName, requiredQty] of recipe) {
      const ingredient = this.ingredients.get(ingredientName);
      if (!ingredient) {
        return false;
      }
      const currentQty = await ingredient.getQuantity();
      if (currentQty < requiredQty) {
        return false;
      }
    }
    return true;
  }

  async updateIngredients(coffeeName) {
    const coffee = this.menu.get(coffeeName);
    if (!coffee) {
      throw new Error("Coffee not found");
    }
    const recipe = coffee.recipe;
    for (let [ingredientName, requiredQty] of recipe) {
      const ingredient = this.ingredients.get(ingredientName);
      if (!ingredient) {
        throw new Error(`Ingredient ${ingredientName} not found`);
      }
      await ingredient.updateQuantity(-requiredQty);
      const newQty = await ingredient.getQuantity();
      if (newQty < 50) {
        console.warn(`Warning: Ingredient ${ingredientName} is running low.`);
      }
    }
  }

  async selectCoffee(coffeeName, payment) {
    const coffee = this.menu.get(coffeeName);
    if (!coffee) {
      throw new Error("Selected coffee is not available");
    }
    if (payment.amount < coffee.price) {
      throw new Error("Insufficient payment");
    }

    const hasIngredients = await this.hasEnoughIngredients(coffeeName);
    if (!hasIngredients) {
      throw new Error("Not enough ingredients to make the selected coffee");
    }

    await this.dispenseCoffee(coffeeName);
    const change = payment.amount - coffee.price;
    if (change > 0) {
      console.log(`Please collect your change: $${change.toFixed(2)}`);
    }
  }

  async dispenseCoffee(coffeeName) {
    await this.updateIngredients(coffeeName);
    console.log(`Dispensing your ${coffeeName}. Enjoy!`);
    console.log("");
  }
}

async function simulateUser(coffeeName, amountPaid) {
  const machine = CoffeeMachine.getInstance();
  const payment = new Payment(amountPaid);
  try {
    await machine.selectCoffee(coffeeName, payment);
  } catch (error) {
    console.error(`Error for user requesting ${coffeeName}: ${error.message}`);
    console.log("");
  }
}

async function main() {
  const machine = CoffeeMachine.getInstance();
  machine.displayMenu();

  const userRequests = [
    simulateUser("Espresso", 3.0),
    simulateUser("Cappuccino", 3.0),
    simulateUser("Latte", 4.0),
    simulateUser("Espresso", 2.0), // Insufficient payment
    simulateUser("Mocha", 4.0), // Coffee not in menu
    simulateUser("Latte", 3.5),
    simulateUser("Espresso", 2.5),
    simulateUser("Cappuccino", 3.0),
    simulateUser("Cappuccino", 3.0),
  ];

  // Simulate concurrent user requests
  await Promise.all(userRequests);
}

main();
