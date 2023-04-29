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
    res.status(401)
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
    res.status(400)
    return
  }
  const bills = await collections?.bills?.findOne({ buildingId: new ObjectId(req.params.id) })
  let totalSolar = 0, totalWind = 0, totalGeo = 0, totalHydro = 0
  if (!bills) {
    res.status(401).json({ renewable: [], totalSolar: 0, totalWind: 0, totalGeo: 0, totalHydro: 0 })
    return
  }

  let renewable = Object.values(bills.bills).map((el: any) => {
    if (el.resources.length > 0) {
      el.resources.map((ele: any) => {
        totalSolar += Object.keys(ele).includes("Solar") ? parseFloat(Object.values(ele).toString()) : 0
        totalGeo += Object.keys(ele).includes("Geo") ? parseFloat(Object.values(ele).toString()) : 0
        totalWind += Object.keys(ele).includes("Wind") ? parseFloat(Object.values(ele).toString()) : 0
        totalHydro += Object.keys(ele).includes("Hydro") ? parseFloat(Object.values(ele).toString()) : 0
      })
      return { date: el.date, resources: el.resources }
    }
  }).filter(el => el !== undefined)

  totalSolar = Number(totalSolar.toFixed(2))
  totalWind = Number(totalWind.toFixed(2))
  totalGeo = Number(totalGeo.toFixed(2))
  totalHydro = Number(totalHydro.toFixed(2))

  res.status(200).json({ renewable, totalSolar, totalWind, totalGeo, totalHydro })
})


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
          await Promise.all(res2!.map(async (el: any) => {
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
                          ...(goal2.type.includes("Water")) && { water: isNaN(bill.water) ? 0 : parseFloat(bill.water).toFixed(2) },
                        })
                      }
                      electric += goal2.type.includes("Electric") ? bill.electric : 0
                      gas += goal2.type.includes("Gas") ? bill.gas : 0
                      water += goal2.type.includes("Water") ? bill.water : 0
                    })
                  data = {
                    totalElectric: parseFloat(electric.toFixed(2)),
                    totalGas: parseFloat(gas.toFixed(2)),
                    totalWater: parseFloat(water.toFixed(2)),
                    aggregated: Object.fromEntries(aggregated),
                    all: res2,
                    invoicesDays: days
                  }
                  result.status(200).json(data)
                } catch (e: any) {
                  console.error(e.message);
                }
              })
            }).on('error', () => {
              return
            })
          }))
        }
      } catch (e: any) {
        console.error(e.message);
      }
    })
  }).on('error', () => {
    return
  })
})

export const getBillsByOrganizationIdAggregated = asyncHandler(async (req, result) => {
  if (!req.params.id) {
    result.status(400)
    return
  }
  const bills = await collections?.bills?.find({ organizationId: new ObjectId(req.params.id) }).toArray()
  if (bills?.length === 0) {
    result.status(401)
    return
  }
  let totalElectric = 0
  let totalGas = 0
  let totalWater = 0
  let aggregated = new Map<any, any>()
  get(`http://localhost:3000/api/organization/${req.params.id}`, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', async () => {
      try {
        const organization = JSON.parse(rawData);
        bills?.map((obj: any) => {
          obj.bills.map((bill: any) => {
            if (aggregated.has(bill.date)) {
              let existing = aggregated.get(bill.date);
              aggregated.set(bill.date, {
                date: existing.date,
                ...(organization.type.includes("Electric")) && { electric: parseFloat(existing.electric + bill.electric).toFixed(2) },
                ...(organization.type.includes("Gas")) && { gas: parseFloat(existing.gas + bill.gas).toFixed(2) },
                ...(organization.type.includes("Water")) && { water: parseFloat(isNaN(existing.water) ? 0 + bill.water : existing.water + bill.water).toFixed(2) },
              })
            } else {
              aggregated.set(bill.date, {
                date: bill.date,
                ...(organization.type.includes("Electric")) && { electric: parseFloat(bill.electric).toFixed(2) },
                ...(organization.type.includes("Gas")) && { gas: parseFloat(bill.gas).toFixed(2) },
                ...(organization.type.includes("Water")) && { water: isNaN(bill.water) ? 0 : parseFloat(bill.water).toFixed(2) },
              })
            }
            totalElectric += organization.type.includes("Electric") ? bill.electric : 0
            totalGas += organization.type.includes("Gas") ? bill.gas : 0
            totalWater += organization.type.includes("Water") ? bill.water : 0
          })
        })
        result.status(200).json({
          result: bills,
          totalElectric: parseFloat(totalElectric.toFixed(2)),
          totalGas: parseFloat(totalGas.toFixed(2)),
          totalWater: parseFloat(totalWater.toFixed(2)),
          aggregated: Object.fromEntries(aggregated)
        });
      } catch (e: any) {
        console.error(e.message);
      }
    })
  }).on('error', () => {
    return
  })
})