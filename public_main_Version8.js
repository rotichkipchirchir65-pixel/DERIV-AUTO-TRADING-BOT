const socket = io();
const SYMBOLS = (window.location.search.match(/symbols=([^&]+)/) ? decodeURIComponent(window.location.search.match(/symbols=([^&]+)/)[1]) : null) || "R_100,R_50,frxEURUSD";
const symbols = SYMBOLS.split(',');

const symbolBlocks = {};
const charts = {};

function createSymbolBlock(symbol) {
  const div = document.createElement('div');
  div.className = 'symbol-block';
  div.innerHTML = `
    <h2>${symbol}</h2>
    <div>
      <label>Auto Trade <input type="checkbox" class="autoTrade" data-symbol="${symbol}" checked></label>
      <button class="manualBuy" data-symbol="${symbol}">Manual Buy Accumulator</button>
      <button class="manualSell" data-symbol="${symbol}">Manual Sell Accumulator</button>
      <input type="number" class="tradeSize" data-symbol="${symbol}" value="1" min="1" />
      <button class="showHistory" data-symbol="${symbol}">Show Trade History</button>
      <fieldset style="margin-top:10px;">
        <legend>Accumulator Params</legend>
        <label>Barrier <input type="number" class="barrier" data-symbol="${symbol}" value="100" /></label>
        <label>Growth Rate <input type="number" step="0.1" class="growth_rate" data-symbol="${symbol}" value="0.5" /></label>
        <label>Stop Out <select class="stop_out" data-symbol="${symbol}"><option value="low">Low</option><option value="high">High</option></select></label>
        <label>Duration <input type="number" class="duration" data-symbol="${symbol}" value="10" min="1" /></label>
        <button class="setAccumulatorParams" data-symbol="${symbol}">Set Params</button>
      </fieldset>
    </div>
    <canvas id="chart-${symbol}" width="350" height="150"></canvas>
    <div class="liveData" id="liveData-${symbol}"></div>
  `;
  document.getElementById('symbols').appendChild(div);
  symbolBlocks[symbol] = div;

  const ctx = document.getElementById(`chart-${symbol}`).getContext('2d');
  charts[symbol] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array(60).fill(''),
      datasets: [
        { label: 'Price', data: [], borderColor: '#00e6b8', fill: false },
        { label: 'Short MA', data: [], borderColor: '#ffbb00', fill: false },
        { label: 'Long MA', data: [], borderColor: '#ff0055', fill: false }
      ]
    },
    options: { responsive: false, scales: { x: { display: false }, y: { beginAtZero: false } } }
  });
}

symbols.forEach(createSymbolBlock);

document.querySelectorAll('.autoTrade').forEach(el => {
  el.onchange = e => {
    socket.emit('toggleAutoTrade', { symbol: e.target.dataset.symbol, enabled: e.target.checked });
  };
});
socket.on('autoTradeStatus', data => {
  document.querySelector(`.autoTrade[data-symbol="${data.symbol}"]`).checked = data.enabled;
});

document.querySelectorAll('.manualBuy').forEach(el => {
  el.onclick = e => {
    const symbol = e.target.dataset.symbol;
    const size = document.querySelector(`.tradeSize[data-symbol="${symbol}"]`).value;
    socket.emit('manualTrade', { symbol, action: 'BUY', size: +size });
  };
});
document.querySelectorAll('.manualSell').forEach(el => {
  el.onclick = e => {
    const symbol = e.target.dataset.symbol;
    const size = document.querySelector(`.tradeSize[data-symbol="${symbol}"]`).value;
    socket.emit('manualTrade', { symbol, action: 'SELL', size: +size });
  };
});

document.querySelectorAll('.showHistory').forEach(el => {
  el.onclick = e => {
    const symbol = e.target.dataset.symbol;
    socket.emit('getTradeHistory', symbol);
  };
});
socket.on('tradeHistory', data => {
  document.getElementById('history').textContent = `${data.symbol}:\n` + JSON.stringify(data.history, null, 2);
});

document.querySelectorAll('.setAccumulatorParams').forEach(el => {
  el.onclick = e => {
    const symbol = e.target.dataset.symbol;
    const barrier = +document.querySelector(`.barrier[data-symbol="${symbol}"]`).value;
    const growth_rate = +document.querySelector(`.growth_rate[data-symbol="${symbol}"]`).value;
    const stop_out = document.querySelector(`.stop_out[data-symbol="${symbol}"]`).value;
    const duration = +document.querySelector(`.duration[data-symbol="${symbol}"]`).value;
    socket.emit('setAccumulatorParams', { symbol, params: { barrier, growth_rate, stop_out, duration } });
  };
});
socket.on('accumulatorParamsSet', data => {
  document.getElementById('tradeMsg').textContent = `${data.symbol}: Accumulator params set!`;
});

document.querySelectorAll('.tradeSize').forEach(el => {
  el.onchange = e => {
    socket.emit('setTradeSize', { symbol: e.target.dataset.symbol, size: +e.target.value });
  };
});

socket.on('priceUpdate', d => {
  if (d.prices && charts[d.symbol]) {
    charts[d.symbol].data.datasets[0].data = d.prices;
    charts[d.symbol].data.datasets[1].data = d.prices.map((_, i, arr) => i < 10 ? null : arr.slice(i - 10, i).reduce((a, b) => a + b, 0) / 10);
    charts[d.symbol].data.datasets[2].data = d.prices.map((_, i, arr) => i < 50 ? null : arr.slice(i - 50, i).reduce((a, b) => a + b, 0) / 50);
    charts[d.symbol].update();
  }
  if (symbolBlocks[d.symbol]) {
    symbolBlocks[d.symbol].querySelector(`#liveData-${d.symbol}`).innerHTML =
      `<p>Live Price: <b>${d.price}</b></p>
       <p>Short MA: <b>${d.shortMA}</b></p>
       <p>Long MA: <b>${d.longMA}</b></p>
       <p>Signal: <b>${d.signal || '--'}</b></p>
       <p>RSI: <b>${d.rsi || '--'}</b></p>
       <p>MACD: <b>${d.macd ? d.macd.macdLine : '--'}</b></p>
       <p>Bollinger: <b>U:${d.boll ? d.boll.upper : '--'} L:${d.boll ? d.boll.lower : '--'}</b></p>`;
  }
});

socket.on('tradeResult', msg => {
  document.getElementById('tradeMsg').textContent = `${msg.symbol}: ${msg.text}`;
});