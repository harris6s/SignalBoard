# The workbook

Everything the dashboard shows comes from one Excel workbook (or Google Sheet) with a tab for each source. This page lists every tab and column, the API call or report that fills each one, and what each API needs. [`dashboard-template.xlsx`](dashboard-template.xlsx) has the same tabs with a note on every header, and [`sample-data.xlsx`](sample-data.xlsx) shows them filled in. Back to the [README](README.md).

## Rules for every tab

- **Keep the tab names and column names.** How you write them does not matter (`Profile Visits`, `profile_visits` and `profileVisits` all work), and many of the platforms' own names are recognised too (`impressions` for views on Instagram, `website_clicks` for link taps, and so on).
- **One header row, then one row per day** (or per post, video or transaction, as each tab says). Dates as `YYYY-MM-DD` text or real Excel dates.
- **Plain numbers**: `4.99`, not `$4.99`. Rates as fractions (`0.0082` = 0.82%) unless the column says %.
- **`loaded_at`** (optional, any tab): when your pipeline wrote the row. If a post or a day appears more than once, the newest copy wins, so you can append fresh totals instead of editing rows.
- **`api_status`** (optional, any tab): rows marked `error` or `failed` are ignored, so a failed API call never shows as a zero.
- **Only fill what you use.** Empty or missing tabs leave their pages empty (and hidden, with `pages.hideEmpty`). Extra tabs and columns are picked up automatically and shown under *New in the sheet*.
- The template's own *Start here*, *Sources* and *Columns* tabs are ignored by the dashboard; keep or delete them.

## Every tab at a glance

| Area | Tab | Filled from | One row per | Required columns |
|---|---|---|---|---|
| Facebook | **Meta Organic** | Meta Graph API: Page Insights | day | `date`, `page_media_view`, `page_post_engagements`, `page_follows`, `page_daily_follows` |
| Facebook | **Facebook Posts** | Meta Graph API: Page posts and post insights | post | `post_id`, `published_at`, `type`, `message`, `views` |
| Facebook | **Facebook Stories** | Meta Graph API: Page stories | story | `story_id`, `published_at`, `views` |
| Instagram | **Instagram** | Instagram Graph API: account insights | day | `date`, `reach`, `follower_count` |
| Instagram | **Instagram Posts** | Instagram Graph API: media and media insights | post | `post_id`, `published_at`, `type`, `caption`, `views`, `reach` |
| Instagram | **Instagram Stories** | Instagram Graph API: stories | story | `story_id`, `published_at`, `views` |
| Instagram | **Instagram Account Activity** | Instagram Graph API: account insights (total_value) | period | `date`, `range_start`, `range_end` |
| Instagram | **Instagram Follower History** | Instagram Graph API: follows_and_unfollows | day | `date`, `followers_gained`, `followers_lost` |
| Instagram | **Instagram Follower Snapshots** | Instagram Graph API: user fields | snapshot | `date`, `followers_total` |
| YouTube | **YouTube Daily** | YouTube Analytics API | day | `date`, `views`, `estimatedMinutesWatched`, `subscribersGained`, `subscribersLost` |
| YouTube | **YouTube** | YouTube Data API: channels | day | `date`, `subscribers` |
| YouTube | **YouTube Videos** | YouTube Data API (videos.list) and YouTube Analytics API (dimensions=video) | video | `video_id`, `published_at`, `title`, `views` |
| YouTube | **YouTube Video Daily** | YouTube Analytics API | video per day | `date`, `video_id`, `views` |
| YouTube | **YouTube Reach** | YouTube Reporting API: channel_reach_basic_a1 report | video per day | `date`, `impressions`, `impressions_ctr` |
| TikTok | **TikTok** | TikTok API (Display API user info and video list, or the Business API) | One account row per day, plus one row per video | `date`, `grain` |
| X | **X** | X API v2 | One account row per day, plus one row per post | `date`, `grain` |
| Website | **GA4** | Google Analytics Data API (GA4) | day | `date`, `sessions` |
| Website | **GA4 Channels** | Google Analytics Data API (GA4) | channel per day | `date`, `channel_group`, `sessions` |
| Paid ads | **Meta** | Meta Marketing API: Ads Insights | day (or per campaign per day) | `date`, `spend` |
| App (Android) | **Play Installs** | Google Play Console statistics reports (Cloud Storage bucket) | day (or per country per day) | `date`, `daily_device_installs` |
| App (Android) | **Play Subscriptions** | Google Play Console subscriptions report (Cloud Storage bucket) | product per day | `date`, `new_subscriptions`, `cancelled_subscriptions`, `active_subscriptions` |
| App (Android) | **Play Traffic Source** | Google Play Console: store performance report | source per day | `date`, `traffic_source`, `store_listing_visitors`, `store_listing_acquisitions` |
| App (iPhone) | **App Store Sales** | App Store Connect API: Sales and Trends | product line per day | `date`, `product_type_identifier`, `units` |
| App (iPhone) | **App Store Subscriptions** | App Store Connect API: Sales and Trends | subscription (and country) per day | `date`, `active_standard_price_subscriptions`, `active_free_trial_introductory_offer_subscriptions` |
| App (iPhone) | **App Store Subscription Events** | App Store Connect API: Sales and Trends | event type per day | `date`, `event`, `quantity` |
| App (iPhone) | **App Store Installs** | App Store Connect API: Analytics Reports | source per day | `date`, `event`, `counts` |
| App (iPhone) | **App Store Deletions** | App Store Connect API: Analytics Reports | day | `date`, `deletions` |
| App stability | **Play_Quality_History** | Google Play Developer Reporting API | metric per day | `date`, `dataset`, `metric`, `dimension`, `value` |
| Revenue | **Play Earnings** | Google Play Console earnings report (Cloud Storage bucket) | transaction line | `date`, `transaction_id`, `transaction_type`, `amount_merchant_currency` |
| Ad revenue | **AdMob** | AdMob API: network report | day (or per country and app per day) | `date`, `estimated_earnings`, `impressions`, `ad_requests` |
| Ad revenue | **AdSense** | AdSense Management API | day | `date`, `estimated_earnings` |
| Data | **Dashboard Status** | Your own pipeline | run | `source`, `status` |

