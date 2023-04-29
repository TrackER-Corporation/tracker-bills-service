import { describe, expect, it } from "vitest";
import app from "../index"
import request from 'supertest';

describe('index test', () => {
    it('should respond error getting bills', async () => {
        const response = await request(app.app).get('/');
        expect(response.statusCode).toBe(200);
    });

});