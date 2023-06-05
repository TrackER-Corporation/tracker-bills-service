import { beforeAll, describe, expect, it, vi } from "vitest";
import { hasCountedDay, addData, updateData, getBills, getBillsByOrganizationId, getBuildingBills, getBillsRenewableOnly, getBillsByOrganizationIdAggregated, getBillsAggregatedFiltered, computeTotals, computeAggregatedCosts } from "../db/controller/controller";
import { ObjectId } from "mongodb";
import { collections, connectToDatabase } from "../db/services/database.service";


interface Response {
    status: number | any
    json: any
}

describe('Bills controller', async () => {
    beforeAll(async () => {
        await connectToDatabase()
        vi.clearAllMocks();
    });

    const mockResponse = () => {
        const res: Response = {
            json: {},
            status: {}
        };
        res.status = vi.fn().mockReturnValue(res);
        res.json = vi.fn().mockReturnValue(res);
        return res;
    };

    it('should return error adding bills with no building id', async () => {
        const req = {
            params: {
                id: ""
            }
        };
        const res = mockResponse();
        expect(async () => await addData(req, res, {})).rejects.toThrow(/Error/);
    });

    it('should return ok creating a new bill', async () => {
        const req = {
            body: {
                buildingId: new ObjectId("111111111111"),
                organizationId: new ObjectId("111111111111"),
                electric: 9,
                gas: 9,
                water: 9,
                resources: [{ Solar: 99 }, { Wind: 99 }, { Geo: 99 }, { Hydro: 99 }],
                date: Date.now()
            },
            params: {
                id: new ObjectId("111111111111"),
            }
        };
        const res = mockResponse();
        await addData(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });


    it('should return error for existing bill', async () => {
        const req = {
            body: {
                buildingId: new ObjectId("111111111111"),
                organizationId: new ObjectId("111111111111"),
                electric: 10,
                gas: 10,
                water: 10,
                resources: [{ Solar: 100 }, { Wind: 100 }, { Geo: 100 }, { Hydro: 100 }],
                date: Date.now()
            },
            params: {
                id: new ObjectId("111111111111"),
            }
        };
        const res = mockResponse();
        expect(async () => await addData(req, res, {})).rejects.toThrow(/Error/);
    });

    it('should return error updating bills with no building id', async () => {
        const req = {
            params: {
                id: ""
            }
        };
        const res = mockResponse();
        expect(async () => await updateData(req, res, {})).rejects.toThrow(/Error/);
    });

    it('should return ok updating a bill', async () => {
        const req = {
            body: {
                buildingId: new ObjectId("111111111111"),
                electric: 100,
                gas: 100,
                water: 100,
                resources: [{ Solar: 99 }, { Wind: 99 }, { Geo: 99 }, { Hydro: 99 }],
                date: Date.now()
            },
            params: {
                id: new ObjectId("111111111111"),
            }
        };
        const res = mockResponse();
        await updateData(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return ok for getting all bills', async () => {
        const req = {};
        const res = mockResponse();
        await getBills(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return error getting bills with no building id', async () => {
        const req = {
            params: {
                id: ""
            }
        };
        const res = mockResponse();
        expect(async () => await getBuildingBills(req, res, {})).rejects.toThrow(/Error/);
    });

    it('should return error getting bills with wrong building id', async () => {
        const req = {
            params: {
                id: "999999999999"
            }
        };
        const res = mockResponse();
        expect(async () => await getBuildingBills(req, res, {})).rejects.toThrow(/Error/);
    });

    it('should return ok getting bills with building id', async () => {
        const req = {
            params: {
                id: "111111111111"
            }
        };
        const res = mockResponse();
        await getBuildingBills(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return error getting bills with no organization id', async () => {
        const req = {
            params: {
                id: ""
            }
        };
        const res = mockResponse();
        expect(async () => await getBillsByOrganizationId(req, res, {})).rejects.toThrow(/Error/);
    });

    it('should return error getting bills with wrong organization id', async () => {
        const req = {
            params: {
                id: "999999999999"
            }
        };
        const res = mockResponse();
        expect(async () => await getBillsByOrganizationId(req, res, {})).rejects.toThrow(/Error/);
    });

    it('should return ok getting bills with organization id', async () => {
        const req = {
            params: {
                id: "111111111111"
            }
        };
        const res = mockResponse();
        await getBillsByOrganizationId(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return error getting renewable bills with no buildingId id', async () => {
        const req = {
            params: {
                id: ""
            }
        };
        const res = mockResponse();
        expect(async () => await getBillsRenewableOnly(req, res, {})).rejects.toThrow(/Error/);
    });

    it('should return error getting renewable bills with wrong buildingId id', async () => {
        const req = {
            params: {
                id: "999999999999"
            }
        };
        const res = mockResponse();
        expect(async () => await getBillsRenewableOnly(req, res, {})).rejects.toThrow(/Error/);
    });

    it('should return ok getting renewable with building id', async () => {
        const req = {
            params: {
                id: "111111111111"
            }
        };
        const res = mockResponse();
        await getBillsRenewableOnly(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return error getting bills aggregated with no organization id', async () => {
        const req = {
            params: {
                id: ""
            }
        };
        const res = mockResponse();
        expect(async () => await getBillsByOrganizationIdAggregated(req, res, {})).rejects.toThrow(/Error/);
    });

    it('should return error getting bills aggregated with wrong organization id', async () => {
        const req = {
            params: {
                id: "999999999999"
            }
        };
        const res = mockResponse();
        expect(async () => await getBillsByOrganizationIdAggregated(req, res, {})).rejects.toThrow(/Error/);
    });

    it('should be called 0 times for gateway offline', async () => {
        const req = {
            params: {
                id: "111111111111"
            }
        };
        const res = mockResponse();
        expect(async () => await getBillsByOrganizationIdAggregated(req, res, {})).rejects.toThrow(/Error/);
    });

    it('should return error getting bills aggregated with no organization id', async () => {
        const req = {
            params: {
                id: ""
            }
        };
        const res = mockResponse();
        expect(async () => await getBillsAggregatedFiltered(req, res, {})).rejects.toThrow(/Error/);
    });

    it('should be called 0 times for gateway offline', async () => {
        const req = {
            params: {
                id: "111111111111"
            }
        };
        const res = mockResponse();
        expect(async () => await getBillsAggregatedFiltered(req, res, {})).rejects.toThrow(/Error/);
        await collections.bills?.deleteOne({ buildingId: new ObjectId("111111111111") });
    });

    it('should return false', async () => {
        const allDay = [new Date("15/05/2023")]
        const day = "16/05/2023"
        expect(hasCountedDay(allDay, day)).toBe(true)
        expect(hasCountedDay(allDay, allDay[0])).toBe(false)
    });

    let bills: any = [
        {
            bills: [
                { electric: 10, gas: 20, water: 30 },
                { electric: 5, gas: 15, water: 25 },
            ],
        },
        {
            bills: [
                { electric: 7, gas: 14, water: 21 },
                { electric: 3, gas: 12, water: 18 },
            ],
        },
    ];

    const organization = { type: ["Electric", "Gas", "Water"] };

    const totals = computeTotals(bills, organization);

    it("should calculate the total electric cost correctly", () => {
        expect(totals.electric).toBe(25)
    });

    it("should calculate the total gas cost correctly", () => {
        expect(totals.gas).toBe(61)
    });

    it("should calculate the total water cost correctly", () => {
        expect(totals.water).toBe(94)
    });


    bills = [
        {
            bills: [
                { date: "2023-01-01", electric: 10, gas: 20, water: 30 },
                { date: "2023-01-01", electric: 5, gas: 15, water: 25 },
            ],
        },
        {
            bills: [
                { date: "2023-01-02", electric: 7, gas: 14, water: 21 },
                { date: "2023-01-02", electric: 3, gas: 12, water: 18 },
            ],
        },
    ];

    const aggregatedCosts = computeAggregatedCosts(bills, organization);

    it("should aggregate costs by date correctly", () => {
        expect(aggregatedCosts).toStrictEqual({
            "2023-01-01": { date: "2023-01-01", electric: 15, gas: 35, water: 55 },
            "2023-01-02": { date: "2023-01-02", electric: 10, gas: 26, water: 39 },
        });
    });
});
