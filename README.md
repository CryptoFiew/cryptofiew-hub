# Crypto Pulse Minions

⚠️ Working progress ⚠️ 

Due to author's ADHD, it is possible that this project may progress at a slower pace than other similar projects. 

Crypto Pulse Minions is a project that uses Node.js and Redis to manage WebSocket client processes for monitoring cryptocurrency prices on various exchanges.

This program should acting like a minion hub for other system to utilise its functionality.

## Requirements
To use Crypto Pulse Minions, you'll need to have the following installed on your machine:
•	Node.js (https://nodejs.org/)
•	Redis (https://redis.io/)
•   VictoriaMetric (https://victoriametrics.com/)
•   RabbitMQ (https://www.rabbitmq.com/)

## Installation

To use Crypto Pulse Minions, you'll need to have Node.js and Redis installed on your machine. You can download Node.js from the official website, and Redis from the official website.

Once you have Node.js and Redis installed, you can clone this repository to your local machine:

```bash
$ git clone https://github.com/stockfiew/crypto-pulse-minions.git
```
After cloning the repository, navigate to the project directory and install the required dependencies:

```bash
$ cd crypto-pulse-minions
$ npm install
```

## Usage

### Docker Compose
For easier deployment and lower the knowledge requirement to run this system, highly suggest to choose docker to start this project.

```bash
$ docker compose build
$ docker compose up -d
```

### Manually ( System-wide )

To use Crypto Pulse Minions, you'll need to have RabbitMQ, VictoriaMetrics and Redis setup correctly and running before proceed this introduction.

#### RabbitMQ

- [https://www.rabbitmq.com/download.html](https://www.rabbitmq.com/download.html)

If you want to have more depth understanding about what is RabbitMQ, there is an article explain how RabbitMQ function quite [clearly](https://www.cloudamqp.com/blog/part1-rabbitmq-for-beginners-what-is-rabbitmq.html)

#### VictoriaMetrics
- [https://github.com/VictoriaMetrics/VictoriaMetrics](https://github.com/VictoriaMetrics/VictoriaMetrics)

More depth reading about VictoriaMetrics: [What makes VictoriaMetrics the new de-facto standard choice?](https://medium.com/everything-full-stack/what-makes-victoriametrics-the-new-de-facto-standard-choice-for-open-source-monitoring-5d2b66b6e292)

#### Redis

- [https://redis.io/docs/getting-started/](https://redis.io/docs/getting-started/)

More depth reading about Redis: [What is Redis what it does and why you should care](https://backendless.com/redis-what-it-is-what-it-does-and-why-you-should-care/)

```bash
$ node index.js
```

This will start the script that listens for commands on the Redis channel and manages the WebSocket client processes.

## Contributing

We welcome contributions to Crypto Pulse Minions! If you'd like to contribute, please follow these steps:

1. Fork this repository to your own GitHub account and clone it to your local machine.
2. Create a new branch for your changes: `git checkout -b feat/new-feature`
3. Make your changes and commit them with a descriptive commit message: `git commit -m "Add new feature"`
4. Push your changes to your forked repository: `git push origin feat/new-feature`
5. Create a pull request from your forked repository to this repository.

We will review your changes and merge them if they fit with the project goals and standards.

## License

Crypto Pulse Minions is licensed under the Apache License 2.0. Feel free to use, modify, and distribute this code as you see fit.

