const express = require("express");
const {
  approveTransaction,
  listUsers,
  listGames,
  pendingTransactions,
  banUser,
  adjustWallet
} = require("../controllers/adminController");

const router = express.Router();

router.get("/users", listUsers);
router.get("/games", listGames);
router.get("/transactions/pending", pendingTransactions);
router.patch("/transactions/:transactionId", approveTransaction);
router.patch("/users/:userId/ban", banUser);
router.patch("/users/:userId/wallet", adjustWallet);

module.exports = router;