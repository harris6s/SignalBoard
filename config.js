/* =====================================================================================================
   DASHBOARD SETTINGS: the only file you need to edit.
   Easiest: open the dashboard, press Personalize, set your logo, colour and name, then "Download for GitHub"
   and replace this file with the one it gives you. Or edit the settings below by hand.
   Everything the dashboard shows comes from one Excel workbook (or Google Sheet) with the tabs listed in
   README.md and in dashboard-template.xlsx. Pick ONE way to connect it under "data" below.
   ===================================================================================================== */
window.DASH = {

  /* ---------- your brand ---------- */
  name: 'Your Brand',                   // shown in the side bar, page titles and copied summaries
  tagline: 'Analytics dashboard',        // the line under the name
  logo: '',                              // leave empty: logo.png is used if you upload one, otherwise logo.svg
  color: '',                             // accent colour, e.g. '#1E88E5'. Empty: taken from your logo automatically
  website: 'yourwebsite.com',            // shown on the Website page
  handles: {                             // used to link to your posts; leave blank if you don't use a platform
    tiktok: '',                          // e.g. 'yourbrand' for tiktok.com/@yourbrand
    x: ''                                // e.g. 'yourbrand' for x.com/yourbrand
  },
  currency: 'USD',                       // the currency your stores and ad accounts pay you in: 'USD', 'EUR', 'GBP', 'QAR'...
  theme: '',                             // the look for new visitors: 'midnight', 'broadcast', 'programme' or 'daylight'
  allowPersonalize: true,                // show the Personalize button (choices made there stay in that browser)

  /* ---------- words the action plan uses in its advice ---------- */
  words: {
    niche: 'your niche',                       // what you post about: 'travel', 'football', 'cooking'
    moments: 'big moments',                    // when interest peaks: 'match days', 'launches', 'holiday weekends'
    partners: 'creators and brands in your niche',  // who you could do collab posts with
    appFeatures: 'alerts, updates and exclusive content'   // what your app gives people (if you have one)
  },

  /* ---------- pages ---------- */
  pages: {
    hide: [],            // pages to leave out, e.g. ['tiktok', 'x', 'stability']
    hideEmpty: true      // hide the pages of platforms that have no data in your workbook
  },

  /* ---------- where the data comes from: fill in ONE of these ---------- */
  data: {
    /* A. A Cloudflare Worker that reads your Google Sheet (or any Excel link) for you. Private, and updates
          every minute. Set it up with cloudflare-worker.js (README.md, "Option A"). Example:
          workerUrl: 'https://my-dashboard-data.yourname.workers.dev'                                        */
    workerUrl: '',
    password: false,     // true if your Worker has DASHBOARD_PASSWORD set: the dashboard then asks for it

    /* B. A direct link to an .xlsx file the browser can read: the simplest is a file put next to the
          dashboard, e.g. 'data/report.xlsx'. Re-read every minute, so replacing the file updates the page. */
    fileUrl: '',

    /* C. Let people open an Excel file from their own computer. It is read in the browser and never
          uploaded anywhere. In Chrome and Edge the page re-reads the file by itself when it is saved.      */
    allowOpenFile: true,

    /* Offer the sample workbook (sample-data.xlsx) on the welcome screen, so people can try the dashboard. */
    sample: 'sample-data.xlsx'
  },

  /* ---------- topics (optional): help the action plan read your captions ---------- */
  topics: {
    phrases: {},   // names of two or more words to keep together, with how to show them: { 'new york': 'New York', 'air fryer': 'Air Fryer' }
    same: {},      // other spellings and hashtags for the same thing: { 'nyc': 'new york', 'airfryer': 'air fryer' }
    ignore: []     // common words in your captions that are not topics: ['recipe', 'episode']
  }
};

/* Instagram's follower total, for the rare case your workbook has no Instagram follower figures at all.
   Leave as it is unless you need it: { value: 12345, asOf: '2026-10-01' } */
window.ATR_MANUAL = { instagramFollowers: null };
