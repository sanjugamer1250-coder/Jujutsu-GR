import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { ethers } from 'ethers';

const vaultName = process.env.KEY_VAULT_NAME || 'golden-ratio-vault';
const url = `https://${vaultName}.vault.azure.net`;

const credential = new DefaultAzureCredential();
const client = new SecretClient(url, credential);

const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
const allowedAdminAddresses = (process.env.ADMIN_ADDRESSES || '').split(',').map(a => a.trim().toLowerCase()).filter(Boolean);

export const executeAdminWithdrawal = async (targetAddress, amountInWei, requesterAddress) => {
  if (!ethers.isAddress(targetAddress)) {
    throw new Error('Invalid target address');
  }

  if (requesterAddress && !allowedAdminAddresses.includes(requesterAddress.toLowerCase())) {
    throw new Error('SECURITY FAILURE: Requester is not an authorized admin');
  }

  if (!rpcUrl) {
    throw new Error('BLOCKCHAIN_RPC_URL is not configured');
  }

  const secret = await client.getSecret('AdminTreasuryPrivateKey');
  const masterPrivateKey = secret.value;

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const adminWallet = new ethers.Wallet(masterPrivateKey, provider);

  const tx = await adminWallet.sendTransaction({
    to: targetAddress,
    value: amountInWei,
  });

  const receipt = await tx.wait();
  console.log(`Withdrawal successful! Tx Hash: ${receipt.hash}`);

  return { status: 'CONFIRMED', txHash: receipt.hash };
};
