# Drivebay

Password-locked file browser for every drive on this machine. Built to run inside [Pinokio](https://pinokio.computer).

**Install this URL in Pinokio:**

```
https://github.com/lordstryfe/drivebay-pinokio
```

## Install in Pinokio (do this)

1. Delete any old Drivebay folders first. In File Explorer delete these if they exist:

   - `Z:\pinokio\api\drivebay.git`
   - `Z:\pinokio\api\drivebay`

2. Open **Pinokio**.
3. Go to **Discover** (or **Download from URL**).
4. Paste `https://github.com/lordstryfe/drivebay-pinokio` and download.
5. Click **Install**. When it asks, pick a **static port** (example `42013`) and wait until it finishes.
6. Forward **that same port** on your router if you want the phone / internet to reach Drivebay.
7. Click **Start**, then **Open Drivebay**.
8. The first visit creates the **only** username and password. Pick something strong — Pinokio is already visible online, and this app can see every file on the machine.
9. After that, anyone who opens it can only unlock. Nobody else can sign up.
10. In the sidebar, open **X:**, **Z:**, and any other drives you want.

Change the port later with **Set port**, then Start again. If it loaded correctly you will see version **3.5**.



## After it is running

- Browse folders, preview images and text, upload, new folder, rename, delete.
- Click **Lock** when you walk away.
- Use **Update** in Pinokio if this repo changes.

## Safety

Treat the password like a house key. Do not share the Pinokio link and the password together. The first person to open a fresh install owns the lock — make sure that person is you.

## Without Pinokio

```sh
npm install
npm run dev
```
