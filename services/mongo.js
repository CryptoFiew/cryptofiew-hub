const { MongoClient } = require("mongodb");
const { mongoHost, mongoDb } = require("../env");
const logger = require("../models/logger");
const { redis } = require("./redis");
const { arraysEqual } = require("../utils/utils");
const env = require("../env");
const { Ok, Err } = require("@sniptt/monads");

const uri = `${mongoHost}/${mongoDb}`;
const client = new MongoClient(uri);

/**
 * Connects to the MongoDB database.
 * @returns {Promise<void>} - A promise that resolves when the connection is established.
 */
async function connect() {
  try {
    await client.connect();
    logger.debug("Connected to MongoDB");
  } catch (err) {
    logger.error(err);
    throw err;
  }
}

/**
 * Disconnects from the MongoDB database.
 * @returns {Promise<void>} - A promise that resolves when the connection is closed.
 */
async function dispose() {
  try {
    await client.close();
    logger.debug("Disconnected from MongoDB");
  } catch (err) {
    logger.error(err);
    throw err;
  }
}

/**
 * Creates a new collection in the MongoDB database.
 * @param {string} collectionName - The name of the collection to create.
 * @returns {Promise<void>} - A promise that resolves when the collection is created.
 */
async function create(collectionName) {
  try {
    const db = client.db();
    await db.createCollection(collectionName);
    logger.debug(`Collection ${collectionName} created`);
  } catch (err) {
    if (err.message.includes("already exists")) {
      logger.debug(`Collection ${collectionName} already exists`);
    } else {
      logger.error(err);
      throw err;
    }
  }
}

/**
 * Gets a reference to a collection in the MongoDB database.
 * @param {string} collectionName - The name of the collection to get.
 * @returns {Promise<object>} - A promise that resolves with a reference to the specified collection.
 */
async function get(collectionName) {
  try {
    const db = client.db();
    return db.collection(collectionName);
  } catch (err) {
    logger.error(err);
    throw err;
  }
}

/**
 * Gets the contents of a collection in the MongoDB database.
 * @param {string} collectionName - The name of the collection to get the contents of.
 * @returns {Promise<object[]>} - A promise that resolves with an array of documents in the specified collection.
 */
async function getContents(collectionName) {
  try {
    const collection = await get(collectionName);
    return await collection.find().toArray();
  } catch (err) {
    logger.error(err);
    throw err;
  }
}

/**
 * Gets the number of documents in a collection in the MongoDB database.
 * @param {string} collectionName - The name of the collection to get the length of.
 * @returns {Promise<number>} - A promise that resolves with the number of documents in the specified collection.
 */
async function getLength(collectionName) {
  try {
    const collection = await get(collectionName);
    return await collection.countDocuments();
  } catch (err) {
    logger.error(err);
    throw err;
  }
}

/**
 * Inserts a document into a collection in the MongoDB database.
 * @param {string} collectionName - The name of the collection to insert the document into.
 * @param {object} document - The document to insert.
 * @returns {Promise<string>} - A promise that resolves with the ID of the inserted document.
 */
async function insert(collectionName, document) {
  try {
    const collection = await get(collectionName);
    const result = await collection.insertOne(document);
    return result.insertedId;
  } catch (err) {
    logger.error(err);
    throw err;
  }
}

/**
 * Inserts multiple documents into a collection in the MongoDB database.
 * @param {string} collectionName - The name of the collection to insert the documents into.
 * @param {object[]} documents - The documents to insert.
 * @returns {Promise<string[]>} - A promise that resolves with an array of IDs of the inserted documents.
 */
async function inserts(collectionName, documents) {
  try {
    const collection = await get(collectionName);
    const result = await collection.insertMany(documents);
    return result.insertedIds;
  } catch (err) {
    logger.error(err);
    throw err;
  }
}

/**
 * Finds documents in a collection in the MongoDB database that match the specified query.
 * @param {string} collectionName - The name of the collection to search.
 * @param {object} query - The query to execute.
 * @returns {Promise<object[]>} - A promise that resolves with an array of documents that match the query.
 */
async function find(collectionName, query) {
  try {
    const collection = await get(collectionName);
    const cursor = collection.find(query);
    return await cursor.toArray();
  } catch (err) {
    logger.error(err);
    throw err;
  }
}

/**
 * Finds a single document in a collection in the MongoDB database that matches the specified query.
 * @param {string} collectionName - The name of the collection to search.
 * @param {object} query - The query to execute.
 * @returns {Promise<object>} - A promise that resolves with the first document that matches the query.
 */
async function findOne(collectionName, query) {
  try {
    const collection = await get(collectionName);
    return await collection.findOne(query);
  } catch (err) {
    logger.error(err);
    throw err;
  }
}

/**
 * Updates a single document in a collection in the MongoDB database that matches the specified filter.
 * @param {string} collectionName - The name of the collection to update.
 * @param {object} filter - The filter to apply.
 * @param {object} update - The update to apply.
 * @returns {Promise<number>} - A promise that resolves with the number of documents that were modified.
 */
async function updateOne(collectionName, filter, update) {
  try {
    const collection = await get(collectionName);
    const result = await collection.updateOne(filter, update);
    return result.modifiedCount;
  } catch (err) {
    logger.error(err);
    throw err;
  }
}

