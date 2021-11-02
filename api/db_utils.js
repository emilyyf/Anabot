const { MongoClient } = require('mongodb');
const process         = require('process');

let cachedDB = null;

const connectToDB = async () => {
	if (cachedDB) return cachedDB;
	const client =
	  await (new MongoClient(process.env.DB_URI, { useNewUrlParser : true }))
	    .connect();
	const db = client.db(process.env.DB_NAME);
	cachedDB = db;
	return db;
};

const insert_quote = async (quote_text) => {
	const quotes_collection = cachedDB.collection('quotes');
	const new_id = parseInt(await quotes_collection.countDocuments()) + 1;
	await quotes_collection.insertOne(
	  { 'id' : new_id, 'quote' : quote_text, 'count' : 0 });
	return new_id;
};

const get_quote = async (quote_id) => {
	const cursor  = cachedDB.collection('quotes').find({ id : quote_id });
	const results = await cursor.toArray();
	if (results.length <= 0) return -1;
	return results[0]['quote'];
};

module.exports = {
	insert_quote,
	get_quote,
	connectToDB,
	cachedDB
};
