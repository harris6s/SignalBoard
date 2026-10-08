# Setup guide

Connecting your data, every setting, branding and troubleshooting. Back to the [README](../README.md) · [Workbook reference](WORKBOOK.md)

## Connect your data

All three ways read the same workbook in the same way. Pick one.

> [!WARNING]
> A GitHub Pages site is public, and on most plans that is true even when the repository is private. Don't put a real workbook in the repository unless you're happy for anyone to download it. For private figures, use Option A or C.

### Option A: a private Google Sheet, live (recommended)

Your figures stay in a private Google Sheet that your tools or scripts fill. A small Cloudflare Worker reads it for the dashboard every minute, and only hands it to your dashboard's address.

1. Open `dashboard-template.xlsx` in Google Sheets (upload it to Drive, then open it with Google Sheets). Keep the tab names and headers.
2. Create a Google Cloud **service account** (console.cloud.google.com › IAM & Admin › Service Accounts › Create), enable the **Google Drive API** for the project, and create a JSON key. Share the sheet with the service account's email address as **Viewer**. The sheet stays private.
3. Create the Worker: Cloudflare › Workers & Pages › Create › Create Worker › Deploy, then *Edit code*, paste in `worker/worker.js`, and Deploy.
4. In the Worker's Settings › Variables and Secrets, add:
   - `DASHBOARD_SITES`: your dashboard's address without the path, e.g. `https://your-username.github.io` (or your own domain)
   - `SHEET_ID`: the long code in the sheet's address, between `/d/` and `/edit`
   - `GOOGLE_SERVICE_ACCOUNT` (secret): the whole JSON key file
   - `DASHBOARD_PASSWORD` (secret, recommended): the password people type to open the dashboard
5. In `config.js`, set `data.workerUrl` to the Worker's address (`https://<name>.<you>.workers.dev`), and `data.password` to `true` if you set a password. Commit the change.

No service account? Share the sheet as "Anyone with the link can view" and add `GOOGLE_API_KEY` instead (optional; it makes change checks instant). Anyone with the sheet's link can then open it, so the service account is the safer choice. The Worker can also read any direct link to an .xlsx file: set `FILE_URL` instead of `SHEET_ID` (OneDrive, Dropbox with `?dl=1`, S3 and so on).

### Option B: a link to an .xlsx file

Set `data.fileUrl` in `config.js` to a link the browser can download, and the dashboard reads it every minute. The simplest is a file next to the dashboard: put your workbook at `data/report.xlsx`, set `fileUrl: 'data/report.xlsx'`, and replace the file whenever it changes. Links on other sites only work if that site lets browsers download from other sites (CORS); if yours doesn't, use the Worker's `FILE_URL`. Anyone who can open the dashboard can download the file.

### Option C: open a file from your computer

Leave `workerUrl` and `fileUrl` empty and press **Open an Excel file**, or drag a file onto the page. The workbook is read inside the browser and never uploaded anywhere. In Chrome and Edge the dashboard keeps a link to the file and re-reads it within a minute of each save, so it stays live while you work in Excel. The last figures stay on that device until you press *Close this file* on the Connect data page.

## Settings (`config.js`)

| Setting | What it does |
|---|---|
| `name`, `tagline` | Your name and the line under it. |
| `logo` | Leave empty to use `img/logo.png`, or `img/logo.svg` when there is no PNG. Or the path or link of any image. |
| `color` | The accent colour, e.g. `'#1E88E5'`. Empty: taken from the logo. |
| `website`, `handles.tiktok`, `handles.x` | Your website's name, and handles used to link to your posts. |
| `currency` | The currency your stores and ad accounts pay you in. Apple proceeds paid in other currencies are converted with the rates at the top of `reader.js`. |
| `theme` | The theme new visitors see. |
| `allowPersonalize` | Show the Personalize button (on by default). |
| `words.niche`, `words.moments`, `words.partners`, `words.appFeatures` | What you post about, when interest peaks, who you could collaborate with, and what your app gives people, for the action plan's advice. |
| `pages.hide` | Pages to leave out: `funnels`, `social`, `facebook`, `instagram`, `youtube`, `tiktok`, `x`, `website`, `ads`, `installs`, `subs`, `adrev`, `stability`, `data`, `updates`. |
| `pages.hideEmpty` | Hide the pages of platforms with no data (on by default). |
| `data.workerUrl`, `data.password` | Option A. |
| `data.fileUrl` | Option B. |
| `data.allowOpenFile` | Option C (on by default). |
| `data.sample` | The sample workbook on the welcome screen; `''` hides it. |
| `topics.phrases`, `topics.same`, `topics.ignore` | Help the action plan read your captions: names of several words to keep together, other spellings and hashtags for the same thing, and common words that are not topics. |

## Branding

### With the Personalize panel

Press **Personalize** and every change shows straight away, behind the panel:

