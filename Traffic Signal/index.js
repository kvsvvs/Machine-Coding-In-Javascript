const Signal = {
  RED: "RED",
  YELLOW: "YELLOW",
  GREEN: "GREEN",
};

class Road {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.trafficLight = null;
  }

  setTrafficLight(trafficLight) {
    this.trafficLight = trafficLight;
  }

  onSignalChange(newSignal) {
    console.log(`Road ${this.name} signal changed to ${newSignal}`);
  }
}

class TrafficLight {
  constructor(id, durations = { RED: 5000, YELLOW: 2000, GREEN: 5000 }) {
    this.id = id;
    this.currentSignal = Signal.RED;
    this.durations = { ...durations };
    this.observers = [];
    this.timer = null;
  }

  addObserver(observer) {
    if (observer && typeof observer.onSignalChange === "function") {
      this.observers.push(observer);
    }
  }

  notifyObservers(newSignal) {
    for (const obs of this.observers) {
      obs.onSignalChange(newSignal);
    }
  }

  changeSignal(newSignal) {
    this.currentSignal = newSignal;
    this.notifyObservers(newSignal);
  }

  startCycle() {
    this._runCycle();
  }

  stopCycle() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  _runCycle() {
    // The cycle order can be customized. For now, we assume:
    // RED -> GREEN -> YELLOW -> RED
    const order = [Signal.RED, Signal.GREEN, Signal.YELLOW];
    const currentIndex = order.indexOf(this.currentSignal);
    const nextIndex = (currentIndex + 1) % order.length;
    const nextSignal = order[nextIndex];

    this.timer = setTimeout(() => {
      this.changeSignal(nextSignal);
      this._runCycle();
    }, this.durations[this.currentSignal]);
  }

  setSignalImmediately(newSignal) {
    this.stopCycle();
    this.changeSignal(newSignal);
  }

  adjustDurations(newDurations) {
    this.durations = { ...this.durations, ...newDurations };
  }
}

class TrafficController {
  constructor() {
    if (TrafficController.instance) {
      return TrafficController.instance;
    }
    this.roads = new Map();

    this.isRunning = false;

    TrafficController.instance = this;
  }

  static getInstance() {
    if (!TrafficController.instance) {
      TrafficController.instance = new TrafficController();
    }
    return TrafficController.instance;
  }

  addRoad(road, trafficLight) {
    if (!road || !trafficLight) {
      throw new Error("Road and TrafficLight must be provided");
    }

    road.setTrafficLight(trafficLight);
    trafficLight.addObserver(road);
    this.roads.set(road.id, road);
  }

  start() {
    if (this.isRunning) {
      console.warn("TrafficController already running.");
      return;
    }
    console.log("TrafficController starting...");
    this.isRunning = true;

    for (const road of this.roads.values()) {
      if (road.trafficLight) {
        road.trafficLight.startCycle();
      }
    }
  }

  stop() {
    if (!this.isRunning) {
      console.warn("TrafficController is not running.");
      return;
    }
    console.log("TrafficController stopping...");
    this.isRunning = false;

    for (const road of this.roads.values()) {
      if (road.trafficLight) {
        road.trafficLight.stopCycle();
      }
    }
  }

  handleEmergency() {
    console.log("EMERGENCY DETECTED! Setting all lights to RED.");
    for (const road of this.roads.values()) {
      if (road.trafficLight) {
        road.trafficLight.setSignalImmediately(Signal.RED);
      }
    }
  }

  adjustAllDurations(newDurations) {
    for (const road of this.roads.values()) {
      if (road.trafficLight) {
        road.trafficLight.adjustDurations(newDurations);
      }
    }
  }
}

class TrafficSignalSystemDemo {
  static runDemo() {
    const controller = TrafficController.getInstance();

    const roadA = new Road("R1", "Main Street");
    const roadB = new Road("R2", "1st Avenue");
    const roadC = new Road("R3", "2nd Avenue");

    const lightA = new TrafficLight("L1");
    const lightB = new TrafficLight("L2");
    const lightC = new TrafficLight("L3");

    controller.addRoad(roadA, lightA);
    controller.addRoad(roadB, lightB);
    controller.addRoad(roadC, lightC);

    controller.start();

    setTimeout(() => {
      console.log("Adjusting durations due to traffic buildup...");
      controller.adjustAllDurations({ RED: 3000, GREEN: 7000 });
    }, 15000);

    setTimeout(() => {
      controller.handleEmergency();
      setTimeout(() => {
        console.log("Emergency cleared! Restarting normal cycles...");
        controller.start();
      }, 5000);
    }, 30000);

    setTimeout(() => {
      console.log("Demo concluded. Stopping all signals.");
      controller.stop();
    }, 60000);
  }
}

TrafficSignalSystemDemo.runDemo();
