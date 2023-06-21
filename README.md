# Crypto Pulse Minions

⚠️ Working progress ⚠️ 

Due to author's ADHD, it is possible that this project may progress at a slower pace than other similar projects. 

Crypto Pulse Minions is a project that uses Node.js and Redis to manage WebSocket client processes for monitoring cryptocurrency prices on various exchanges.

This program should acting like a minion hub for other system to utilise its functionality.

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

To use Crypto Pulse Minions, you'll need to start the Redis server and run the Node.js script that manages the WebSocket client processes.

To start the Redis server, open a new terminal window and run the following command:

```bash
$ redis-server
```

This will start the Redis server on the default port (6379).

To run the Node.js script, open another terminal window and navigate to the project directory. Then, run the following command:

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

