// Car class
class Car {
  constructor(
    make,
    model,
    year,
    licensePlateNumber,
    rentalPricePerDay,
    carType
  ) {
    this.make = make;
    this.model = model;
    this.year = year;
    this.licensePlateNumber = licensePlateNumber;
    this.rentalPricePerDay = rentalPricePerDay;
    this.carType = carType;
    this.isAvailable = true;
  }
}

// Customer class
class Customer {
  constructor(name, contactDetails, driversLicenseNumber) {
    this.name = name;
    this.contactDetails = contactDetails;
    this.driversLicenseNumber = driversLicenseNumber;
  }
}

// Reservation class
class Reservation {
  constructor(reservationId, customer, car, startDate, endDate, totalPrice) {
    this.reservationId = reservationId;
    this.customer = customer;
    this.car = car;
    this.startDate = startDate;
    this.endDate = endDate;
    this.totalPrice = totalPrice;
  }
}

// PaymentProcessor interface
class PaymentProcessor {
  processPayment(amount, paymentDetails) {
    throw new Error("Method not implemented");
  }
}

// CreditCardPaymentProcessor class
class CreditCardPaymentProcessor extends PaymentProcessor {
  processPayment(amount, paymentDetails) {
    // Simulate processing credit card payment
    console.log(`Processing credit card payment of $${amount}`);
    // ... logic to process credit card payment
    return true;
  }
}

// PayPalPaymentProcessor class
class PayPalPaymentProcessor extends PaymentProcessor {
  processPayment(amount, paymentDetails) {
    // Simulate processing PayPal payment
    console.log(`Processing PayPal payment of $${amount}`);
    // ... logic to process PayPal payment
    return true;
  }
}

// RentalSystem class (Singleton)
class RentalSystem {
  constructor() {
    if (RentalSystem.instance instanceof RentalSystem) {
      return RentalSystem.instance;
    }

    // Map of cars, key is license plate number
    this.cars = new Map();

    // Map of reservations, key is reservation ID
    this.reservations = new Map();

    // For generating unique reservation IDs
    this.nextReservationId = 1;

    // Simulate a lock for concurrent access
    this.lockedCars = new Set();

    RentalSystem.instance = this;

    return this;
  }

  // Method to add a car
  addCar(car) {
    if (this.cars.has(car.licensePlateNumber)) {
      console.log(
        `Car with license plate ${car.licensePlateNumber} already exists.`
      );
      return false;
    }
    this.cars.set(car.licensePlateNumber, car);
    console.log(`Car with license plate ${car.licensePlateNumber} added.`);
    return true;
  }

  // Method to remove a car
  removeCar(licensePlateNumber) {
    if (!this.cars.has(licensePlateNumber)) {
      console.log(
        `Car with license plate ${licensePlateNumber} does not exist.`
      );
      return false;
    }
    this.cars.delete(licensePlateNumber);
    console.log(`Car with license plate ${licensePlateNumber} removed.`);
    return true;
  }

  // Method to search for available cars based on criteria
  searchCars(criteria) {
    // criteria is an object with properties to filter on
    let result = [];
    for (let car of this.cars.values()) {
      let match = true;
      for (let key in criteria) {
        if (key === "availability") {
          if (car.isAvailable !== criteria[key]) {
            match = false;
            break;
          }
        } else if (car[key] !== criteria[key]) {
          match = false;
          break;
        }
      }
      if (match) {
        result.push(car);
      }
    }
    return result;
  }

  // Method to make a reservation
  makeReservation(
    customer,
    car,
    startDate,
    endDate,
    paymentProcessor,
    paymentDetails
  ) {
    // Check if car is available for the given date range
    if (!this.isCarAvailable(car, startDate, endDate)) {
      console.log(
        `Car ${car.licensePlateNumber} is not available for the given dates.`
      );
      return null;
    }

    // Simulate locking the car
    if (this.lockedCars.has(car.licensePlateNumber)) {
      console.log(
        `Car ${car.licensePlateNumber} is currently locked for reservation.`
      );
      return null;
    }
    this.lockedCars.add(car.licensePlateNumber);

    try {
      // Calculate total price
      const totalDays = this.calculateDays(startDate, endDate);
      const totalPrice = totalDays * car.rentalPricePerDay;

      // Process payment
      const paymentSuccess = paymentProcessor.processPayment(
        totalPrice,
        paymentDetails
      );
      if (!paymentSuccess) {
        console.log(`Payment failed for reservation.`);
        return null;
      }

      // Create reservation
      const reservationId = this.nextReservationId++;
      const reservation = new Reservation(
        reservationId,
        customer,
        car,
        startDate,
        endDate,
        totalPrice
      );

      // Update car availability
      car.isAvailable = false;

      // Add reservation to the map
      this.reservations.set(reservationId, reservation);

      console.log(`Reservation ${reservationId} created successfully.`);
      return reservation;
    } finally {
      // Release the lock
      this.lockedCars.delete(car.licensePlateNumber);
    }
  }