## Tab by tab

Each tab, the API call or report that fills it, and its columns (**bold** = required). The `Columns` tab in the template has an example value for every column.

### Facebook

**Meta Organic**: Your Facebook Page, one row per day.  
API: Meta Graph API: Page Insights. `GET /{page-id}/insights?metric=page_media_view,page_total_media_view_unique,page_post_engagements,page_follows,page_daily_follows,page_views_total&period=day`  
Columns: **`date`** (the day (YYYY-MM-DD)); **`page_media_view`** (views of the Page's posts, reels and stories that day); **`page_post_engagements`** (reactions, comments, shares and clicks on posts); **`page_follows`** (total Page followers at the end of the day); **`page_daily_follows`** (new follows that day); `page_total_media_view_unique` (people who viewed (each counted once)); `page_views_total` (visits to the Page itself); `video_views` (video views that day); `reactions` (reactions that day); `comments` (comments that day); `shares` (shares that day); `link_clicks` (clicks on links in posts).

**Facebook Posts**: One row per post with its latest totals. Update the row, or add a new one with a later loaded_at.  
API: Meta Graph API: Page posts and post insights. `GET /{page-id}/posts, then GET /{post-id}/insights?metric=post_media_view,post_impressions_unique,post_reactions_by_type_total,post_clicks_by_type`  
Columns: **`post_id`** (the post's ID); **`published_at`** (when the post went out (date or date and time)); **`type`** (photo, video, reel, link or status); **`message`** (the caption (used to find which topics work)); `url` (link to the post); **`views`** (views of the post); `reach` (people who saw it); `reactions` (reactions); `comments` (comments); `shares` (shares); `link_clicks` (link clicks); `video_views` (video views); `watch_time_minutes` (total minutes watched); `loaded_at` (when your pipeline wrote this row (the newest copy of a post wins)).

**Facebook Stories**: One row per story.  
API: Meta Graph API: Page stories. `GET /{page-id}/stories, then story insights`  
Columns: **`story_id`** (the story's ID); **`published_at`** (when it went out); `message` (text, if any); `url` (link); **`views`** (views); `reach` (people who saw it); `reactions` (reactions).

### Instagram

**Instagram**: Your Instagram account, one row per day.  
API: Instagram Graph API: account insights. `GET /{ig-user-id}/insights?metric=reach,follower_count,views,accounts_engaged,profile_views,website_clicks&period=day`  
Columns: **`date`** (the day); **`reach`** (accounts reached that day); **`follower_count`** (new followers that day (Instagram's follower_count metric)); `views` (views that day); `accounts_engaged` (accounts that interacted); `profile_visits` (profile visits); `external_link_taps` (taps on the link in bio); `followers_total` (total followers at the end of the day); `likes` (likes); `comments` (comments); `saves` (saves); `shares` (shares).

**Instagram Posts**: One row per post or reel with its latest totals.  
API: Instagram Graph API: media and media insights. `GET /{ig-user-id}/media, then GET /{media-id}/insights?metric=views,reach,likes,comments,saved,shares,profile_visits,follows,total_interactions`  
Columns: **`post_id`** (the media ID); **`published_at`** (when it went out); **`type`** (IMAGE, VIDEO, CAROUSEL_ALBUM or REELS); **`caption`** (the caption); `url` (permalink); **`views`** (views); **`reach`** (accounts reached); `likes` (likes); `comments` (comments); `saves` (saves); `shares` (shares); `profile_visits` (profile visits from the post); `follows` (follows from the post); `total_interactions` (all interactions); `loaded_at` (when your pipeline wrote this row).

**Instagram Stories**: One row per story.  
API: Instagram Graph API: stories. `GET /{ig-user-id}/stories, then story insights`  
Columns: **`story_id`** (the story ID); **`published_at`** (when it went out); **`views`** (views); `reach` (accounts reached); `replies` (replies); `taps_forward` (taps forward); `taps_back` (taps back); `exits` (exits); `link_clicks` (link sticker taps).

**Instagram Account Activity**: Account totals over a period (for example a month).  
API: Instagram Graph API: account insights (total_value). `GET /{ig-user-id}/insights?metric=views,profile_views,website_clicks,total_interactions,follows_and_unfollows&metric_type=total_value&since=…&until=…`  
Columns: **`date`** (the day the totals were read (usually the last day of the period)); **`range_start`** (first day of the period); **`range_end`** (last day of the period); `views` (views); `profile_visits` (profile visits); `link_clicks` (link in bio taps); `total_interactions` (all interactions); `follows` (follows).

**Instagram Follower History**: Followers gained and lost each day.  
API: Instagram Graph API: follows_and_unfollows. `GET /{ig-user-id}/insights?metric=follows_and_unfollows&metric_type=total_value&breakdown=follow_type&period=day`  
Columns: **`date`** (the day); **`followers_gained`** (followers gained); **`followers_lost`** (followers lost); `net_followers` (gained minus lost); `followers_total` (total followers, if you have it).

**Instagram Follower Snapshots**: Your follower total now and then (the dashboard fills the days between).  
API: Instagram Graph API: user fields. `GET /{ig-user-id}?fields=followers_count`  
Columns: **`date`** (the day of the snapshot); **`followers_total`** (total followers).

### YouTube

**YouTube Daily**: Your channel, one row per day.  
API: YouTube Analytics API. `reports.query ids=channel==MINE dimensions=day metrics=views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost,likes,comments,shares`  
Columns: **`date`** (the day); **`views`** (views); **`estimatedMinutesWatched`** (minutes watched); `averageViewDuration` (average view length in seconds); **`subscribersGained`** (subscribers gained); **`subscribersLost`** (subscribers lost); `likes` (likes); `comments` (comments); `shares` (shares).

**YouTube**: Channel totals, one snapshot per day.  
API: YouTube Data API: channels. `channels.list part=statistics mine=true`  
Columns: **`date`** (the day); **`subscribers`** (subscribers); `total_views` (all-time views); `total_videos` (videos on the channel).

**YouTube Videos**: One row per video or Short with its latest totals.  
API: YouTube Data API (videos.list) and YouTube Analytics API (dimensions=video). `videos.list part=snippet,contentDetails; reports.query dimensions=video metrics=views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained`  
Columns: **`video_id`** (the video ID); **`published_at`** (when it went out); **`title`** (title); `type` (short or video (or give duration and Shorts are worked out: 3 minutes or less is a Short)); `duration` (length in seconds (38) or YouTube's own format (PT38S)); `url` (link); **`views`** (views); `watch_time_minutes` (minutes watched); `avg_view_duration_seconds` (average view length in seconds); `avg_view_percentage` (average share watched (%)); `subscribers_gained` (subscribers gained from it); `impressions` (thumbnail impressions); `impressions_ctr` (click-through rate (%)); `likes` (likes); `comments` (comments); `loaded_at` (when your pipeline wrote this row).

**YouTube Video Daily**: Optional: per-video daily figures. Fills in recent days before the channel report catches up.  
API: YouTube Analytics API. `reports.query dimensions=day,video metrics=views,estimatedMinutesWatched,subscribersGained,subscribersLost`  
Columns: **`date`** (the day); **`video_id`** (the video ID); **`views`** (views); `watch_time_minutes` (minutes watched); `subscribers_gained` (subscribers gained); `subscribers_lost` (subscribers lost).

**YouTube Reach**: Optional: thumbnail impressions and click-through.  
API: YouTube Reporting API: channel_reach_basic_a1 report. `reportTypes channel_reach_basic_a1`  
Columns: **`date`** (the day); `video_id` (the video ID); **`impressions`** (thumbnail impressions); **`impressions_ctr`** (click-through rate (%)).

### TikTok

**TikTok**: Account rows (grain = account) and video rows (grain = video) in one tab.  
API: TikTok API (Display API user info and video list, or the Business API). `user/info fields=follower_count,following_count,likes_count,video_count; video/list fields=id,title,create_time,view_count,like_count,comment_count,share_count`  
Columns: **`date`** (the day the row was captured); **`grain`** (account or video); `follower_count` (followers (account rows)); `following_count` (following (account rows)); `heart_count` (total likes (account rows)); `play_count` (plays: all-time on account rows, per video on video rows); `dimension_id` (video ID (video rows)); `dimension_name` (video caption (video rows)); `published_at` (when the video went out (video rows)); `likes` (likes (video rows)); `comments` (comments (video rows)); `shares` (shares (video rows)).

### X

**X**: Account rows (grain = account) and post rows (grain = post) in one tab.  
API: X API v2. `GET /2/users/:id?user.fields=public_metrics; GET /2/users/:id/tweets?tweet.fields=public_metrics,non_public_metrics,created_at`  
Columns: **`date`** (the day the row was captured); **`grain`** (account or post); `follower_count` (followers (account rows)); `following_count` (following (account rows)); `post_count` (posts (account rows)); `dimension_id` (post ID (post rows)); `dimension_name` (post text (post rows)); `published_at` (when the post went out (post rows)); `impressions` (impressions (post rows)); `likes` (likes); `reposts` (reposts); `replies` (replies); `bookmarks` (bookmarks); `engagements` (all engagements).

### Website

**GA4**: Your website, one row per day.  
API: Google Analytics Data API (GA4). `properties/{id}:runReport dimensions=date metrics=sessions,totalUsers,newUsers,screenPageViews,engagedSessions,averageSessionDuration,bounceRate,conversions,totalRevenue`  
Columns: **`date`** (the day); **`sessions`** (visits); `total_users` (visitors); `new_users` (new visitors); `page_views` (page views); `engaged_sessions` (engaged visits); `avg_session_duration` (average visit length in seconds); `bounce_rate` (bounce rate (0 to 1)); `conversions` (conversions (key events)); `total_revenue` (revenue).

**GA4 Channels**: Visits by channel (Organic Search, Direct, Organic Social…), one row per channel per day.  
API: Google Analytics Data API (GA4). `properties/{id}:runReport dimensions=date,sessionDefaultChannelGroup metrics=sessions,totalUsers,newUsers`  
Columns: **`date`** (the day); **`channel_group`** (the channel); **`sessions`** (visits); `source_medium` (source / medium).

### Paid ads

**Meta**: Your Meta (Facebook and Instagram) ads, one row per day (or per campaign per day).  
API: Meta Marketing API: Ads Insights. `GET /act_{ad-account-id}/insights?level=account&time_increment=1&fields=spend,impressions,clicks,reach,inline_link_clicks,actions`  
Columns: **`date`** (the day); **`spend`** (amount spent); `impressions` (impressions); `clicks` (clicks); `reach` (people reached); `inline_link_clicks` (link clicks); `act_landing_page_view` (landing page views (from actions)); `act_mobile_app_install` (app installs (from actions)); `dimension_name` (campaign name, if one row per campaign).

### App (Android)

**Play Installs**: Google Play installs and uninstalls, one row per day (or per country per day).  
API: Google Play Console statistics reports (Cloud Storage bucket). `gs://pubsite_prod_…/stats/installs/installs_{package}_{yyyymm}_overview.csv (or _country.csv)`  
Columns: **`date`** (the day); **`daily_device_installs`** (installs on new devices); `daily_user_installs` (installs by new users); `daily_user_uninstalls` (uninstalls by users); `uninstall_events` (uninstall events); `update_events` (update events); `active_device_installs` (devices with the app installed); `country` (country code, if one row per country).

**Play Subscriptions**: Google Play subscriptions, one row per product (and country) per day.  
API: Google Play Console subscriptions report (Cloud Storage bucket). `gs://pubsite_prod_…/financial-stats/subscriptions/subscriptions_{package}_{product}_{yyyymm}_country.csv`  
Columns: **`date`** (the day); `product_id` (subscription product); **`new_subscriptions`** (new subscriptions); **`cancelled_subscriptions`** (cancellations); **`active_subscriptions`** (active subscriptions); `is_free_trial_offer` (TRUE if the new ones started on a free trial); `country` (country code).

**Play Traffic Source**: Google Play store listing visitors and installs by traffic source.  
API: Google Play Console: store performance report. `Play Console > Store performance > Traffic sources (export), or the stats/store_performance reports`  
Columns: **`date`** (the day); **`traffic_source`** (google Play search, Google Play explore, Ads and referrals…); **`store_listing_visitors`** (store listing visitors); **`store_listing_acquisitions`** (visitors who installed).

### App (iPhone)

**App Store Sales**: App Store downloads and subscription proceeds from Apple's daily sales report.  
API: App Store Connect API: Sales and Trends. `GET /v1/salesReports?filter[reportType]=SALES&filter[reportSubType]=SUMMARY&filter[frequency]=DAILY`  
Columns: **`date`** (the day); **`product_type_identifier`** (1 = first download, 3 = re-download, 7 = update, IAY = subscription); **`units`** (units); `developer_proceeds` (proceeds per unit (subscriptions)); `currency_of_proceeds` (currency of the proceeds); `country_code` (country); `title` (app or subscription name).

**App Store Subscriptions**: Active iPhone subscriptions from Apple's daily subscription report.  
API: App Store Connect API: Sales and Trends. `GET /v1/salesReports?filter[reportType]=SUBSCRIPTION&filter[frequency]=DAILY`  
Columns: **`date`** (the day); **`active_standard_price_subscriptions`** (paying subscribers); **`active_free_trial_introductory_offer_subscriptions`** (subscribers on a free trial); `subscription_name` (subscription); `country` (country).

**App Store Subscription Events**: Trials, conversions, renewals and cancellations from Apple's subscription event report.  
API: App Store Connect API: Sales and Trends. `GET /v1/salesReports?filter[reportType]=SUBSCRIPTION_EVENT&filter[frequency]=DAILY`  
Columns: **`date`** (the day); **`event`** (start Introductory Offer, Paid Subscription from Introductory Offer, Renew, Cancel, Start Offer Code, Subscribe, Reactivate…); **`quantity`** (how many).

**App Store Installs**: Installs and deletions by source from Apple's analytics report.  
API: App Store Connect API: Analytics Reports. `App Store Installation and Deletion report (POST /v1/analyticsReportRequests, then download the instances)`  
Columns: **`date`** (the day); **`event`** (install or Delete); `download_type` (first-time download, Redownload, Manual update…); `source_type` (app Store search, App Store browse, Web referrer, App referrer…); **`counts`** (how many).

**App Store Deletions**: Optional: iPhone deletions per day, if you keep them in their own tab.  
API: App Store Connect API: Analytics Reports. `App Store Installation and Deletion report (Delete events)`  
Columns: **`date`** (the day); **`deletions`** (deletions).

### App stability

**Play_Quality_History**: Android vitals: crash and ANR (freeze) rates, one row per metric per day.  
API: Google Play Developer Reporting API. `vitals.crashrate:query and vitals.anrrate:query (metrics crashRate, userPerceivedCrashRate, anrRate, userPerceivedAnrRate, distinctUsers)`  
Columns: **`date`** (the day); **`dataset`** (crashRateMetricSet or anrRateMetricSet); **`metric`** (crashRate, userPerceivedCrashRate, anrRate, userPerceivedAnrRate or distinctUsers); **`dimension`** ([] for the whole app); **`value`** (the value (a rate as a fraction: 0.0082 = 0.82%)).

### Revenue

**Play Earnings**: Google Play earnings report rows: charges, Google fees, taxes and refunds.  
API: Google Play Console earnings report (Cloud Storage bucket). `gs://pubsite_prod_…/earnings/earnings_{yyyymm}_{id}.zip`  
Columns: **`date`** (transaction date); **`transaction_id`** (transaction ID); **`transaction_type`** (charge, Google fee, Tax or Refund); **`amount_merchant_currency`** (amount in your payout currency (fees are negative)); `merchant_currency` (your payout currency); `product_title` (product).

### Ad revenue

**AdMob**: In-app ad earnings, one row per day (or per country and app per day).  
API: AdMob API: network report. `accounts.networkReport.generate dimensions=DATE,COUNTRY,APP metrics=ESTIMATED_EARNINGS,IMPRESSIONS,AD_REQUESTS,CLICKS`  
Columns: **`date`** (the day); **`estimated_earnings`** (estimated earnings); **`impressions`** (impressions); **`ad_requests`** (ad requests); `clicks` (clicks); `country` (country); `app` (app).

**AdSense**: Website ad earnings, one row per day.  
API: AdSense Management API. `accounts.reports.generate dimensions=DATE metrics=ESTIMATED_EARNINGS`  
Columns: **`date`** (the day); **`estimated_earnings`** (estimated earnings).

### Data

**Dashboard Status**: Optional: your pipeline's own log, shown on the Data page as API health.  
API: Your own pipeline. `Write one row per API run`  
Columns: **`source`** (which API); **`status`** (ok or error); `last_success` (last good run); `message` (error text, if any).

## Filling the workbook from the APIs

Any way that puts the right rows in the right tabs works. Most people use one of these:

- **By hand or from exports.** Every platform can export a CSV. Paste it into the tab and rename the headers to match. Fine for a weekly update.
- **A no-code tool.** Make, Zapier, Supermetrics, Coupler.io and similar tools can pull most of these APIs into Google Sheets on a schedule. Point each one at its tab and map the fields to the column names above.
- **Your own script.** A small Python or Google Apps Script job that runs once a day, calls each API for yesterday's figures, and appends one row per day (or per post). Write `loaded_at` with the time, and `api_status` = `error` when a call fails. Add a row per run to the **Dashboard Status** tab and the Data coverage page shows the health of every API.

## What each API needs

Check each platform's current rules, as they change.

| Source | What you need |
|---|---|
| Facebook and Instagram (Meta Graph API) | A Facebook Page linked to an Instagram professional account, and a Meta app with a Page access token. Permissions: `pages_read_engagement`, `read_insights`, `instagram_basic`, `instagram_manage_insights`. |
| Meta Ads (Marketing API) | The same Meta app with `ads_read` on your ad account. |
| YouTube | A Google Cloud project with the YouTube Data API v3 and YouTube Analytics API enabled, and OAuth sign-in as the channel owner. The YouTube Reporting API gives thumbnail impressions. |
| TikTok | A TikTok for Developers app (Display API scopes `user.info.stats` and `video.list`), or the TikTok Business API. |
| X | An X developer account; impressions per post need user-context access on a plan that includes them. |
| Google Analytics 4 | The Google Analytics Data API enabled, and a service account added to the GA4 property as Viewer. |
| Google Play | Play Console > Download reports gives the Cloud Storage bucket (`pubsite_prod_…`) with installs, subscriptions, earnings and store performance reports; invite a service account in Play Console to read it. Android vitals come from the Google Play Developer Reporting API. |
| App Store | An App Store Connect API key (Users and Access > Integrations): Sales and Trends for downloads and subscriptions, Analytics Reports for installs, deletions and sources. |
| AdMob and AdSense | The AdMob API and AdSense Management API, with OAuth sign-in as the account owner. |
