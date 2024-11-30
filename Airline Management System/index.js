// Airline Management System in JavaScript

// Enums for SeatType, SeatStatus, BookingStatus, PaymentStatus, UserRoles
const SeatType = Object.freeze({
  ECONOMY: "Economy",
  BUSINESS: "Business",
  FIRST_CLASS: "First Class",
});

const SeatStatus = Object.freeze({
  AVAILABLE: "Available",
  BOOKED: "Booked",
  RESERVED: "Reserved",
});

const BookingStatus = Object.freeze({
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  PENDING: "Pending",
});

const PaymentStatus = Object.freeze({
  COMPLETED: "Completed",
  FAILED: "Failed",
  PENDING: "Pending",
});

const UserRoles = Object.freeze({
  PASSENGER: "Passenger",
  STAFF: "Staff",
  ADMIN: "Administrator",
});

// Seat Class
class Seat {
  constructor(seatNumber, seatType) {
    this.seatNumber = seatNumber;
    this.seatType = seatType;
    this.seatStatus = SeatStatus.AVAILABLE;
  }
}

// Aircraft Class
class Aircraft {
  constructor(tailNumber, model, totalSeats) {
    this.tailNumber = tailNumber;
    this.model = model;
    this.totalSeats = totalSeats;
    this.seats = this.generateSeats(totalSeats);
  }

  generateSeats(totalSeats) {
    let seats = [];
    for (let i = 1; i <= totalSeats; i++) {
      let seatType = SeatType.ECONOMY;
      if (i <= 10) seatType = SeatType.FIRST_CLASS;
      else if (i <= 30) seatType = SeatType.BUSINESS;
      seats.push(new Seat(i, seatType));
    }
    return seats;
  }
}

// Flight Class
class Flight {
  constructor(
    flightNumber,
    source,
    destination,
    departureTime,
    arrivalTime,
    aircraft
  ) {
    this.flightNumber = flightNumber;
    this.source = source;
    this.destination = destination;
    this.departureTime = new Date(departureTime);
    this.arrivalTime = new Date(arrivalTime);
    this.aircraft = aircraft;
  }

  getAvailableSeats() {
    return this.aircraft.seats.filter(
      (seat) => seat.seatStatus === SeatStatus.AVAILABLE
    );
  }
}

// Passenger Class
class Passenger {
  constructor(id, name, email, phoneNumber) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.phoneNumber = phoneNumber;
    this.baggageInfo = [];
  }

  addBaggage(baggage) {
    this.baggageInfo.push(baggage);
  }
}

// Booking Class
class Booking {
  constructor(bookingNumber, flight, passenger, seat, price) {
    this.bookingNumber = bookingNumber;
    this.flight = flight;
    this.passenger = passenger;
    this.seat = seat;
    this.price = price;
    this.bookingStatus = BookingStatus.PENDING;
  }

  confirmBooking() {
    this.bookingStatus = BookingStatus.CONFIRMED;
    this.seat.seatStatus = SeatStatus.BOOKED;
  }

  cancelBooking() {
    this.bookingStatus = BookingStatus.CANCELLED;
    this.seat.seatStatus = SeatStatus.AVAILABLE;
  }
}

// Payment Class
class Payment {
  constructor(paymentId, booking, paymentMethod, amount) {
    this.paymentId = paymentId;
    this.booking = booking;
    this.paymentMethod = paymentMethod;
    this.amount = amount;
    this.paymentStatus = PaymentStatus.PENDING;
  }

  completePayment() {
    this.paymentStatus = PaymentStatus.COMPLETED;
    this.booking.confirmBooking();
  }

  failPayment() {
    this.paymentStatus = PaymentStatus.FAILED;
  }
}

// FlightSearch Class
class FlightSearch {
  constructor(flights) {
    this.flights = flights;
  }

  searchFlights(source, destination, date) {
    const searchDate = new Date(date).setHours(0, 0, 0, 0);
    return this.flights.filter(
      (flight) =>
        flight.source === source &&
        flight.destination === destination &&
        flight.departureTime.setHours(0, 0, 0, 0) === searchDate
    );
  }
}

// Singleton BookingManager Class
class BookingManager {
  constructor() {
    if (BookingManager.instance) {
      return BookingManager.instance;
    }
    BookingManager.instance = this;
    this.bookings = [];
  }

