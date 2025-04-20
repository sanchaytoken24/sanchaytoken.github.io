const { Connection, PublicKey, clusterApiUrl, Transaction } = solanaWeb3;
const { getAssociatedTokenAddress, createTransferInstruction } = window.splToken;

const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
let wallet = null;
const tokenMintAddress = new PublicKey("EaeryGrfbM4R3p133WV5SF3jNG1Dh1oL6V9igYp7q1FD"); // SCY Mint

// Connect Phantom
document.getElementById("connectBtn").onclick = async () => {
  if (window.solana && window.solana.isPhantom) {
    try {
      const response = await window.solana.connect();
      wallet = window.solana;
      alert("Connected: " + wallet.publicKey.toString());
    } catch (err) {
      alert("Connection failed.");
    }
  } else {
    alert("Phantom Wallet not found.");
  }
};

// Load CSV Button triggers file input
document.getElementById("loadCsvBtn").onclick = () => {
  document.getElementById("csvFile").click();
};

// Read CSV and populate table
document.getElementById("csvFile").addEventListener("change", function (e) {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function (event) {
    const lines = event.target.result.split("\n");
    const tableBody = document.querySelector("#airdropTable tbody");
    tableBody.innerHTML = "";

    lines.forEach(line => {
      const [address, amount] = line.split(",");
      if (address && amount) {
        const row = tableBody.insertRow();
        row.insertCell(0).innerText = address.trim();
        row.insertCell(1).innerText = amount.trim();
        row.insertCell(2).innerText = "Pending";
      }
    });

    document.getElementById("airdropTable").style.display = "table";
  };

  reader.readAsText(file);
});

// Start Airdrop Logic
document.getElementById("startBtn").onclick = async () => {
  if (!wallet || !wallet.publicKey) {
    alert("Please connect Phantom wallet first.");
    return;
  }

  const tableRows = document.querySelectorAll("#airdropTable tbody tr");

  for (let row of tableRows) {
    const address = row.cells[0].innerText.trim();
    const amount = parseFloat(row.cells[1].innerText.trim());
    const recipient = new PublicKey(address);
    const sender = wallet.publicKey;

    try {
      const fromTokenAccount = await getAssociatedTokenAddress(tokenMintAddress, sender);
      const toTokenAccount = await getAssociatedTokenAddress(tokenMintAddress, recipient);

      const instruction = createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        sender,
        amount * 1e6
      );

      const transaction = new Transaction().add(instruction);
      const { signature } = await wallet.signAndSendTransaction(transaction);
      await connection.confirmTransaction(signature, "confirmed");

      row.cells[2].innerHTML = '<span class="success">Success</span>';
    } catch (error) {
      console.error("Airdrop failed:", error);
      row.cells[2].innerHTML = '<span class="failed">Failed</span>';
    }
  }
};
