# EPF Wallet

An EIP-4337 Compatible wallet that aims to challenge the status quo of Ethereum EOA wallets.

## Motivation

<!-- What problem is your project is solving? Why is it important and what area of the protocol will be affected? -->

We are moving closer towards the finalisation of [EIP-4337](https://eips.ethereum.org/EIPS/eip-4337). A lot of effort by the core team has been put into designing the contracts, mempool, DOS protections etc. But the team haven't had time to properly support UserOps through one of the browser extension wallets.

This project aims to make a user-facing wallet which can then pave the way forward for the wallets in the Ethereum ecosystem. The larger goal is to test the eip enough and make it ready for everyday use. Once we get AAs into everyday use we can then easily work towards the depreciation of EOAs from the ecosystem.

## Install Extension

### Install dependency

```shell
yarn
```

### Run extension

```shell
yarn workspace @epf-wallet/extension run dev
```

### Install Extension

Once the build is running, you can install the extension in your browser of choice:

- [Firefox instructions](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/)
- [Chrome, Brave, Edge, and Opera instructions](https://developer.chrome.com/docs/extensions/mv3/getstarted/#manifest)
  - Note that these instructions are for Chrome, but substituting
    `brave://extensions` or `edge://extensions` or `opera://extensions` for `chrome://extensions`
    depending on browser should get you to the same buttons.
