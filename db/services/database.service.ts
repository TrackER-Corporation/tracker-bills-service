import * as mongoDB from "mongodb";
import * as dotenv from "dotenv";

export const collections: { bills?: mongoDB.Collection } = {}

export async function connectToDatabase() {
  dotenv.config();

  try {
    const client: mongoDB.MongoClient = new mongoDB.MongoClient(process.env.DB_CONN_STRING!);

    await client.connect();

    const db: mongoDB.Db = client.db(process.env.DB_NAME);

    const billsCollection: mongoDB.Collection = db.collection(process.env.COLLECTION!);

    collections.bills = billsCollection;

    console.log(`Successfully connected to database: ${db.databaseName} and collection: ${billsCollection.collectionName}`);
  } catch (error) {
    console.error(error);
  }
}