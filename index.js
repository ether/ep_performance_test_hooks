'use strict';
const stats = require('../../src/node/stats');

const pushStatsToStats = (performanceStats) => {
  const performance = JSON.parse(performanceStats);
  console.warn("hrm", performance);
  for (const [key, value] of Object.entries(performance)) {
    stats.gauge(key, () => value);
    console.warn(key,value);
  }

}

/*
* Handle incoming stats
*/
exports.handleMessage = async (hookName, context) => {
  // Firstly ignore any request that aren't about chat
  let isStats = false;
  if (context && context.message && context.message.type && context.message.data && context.message.data.type === 'STATS') {
    isStats = true;
  }

  if (!isStats) {
    return false;
  } else {
    pushStatsToStats(context.message.data.message);
    return true;
  }
};
