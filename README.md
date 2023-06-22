# Crypto Pulse Minions

⚠️ Working progress ⚠️ 

Due to author's ADHD, it is possible that this project may progress at a slower pace than other similar projects. 

Crypto Pulse Minions is a project that uses Node.js, Redis, MongoDB, InfluxDB and RabbitMQ to manage WebSocket client processes for monitoring cryptocurrency prices on various exchanges.

This program should acting like a minion hub for other system to utilise its functionality.

## Requirements
To use Crypto Pulse Minions, you'll need to have the following installed on your machine:

* Node.js (https://nodejs.org/)
* Redis (https://redis.io/)
* MongoDB (https://mongodb.com/)
* InfluxDB (https://www.influxdata.com/)
* RabbitMQ (https://www.rabbitmq.com/)

## Installation

To use Crypto Pulse Minions, you can follow these steps:
1. Install [Docker](https://docker.com/) and [Docker Compose](https://docs.docker.com/compose/install/) on your machine.
2. Clone this repository to your local machine:
```bash
$ git clone https://github.com/stockfiew/crypto-pulse-minions.git
```
3. Navigate to the project directory and run the following command to pull the required images:
```bash
$ docker-compose pull
```
4. After pulling the images, start the containers using the following command:
```bash
$ docker-compose up
```
5. The Crypto Pulse Minions should now be running and ready to use.
Note: If you want to run the containers in the background, you can use the `-d` flag with the `docker-compose up` command.

## Usage

### Docker Compose
For easier deployment and lower the knowledge requirement to run this system, highly suggest to choose docker to start this project.

```bash
$ docker compose build
$ docker compose pull
$ docker compose up -d
```

### Manually ( System-wide )

To use Crypto Pulse Minions, you'll need to have RabbitMQ, VictoriaMetrics and Redis setup correctly and running before proceed this introduction.

#### RabbitMQ

- [https://www.rabbitmq.com/download.html](https://www.rabbitmq.com/download.html)

#### MongoDB

- [https://www.mongodb.com/docs/manual/tutorial/getting-started/](https://www.mongodb.com/docs/manual/tutorial/getting-started/)

#### InfluxDB
- [https://github.com/influxdata/influxdb](https://github.com/influxdata/influxdb)


#### Redis

- [https://redis.io/docs/getting-started/](https://redis.io/docs/getting-started/)

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

