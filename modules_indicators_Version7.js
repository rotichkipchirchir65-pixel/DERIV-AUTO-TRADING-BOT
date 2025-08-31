function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length - 1; i++) {
    const diff = prices[i + 1] - prices[i];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const rs = gains / (losses || 1);
  return +(100 - 100 / (1 + rs)).toFixed(2);
}
function ema(prices, period) {
  if (prices.length < period) return null;
  const k = 2 / (period + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}
function calculateMACD(prices, fast = 12, slow = 26, signal = 9) {
  if (prices.length < slow + signal) return null;
  const emaFast = ema(prices, fast);
  const emaSlow = ema(prices, slow);
  const macdLine = emaFast - emaSlow;
  return { macdLine: +macdLine.toFixed(5), signalLine: +ema(prices, signal).toFixed(5) };
}
function calculateBollinger(prices, period = 20, mult = 2) {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  const avg = slice.reduce((a, b) => a + b, 0) / period;
  const stddev = Math.sqrt(slice.map(p => Math.pow(p - avg, 2)).reduce((a, b) => a + b, 0) / period);
  return {
    upper: +(avg + mult * stddev).toFixed(5),
    lower: +(avg - mult * stddev).toFixed(5),
    avg: +(avg).toFixed(5)
  };
}
module.exports = { calculateRSI, calculateMACD, calculateBollinger };