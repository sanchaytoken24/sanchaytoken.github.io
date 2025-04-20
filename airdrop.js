const { Connection, clusterApiUrl, PublicKey, Transaction } = solanaWeb3;
const { getAssociatedTokenAddress, createTransferInstruction, getAccount } = window.splToken;

const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
let wallet = null;
let tokenMintAddress = "EaeryGrfbM4R3p133WV5SF3jNG1Dh1oL6V9igYp7q1FD"; // SANCHAY ($SCY) Token Mint

const csvInput = document.getElementById("csvFile");
const table = document.getElementById("airdropTable").getElementsByTagName("tbody")[0];

// Connect Phantom
document.getElementById("connectBtn").onclick = async () => {
  if (window.solana && window.solana.isPhantom) {
    try {
      const response = await window.solana.connect();
      wallet = window.solana;
      alert("Connected: " + response.publicKey.toString());
    } catch (err) {
      alert("Connection failed.");
    }
  } else {
    alert("Phantom Wallet not found.");
  }
};

// Load CSV
csvInput.addEventListener("change", function (e) {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function (event) {
    const lines = event.target.result.split("\n");
    table.innerHTML = "";

    for (let i = 0; i < lines.length; i++) {
      const [address, amount] = lines[i].split(",");
      if (address && amount) {
        const row = table.insertRow();
        row.insertCell(0).innerText = address.trim();
        row.insertCell(1).innerText = amount.trim();
        row.insertCell(2).innerText = "Pending";
      }
    }

    document.getElementById("airdropTable").style.display = "table";
  };

  reader.readAsText(file);
});

// Start Airdrop
document.getElementById("startBtn").onclick = async () => {
  if (!wallet || !wallet.publicKey) return alert("Please connect Phantom first");

  const tokenMint = new PublicKey(tokenMintAddress);
  const rows = table.rows;

  for (let i = 0; i < rows.length; i++) {
    const address = rows[i].cells[0].innerText;
    const amount = parseFloat(rows[i].cells[1].innerText);
    const recipient = new PublicKey(address);
    const sender = wallet.publicKey;

    try {
      const fromTokenAccount = await getAssociatedTokenAddress(tokenMint, sender);
      const toTokenAccount = await getAssociatedTokenAddress(tokenMint, recipient);

      const instruction = createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        sender,
        amount * 1e6 // Adjust if SCY uses different decimals
      );

      const transaction = new Transaction().add(instruction);
      const { signature } = await wallet.signAndSendTransaction(transaction);
      await connection.confirmTransaction(signature, "confirmed");

      rows[i].cells[2].innerText = "Success";
    } catch (err) {
      rows[i].cells[2].innerText = "Failed";
      console.error("Airdrop failed for", address, err);
    }
  }
};
