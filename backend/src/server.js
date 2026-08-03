import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { executeAdminWithdrawal } from './treasuryAuth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
}));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/treasury/withdraw', async (req, res) => {
  const { targetAddress, amountInWei, requesterAddress } = req.body;

  if (!targetAddress || !amountInWei) {
    return res.status(400).json({ error: 'Missing targetAddress or amountInWei' });
  }

  try {
    const result = await executeAdminWithdrawal(targetAddress, amountInWei, requesterAddress);
    res.json(result);
  } catch (error) {
    console.error('Authorization failed. Treasury Locked.', error.message);
    res.status(403).json({ error: 'SECURITY FAILURE: Cannot process withdrawal' });
  }
});

app.listen(PORT, () => {
  console.log(`Treasury auth server running on port ${PORT}`);
});