/**
 * Deletes a single document from a collection in the MongoDB database that matches the specified filter.
 * @param {string} collectionName - The name of the collection to delete from.
 * @param {object} filter - The filter to apply.
 * @returns {Promise<number>} - A promise that resolves with the number of documents that were deleted.
 */
async function deleteOne(collectionName, filter) {
  try {
    const collection = await get(collectionName);
    const result = await collection.deleteOne(filter);
    return result.deletedCount;
  } catch (err) {
    logger.error(err);
    throw err;
  }
}

/**
 * Deletes multiple documents from a collection in the MongoDB database that match the specified filter.
 * @param {string} collectionName - The name of the collection to delete from.
 * @param {object} filter - The filter to apply.
 * @returns {Promise<number>} - A promise that resolves with the number of documents that were deleted.
 */
async function deleteMany(collectionName, filter) {
  try {
    const collection = await get(collectionName);
    const result = await collection.deleteMany(filter);
    return result.deletedCount;
  } catch (err) {
    logger.error(err);
    throw err;
  }
}

/**
 * Executes an aggregation pipeline on a collection in the MongoDB database.
 * @param {string} collectionName - The name of the collection to aggregate.
 * @param {object[]} pipeline - The pipeline to execute.
 * @returns {Promise<object[]>} - A promise that resolves with the results of the aggregation.
 */
async function aggregate(collectionName, pipeline) {
  try {
    const collection = await get(collectionName);
    const cursor = collection.aggregate(pipeline);
    return await cursor.toArray();
  } catch (err) {
    logger.error(err);
    throw err;
  }
}

/**
 * Creates an index on a collection in the MongoDB database.
 * @param {string} collectionName - The name of the collection to create the index on.
 * @param {object} keys - The keys to index.
 * @param {object} options - The options for the index.
 * @returns {Promise<string>} - A promise that resolves with the name of the created index.
 */
async function createIndex(collectionName, keys, options) {
  try {
    const collection = await get(collectionName);
    return await collection.createIndex(keys, options);
  } catch (err) {
    logger.error(err);
    throw err;
  }
}

/**
 * Checks if a collection in the MongoDB database is empty.
 * @param {string} collectionName - The name of the collection to check.
 * @returns {Promise<boolean>} - A promise that resolves with a boolean indicating whether the collection is empty.
 */
async function isEmpty(collectionName) {
  try {
    const collection = await get(collectionName);
    const count = await collection.countDocuments();
    return count === 0;
  } catch (err) {
    logger.error(err);
    throw err;
  }
}

/**
 * Deletes all documents from a collection in the MongoDB database.
 * @param {string} collectionName - The name of the collection to delete from.
 * @returns {Promise<number>} - A promise that resolves with the number of documents that were deleted.
 */
async function purge(collectionName) {
  try {
    const collection = await get(collectionName);
    const result = await collection.deleteMany({});
    return result.deletedCount;
  } catch (err) {
    logger.error(err);
    throw err;
  }
}

/**
 * Initializes MongoDB by creating the 'intervals' collection,
 * updating the interval list, and publishing the list to Redis.
 *
 * @returns {Result<Array<string>, Error>} - The result indicating success with the list of intervals or error.
 */
async function warmup() {
  try {
    await this.connect();
    const intervals = env.klinesIntervals;

    // Create the 'intervals' collection in MongoDB
    this.create("intervals");
    logger.debug('Created or found "intervals" collection in MongoDB.');

    // Flush Redis
    await redis.pub.flushdb("SYNC");

    // Update the interval list in MongoDB
    const intervalListEmpty = await this.isEmpty("intervals");
    const mongoIntervals = await this.getContents("intervals");
    const currentIntervals = mongoIntervals.map((item) => item.interval);
    logger.debug(`currentIntervals: \n${JSON.stringify(currentIntervals)}`);

    let returnIntervals;
    if (intervalListEmpty || !arraysEqual(intervals, currentIntervals)) {
      logger.debug("Updating interval list in MongoDB.");
      await this.purge("intervals");
      await this.inserts(
        "intervals",
        intervals.map((interval) => ({ interval })),
      );
      logger.debug(`Setting new intervals to key ${env.redisIntervals}`);
      logger.debug(`[C] Setting return intervals: ${intervals}`);
      returnIntervals = intervals;
    } else {
      logger.debug(
        `[N] Setting return intervals: ${JSON.stringify(currentIntervals)}`,
      );
      returnIntervals = currentIntervals;
      logger.info("Skipping update - interval list has not changed.");
    }

    // Publish the interval list to the 'intervals' channel
    const channel = env.redisMinionChan;
    const message = { type: "intervals", data: intervals };
    redis.pub.publish(channel, JSON.stringify(message));
    logger.info(`Publish new intervals list to ${env.redisMinionChan}`);
    redis.lPop(env.redisIntervals, 20);
    redis.lPush(env.redisIntervals, returnIntervals);

    return Ok(returnIntervals);
  } catch (error) {
    logger.error(`Error during MongoDB warm-up: ${error.message}`);
    return Err(error);
  }
}

module.exports = {
  connect,
  dispose,
  create,
  get,
  getContents,
  getLength,
  insert,
  inserts,
  find,
  findOne,
  updateOne,
  deleteOne,
  deleteMany,
  aggregate,
  createIndex,
  isEmpty,
  purge,
  warmup,
};