  // Method to cancel a reservation
  cancelReservation(reservationId) {
    if (!this.reservations.has(reservationId)) {
      console.log(`Reservation ${reservationId} does not exist.`);
      return false;
    }
    const reservation = this.reservations.get(reservationId);
    reservation.car.isAvailable = true;
    this.reservations.delete(reservationId);
    console.log(`Reservation ${reservationId} canceled successfully.`);
    return true;
  }

  // Helper method to check car availability
  isCarAvailable(car, startDate, endDate) {
    // Check if car is currently available
    if (!car.isAvailable) {
      return false;
    }
    // Check if car is reserved in the given date range
    for (let reservation of this.reservations.values()) {
      if (reservation.car.licensePlateNumber === car.licensePlateNumber) {
        if (
          this.isDateOverlap(
            startDate,
            endDate,
            reservation.startDate,
            reservation.endDate
          )
        ) {
          return false;
        }
      }
    }
    return true;
  }

  // Helper method to check date overlap
  isDateOverlap(start1, end1, start2, end2) {
    return start1 <= end2 && end1 >= start2;
  }

  // Helper method to calculate total days
  calculateDays(startDate, endDate) {
    const oneDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round(Math.abs((endDate - startDate) / oneDay));
    return diffDays + 1;
  }

  // Method to modify a reservation
  modifyReservation(reservationId, newStartDate, newEndDate) {
    if (!this.reservations.has(reservationId)) {
      console.log(`Reservation ${reservationId} does not exist.`);
      return false;
    }
    const reservation = this.reservations.get(reservationId);

    // Check if car is available for new dates
    if (!this.isCarAvailable(reservation.car, newStartDate, newEndDate)) {
      console.log(
        `Car ${reservation.car.licensePlateNumber} is not available for the new dates.`
      );
      return false;
    }

    reservation.startDate = newStartDate;
    reservation.endDate = newEndDate;
    console.log(`Reservation ${reservationId} modified successfully.`);
    return true;
  }

  // Method to process payments (if needed)
  processPayment(amount, paymentProcessor, paymentDetails) {
    return paymentProcessor.processPayment(amount, paymentDetails);
  }
}

// Entry point class
class CarRentalSystem {
  run() {
    // Create instance of RentalSystem (Singleton)
    const rentalSystem = new RentalSystem();

    // Add some cars
    const car1 = new Car("Toyota", "Camry", 2020, "ABC123", 50, "Sedan");
    const car2 = new Car("Honda", "Civic", 2019, "XYZ789", 45, "Sedan");
    const car3 = new Car("Ford", "Explorer", 2021, "DEF456", 70, "SUV");

    rentalSystem.addCar(car1);
    rentalSystem.addCar(car2);
    rentalSystem.addCar(car3);

    // Create a customer
    const customer = new Customer(
      "John Doe",
      "johndoe@example.com",
      "D1234567"
    );

    // Search for available cars
    const availableCars = rentalSystem.searchCars({
      carType: "Sedan",
      availability: true,
    });
    console.log("Available Cars:", availableCars);

    // Make a reservation
    const startDate = new Date("2023-12-01");
    const endDate = new Date("2023-12-05");
    const paymentProcessor = new CreditCardPaymentProcessor();
    const paymentDetails = {
      cardNumber: "4111111111111111",
      expiryDate: "12/25",
      cvv: "123",
    };

    const reservation = rentalSystem.makeReservation(
      customer,
      car1,
      startDate,
      endDate,
      paymentProcessor,
      paymentDetails
    );

    // Modify a reservation
    if (reservation) {
      const newStartDate = new Date("2023-12-02");
      const newEndDate = new Date("2023-12-06");
      rentalSystem.modifyReservation(
        reservation.reservationId,
        newStartDate,
        newEndDate
      );
    }

    // Cancel a reservation
    if (reservation) {
      rentalSystem.cancelReservation(reservation.reservationId);
    }
  }
}

// Run the CarRentalSystem
const app = new CarRentalSystem();
app.run();
