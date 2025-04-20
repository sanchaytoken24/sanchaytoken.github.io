const { Connection, PublicKey, clusterApiUrl, Transaction } = solanaWeb3;
const { getAssociatedTokenAddress, createTransferInstruction } = window.splToken;

const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
let wallet = null;
const tokenMintAddress = new PublicKey("EaeryGrfbM4R3p133WV5SF3jNG1Dh1oL6V9igYp7q1FD");

document.getElementById("connectWallet").onclick = async () => {
  if (window.solana && window.solana.isPhantom) {
    try {
      const res = await window.solana.connect();
      wallet = window.solana;
      alert("Connected: " + res.publicKey.toString());
    } catch (err) {
      alert("Wallet connection failed");
    }
  } else {
    alert("Phantom Wallet not found.");
  }
};

document.getElementById("csvFile").addEventListener("change", function (event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  const tbody = document.querySelector("#airdropTable tbody");

  reader.onload = function (e) {
    const lines = e.target.result.split("\n");
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

document.getElementById("startAirdrop").onclick = async () => {
  if (!wallet || !wallet.publicKey) {
    alert("Please connect your wallet.");
    return;
  }

  const rows = document.querySelectorAll("#airdropTable tbody tr");

  for (let row of rows) {
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

      const tx = new Transaction().add(instruction);
      const { signature } = await wallet.signAndSendTransaction(tx);
      await connection.confirmTransaction(signature, "confirmed");

      row.cells[2].innerHTML = '<span class="success">Success</span>';
    } catch (err) {
      console.error("Airdrop failed:", err);
      row.cells[2].innerHTML = '<span class="failed">Failed</span>';
    }
  }
};
