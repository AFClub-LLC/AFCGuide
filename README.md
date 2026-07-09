# AFC Platform Training Guide

A standalone, static training site for the AFC team (Andre, Mikey, Sahand): every
parent-facing flow, every admin screen, the coach check-in flow, system behavior
(emails + daily automations), and the honest list of current limits.

Nothing to build, no server, no dependencies. Just open `index.html`.

## What's inside

```
training-site/        (this folder IS the site)
  index.html          # the whole guide: sticky TOC, search, print styles
  images/             # real screenshots of the running app (webp, ~5MB total)
  netlify.toml        # publish config (publish = ".", noindex headers)
```

## Conventions

- Screenshots are real captures of the running app at 1280px wide (desktop) and
  375px wide (the coach Session Check-In flow, which is phone-first).
- Practice records in shots use the `ZZTest` prefix; they were created for the
  captures and deleted from the database afterwards.
- To refresh a screenshot: retake it against the dev server, convert to webp
  (sharp, quality 80, 1600px wide for desktop / native for mobile), and drop it
  into `images/` under the same name.

## Deploy

Same pattern as `email-review-site/`: point a Netlify site at this folder with
publish directory `.`, or drag the folder into Netlify's manual deploy. There is
no build step.
