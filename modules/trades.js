const fs = require('fs');
const tradeFile = './data/trades.json';

let tradeHistory = {};
if (fs.existsSync(tradeFile)) tradeHistory = JSON.parse(fs.readFileSync(tradeFile));
if (!tradeHistory || typeof tradeHistory !== 'object') tradeHistory = {};

function executeTrade(symbol, action, size, price, user) {
  if (!tradeHistory[symbol]) tradeHistory[symbol] = [];
  const entry = { action, size: +size, price, time: Date.now(), user };
  tradeHistory[symbol].push(entry);
  fs.writeFileSync(tradeFile, JSON.stringify(tradeHistory, null, 2));
  return { text: `Simulated Trade: ${action} at ${price}`, ...entry };
}

function getTradeHistory(symbol) {
  return tradeHistory[symbol] || [];
}

function setRiskConfig(c) {}

module.exports = { executeTrade, getTradeHistory, setRiskConfig };