- **Logo**: PNG, SVG, JPG or WebP. It is resized to a crisp 512-pixel PNG and used in the side bar, the welcome and sign-in screens, the browser tab, the summary and printed pages.
- **Colour**: taken from the logo automatically (its most common strong colour, adjusted for each theme so text stays readable). Or pick your own, or keep the theme's.
- **Look**: the theme new visitors see, and your currency.
- **Name**: company name, the line under it, website and social handles.
- **Your words**: what you post about, when interest peaks, who you could collaborate with and what your app gives people. The action plan uses them in its advice.
- **Pages**: untick what you don't need, and choose whether platforms with no data hide themselves.

**Save** keeps your choices in that browser. **Download for GitHub** gives you `config.js` (and `logo.png` if you uploaded one) so they become the default for everyone. **Reset** goes back to the site's own settings.

### In the repository

| To change | Do this |
|---|---|
| Logo | Add a square PNG as `img/logo.png`, or replace `img/logo.svg`. |
| Colour | Nothing: it comes from the logo. To choose it, set `color: '#1E88E5'` in `config.js`. |
| Name and links | `name`, `tagline`, `website` and `handles` in `config.js`. |
| Currency | `currency: 'EUR'`, or any other ISO currency code. Money figures use its symbol. |
| Theme | `theme: 'daylight'`, `'broadcast'`, `'programme'` or `'midnight'`. Visitors can still pick their own. |
| Pages | `pages.hide: ['tiktok', 'x']` leaves pages out; `pages.hideEmpty` hides platforms with no data. |
| Advice wording | `words` in `config.js`. |
| The Personalize button | `allowPersonalize: false` hides it. |

## What the dashboard shows

- **Executive summary**: the headline numbers, a scorecard, what stands out and the top tasks.
- **Action plan**: everything that needs doing, numbered in the order to do it (this week, this month, when there's time). It compares the latest 28 days with the 28 before, ignores changes that are within a number's normal ups and downs, reads reach and followers together, checks whether the latest week is still getting worse, and drops a task once the numbers say it's done. *Copy the list* gives it as text for WhatsApp, Slack or email.
- **Funnels**, **Social overview**, and a page each for **Facebook, Instagram, YouTube, TikTok and X**.
- **Website**, **Paid ads** and **App installs**.
- **Subscribers and revenue** and **Ad revenue**.
- **App stability**, **Data coverage** (how current every source is, with a data audit), **Updates** (what changed in each new version of the workbook) and **Connect data** (every source, its tab, its API, and whether your workbook has it).

## Updating and privacy

- **New figures** appear by themselves while the dashboard is open.
- **Your copy doesn't update itself.** Copies made from a template are independent. To move to a newer version, replace the files with the new ones, keeping your `config.js` and `img/logo.png`.
- **The page holds no figures.** They come from your workbook: through the Worker only to your dashboard's address, and only after sign-in when you set a password.
- **No tracking.** The only outside request is Google Fonts, for the typefaces. Remove the font links in `index.html` to drop it.

## Troubleshooting

| You see | What to do |
|---|---|
| A 404 page on GitHub Pages | Wait a minute or two after turning Pages on, and check that Settings › Pages says *Deploy from a branch*, **main**, **/ (root)**. `index.html` must be at the top of the repository, not inside a folder. |
| The old logo | The file must be called exactly `logo.png`, in lower case, inside `img`. Refresh with Ctrl+F5 (Cmd+Shift+R on a Mac). A logo saved with Personalize in your browser comes first: open Personalize and press Reset. |
| An unexpected colour | Pick it in Personalize, or set `color` in `config.js`. Black, white and grey logos keep the theme's own colour. |
| "The data link refused this site" | Add your dashboard's address, e.g. `https://your-username.github.io`, to the Worker's `DASHBOARD_SITES`. |
| The welcome screen after setting `workerUrl` or `fileUrl` | Check the address in `config.js`. The message under the buttons says what went wrong. |
| A page is missing | Its platform has no data in the workbook. Turn off `pages.hideEmpty` to show it anyway; the Connect data page lists which tabs your workbook has. |
| A number looks wrong | The Data coverage page shows how current every tab is, and its audit checks the totals against the workbook's own sums. |
| Nothing happens from `index.html` on your disk | Open it from a web address instead (see the [Quick start](../README.md#getting-started)). |

## Project structure

```text
index.html               the page and its styles, four themes
config.js                your settings: brand, currency, pages, data source
brand.js                 logo, colour and the Personalize panel
app.js                   every page and chart
actions.js               the action plan's rules
reader.js                reads the workbook in the background
sources.js               every tab, column and API the dashboard knows
data.js                  empty starting data
img/logo.svg             placeholder logo (add img/logo.png to replace it)
lib/                     SheetJS, the Excel reader
dashboard-template.xlsx  the blank workbook
sample-data.xlsx         the same, filled with sample figures
worker/worker.js         optional Cloudflare Worker for a private Google Sheet
docs/                    WORKBOOK.md and the screenshots
```

To change the advice, every action plan rule is in `actions.js`, one `rule(...)` each with plain-language comments. To give a new tab its own section, read it in `reader.js` and draw it in `app.js`. Styles and theme colours are at the top of `index.html`.
