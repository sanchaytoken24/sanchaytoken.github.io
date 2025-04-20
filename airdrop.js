const { Connection, PublicKey, clusterApiUrl, Transaction } = solanaWeb3;
const { getAssociatedTokenAddress, createTransferInstruction } = window.splToken;

const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
let wallet = null;
const tokenMintAddress = new PublicKey("EaeryGrfbM4R3p133WV5SF3jNG1Dh1oL6V9igYp7q1FD"); // SCY Mint Address

document.getElementById("connectBtn").onclick = async () => {
  if (window.solana && window.solana.isPhantom) {
    try {
      await window.solana.connect();
      wallet = window.solana;
      alert("Wallet connected: " + wallet.publicKey.toString());
    } catch (err) {
      alert("Wallet connection failed.");
    }
  } else {
    alert("Phantom Wallet not found.");
  }
};

document.getElementById("csvFile").addEventListener("change", function (e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  const tbody = document.querySelector("#airdropTable tbody");

  reader.onload = function (event) {
    const lines = event.target.result.split("\n");
    tbody.innerHTML = "";

    for (let line of lines) {
      const [address, amount] = line.split(",");
      if (address && amount) {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = address.trim();
        row.insertCell(1).innerText = amount.trim();
        row.insertCell(2).innerText = "Pending";
      }
    }

    document.getElementById("airdropTable").style.display = "table";
  };

  reader.readAsText(file);
});

document.getElementById("startBtn").onclick = async () => {
  if (!wallet || !wallet.publicKey) {
    alert("Please connect your Phantom wallet first.");
    return;
  }

  const tbody = document.querySelector("#airdropTable tbody");
  const rows = tbody.rows;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const recipient = new PublicKey(row.cells[0].innerText.trim());
    const amount = parseFloat(row.cells[1].innerText.trim());

    try {
      const sender = wallet.publicKey;
      const fromTokenAccount = await getAssociatedTokenAddress(tokenMintAddress, sender);
      const toTokenAccount = await getAssociatedTokenAddress(tokenMintAddress, recipient);

      const instruction = createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        sender,
        amount * 1e6 // Adjust if token has different decimals
      );

      const transaction = new Transaction().add(instruction);
      const { signature } = await wallet.signAndSendTransaction(transaction);
      await connection.confirmTransaction(signature, "confirmed");

      row.cells[2].innerHTML = '<span class="status-success">Success</span>';
    } catch (error) {
      console.error("Error sending to", recipient.toString(), error);
      row.cells[2].innerHTML = '<span class="status-failed">Failed</span>';
    }
  }
};
