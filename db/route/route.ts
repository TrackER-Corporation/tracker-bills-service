import express from 'express'
const router = express.Router()
import { addData, getBills, getBillsByOrganizationId, getBuildingBills, getBillsRenewableOnly, getBillsAggregatedFiltered, getBillsByOrganizationIdAggregated, updateData } from '../controller/controller'


router.post('/add/:id', addData)
router.post('/update/:id', updateData)
router.get('/', getBills)
router.get('/buildings/:id', getBuildingBills)
router.get('/renewable/:id', getBillsRenewableOnly)
router.get('/organization/:id', getBillsByOrganizationId)
router.get('/organization/aggregated/:id', getBillsByOrganizationIdAggregated)
router.get('/:id', getBillsAggregatedFiltered)

export default router