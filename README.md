![Publish Status](https://github.com/ether/ep_performance_test_hooks/workflows/Node.js%20Package/badge.svg) [![Backend Tests Status](https://github.com/ether/ep_performance_test_hooks/actions/workflows/test-and-release.yml/badge.svg)](https://github.com/ether/ep_performance_test_hooks/actions/workflows/test-and-release.yml)

# Performance Test Hooks for Etherpad

**See exactly how long your Etherpad takes to become editable — and which assets weigh it down — straight from the browser, with no external APM.**

This plugin instruments the client lifecycle: it times every Etherpad boot hook (`documentReady` → `postAceInit`) and records the load time and byte size of every resource the pad, outer frame, and inner editor request. The data is exposed as JSON at `/stats`, ready to graph, alert on, or diff between releases.

## Why you'd want it

- **Find the slow phase of pad load.** The boot waterfall (`etherpadHooksDuration`) shows the cost of each lifecycle stage, so you know whether time goes to the editor, the toolbar, or plugin init — not just a single opaque "load time".
- **Catch asset bloat before users do.** Per-resource decoded/encoded/transfer sizes make it obvious when a font, locale bundle, or plugin asset balloons.
- **Spot regressions across releases.** `/stats` is plain JSON, so you can snapshot it in CI and fail the build when boot time or payload size creeps up.
- **No third-party APM.** Everything is collected with the browser's own `PerformanceResourceTiming` API and stays on your server.

## The data

Open any pad (this is what populates the metrics), then `GET /stats`. The plugin's output lives under the `ep_performance_test_hooks` key. Below is a **real response** from an Etherpad running this plugin — the values are exactly as captured; only explanatory `//` comments have been added and the `loadTimes`/`loadSizes` maps truncated (the full response carries every resource across all three frames — 49 + 49 + 46 in this capture):

```jsonc
{
  "ep_performance_test_hooks": {
    // Wall-clock timestamp each lifecycle hook fired
    "etherpadHooks": {
      "documentReady": 1781864859040,
      "aceInitInnerdocbodyHead": 1781864859200,
      "aceInitialized": 1781864859220,
      "postToolbarInit": 1781864859250,
      "postAceInit": 1781864859323
    },
    // The boot waterfall: ms from documentReady to each hook
    "etherpadHooksDuration": {
      "documentReady": 0,
      "aceInitInnerdocbodyHead": 160,
      "aceInitialized": 180,
      "postToolbarInit": 210,
      "postAceInit": 283          // editor interactive 283 ms after documentReady
    },
    // Per-resource timing for the main / outer / inner frames (2 of 49 shown)
    "loadTimes": {
      "main": {
        "/static/css/pad.css": {
          "redirectTime": 0, "domainLookupTime": 0, "tcpTime": 0,
          "secureConnectionTime": "0", "responseTime": 0,
          "fetchUntilResponseEndTime": 0,
          "requestStartUntilResponseEndTime": 0,
          "startUntilResponseEndTime": 0
        }
      }
    },
    // Per-resource byte sizes (2 of 49 shown)
    "loadSizes": {
      "main": {
        "/static/css/pad.css":               { "decodedBodySize": 9279, "encodedBodySize": 9279, "transferSize": 0 },
        "/static/skins/colibris/pad.css":    { "decodedBodySize": 2145, "encodedBodySize": 2145, "transferSize": 0 }
      }
    }
  }
}
```

## What's measured

| Field | What it tells you |
| --- | --- |
| `etherpadHooks` | Wall-clock timestamp each lifecycle hook fired |
| `etherpadHooksDuration` | Milliseconds from `documentReady` to each hook — the **boot waterfall** |
| `loadTimes.{main,outer,inner}` | Redirect / DNS / TCP / TLS / response timings per resource, for each of the three pad frames |
| `loadSizes.{main,outer,inner}` | `decodedBodySize` / `encodedBodySize` / `transferSize` per resource |
| `performance` | The page's `navigation` PerformanceEntry |

## Usage

The plugin only emits data — render or alert on it however you like. For example, fail CI if the editor takes too long to become interactive:

```sh
curl -s http://localhost:9001/stats \
  | jq '.ep_performance_test_hooks.etherpadHooksDuration.postAceInit'   # -> 283
```

…or find your heaviest assets:

```sh
curl -s http://localhost:9001/stats \
  | jq -r '.ep_performance_test_hooks.loadSizes.main
           | to_entries | sort_by(-.value.decodedBodySize)[:10][]
           | "\(.value.decodedBodySize)\t\(.key)"'
```

## Installation

Install from the Etherpad admin UI (**Admin → Manage Plugins**,
search for `ep_performance_test_hooks` and click *Install*), or from the Etherpad
root directory:

```sh
pnpm run plugins install ep_performance_test_hooks
```

> ⚠️ Don't run `npm i` / `npm install` yourself from the Etherpad
> source tree — Etherpad tracks installed plugins through its own
> plugin-manager, and hand-editing `package.json` can leave the
> server unable to start.

After installing, restart Etherpad.
