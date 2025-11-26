/**
 * Author: Anton Carlo Santoro
 * Copyright: (c) 2025 Anton Carlo Santoro. All rights reserved.
 * 
 * Script per testare deposit_and_bridge con CCTP su Solana devnet
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { NextblockSatellite } from "../target/types/nextblock_satellite";

// Configurazione
const USDC_MINT_DEVNET = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const TOKEN_MESSENGER = new PublicKey("CCTPmbSD7gX1bxKPAmg77w8oFzNFpaQiQUWD43TKaecd");
const MESSAGE_TRANSMITTER = new PublicKey("CCTPiPYPc6AsJuwueEnWgSgucamXDZwBd53dQ11YiKX3");

async function main() {
  // Setup provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.NextblockSatellite as Program<NextblockSatellite>;
  const user = provider.wallet as anchor.Wallet;

  console.log("========================================");
  console.log("NEXTBLOCK CCTP DEPOSIT TEST");
  console.log("========================================");
  console.log("");
  console.log("Network: Devnet");
  console.log("User:", user.publicKey.toString());
  console.log("Program:", program.programId.toString());
  console.log("");

  // Deriva PDAs
  const [statePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("state")],
    program.programId
  );

  const [authorityPda, authorityBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("authority")],
    program.programId
  );

  // Ottieni state per deposit_count
  let state;
  try {
    state = await program.account.programState.fetch(statePda);
    console.log("Program State:");
    console.log("  Admin:", state.admin.toString());
    console.log("  Paused:", state.paused);
    console.log("  Total Deposits:", state.totalDeposits.toString());
    console.log("  Deposit Count:", state.depositCount.toString());
    console.log("");
  } catch (e) {
    console.error("Error: Program not initialized");
    console.log("Run 'anchor run initialize' first");
    process.exit(1);
  }

  // Deriva deposit record PDA
  const depositCount = state.depositCount.toNumber();
  const [depositRecordPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("deposit"),
      Buffer.from(new Uint8Array(new BigUint64Array([BigInt(depositCount)]).buffer)),
    ],
    program.programId
  );

  // User USDC account
  const userUsdcAccount = await getAssociatedTokenAddress(
    USDC_MINT_DEVNET,
    user.publicKey
  );

  // Program USDC account
  const programUsdcAccount = await getAssociatedTokenAddress(
    USDC_MINT_DEVNET,
    authorityPda,
    true
  );

  // Verifica user USDC balance
  const connection = provider.connection;
  try {
    const balance = await connection.getTokenAccountBalance(userUsdcAccount);
    console.log("User USDC Balance:", balance.value.uiAmount, "USDC");
    console.log("");
  } catch (e) {
    console.error("Error: User doesn't have USDC account");
    console.log("Get USDC from faucet: https://faucet.circle.com/");
    process.exit(1);
  }

  // Parametri deposit
  const amount = new anchor.BN(100_000_000); // 100 USDC
  const recipient = Buffer.from([
    0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0,
    0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0,
    0x12, 0x34, 0x56, 0x78,
  ]); // 20 bytes - esempio indirizzo Base

  console.log("Deposit Parameters:");
  console.log("  Amount:", amount.toNumber() / 1_000_000, "USDC");
  console.log("  Recipient (Base):", recipient.toString("hex"));
  console.log("");

  // Deriva CCTP accounts
  const [tokenMessengerPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("token_messenger")],
    TOKEN_MESSENGER
  );

  const [messageTransmitterPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("message_transmitter")],
    MESSAGE_TRANSMITTER
  );

  const [tokenMinterPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("token_minter")],
    TOKEN_MESSENGER
  );

  // Remote token messenger (Base)
  const remoteTokenMessenger = PublicKey.findProgramAddressSync(
    [Buffer.from("remote_token_messenger")],
    TOKEN_MESSENGER
  )[0];

  // Message sent event data account
  const messageSentEventData = Keypair.generate();

  console.log("Executing deposit_and_bridge...");
  console.log("");

  try {
    const tx = await program.methods
      .depositAndBridge(amount, Array.from(recipient))
      .accounts({
        state: statePda,
        depositRecord: depositRecordPda,
        userUsdcAccount: userUsdcAccount,
        programUsdcAccount: programUsdcAccount,
        programAuthority: authorityPda,
        usdcMint: USDC_MINT_DEVNET,
        user: user.publicKey,
        tokenMessengerProgram: TOKEN_MESSENGER,
        messageTransmitterProgram: MESSAGE_TRANSMITTER,
        tokenMessenger: tokenMessengerPda,
        messageTransmitter: messageTransmitterPda,
        tokenMinter: tokenMinterPda,
        remoteTokenMessenger: remoteTokenMessenger,
        messageSentEventData: messageSentEventData.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([messageSentEventData])
      .rpc();

    console.log("========================================");
    console.log("DEPOSIT SUCCESSFUL");
    console.log("========================================");
    console.log("");
    console.log("Transaction:", tx);
    console.log("Explorer:", `https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    console.log("");

    // Fetch deposit record
    const depositRecord = await program.account.depositRecord.fetch(depositRecordPda);
    console.log("Deposit Record:");
    console.log("  Deposit ID:", depositRecord.depositId.toString());
    console.log("  User:", depositRecord.user.toString());
    console.log("  Recipient:", Buffer.from(depositRecord.recipient).toString("hex"));
    console.log("  Amount:", depositRecord.amount.toNumber() / 1_000_000, "USDC");
    console.log("  CCTP Nonce:", depositRecord.cctpNonce.toString());
    console.log("  Status:", Object.keys(depositRecord.status)[0]);
    console.log("");

    // Fetch updated state
    const updatedState = await program.account.programState.fetch(statePda);
    console.log("Updated Program State:");
    console.log("  Total Deposits:", updatedState.totalDeposits.toString());
    console.log("  Deposit Count:", updatedState.depositCount.toString());
    console.log("");

    console.log("Next Steps:");
    console.log("1. Check CCTP Explorer: https://cctp-explorer.circle.com/");
    console.log("2. Wait for attestation (2-3 minutes)");
    console.log("3. Verify mint on Base Sepolia");
    console.log("4. Check CCTPReceiver received funds");
    console.log("5. Verify vault shares minted");
    console.log("");

  } catch (e) {
    console.error("========================================");
    console.error("DEPOSIT FAILED");
    console.error("========================================");
    console.error("");
    console.error("Error:", e);
    console.error("");
    
    if (e.toString().includes("ProgramPaused")) {
      console.error("Program is paused. Run unpause first.");
    } else if (e.toString().includes("AmountTooLow")) {
      console.error("Amount too low. Minimum is 10 USDC.");
    } else if (e.toString().includes("InsufficientFunds")) {
      console.error("Insufficient USDC balance.");
    }
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
