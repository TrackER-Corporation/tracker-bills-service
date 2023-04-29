import asyncHandler from 'express-async-handler';
import { ObjectId } from 'mongodb';
import { collections } from '../services/database.service';
import { get } from 'http';

const hasCountedDay = function (allDay: any, date: any) {
  if (allDay.includes(new Date(date).getDate()))
    return false
  allDay.push(new Date(date).getDate())
  return true
};

export const addData = asyncHandler(async (req, res) => {
  if (!req.params.id) {
    res.status(400)
    return
  }
  const exist = await collections?.bills?.findOne({ buildingId: new ObjectId(req.params.id) })
  if (!exist) {
    const bills = await collections?.bills?.insertOne({
      buildingId: new ObjectId(req.params.id),
      organizationId: new ObjectId(req.body.organizationId),
      bills: [
        {
          electric: req.body.electric,
          gas: req.body.gas,
          water: req.body.water,
          resources: req.body.resources,
          date: req.body.date
        }
      ]
    })
    if (bills) {
      res.status(200).json(bills)
    }
  } else {
    res.status(400)
  }
})

export const updateData = asyncHandler(async (req, res) => {
  if (!req.params.id) {
    res.status(400)
    return
  }
  const exist = await collections?.bills?.findOne({ buildingId: new ObjectId(req.params.id) })
  if (exist) {
    const bills = await collections?.bills?.updateOne(
      { "buildingId": new ObjectId(req.params.id) },
      {
        "$push": {
          "bills": {
            electric: req.body.electric,
            gas: req.body.gas,
            water: req.body.water,
            resources: req.body.resources,
            date: req.body.date
          }
        }
      })
    if (bills) {
      res.status(200).json(bills)
    }
  }
})

export const getBills = asyncHandler(async (req, res) => {
  const bills = await collections?.bills?.find({}).toArray();
  res.status(200).json(bills)
})

export const getBuildingBills = asyncHandler(async (req, res) => {
  if (!req.params.id) {
    res.status(400)
    return
  }
  const goal = await collections?.bills?.findOne({ buildingId: new ObjectId(req.params.id) })
  if (!goal) {
    res.status(404)
  } else {
    res.status(200).json(goal);
  }
})

export const getBillsByOrganizationId = asyncHandler(async (req, res) => {
  if (!req.params.id) {
    res.status(400)
    return
  }
  const bills = await collections?.bills?.find({ organizationId: new ObjectId(req.params.id) }).toArray();
  if (bills?.length === 0) {
    res.status(401)
  } else {
    res.status(200).json(bills);
  }
})

export const getBillsRenewableOnly = asyncHandler(async (req, res) => {
  if (!req.params.id) {
    res.status(400);
    return;
  }

  const bills = await collections?.bills?.findOne({ buildingId: new ObjectId(req.params.id) });
  if (!bills) {
    res.status(401).json({ renewable: [], totalSolar: 0, totalWind: 0, totalGeo: 0, totalHydro: 0 });
    return;
  }

  let totalSolar = 0, totalWind = 0, totalGeo = 0, totalHydro = 0;
  const renewable = Object.values(bills.bills)
    .map((el: any) => {
      if (el.resources.length === 0) {
        return null;
      }

      el.resources.forEach((ele: any) => {
        const value = parseFloat(Object.values(ele).toString());
        if (Object.keys(ele).includes("Solar")) {
          totalSolar += value;
        } else if (Object.keys(ele).includes("Wind")) {
          totalWind += value;
        } else if (Object.keys(ele).includes("Geo")) {
          totalGeo += value;
        } else if (Object.keys(ele).includes("Hydro")) {
          totalHydro += value;
        }
      });

      return { date: el.date, resources: el.resources };
    })
    .filter((el) => el !== null);

  res.status(200).json({
    renewable,
    totalSolar: Number(totalSolar.toFixed(2)),
    totalWind: Number(totalWind.toFixed(2)),
    totalGeo: Number(totalGeo.toFixed(2)),
    totalHydro: Number(totalHydro.toFixed(2)),
  });
});


