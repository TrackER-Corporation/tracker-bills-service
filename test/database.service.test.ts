import { describe, expect, it } from "vitest";
import * as mongoDB from 'mongodb';
import { collections, connectToDatabase } from "../db/services/database.service";


describe('connectToDatabase', () => {
    it('should connect to the database and set up the activity collection', async () => {

        // Connect to the database
        await connectToDatabase();

        // Check that the activity collection has been set up
        expect(collections.bills).toBeInstanceOf(mongoDB.Collection);

        // Check that the connection was successful by inserting a new activity
        const bill = {
            _id: new mongoDB.ObjectId("111111111111"),
            buildingId: new mongoDB.ObjectId("111111111111"),
            organizationId: new mongoDB.ObjectId("111111111111"),
            bills: [{electric: 9, gas:9, water:9, resources: [{Solar:99}, {Wind:99}, {Geo:99}, {Hydro:99}], date: Date.now()}],
            __v: 0
        };

        const result = await collections.bills?.insertOne(bill);
        expect(result?.acknowledged).toBe(true);

        // Clean up by deleting the test activity
        await collections.bills?.deleteOne({ _id: new mongoDB.ObjectId("111111111111") });
    });
});