  createBooking(flight, passenger, seatNumber, price) {
    const seat = flight.aircraft.seats.find(
      (seat) => seat.seatNumber === seatNumber
    );
    if (seat && seat.seatStatus === SeatStatus.AVAILABLE) {
      const bookingNumber = `BKG${Date.now()}`;
      const booking = new Booking(
        bookingNumber,
        flight,
        passenger,
        seat,
        price
      );
      this.bookings.push(booking);
      return booking;
    } else {
      throw new Error("Seat not available");
    }
  }

  cancelBooking(bookingNumber) {
    const booking = this.bookings.find(
      (b) => b.bookingNumber === bookingNumber
    );
    if (booking && booking.bookingStatus === BookingStatus.CONFIRMED) {
      booking.cancelBooking();
      return true;
    } else {
      throw new Error("Booking cannot be cancelled");
    }
  }

  getBooking(bookingNumber) {
    return this.bookings.find((b) => b.bookingNumber === bookingNumber);
  }
}

// Singleton PaymentProcessor Class
class PaymentProcessor {
  constructor() {
    if (PaymentProcessor.instance) {
      return PaymentProcessor.instance;
    }
    PaymentProcessor.instance = this;
    this.payments = [];
  }

  processPayment(booking, paymentMethod, amount) {
    const paymentId = `PAY${Date.now()}`;
    const payment = new Payment(paymentId, booking, paymentMethod, amount);
    // Simulate payment processing
    try {
      // Payment logic here
      payment.completePayment();
      this.payments.push(payment);
      return payment;
    } catch (error) {
      payment.failPayment();
      throw new Error("Payment failed");
    }
  }
}

// User Class
class User {
  constructor(id, name, role) {
    this.id = id;
    this.name = name;
    this.role = role;
  }
}

// AirlineManagementSystem Class
class AirlineManagementSystem {
  constructor() {
    this.flights = [];
    this.passengers = [];
    this.users = [];
    this.flightSearch = new FlightSearch(this.flights);
    this.bookingManager = new BookingManager();
    this.paymentProcessor = new PaymentProcessor();
  }

  addFlight(flight) {
    this.flights.push(flight);
  }

  registerPassenger(passenger) {
    this.passengers.push(passenger);
  }

  addUser(user) {
    this.users.push(user);
  }

  searchFlights(source, destination, date) {
    return this.flightSearch.searchFlights(source, destination, date);
  }

  bookFlight(flightNumber, passengerId, seatNumber, price) {
    const flight = this.flights.find((f) => f.flightNumber === flightNumber);
    const passenger = this.passengers.find((p) => p.id === passengerId);
    if (flight && passenger) {
      return this.bookingManager.createBooking(
        flight,
        passenger,
        seatNumber,
        price
      );
    } else {
      throw new Error("Flight or Passenger not found");
    }
  }

  makePayment(bookingNumber, paymentMethod, amount) {
    const booking = this.bookingManager.getBooking(bookingNumber);
    if (booking) {
      return this.paymentProcessor.processPayment(
        booking,
        paymentMethod,
        amount
      );
    } else {
      throw new Error("Booking not found");
    }
  }

  cancelBooking(bookingNumber) {
    return this.bookingManager.cancelBooking(bookingNumber);
  }
}

// Example usage:

// Initialize System
const system = new AirlineManagementSystem();

// Create Aircraft
const aircraft = new Aircraft("TN123", "Boeing 777", 100);

// Create Flight
const flight = new Flight(
  "FL123",
  "New York",
  "London",
  "2024-12-01T10:00:00",
  "2024-12-01T20:00:00",
  aircraft
);
system.addFlight(flight);

// Register Passenger
const passenger = new Passenger(
  "P001",
  "John Doe",
  "john@example.com",
  "1234567890"
);
system.registerPassenger(passenger);

// Search Flights
const flights = system.searchFlights("New York", "London", "2024-12-01");
console.log("Available Flights:", flights);

// Book Flight
try {
  const booking = system.bookFlight("FL123", "P001", 12, 500);
  console.log("Booking Successful:", booking);

  // Make Payment
  const payment = system.makePayment(booking.bookingNumber, "Credit Card", 500);
  console.log("Payment Successful:", payment);
} catch (error) {
  console.error(error.message);
}

// Cancel Booking
try {
  const cancellation = system.cancelBooking("BKG1234567890");
  console.log("Cancellation Successful:", cancellation);
} catch (error) {
  console.error(error.message);
}
