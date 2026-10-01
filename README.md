# DuckDNS IP Changer

DuckDNS IP Changer is a desktop application that keeps a DuckDNS hostname synced with your current public IP address. It watches your external IPv4, checks it on a selected interval, and updates the DuckDNS record automatically so your hostname continues to resolve to your current network.

This project combines a Next.js frontend with a Rust + Tauri backend. The UI lets you configure your DuckDNS domain, token, refresh interval, and notification preferences, while the native layer handles the actual API call to DuckDNS.

## Features

- Detects the machine's public IPv4 address using ipify
- Updates a DuckDNS hostname with the current IP
- Runs automatically on a configurable interval: 5, 10, or 15 minutes
- Shows the current public IP and live status in the app
- Includes a tray menu with Show and Quit actions
- Built as a desktop application using Tauri for native desktop integration

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Desktop shell: Tauri 2
- Backend: Rust with reqwest
- UI components: shadcn-style component library

## Project Structure

```text
.
├── src/                       # Next.js frontend
│   ├── app/                   # App pages and global styling
│   ├── components/            # Reusable UI components
│   └── lib/                  # Utility helpers
├── src-tauri/                # Tauri + Rust backend
│   ├── src/                  # Rust source code
│   ├── icons/                # App icons
│   ├── capabilities/         # Tauri capabilities
│   ├── Cargo.toml            # Rust dependencies
│   ├── tauri.conf.json      # App configuration
│   └── build.rs              # Tauri build config
├── public/                   # Static assets
├── package.json              # Node scripts and dependencies
├── tsconfig.json             # TypeScript config
├── next.config.ts            # Next.js configuration
├── eslint.config.mjs         # ESLint configuration
├── components.json           # shadcn config
├── README.md                 # Project documentation
└── .gitignore
```

## Requirements

Before running the app, make sure you have:

- Node.js 20+
- npm
- Rust stable toolchain
- Tauri prerequisites for your platform

On Windows, the usual requirements include:

- Visual Studio 2022 Build Tools with C++ workload
- WebView2 runtime if needed by your environment

## Installation

Clone the repository and install dependencies:

```bash
git clone <your-repository-url>
cd duckdns-ipchanger
npm install
```

## Running in Development

The app is configured to launch the Next.js frontend and the Tauri desktop shell together:

```bash
npm run tauri dev
```

If you want to run the web frontend alone for quick inspection:

```bash
npm run dev
```

Then open the local address shown by Next.js, usually http://localhost:3000.

## Usage

1. Open the app.
2. Enter your DuckDNS domain, such as `yourname.duckdns.org`.
3. Paste your DuckDNS token.
4. Choose the refresh interval.
5. Click Save Settings.
6. The app checks your public IP and updates DuckDNS automatically.

The update flow works as follows:

- The frontend reads the public IP using `https://api.ipify.org?format=json`
- It invokes the Rust command `update_duckdns`
- The backend sends a request to:

```text
https://www.duckdns.org/update?domains={domain}&token={token}&ip={ip}
```

- DuckDNS responds with `OK` on success or `KO` on rejection.

## Build for Production

To package the desktop application:

```bash
npm run tauri build
```

This creates the installable app/binary for your target platform.

## Security Notes

- Your DuckDNS token is entered in the app and used in the update request.
- The value is not permanently stored in the project by default.
- Treat the token like a password and avoid sharing screenshots or logs that include it.

## License

This project does not currently declare a license in the project metadata. If you plan to distribute or publish it, add an appropriate license file and update the Cargo package metadata as needed.

## Notes

This app is intended for personal or local use with a DuckDNS account. It is not a hosted service, and it depends on the DuckDNS API being reachable from the machine running it.
