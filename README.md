# Drivebay

Password-locked file browser for every drive on this machine. Built to run inside [Pinokio](https://pinokio.computer).

**Install this URL in Pinokio:**

```
https://github.com/lordstryfe/drivebay-pinokio
```

Current version: **3.14** — see [Changelog](#changelog) below.

## Install in Pinokio (do this)

1. Delete any old Drivebay folders first. In File Explorer delete these if they exist:

   - `Z:\pinokio\api\drivebay.git`
   - `Z:\pinokio\api\drivebay`

2. Open **Pinokio**.
3. Go to **Discover** (or **Download from URL**).
4. Paste `https://github.com/lordstryfe/drivebay-pinokio` and download.
5. Click **Install**. Choose **Static** (you pick the port) or **Random** (new port each Start).
6. If you chose Static, forward **that same port** on your router.
7. Click **Start**, then **Open Drivebay**.
8. The first visit creates the **only** username and password. Pick something strong — Pinokio is already visible online, and this app can see every file on the machine.
9. After that, anyone who opens it can only unlock. Nobody else can sign up.
10. In the sidebar, open **X:**, **Z:**, and any other drives you want.

Change the port later with **Set port** or the in-app **Settings** page, then Start again.

Your username and password are stored in a `data` folder next to the app. **Update does not delete them.**

Search: type in the search box and press Enter (or Ctrl/Cmd+K). It looks through the current folder and its subfolders. Hidden folders follow the eye toggle.

## After it is running

- Browse folders, preview images and text, upload, new folder, rename, delete.
- Click **Lock** when you walk away.
- Open **Settings** for password, port, version, and feature requests.
- Use **Update** in Pinokio if this repo changes.

## Safety

Treat the password like a house key. Do not share the Pinokio link and the password together. The first person to open a fresh install owns the lock — make sure that person is you.

## Changelog

### 3.14
- Search walks **subfolders**.
- Hidden folders (names starting with `.`) are included when the eye is on.
- Toggling the eye re-runs the current search.

### 3.13
- Opens on **Home** instead of Workspace.
- Settings shows the version number.
- **Request a feature** in Settings opens a GitHub issue.

### 3.12
- Home page no longer loads the big file-browser module on the server (fixes Windows 500).
- **Update** now force-resets to GitHub `main` so new code actually arrives.

### 3.11
- Removed leftover file-list code that crashed the home page (500).

### 3.10
- Fixed a typo in `vite.config.ts` that blocked **Start**.

### 3.9
- Stopped a Windows database crash from showing a JSON 500 page.

### 3.8
- **Search this folder** (Enter or Ctrl/Cmd+K).

### 3.7
- **Settings** page (password + port).
- Login lock stored in a `data` folder so **Update does not wipe it**.

### 3.6
- Install / Set port asks **Random** or **Static**.

### 3.5
- Installer can pick a **static port** for router forwarding.

### 3.4
- Login works from a public / Tailscale / phone address (invalid origin fix).

### 3.3 and earlier
- Pinokio install package, X: and Z: drives, password lock, file browser.

## Without Pinokio

```sh
cd app
npm install
npm run dev
```
