const Direction = Object.freeze({
  UP: "UP",
  DOWN: "DOWN",
  IDLE: "IDLE",
});

class Request {
  constructor(sourceFloor, destinationFloor) {
    this.sourceFloor = sourceFloor;
    this.destinationFloor = destinationFloor;
    this.direction =
      destinationFloor > sourceFloor ? Direction.UP : Direction.DOWN;
  }
}

class Elevator {
  constructor(id, capacityLimit) {
    this.id = id;
    this.capacityLimit = capacityLimit;
    this.currentFloor = 0;
    this.direction = Direction.IDLE;
    this.requests = [];
    this.passengers = 0;
    this.isMoving = false;
    this.mutex = false;
  }

  async addRequest(request) {
    while (this.mutex) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    this.mutex = true;

    if (this.passengers >= this.capacityLimit) {
      console.log(`Elevator ${this.id} is at capacity.`);
      this.mutex = false;
      return false;
    }

    this.requests.push(request);
    this.optimizeRequests();

    if (!this.isMoving) {
      this.processRequests();
    }

    this.mutex = false;
    return true;
  }

  optimizeRequests() {
    if (this.direction === Direction.UP) {
      this.requests.sort((a, b) => a.destinationFloor - b.destinationFloor);
    } else if (this.direction === Direction.DOWN) {
      this.requests.sort((a, b) => b.destinationFloor - a.destinationFloor);
    } else {
      if (this.requests.length > 0) {
        this.direction = this.requests[0].direction;
        this.optimizeRequests();
      }
    }
  }

  async processRequests() {
    this.isMoving = true;
    while (this.requests.length > 0) {
      const request = this.requests.shift();

      if (this.currentFloor !== request.sourceFloor) {
        await this.moveToFloor(request.sourceFloor);
      }

      this.passengers += 1;
      console.log(
        `Elevator ${this.id} picked up passenger at floor ${this.currentFloor}`
      );

      await this.moveToFloor(request.destinationFloor);

      this.passengers -= 1;
      console.log(
        `Elevator ${this.id} dropped off passenger at floor ${this.currentFloor}`
      );

      if (this.requests.length === 0) {
        this.direction = Direction.IDLE;
      } else {
        this.direction = this.requests[0].direction;
      }
    }
    this.isMoving = false;
  }

  async moveToFloor(floor) {
    console.log(
      `Elevator ${this.id} moving from floor ${this.currentFloor} to floor ${floor}`
    );

    while (this.currentFloor !== floor) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (this.currentFloor < floor) {
        this.currentFloor += 1;
      } else {
        this.currentFloor -= 1;
      }

      console.log(`Elevator ${this.id} arrived at floor ${this.currentFloor}`);
    }
  }
}

class ElevatorController {
  constructor(elevators) {
    this.elevators = elevators;
  }

  handleRequest(request) {
    const elevator = this.findOptimalElevator(request);
    if (elevator) {
      elevator.addRequest(request);
    } else {
      console.log("No available elevators to handle the request.");
    }
  }

  findOptimalElevator(request) {
    let optimalElevator = null;
    let minDistance = Infinity;

    for (const elevator of this.elevators) {
      if (elevator.passengers >= elevator.capacityLimit) {
        continue;
      }

      const distance = Math.abs(elevator.currentFloor - request.sourceFloor);

      if (distance < minDistance) {
        minDistance = distance;
        optimalElevator = elevator;
      }
    }

    return optimalElevator;
  }
}

class ElevatorSystem {
  constructor(numElevators, capacityLimit) {
    this.elevators = [];
    for (let i = 0; i < numElevators; i++) {
      this.elevators.push(new Elevator(i + 1, capacityLimit));
    }
    this.controller = new ElevatorController(this.elevators);
  }

  run() {
    const requests = [
      new Request(0, 5),
      new Request(3, 10),
      new Request(2, 1),
      new Request(7, 0),
      new Request(6, 2),
    ];

    for (const request of requests) {
      this.controller.handleRequest(request);
    }
  }
}

const elevatorSystem = new ElevatorSystem(3, 5);
elevatorSystem.run();