export const getBillsAggregatedFiltered = asyncHandler(async (req, result) => {
  if (!req.params.id) {
    result.status(400)
    return
  }
  const bills = await collections?.bills?.find({}).toArray();
  let days = 0
  let data = {}
  let electric = 0
  let gas = 0
  let water = 0
  let allDay: any = []
  get(`http://localhost:3000/api/buildings/find/${req.params.id}`, async (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', async () => {
      try {
        const goal = JSON.parse(rawData);
        if (goal) {
          let orgIds: any = []
          let aggregated = new Map<any, any>()
          let tmpRes = goal.map((el: any) => {
            orgIds.push({ id: el._id, organizationId: el.organizationId })
            return el._id.toString()
          })
          const res2 = bills?.filter((r: any) => tmpRes.includes(r.buildingId.toString()))
          if (!res2) {
            result.status(400)
            return
          }
          await Promise.all(res2.map(async (el: any) => {
            let obj = orgIds.find((o: any) => o.id.toString() === el.buildingId.toString());
            get(`http://localhost:3000/api/organization/${obj.organizationId}`, (res) => {
              let rawData = '';
              res.on('data', (chunk) => { rawData += chunk; });
              res.on('end', () => {
                try {
                  const goal2 = JSON.parse(rawData);
                  if (goal2)
                    el.bills.map((bill: any) => {
                      if (hasCountedDay(allDay, bill.date))
                        days++
                      if (aggregated.has(bill.date)) {
                        let existing = aggregated.get(bill.date);
                        aggregated.set(bill.date, {
                          date: existing.date,
                          ...(goal2.type.includes("Electric")) && { electric: parseFloat(existing.electric + bill.electric).toFixed(2) },
                          ...(goal2.type.includes("Gas")) && { gas: parseFloat(existing.gas + bill.gas).toFixed(2) },
                          ...(goal2.type.includes("Water")) && { water: parseFloat(isNaN(existing.water) ? 0 + bill.water : existing.water + bill.water).toFixed(2) },
                        })
                      } else {
                        aggregated.set(bill.date, {
                          date: bill.date,
                          ...(goal2.type.includes("Electric")) && { electric: parseFloat(bill.electric).toFixed(2) },
                          ...(goal2.type.includes("Gas")) && { gas: parseFloat(bill.gas).toFixed(2) },
                          ...(goal2.type.includes("Water")) && { water: parseFloat(bill.water).toFixed(2) },
                        })
                      }
                      if (goal2.type.includes("Electric"))
                        electric += bill.electric
                      if (goal2.type.includes("Gas"))
                        gas += bill.gas
                      if (goal2.type.includes("Water"))
                        water += bill.water
                    })
                } catch (e: any) {
                  console.error(e.message);
                }
              });
            }).on('error', (e) => {
              console.error(`Got an error: ${e}`);
            });
          }))
          data = Array.from(aggregated.values())
        }
        result.json({ data, electric, gas, water, days })
      } catch (e: any) {
        console.error(e.message);
      }
    });
  }).on('error', (e) => {
    console.error(`Got an error: ${e}`);
  });
});

export const getBillsByOrganizationIdAggregated = asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!id) {
    res.status(400)
    return;
  }

  const bills = await collections?.bills?.find({ organizationId: new ObjectId(id) }).toArray();
  if (!bills || bills.length === 0) {
    res.status(400)
    return;
  }

  const organization = await fetchOrganization(id);
  if (!organization) {
    res.status(400)
    return;
  }

  const { electric, gas, water } = computeTotals(bills, organization);

  const aggregated = computeAggregatedCosts(bills, organization);

  res.status(200).json({
    result: bills,
    totalElectric: electric,
    totalGas: gas,
    totalWater: water,
    aggregated: aggregated,
  });
});

async function fetchOrganization(id: string) {
  try {
    const response = await fetch(`http://localhost:3000/api/organization/${id}`);
    return await response.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

function computeTotals(bills: any[], organization: any) {
  let electric = 0;
  let gas = 0;
  let water = 0;

  bills.forEach((bill) => {
    bill.bills.forEach((item: any) => {
      if (organization.type.includes("Electric")) electric += item.electric;
      if (organization.type.includes("Gas")) gas += item.gas;
      if (organization.type.includes("Water")) water += item.water || 0;
    });
  });

  return {
    electric: parseFloat(electric.toFixed(2)),
    gas: parseFloat(gas.toFixed(2)),
    water: parseFloat(water.toFixed(2)),
  };
}

function computeAggregatedCosts(bills: any[], organization: any) {
  const aggregated = new Map<any, any>();

  bills.forEach((bill) => {
    bill.bills.forEach((item: any) => {
      const date = item.date;

      if (!aggregated.has(date)) {
        aggregated.set(date, { date: date, electric: 0, gas: 0, water: 0 });
      }

      const entry = aggregated.get(date);

      if (organization.type.includes("Electric")) entry.electric += item.electric;
      if (organization.type.includes("Gas")) entry.gas += item.gas;
      if (organization.type.includes("Water")) entry.water += item.water || 0;

      aggregated.set(date, entry);
    });
  });

  return Object.fromEntries(aggregated);
}