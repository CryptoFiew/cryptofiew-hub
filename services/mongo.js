const { MongoClient } = require('mongodb');
require('dotenv').config()

const uri = `${process.env.MONGO_HOST}/${process.env.MONGO_DB}`;
const client = new MongoClient(uri);

(async function() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error(err);
    }
})();

async function disposeConnection() {
    try {
        await client.close();
        console.log('Disconnected from MongoDB');
    } catch (err) {
        console.error(err);
    }
}

async function createCollection(collectionName) {
    const db = client.db();
    try {
        await db.createCollection(collectionName);
        console.log(`Collection ${collectionName} created`);
    } catch (err) {
        if (err.message.includes('already exists')) {
            console.log(`Collection ${collectionName} already exists`);
        } else {
            console.error(err);
        }
    }
}

async function insertDocument(collectionName, document) {
    const collection = client.db().collection(collectionName);
    try {
        const result = await collection.insertOne(document);
        return result.insertedId;
    } catch (err) {
        console.error(err);
        return null;
    }
}

async function insertDocuments(collectionName, documents) {
    const collection = client.db().collection(collectionName);
    try {
        const result = await collection.insertMany(documents);
        return result.insertedIds;
    } catch (err) {
        console.error(err);
        return null;
    }
}

async function findDocuments(collectionName, query) {
    const collection = client.db().collection(collectionName);
    try {
        const cursor = collection.find({});
        return await cursor.toArray();
    } catch (err) {
        console.error(err);
        return [];
    }
}

async function findAllDocuments(collectionName) {
    const collection = client.db().collection(collectionName);
    try {
        const cursor = collection.find({});
        return await cursor.toArray();
    } catch (err) {
        console.error(err);
        return [];
    }
}

async function findOneDocument(collectionName, query) {
    const collection = client.db().collection(collectionName);
    try {
        return await collection.findOne(query);
    } catch (err) {
        console.error(err);
        return null;
    }
}

async function countDocuments(collectionName, query) {
    const collection = client.db().collection(collectionName);
    try {
        return await collection.countDocuments(query);
    } catch (err) {
        console.error(err);
        return 0;
    }
}

async function updateDocument(collectionName, filter, update) {
    const collection = client.db().collection(collectionName);
    try {
        const result = await collection.updateOne(filter, update);
        return result.modifiedCount;
    } catch (err) {
        console.error(err);
        return 0;
    }
}

async function deleteDocument(collectionName, filter) {
    const collection = client.db().collection(collectionName);
    try {
        const result = await collection.deleteOne(filter);
        return result.deletedCount;
    } catch (err) {
        console.error(err);
        return 0;
    }
}

async function aggregateDocuments(collectionName, pipeline) {
    const collection = client.db().collection(collectionName);
    try {
        const cursor = collection.aggregate(pipeline);
        return await cursor.toArray();
    } catch (err) {
        console.error(err);
        return [];
    }
}

async function createIndex(collectionName, keys, options) {
    const collection = client.db().collection(collectionName);
    try {
        return await collection.createIndex(keys, options);
    } catch (err) {
        console.error(err);
        return null;
    }
}

async function isCollectionEmpty(collectionName) {
    const collection = client.db().collection(collectionName);
    try {
        const count = await collection.countDocuments();
        return count === 0;
    } catch (err) {
        console.error(err);
        return null;
    }
}

module.exports = {
    createCollection,
    disposeConnection,
    insertDocument,
    insertDocuments,
    findDocuments,
    findAllDocuments,
    findOneDocument,
    countDocuments,
    updateDocument,
    deleteDocument,
    aggregateDocuments,
    createIndex,
    isCollectionEmpty,
};
