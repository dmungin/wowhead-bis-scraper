# wowhead bis scraper

Web scraper that scrapes [www.wowhead.com](https://www.wowhead.com/cata) preraid bis and raid bis lists for Cataclysm Classic. 

By default, the bis lists are output into lua files that are formatted to work with my Wow Addon "LootAlert": https://github.com/dmungin/LootAlert

You can choose to output the data as json as well. See commands listed below

Note: Requires Node.js to run - https://nodejs.org/

## How to use:

```bash
# Install dependencies
npm ci

# Run scraping logic to output lua
npm start 
# or 
npm run generate
# or 
npm run generate:lua

# Run scraper with json file output
npm run generate:json
```

This project uses playwright to read and pull information from wowhead. See documentation here: https://playwright.dev/