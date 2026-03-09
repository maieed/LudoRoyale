const express = require("express");
const { getBalance, deposit, withdraw, history } = require("../controllers/walletController");

const router = express.Router();

router.get("/balance", getBalance);
router.post("/deposit", deposit);
router.post("/withdraw", withdraw);
router.get("/transactions", history);

module.exports = router;