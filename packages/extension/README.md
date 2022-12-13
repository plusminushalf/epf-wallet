# Extension

## Setup

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

## Contributions

### Directory structure

`packages/extension` directory has the code related to browser extension. The code lives in the `src` directory, `public` directory hosts the publically accessible assets. The project is built using [Vite](https://vitejs.dev/), uses [Preact](https://preactjs.com/) for extension's popup, app and injected content scripts. App's state is stored in background script and kept in synced with frontend using [webext-redux](https://github.com/tshaddix/webext-redux). For the purpose of stying we are using [Tailwindcss](https://tailwindcss.com/) and it's component library [DaisyUI](https://daisyui.com/).

Major folders are `app`, `popup`, `content` and `background`. The names are self explanory and they represent respectfull manofest filles. Here is a light guide to the directory structure:

```
packages/extension
│   README.md
│   manifest.config.ts       # Manifest configuration for the extension
|   ...                      # Other configuration files
│
└───src
│   └───app                  # The App UI code. This project has a light popup and a heavy full desktop app.
|   │   └───pages            # The app pages
|   │   └───routes           # The route definations
│   └───background           # Background script for the extension, This contains the redux confiduration & core services like keyring.
|   │   └───hooks            # Custom hooks that can be used by app as well as popup.
|   │   └───redux-slices     # We use @reduxjs/toolkit to create slices to interact with redux state
|   │   └───services         # Services that will be used by background, example keyring service to keep private keys & other signing information secure
|   │   └───utils            # Common utils for app, popup, & background
│   └───components           # Common UI components that can be used in app or popup
│   └───content              # The content script that is injected into the browser tab to give access to window.ethereum
│   └───popup                # The extensions popup UI code.
│   └───sandbox              # The sandbox environment to load multiple SCW implementation modules

```
