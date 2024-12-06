const VehicleType = Object.freeze({
  CAR: "CAR",
  MOTORCYCLE: "MOTORCYCLE",
  TRUCK: "TRUCK",
});

class Vehicle {
  constructor(licensePlate, type) {
    if (new.target === Vehicle) {
      throw new Error("Cannot instantiate abstract class Vehicle directly.");
    }
    if (!licensePlate || typeof licensePlate !== "string") {
      throw new Error("Vehicle must have a valid license plate.");
    }
    if (!Object.values(VehicleType).includes(type)) {
      throw new Error("Invalid vehicle type.");
    }
    this.licensePlate = licensePlate;
    this.type = type;
  }

  getType() {
    return this.type;
  }

  getLicensePlate() {
    return this.licensePlate;
  }
}

class Car extends Vehicle {
  constructor(licensePlate) {
    super(licensePlate, VehicleType.CAR);
  }
}

class Motorcycle extends Vehicle {
  constructor(licensePlate) {
    super(licensePlate, VehicleType.MOTORCYCLE);
  }
}

class Truck extends Vehicle {
  constructor(licensePlate) {
    super(licensePlate, VehicleType.TRUCK);
  }
}

class ParkingSpot {
  constructor(allowedType, spotId) {
    if (!Object.values(VehicleType).includes(allowedType)) {
      throw new Error("Invalid allowed vehicle type for parking spot.");
    }
    if (!spotId || typeof spotId !== "string") {
      throw new Error("ParkingSpot must have a valid spotId (string).");
    }
    this.allowedType = allowedType;
    this.spotId = spotId;
    this.occupiedVehicle = null;
  }

  isAvailable() {
    return this.occupiedVehicle === null;
  }

  canPark(vehicle) {
    return this.isAvailable() && vehicle.getType() === this.allowedType;
  }

  park(vehicle) {
    if (!this.canPark(vehicle)) {
      throw new Error(
        `Cannot park vehicle ${vehicle.getLicensePlate()} of type ${vehicle.getType()} in this spot (${
          this.allowedType
        }).`
      );
    }
    this.occupiedVehicle = vehicle;
  }

  unpark() {
    const vehicle = this.occupiedVehicle;
    this.occupiedVehicle = null;
    return vehicle;
  }

  getOccupiedVehicle() {
    return this.occupiedVehicle;
  }

  getAllowedType() {
    return this.allowedType;
  }

  getSpotId() {
    return this.spotId;
  }
}

class Level {
  constructor(levelId, spots) {
    if (!levelId || typeof levelId !== "string") {
      throw new Error("Level must have a valid levelId.");
    }
    if (
      !Array.isArray(spots) ||
      spots.some((s) => !(s instanceof ParkingSpot))
    ) {
      throw new Error(
        "Level must be initialized with an array of ParkingSpot instances."
      );
    }
    this.levelId = levelId;
    this.spots = spots;
  }

  parkVehicle(vehicle) {
    for (const spot of this.spots) {
      if (spot.canPark(vehicle)) {
        spot.park(vehicle);
        return spot;
      }
    }
    return null; // No available spot for this vehicle type
  }

  unparkVehicle(licensePlate) {
    for (const spot of this.spots) {
      const occupant = spot.getOccupiedVehicle();
      if (occupant && occupant.getLicensePlate() === licensePlate) {
        return spot.unpark();
      }
    }
    return null;
  }

  getAvailability() {
    const availability = {
      [VehicleType.CAR]: { total: 0, available: 0 },
      [VehicleType.MOTORCYCLE]: { total: 0, available: 0 },
      [VehicleType.TRUCK]: { total: 0, available: 0 },
    };

    for (const spot of this.spots) {
      const t = spot.getAllowedType();
      availability[t].total += 1;
      if (spot.isAvailable()) {
        availability[t].available += 1;
      }
    }

    return availability;
  }

  getLevelId() {
    return this.levelId;
  }
}

class Lock {
  constructor() {
    this._locked = false;
    this._waiting = [];
  }

  async acquire() {
    while (this._locked) {
      await new Promise((resolve) => this._waiting.push(resolve));
    }
    this._locked = true;
  }

  release() {
    this._locked = false;
    if (this._waiting.length > 0) {
      const resolve = this._waiting.shift();
      resolve();
    }
  }
}

class ParkingLot {
  constructor() {
    if (ParkingLot._instance) {
      throw new Error(
        "Cannot create multiple instances of ParkingLot. Use ParkingLot.getInstance()."
      );
    }

    this.levels = [];
    this.lock = new Lock();
  }

  static getInstance() {
    if (!ParkingLot._instance) {
      ParkingLot._instance = new ParkingLot();
    }
    return ParkingLot._instance;
  }

