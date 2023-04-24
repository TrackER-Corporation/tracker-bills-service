import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectToDatabase } from './db/services/database.service';

dotenv.config();

const port = process.env.PORT;

const app = express();
app.use(cors());
app.use(express.json());

app.use(
  '/',
  (req, res, next) => {
    return res.status(200).json({ "msg": "test" })
  });

connectToDatabase()
app.listen(port, () => console.info(`tracker-bills-service is running`));

export default { app }