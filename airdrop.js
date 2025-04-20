// airdrop.js
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction
} from "https://cdn.skypack.dev/@solana/spl-token";

const provider = window.solana;
const status = document.getElementById("status");
const connectBtn = document.getElementById("connect");
const loadBtn = document.getElementById("load");
const startBtn = document.getElementById("start");
const logBox = document.getElementById("logBox");
const tableBody = document.getElementById("tableBody");
const MINT = new solanaWeb3.PublicKey("EaeryGrfbM4R3p133WV5SF3jNG1Dh1oL6V9igYp7q1FD");

let wallet = null;
let connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl("mainnet-beta"));
let airdropList = [];

const log = (msg) => {
  console.log(msg);
  logBox.textContent += msg + "\n";
};

connectBtn.onclick = async () => {
  try {
    const resp = await provider.connect();
    wallet = resp.publicKey;
    status.textContent = "Connected: " + wallet.toBase58();
    log("Wallet connected.");
  } catch (e) {
    status.textContent = "Connection failed.";
    log("Error: " + e.message);
  }
};

loadBtn.onclick = () => {
  const file = document.getElementById("fileInput").files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const lines = e.target.result.trim().split("\n");
    tableBody.innerHTML = "";
    airdropList = lines.map((line, i) => {
      const [addr, amt] = line.split(",");
      const row = tableBody.insertRow();
      row.insertCell(0).textContent = i + 1;
      row.insertCell(1).textContent = addr;
      row.insertCell(2).textContent = amt;
      row.insertCell(3).textContent = "Pending";
      return { address: addr.trim(), amount: parseFloat(amt), row };
    });
    log("Loaded " + airdropList.length + " entries.");
  };
  reader.readAsText(file);
};

startBtn.onclick = async () => {
  if (!wallet) return alert("Connect wallet first");
  const fromTokenAcc = await getAssociatedTokenAddress(MINT, wallet);
  log("Source Token Account: " + fromTokenAcc.toBase58());

  for (let i = 0; i < airdropList.length; i++) {
    const entry = airdropList[i];
    try {
      const recipient = new solanaWeb3.PublicKey(entry.address);
      const toTokenAcc = await getAssociatedTokenAddress(MINT, recipient);
      const tx = new solanaWeb3.Transaction();

      const toInfo = await connection.getAccountInfo(toTokenAcc);
      if (!toInfo) {
        log(`Creating ATA for ${entry.address}`);
        tx.add(createAssociatedTokenAccountInstruction(wallet, toTokenAcc, recipient, MINT));
      }

      log(`Adding transfer: ${entry.amount} to ${entry.address}`);
      tx.add(createTransferInstruction(fromTokenAcc, toTokenAcc, wallet, entry.amount));
      tx.feePayer = wallet;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signed = await provider.signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      log(`Tx submitted: ${sig}`);

      await connection.confirmTransaction(sig);
      entry.row.cells[3].textContent = "Sent";
      log(`✅ Success: ${entry.amount} SCY sent to ${entry.address}`);
    } catch (e) {
      entry.row.cells[3].textContent = "Failed";
      log(`❌ Failed ${entry.address}: ${e.message}`);
    }
  }
};
