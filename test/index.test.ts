import { describe, expect, it } from "vitest";
import app from "../index"
import request from 'supertest';
import { connectToDatabase } from "../db/services/database.service";

describe('index test', () => {
    it('should respond error getting bills', async () => {
        await connectToDatabase()
        const response = await request(app.app).get('/');
        expect(response.statusCode).toBe(200);
    });

});