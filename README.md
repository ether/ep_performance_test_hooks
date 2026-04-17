![Publish Status](https://github.com/ether/ep_performance_test_hooks/workflows/Node.js%20Package/badge.svg) [![Backend Tests Status](https://github.com/ether/ep_performance_test_hooks/actions/workflows/test-and-release.yml/badge.svg)](https://github.com/ether/ep_performance_test_hooks/actions/workflows/test-and-release.yml)

# Performance Test Hooks for Etherpad

A plugin to get test data to help improve the performance of Etherpad.

## Usage

See the collected stats at ``/stats``

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
