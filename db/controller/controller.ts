import asyncHandler from 'express-async-handler';
import { ObjectId } from 'mongodb';
import { collections } from '../services/database.service';

export const hasCountedDay = function (allDay: any, date: any) {
  if (allDay.includes(new Date(date).getDate()))
    return false
  allDay.push(new Date(date).getDate())
  return true
};

export const addData = asyncHandler(async (req, res) => {
  if (!req.params.id) {
    throw Error('Error')
  }
  const exist = await collections?.bills?.findOne({ buildingId: new ObjectId(req.params.id) })
  if (exist === null) {
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
    throw Error('Error')
  }
})

export const updateData = asyncHandler(async (req, res) => {
  if (!req.params.id) {
    throw Error('Error')
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
  } else {
    throw Error("Error")
  }
})

export const getBills = asyncHandler(async (req, res) => {
  const bills = await collections.bills?.find({}).toArray();
  if (!bills) throw Error('Error')
  res.status(200).json(bills)
})

export const getBuildingBills = asyncHandler(async (req, res) => {
  if (!req.params.id) {
    throw Error('Error')
  }
  const goal = await collections?.bills?.findOne({ buildingId: new ObjectId(req.params.id) })
  if (!goal)
    throw Error('Error')
  res.status(200).json(goal);
})

export const getBillsByOrganizationId = asyncHandler(async (req, res) => {
  if (!req.params.id) {

    throw Error('Error')
  }
  const bills = await collections?.bills?.find({ organizationId: new ObjectId(req.params.id) }).toArray();
  if (bills?.length === 0) {

    throw Error('Error')
  } else {
    res.status(200).json(bills);
  }
})

export const getBillsRenewableOnly = asyncHandler(async (req, res) => {
  if (!req.params.id) {
    throw Error('Error')
  }

  const bills = await collections?.bills?.findOne({ buildingId: new ObjectId(req.params.id) });
  if (!bills) {
    throw Error('Error');
  }

  const sumRenewablesFetch = collections.bills?.aggregate
    ([
      { $unwind: "$bills" },
      { $unwind: "$bills.resources" },
      {
        $match: {
          buildingId: new ObjectId(req.params.id)
        }
      },
      {
        $group: {
          _id: null,
          totalSolar: { $sum: "$bills.resources.Solar" },
          totalWind: { $sum: "$bills.resources.Wind" },
          totalGeo: { $sum: "$bills.resources.Geo" },
          totalHydro: { $sum: "$bills.resources.Hydro" }
        }
      }
    ])
  const sumRenewables = await sumRenewablesFetch?.next()

  const renewable = Object.values(bills.bills)
    .map((el: any) => {
      if (!el.resources || el.resources.length === 0) { }
      return { date: el.date, resources: el.resources };
    })
    .filter((el) => el !== null);

  res.status(200).json({
    renewable,
    totalSolar: Number(sumRenewables?.totalSolar.toFixed(2)),
    totalWind: Number(sumRenewables?.totalWind.toFixed(2)),
    totalGeo: Number(sumRenewables?.totalGeo.toFixed(2)),
    totalHydro: Number(sumRenewables?.totalHydro.toFixed(2)),
  });
});


export const getBillsAggregatedFiltered = asyncHandler(async (req, result) => {
  if (!req.params.id) {
    throw Error('Error')
  }

  const bills = await collections?.bills?.find({}).toArray()

  let days = 0
  let data = {}
  let electric = 0
  let gas = 0
  let water = 0
  let allDay: any = []
  const aggregated: any = {}

  let buildingsFetch

  try {
    buildingsFetch = await fetch(`http://localhost:3000/api/buildings/user/${req.params.id}`)
  } catch (error) {
    throw Error("Error")
  }

  const buildings = await buildingsFetch.json()
  if (buildings) {
    const orgIds: Array<any> = []
    const buildingsIds = buildings.map((building: any) => {
      orgIds.push({ id: building._id, organizationId: building.organizationId })
      return building._id.toString()
    })

    const buildingsBills = bills?.filter((bill: any) => buildingsIds.includes(bill.buildingId.toString()))
    if (!buildingsBills) {
      throw Error('Error')
    }
    await Promise.all(buildingsBills.map(async buildingBills => {
      const org = orgIds.find(org => org.id.toString() === buildingBills.buildingId.toString());
      let organizationFetch
      try {
        organizationFetch = await fetch(`http://localhost:3000/api/organization/${org.organizationId}`)
      } catch (error) {
        throw Error("Error")
      }
      const organization = await organizationFetch.json()
      if (organization) {
        buildingBills.bills.map((bill: any) => {
          if (hasCountedDay(allDay, bill.date))
            days++
          if (aggregated.hasOwnProperty(bill.date)) {
            const existing = aggregated[bill.date];
            if (bill.date !== null) {
              aggregated[bill.date] = {
                date: existing.date,
                ...(organization.type.includes("Electric")) && { electric: parseFloat(existing.electric + bill.electric).toFixed(2) },
                ...(organization.type.includes("Gas")) && { gas: parseFloat(existing.gas + bill.gas).toFixed(2) },
                ...(organization.type.includes("Water")) && { water: parseFloat(isNaN(existing.water) ? 0 + bill.water : existing.water + bill.water).toFixed(2) },
              }
            }
          } else {
            aggregated[bill.date] = {
              date: bill.date,
              ...(organization.type.includes("Electric")) &&
              { electric: parseFloat(bill.electric).toFixed(2) },
              ...(organization.type.includes("Gas")) &&
              { gas: parseFloat(bill.gas).toFixed(2) },
              ...(organization.type.includes("Water")) &&
              { water: parseFloat(bill.water).toFixed(2) },
            }
          }
          if (organization.type.includes("Electric"))
            electric += bill.electric
          if (organization.type.includes("Gas"))
            gas += bill.gas
          if (organization.type.includes("Water"))
            water += bill.water
        })
      }
    }))
    data = {
      totalElectric: parseFloat(electric.toFixed(2)),
      totalGas: parseFloat(gas.toFixed(2)),
      totalWater: parseFloat(water.toFixed(2)),
      aggregated,
      all: buildingsBills,
      invoicesDays: days
    }
  }
  result.json(data)
})

export const getBillsByOrganizationIdAggregated = asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!id) {

    throw Error('Error');
  }

  const bills = await collections?.bills?.find({ organizationId: new ObjectId(id) }).toArray();
  if (!bills || bills.length === 0) {

    throw Error('Error');
  }

  const organization = await fetchOrganization(id);
  if (!organization) {

    throw Error('Error');
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
  } catch {
    throw Error('Error')
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