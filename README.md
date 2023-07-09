# CryptoFiew Hub

⚠️ Working progress ⚠️

Due to the author's ADHD, it is possible that this project may progress at a
slower pace than other similar projects.

CryptoFiew Hub is a project that uses Node.js, Redis, MongoDB, InfluxDB and
RabbitMQ to manage WebSocket client processes for monitoring cryptocurrency
prices on various exchanges.

This program should be acting like a hub for another system to utilise its
functionality.

## The Purpose?

The CryptoFiew hub is a system that aims to monitor top cryptocurrency symbols
based on Binance's 24-hour ticker volume trades for data collection purposes.
The hub retrieves trading data using the official Binance/connector and stores
the top symbols and intervals in Redis. Moreover, kline and trade data are
passed through a WebSocket connection into Redis and RabbitMQ to facilitate
real-time monitoring and data storage. To provide a modular design, a subprocess
monitors RabbitMQ for new queues and retrieves data for storage in InfluxDB.
This approach enables scalability and adaptability to changing user demands. The
Crypto Pulse hub is compatible with both Kubernetes setups and single-server
environments. Regardless of the deployment configuration, this powerful tool can
enhance data monitoring and collection capabilities.

## Requirements

To use CryptoFiew Hub, you'll need to have the following installed on your
machine:

- Node.js (https://nodejs.org/)
- Redis (https://redis.io/)
- MongoDB (https://mongodb.com/)
- InfluxDB (https://www.influxdata.com/)
- RabbitMQ (https://www.rabbitmq.com/)

## Installation

To use CryptoFiew Hub, follow these steps:

1. Install [Docker](https://docker.com/) and
   [Docker Compose](https://docs.docker.com/compose/install/).
2. Clone this repository:

```bash
$ git clone https://github.com/p3nj/crypto-pulse-minions.git
```

3. Navigate to the project directory and run the following command to pull the
   required images:

```bash
$ docker-compose pull
```

4. After pulling the images, start the containers using the following command:

```bash
$ docker-compose up
```

5. The CryptoFiew Hub should now be running and ready to use. Note: If you want
   to run the containers in the background, you can use the `-d` flag with the
   `docker-compose up` command.

## Usage

### Docker Compose

For easier deployment and to lower the knowledge required to run this system, I
highly suggest choosing Docker to start this project.

```bash
$ docker compose build
$ docker compose pull
$ docker compose up -d
```

### Manually ( System-wide )

To use CryptoFiew Hub, you'll need to have RabbitMQ, InfluxDB, MongoDB, and
Redis set up correctly and running before proceeding with the introductions
below.

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

This will start the script that listens for commands on the Redis channel and
manages the WebSocket client processes.

## Contributing

We welcome contributions to CryptoFiew Minions! If you'd like to contribute,
please follow these steps:

1. Fork this repository to your own GitHub account and clone it to your local
   machine.
2. Create a new branch for your changes: `git checkout -b feat/new-feature`
3. Make your changes and commit them with a descriptive commit message:
   `git commit -m "Add new feature"`
4. Push your changes to your forked repository:
   `git push origin feat/new-feature`
5. Create a pull request from your forked repository to this repository.

We will review your changes and merge them if they fit with the project goals
and standards.

## License

CryptoFiew Minions is licensed under the Apache License 2.0. Feel free to use,
modify, and distribute this code as you see fit.
