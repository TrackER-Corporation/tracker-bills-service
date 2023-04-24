import { describe, expect, it } from "vitest";
import app from "../index"
import request from 'supertest';

describe('GET /', () => {
    it('should respond with a JSON object containing a message', async () => {
        const response = await request(app.app).get('/');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ "msg": "test" });
    });
});