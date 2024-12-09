// Message.js
class Message {
  constructor(content) {
    this.content = content;
  }
}

class Subscriber {
  onMessage(message) {
    throw new Error(
      "onMessage method must be implemented by Subscriber subclasses."
    );
  }
}

class PrintSubscriber extends Subscriber {
  constructor(name = "Subscriber") {
    super();
    this.name = name;
  }

  onMessage(message) {
    console.log(`[${this.name}] Received message: ${message.content}`);
  }
}

class Topic {
  constructor(name) {
    this.name = name;
    this.subscribers = new Set();
  }

  addSubscriber(subscriber) {
    if (!(subscriber instanceof Subscriber)) {
      throw new Error("Only instances of Subscriber can be added.");
    }
    this.subscribers.add(subscriber);
  }

  removeSubscriber(subscriber) {
    this.subscribers.delete(subscriber);
  }

  async publish(message) {
    const subscriberPromises = [];
    for (const subscriber of this.subscribers) {
      subscriberPromises.push(
        (async () => {
          try {
            subscriber.onMessage(message);
          } catch (err) {
            console.error(
              `[Topic:${this.name}] Error delivering message: ${err}`
            );
          }
        })()
      );
    }

    await Promise.all(subscriberPromises);
  }
}

class Publisher {
  constructor(pubSubSystem, topicName) {
    this.pubSubSystem = pubSubSystem;
    this.topicName = topicName;
  }

  async publish(message) {
    await this.pubSubSystem.publishMessage(this.topicName, message);
  }
}

class PubSubSystem {
  constructor() {
    this.topics = new Map();
  }

  getOrCreateTopic(topicName) {
    if (!this.topics.has(topicName)) {
      this.topics.set(topicName, new Topic(topicName));
    }
    return this.topics.get(topicName);
  }

  addSubscriberToTopic(topicName, subscriber) {
    const topic = this.getOrCreateTopic(topicName);
    topic.addSubscriber(subscriber);
  }

  removeSubscriberFromTopic(topicName, subscriber) {
    const topic = this.getOrCreateTopic(topicName);
    topic.removeSubscriber(subscriber);
  }

  async publishMessage(topicName, message) {
    const topic = this.getOrCreateTopic(topicName);
    await topic.publish(message);
  }
}

// PubSubDemo.js
(async function PubSubDemo() {
  // Create a PubSubSystem instance
  const pubSubSystem = new PubSubSystem();

  // Create topics
  const newsTopic = "news";
  const sportsTopic = "sports";

  // Create subscribers
  const newsSubscriber = new PrintSubscriber("NewsSubscriber");
  const sportsSubscriber = new PrintSubscriber("SportsSubscriber");
  const generalSubscriber = new PrintSubscriber("GeneralSubscriber");

  // Add subscribers to topics
  pubSubSystem.addSubscriberToTopic(newsTopic, newsSubscriber);
  pubSubSystem.addSubscriberToTopic(sportsTopic, sportsSubscriber);
  pubSubSystem.addSubscriberToTopic(newsTopic, generalSubscriber);
  pubSubSystem.addSubscriberToTopic(sportsTopic, generalSubscriber);

  // Create publishers
  const newsPublisher = new Publisher(pubSubSystem, newsTopic);
  const sportsPublisher = new Publisher(pubSubSystem, sportsTopic);

  // Publish messages
  await newsPublisher.publish(
    new Message("Breaking: Market hits all-time high!")
  );
  await sportsPublisher.publish(
    new Message("Update: Local team wins championship!")
  );

  // Remove a subscriber and publish again
  pubSubSystem.removeSubscriberFromTopic(newsTopic, generalSubscriber);
  await newsPublisher.publish(
    new Message("Weather Alert: Heavy rain expected.")
  );

  // The output demonstrates that the removed subscriber no longer receives messages.
})();
