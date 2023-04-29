import { beforeAll, describe, expect, it, vi } from "vitest";
import { addData, updateData, getBills, getBillsByOrganizationId, getBuildingBills, getBillsRenewableOnly, getBillsByOrganizationIdAggregated, getBillsAggregatedFiltered } from "../db/controller/controller";
import { ObjectId } from "mongodb";
import { collections, connectToDatabase } from "../db/services/database.service";


interface Response {
    status: number | any
    json: any
}

describe('Activity controller', async () => {
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
        await addData(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
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
        await addData(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return error updating bills with no building id', async () => {
        const req = {
            params: {
                id: ""
            }
        };
        const res = mockResponse();
        await updateData(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
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
        await getBuildingBills(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return ok getting bills with wrong building id', async () => {
        const req = {
            params: {
                id: "999999999999"
            }
        };
        const res = mockResponse();
        await getBuildingBills(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
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
        await getBillsByOrganizationId(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return ok getting bills with wrong organization id', async () => {
        const req = {
            params: {
                id: "999999999999"
            }
        };
        const res = mockResponse();
        await getBillsByOrganizationId(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
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
        await getBillsRenewableOnly(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return error getting renewable bills with wrong buildingId id', async () => {
        const req = {
            params: {
                id: "999999999999"
            }
        };
        const res = mockResponse();
        await getBillsRenewableOnly(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
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
        await getBillsByOrganizationIdAggregated(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return ok getting bills aggregated with wrong organization id', async () => {
        const req = {
            params: {
                id: "999999999999"
            }
        };
        const res = mockResponse();
        await getBillsByOrganizationIdAggregated(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should be called 0 times for gateway offline', async () => {
        const req = {
            params: {
                id: "111111111111"
            }
        };
        const res = mockResponse();
        await getBillsByOrganizationIdAggregated(req, res);
        expect(res.status).toHaveBeenCalledTimes(1)
    });

    it('should return error getting bills aggregated with no organization id', async () => {
        const req = {
            params: {
                id: ""
            }
        };
        const res = mockResponse();
        await getBillsAggregatedFiltered(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should be called 0 times for gateway offline', async () => {
        const req = {
            params: {
                id: "111111111111"
            }
        };
        const res = mockResponse();
        await getBillsAggregatedFiltered(req, res);
        expect(res.status).toHaveBeenCalledTimes(0)
        await collections.bills?.deleteOne({ buildingId: new ObjectId("111111111111") });
    });

});