  addLevel(level) {
    if (!(level instanceof Level)) {
      throw new Error("Can only add instances of Level to ParkingLot.");
    }
    this.levels.push(level);
  }

  async parkVehicle(vehicle) {
    if (!(vehicle instanceof Vehicle)) {
      throw new Error("Invalid vehicle.");
    }
    await this.lock.acquire();
    try {
      for (const level of this.levels) {
        const spot = level.parkVehicle(vehicle);
        if (spot) {
          return {
            levelId: level.getLevelId(),
            spotId: spot.getSpotId(),
          };
        }
      }
      throw new Error(
        `No available spot for vehicle ${vehicle.getLicensePlate()} of type ${vehicle.getType()}.`
      );
    } finally {
      this.lock.release();
    }
  }

  async unparkVehicle(licensePlate) {
    if (!licensePlate || typeof licensePlate !== "string") {
      throw new Error("License plate must be a non-empty string.");
    }

    await this.lock.acquire();
    try {
      for (const level of this.levels) {
        const vehicle = level.unparkVehicle(licensePlate);
        if (vehicle) {
          return {
            levelId: level.getLevelId(),
            vehicle: vehicle,
          };
        }
      }
      return null;
    } finally {
      this.lock.release();
    }
  }

  async getAvailability() {
    await this.lock.acquire();
    try {
      const summary = {
        [VehicleType.CAR]: { total: 0, available: 0 },
        [VehicleType.MOTORCYCLE]: { total: 0, available: 0 },
        [VehicleType.TRUCK]: { total: 0, available: 0 },
      };

      for (const level of this.levels) {
        const avail = level.getAvailability();
        for (const vt of Object.values(VehicleType)) {
          summary[vt].total += avail[vt].total;
          summary[vt].available += avail[vt].available;
        }
      }

      return summary;
    } finally {
      this.lock.release();
    }
  }
}

(async () => {
  // Construct a ParkingLot with multiple levels and spots
  const parkingLot = ParkingLot.getInstance();

  // Create a few levels:
  // Level 1: 5 CAR spots, 2 MOTORCYCLE spots
  const level1Spots = [
    new ParkingSpot(VehicleType.CAR, "L1C1"),
    new ParkingSpot(VehicleType.CAR, "L1C2"),
    new ParkingSpot(VehicleType.CAR, "L1C3"),
    new ParkingSpot(VehicleType.CAR, "L1C4"),
    new ParkingSpot(VehicleType.CAR, "L1C5"),
    new ParkingSpot(VehicleType.MOTORCYCLE, "L1M1"),
    new ParkingSpot(VehicleType.MOTORCYCLE, "L1M2"),
  ];
  const level1 = new Level("Level1", level1Spots);

  // Level 2: 2 CAR spots, 2 TRUCK spots
  const level2Spots = [
    new ParkingSpot(VehicleType.CAR, "L2C1"),
    new ParkingSpot(VehicleType.CAR, "L2C2"),
    new ParkingSpot(VehicleType.TRUCK, "L2T1"),
    new ParkingSpot(VehicleType.TRUCK, "L2T2"),
  ];
  const level2 = new Level("Level2", level2Spots);

  // Add levels to parking lot
  parkingLot.addLevel(level1);
  parkingLot.addLevel(level2);

  // Create some vehicles
  const car1 = new Car("ABC-123");
  const car2 = new Car("XYZ-789");
  const motorcycle1 = new Motorcycle("MOTO-001");
  const truck1 = new Truck("TRK-100");

  // Park vehicles
  console.log("Parking car1...");
  const car1Spot = await parkingLot.parkVehicle(car1);
  console.log("car1 parked at:", car1Spot);

  console.log("Parking car2...");
  const car2Spot = await parkingLot.parkVehicle(car2);
  console.log("car2 parked at:", car2Spot);

  console.log("Parking motorcycle1...");
  const motoSpot = await parkingLot.parkVehicle(motorcycle1);
  console.log("motorcycle1 parked at:", motoSpot);

  console.log("Parking truck1...");
  const truckSpot = await parkingLot.parkVehicle(truck1);
  console.log("truck1 parked at:", truckSpot);

  // Get availability
  console.log("Availability after parking:");
  console.log(await parkingLot.getAvailability());

  // Unpark a vehicle
  console.log("Unparking car1...");
  const unparkedCar = await parkingLot.unparkVehicle("ABC-123");
  if (unparkedCar) {
    console.log(
      `Unparked vehicle ${unparkedCar.vehicle.getLicensePlate()} from ${
        unparkedCar.levelId
      }`
    );
  } else {
    console.log("Vehicle not found!");
  }

  // Get availability after unparking
  console.log("Availability after unparking car1:");
  console.log(await parkingLot.getAvailability());
})();
