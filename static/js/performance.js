'use strict';

// It's hacky but we use window.top to ensure all the values are in the same namespace
// TODO: make this less hacky.  Note that my initial solution worked fine when minify
// was false, it was only when minify was set to true that I needed to do this hack.
// CRITICAL TODO: This causes a global leak which causes the tests to fail.

// Lazily get (and create) the shared namespace. `documentReady` only fires on the
// pad page (pad.html), never in the timeslider bootstrap, so hooks that also fire in
// the timeslider (postToolbarInit, postTimesliderInit) used to throw
// `TypeError: Cannot set properties of undefined` there. Those uncaught errors
// surfaced as error toasts and broke core's timeslider specs. Ensuring the namespace
// exists makes every hook safe regardless of which page fired it.
const hooks = () => (window.top.etherpadHooks = window.top.etherpadHooks || {});

exports.documentReady = () => {
  hooks().documentReady = Date.now();
};
exports.aceAttribClasses = () => hooks().aceAttribClasses = Date.now();
exports.aceEditorCSS = () => hooks().aceEditorCSS = Date.now();
exports.aceInitInnerdocbodyHead =
    () => hooks().aceInitInnerdocbodyHead = Date.now();
exports.aceInitialized = () => hooks().aceInitialized = Date.now();
exports.postToolbarInit = () => hooks().postToolbarInit = Date.now();
exports.postTimesliderInit = () => hooks().postTimesliderInit = Date.now();

exports.postAceInit = () => {
  hooks().postAceInit = Date.now();
  const perf = {};
  perf.etherpadHooks = hooks();
  perf.etherpadHooksDuration = {};

  // Takes previous hook times and stores a duration
  // This is useful for graphing.
  for (const [hook, time] of Object.entries(perf.etherpadHooks)) {
    perf.etherpadHooksDuration[hook] = time - perf.etherpadHooks.documentReady;
  }

  perf.performance = performance.getEntriesByType('navigation')[0];
  perf.loadTimes = {};
  perf.loadSizes = {};
  // main window
  perf.loadTimes.main = getLoadTimes(window.performance.getEntriesByType('resource'));
  perf.loadSizes.main = getSizeData(performance.getEntriesByType('resource'));
  // ace_outer
  perf.loadTimes.outer = getLoadTimes(window[1].performance.getEntriesByType('resource'));
  perf.loadSizes.outer = getSizeData(window[1].performance.getEntriesByType('resource'));
  // ace_inner
  perf.loadTimes.inner = getLoadTimes(window[1].frames[0].performance.getEntriesByType('resource'));
  perf.loadSizes.inner = getSizeData(window[1].frames[0].performance.getEntriesByType('resource'));
  const myAuthorId = pad.getUserId();
  const padId = pad.getPadId();
  const message = {
    type: 'STATS',
    action: 'sendSTATS',
    message: JSON.stringify(perf),
    padId,
    myAuthorId,
  };
  pad.collabClient.sendMessage(message); // Send the chat position message to the server
};

const getLoadTimes = (resources) => {
  const data = {};

  for (let i = 0; i < resources.length; i++) {
    const name = new URL(resources[i].name).pathname;
    data[name] = {};

    // Redirect time
    let t = resources[i].redirectEnd - resources[i].redirectStart;
    data[name].redirectTime = t;

    // DNS time
    t = resources[i].domainLookupEnd - resources[i].domainLookupStart;
    data[name].domainLookupTime = t;

    // TCP handshake time
    t = resources[i].connectEnd - resources[i].connectStart;
    data[name].tcpTime = t;

    // Secure connection time
    t = (resources[i].secureConnectionStart > 0) ? (
      resources[i].connectEnd - resources[i].secureConnectionStart
    ) : '0';
    data[name].secureConnectionTime = t;

    // Response time
    t = resources[i].responseEnd - resources[i].responseStart;
    data[name].responseTime = t;

    // Fetch until response end
    t = (resources[i].fetchStart > 0)
      ? (resources[i].responseEnd - resources[i].fetchStart) : '0';
    data[name].fetchUntilResponseEndTime = t;

    // Request start until response end
    t = (resources[i].requestStart > 0)
      ? (resources[i].responseEnd - resources[i].requestStart) : '0';
    data[name].requestStartUntilResponseEndTime = t;

    // Start until response end
    t = (resources[i].startTime > 0) ? (resources[i].responseEnd - resources[i].startTime) : '0';
    data[name].startUntilResponseEndTime = t;
  }
  return data;
};

const getSizeData = (list) => {
  if (list === undefined) {
    return;
  }
  const data = {};

  // For each "resource", display its Size property values
  for (let i = 0; i < list.length; i++) {
    const url = new URL(list[i].name).pathname;
    data[url] = {};

    if ('decodedBodySize' in list[i]) {
      data[url].decodedBodySize = list[i].decodedBodySize;
    }

    if ('encodedBodySize' in list[i]) {
      data[url].encodedBodySize = list[i].encodedBodySize;
    }

    if ('transferSize' in list[i]) {
      data[url].transferSize = list[i].transferSize;
    }
  }
  return data;
};
