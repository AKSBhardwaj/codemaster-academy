# Loading and Lighthouse checks

Measured on 16 November 2026 with Lighthouse 13.6.0 and installed stable Chrome 157.0.8103.52.
The target was the compressed static production preview at `http://localhost:4400/`, using a
fresh Lighthouse browser profile for each run. Mobile used Lighthouse's default simulated slow
4G connection and 4× CPU slowdown. These are local lab results, not measurements of a live host.

| Check                              | Mobile                         | Desktop |
| ---------------------------------- | ------------------------------ | ------- |
| Performance                        | **95** median; runs 92, 95, 97 | **100** |
| Accessibility                      | 100                            | 100     |
| Best practices                     | 100                            | 100     |
| SEO                                | 100                            | 100     |
| Applicable agentic browsing checks | 4/4                            | 4/4     |
| First contentful paint             | 1.18 s median                  | 0.32 s  |
| Largest contentful paint           | 1.18 s median                  | 0.32 s  |
| Total blocking time                | 255 ms median                  | 3 ms    |
| Cumulative layout shift            | 0 in every run                 | 0       |

The mobile score still allows room to reduce JavaScript startup work. Scores will vary with the
browser version, hardware, machine load and the eventual host. There is no guarantee of a fixed
score for every visitor.

## Changes

- Production pages inline their needed styles, removing the blocking stylesheet from the first
  render. The full stylesheet becomes active after it finishes loading, including in Safari;
  the no-JavaScript fallback still loads it normally.
- A build helper preserves dark-theme rules and font declarations before the full CSS arrives.
  The local Manrope font is preloaded using the site's deployment prefix.
- Homepage search uses native bindings. The global search dialog loads when opened, and cards
  below the screen hydrate when they enter the viewport. Their rendered text and native links
  remain available in the HTML.
- Unused negative-margin utilities were removed. Global CSS fell from 258,294 to 242,776 bytes.
  The measured homepage downloaded 9 script files instead of 17, with decoded script payload
  falling from 554,620 to 479,059 bytes.
- Generated `llms.txt` and ARD files describe the real tutorials and static catalog. The app
  remains frontend-only. See [deployment notes](DEPLOYMENT.md#machine-readable-tutorial-guides)
  for GitHub project-site discovery paths.
- Local preview supports gzip, including JSON and XML, and tolerates cancelled requests.
- Search handles Escape through the native cancel event, preventing a delayed close event from
  closing a newly reopened dialog.
- The skip link has an explicit keyboard focus stop so Safari includes it in its default tab order.

Verification passed: 170 desktop/mobile Chromium checks, 34 Firefox/WebKit checks, 28 application
unit tests and 18 build/deployment tests, plus lint, formatting and the full static SEO audit.
Four browser checks intentionally skip the viewport where they do not apply. Browser coverage
includes delayed assets, theme stability, keyboard navigation, search reopening, saved progress,
lessons, quizzes, playground execution, downloads and responsive layouts.

## Reproduce

Build and start the preview in one terminal:

```powershell
npm run build
npm run preview
```

Audit the printed preview URL in another terminal. The normal preview port is 4173; this session
used 4400 to avoid existing servers. Use a fresh browser profile and repeat the mobile audit
three times. Wait until builds and other browser tests finish before measuring.

```powershell
$env:CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
npx --yes lighthouse@13.6.0 http://localhost:4173/ --chrome-flags="--headless=new --disable-extensions" --output=html --output-path=./lighthouse-mobile.html
npx --yes lighthouse@13.6.0 http://localhost:4173/ --preset=desktop --chrome-flags="--headless=new --disable-extensions" --output=html --output-path=./lighthouse-desktop.html
```

`npm start` uses Angular's development server, including debugging code and unoptimized styles.
Its port-4200 result is not directly comparable with a production audit. The initial development
audit reproduced 2/4 browsing checks because missing discovery paths returned homepage HTML.

Earlier investigations used Playwright's Chromium 159 build. Its trace recorded a 309 ms native
presentation wait with less than 1 ms thread CPU; Lighthouse's simulation counted that interval
as more than a second of blocking time. Those noisy scores are not used to claim a same-browser
before/after improvement. The table above reports the final stable-Chrome measurements only.

Session reports are in the ignored `tmp/lh/stable-mobile-*.report.{html,json}` and
`tmp/lh/stable-desktop.report.{html,json}` files. The published-content audit remains in
`dist/codemaster-academy/seo-report.json`.
