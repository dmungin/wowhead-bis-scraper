# wowhead bis scraper

Web scraper that scrapes [www.wowhead.com](https://www.wowhead.com/cata) preraid bis and raid bis lists for Cataclysm Classic. The bis lists are output into lua files that are formatted to work with my Wow Addon "LootAlert": https://github.com/dmungin/LootAlert

Future updates will add additonal output formats such as JSON, that may be useful for other projects.

## How to use:

```bash
# Install dependencies
npm ci

# Run scraper
npm start 
```

This project uses playwright to read and pull information from wowhead. See documentation here: https://playwright.dev/