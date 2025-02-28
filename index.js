const fs = require('node:fs/promises');
const argv = require('minimist')(process.argv.slice(2));
const playwright = require('playwright');
const { writeSpecFile } = require('./writeSpecFile');
const { writeTierFile } = require('./writeTierFile');
const {
  CLASSES, SPECS, SLOTS, CLASS_SPEC_ROLES, TOKEN_SLOT_TO_INV_SLOT_MAP,
} = require('./constants');

const getClassSpecListUrl = ({
  pClass, spec, urlSpec, role, preRaid = false,
}) => {
  const wowheadSpec = urlSpec || spec;
  const suffix = preRaid ? 'pre-raid' : 'pve';

  return `https://www.wowhead.com/cata/guide/classes/${pClass}/${wowheadSpec}/${role}-bis-gear-${suffix}`;
};

const getBodyArmorSelector = (
  order,
  { sectionId = 'body-armor', tableSelector = 'div.markup-table-wrapper' } = {},
) => `#${sectionId} ~ :nth-child(${order} of ${tableSelector}) tr`;
const getJewelrySelector = (
  order,
  { sectionId = 'jewelry', tableSelector = 'div.markup-table-wrapper' } = {},
) => `#${sectionId} ~ :nth-child(${order} of ${tableSelector}) tr`;
const getWeaponSelector = (
  order,
  { sectionId = 'weapons', tableSelector = 'div.markup-table-wrapper' } = {},
) => `#${sectionId} ~ :nth-child(${order} of ${tableSelector}) tr`;

/* Currently balance druid has 1 extra table so offset fixes this */
const getBaseSelectors = (
  offset = 0,
  {
    bodyArmorOverrides,
    jewelryOverrides,
  } = {},
) => [
  { selector: getBodyArmorSelector(1 + offset, bodyArmorOverrides), slot: SLOTS.head },
  { selector: getBodyArmorSelector(2 + offset, bodyArmorOverrides), slot: SLOTS.shoulder },
  { selector: getBodyArmorSelector(3 + offset, bodyArmorOverrides), slot: SLOTS.back },
  { selector: getBodyArmorSelector(4 + offset, bodyArmorOverrides), slot: SLOTS.chest },
  { selector: getBodyArmorSelector(5 + offset, bodyArmorOverrides), slot: SLOTS.wrist },
  { selector: getBodyArmorSelector(6 + offset, bodyArmorOverrides), slot: SLOTS.hands },
  { selector: getBodyArmorSelector(7 + offset, bodyArmorOverrides), slot: SLOTS.waist },
  { selector: getBodyArmorSelector(8 + offset, bodyArmorOverrides), slot: SLOTS.legs },
  { selector: getBodyArmorSelector(9 + offset, bodyArmorOverrides), slot: SLOTS.feet },
  { selector: getJewelrySelector(10 + offset, jewelryOverrides), slot: SLOTS.neck },
  { selector: getJewelrySelector(11 + offset, jewelryOverrides), slot: SLOTS.ring },

];

const getGearSelectorsBySpec = (pClass, spec, preRaid) => {
  if (
    (pClass === CLASSES.dk && spec === SPECS.blood)
        || (pClass === CLASSES.druid && spec === SPECS.bear)
  ) {
    return [
      ...getBaseSelectors(),
      { selector: getJewelrySelector(12), slot: SLOTS.trinket },
      { selector: getJewelrySelector(13), slot: SLOTS.trinket },
      { selector: getWeaponSelector(14), slot: SLOTS.twoHand },
      { selector: getWeaponSelector(15), slot: SLOTS.ranged },
    ];
  } if (
    (pClass === CLASSES.paladin && spec === SPECS.retribution) // ret has extra table wrapper div :(
  ) {
    return [
      ...getBaseSelectors(3, {
        bodyArmorOverrides: {
          tableSelector: '.wh-center',
        },
      }),
      { selector: getJewelrySelector(15, { tableSelector: '.wh-center' }), slot: SLOTS.trinket },
      { selector: getWeaponSelector(16, { tableSelector: '.wh-center' }), slot: SLOTS.twoHand },
      { selector: getWeaponSelector(17, { tableSelector: '.wh-center' }), slot: SLOTS.ranged },
    ];
  } if (
    (pClass === CLASSES.paladin && spec === SPECS.protection)
        || (pClass === CLASSES.warrior && spec === SPECS.protection)
        || (pClass === CLASSES.dk && spec === SPECS.frost)
        || (pClass === CLASSES.paladin && spec === SPECS.holy)
        || pClass === CLASSES.rogue
        || pClass === CLASSES.mage
  ) {
    return [
      ...getBaseSelectors(),
      { selector: getJewelrySelector(12), slot: SLOTS.trinket },
      { selector: getWeaponSelector(13), slot: SLOTS.mainHand },
      { selector: getWeaponSelector(14), slot: SLOTS.offHand },
      { selector: getWeaponSelector(15), slot: SLOTS.ranged },
    ];
  } if (
    pClass === CLASSES.druid && spec === SPECS.balance && preRaid
  ) {
    return [
      ...getBaseSelectors(1),
      { selector: getJewelrySelector(13), slot: SLOTS.trinket },
      { selector: getWeaponSelector(14), slot: SLOTS.mainHand },
      { selector: getWeaponSelector(15), slot: SLOTS.offHand },
      { selector: getWeaponSelector(16), slot: SLOTS.ranged },
    ];
  } if (
    pClass === CLASSES.druid && spec === SPECS.balance && !preRaid
  ) {
    return [
      ...getBaseSelectors(2),
      { selector: getJewelrySelector(14), slot: SLOTS.trinket },
      { selector: getWeaponSelector(15), slot: SLOTS.mainHand },
      { selector: getWeaponSelector(16), slot: SLOTS.offHand },
      { selector: getWeaponSelector(17), slot: SLOTS.ranged },
    ];
  } if (
    (pClass === CLASSES.dk && spec === SPECS.unholy)
        || (pClass === CLASSES.druid && spec === SPECS.cat)
        || (pClass === CLASSES.warrior && spec === SPECS.arms)
        || (pClass === CLASSES.warrior && spec === SPECS.fury)
        || pClass === CLASSES.hunter
  ) {
    return [
      ...getBaseSelectors(),
      { selector: getJewelrySelector(12), slot: SLOTS.trinket },
      { selector: getWeaponSelector(13), slot: SLOTS.twoHand },
      { selector: getWeaponSelector(14), slot: SLOTS.ranged },
    ];
  } if (
    pClass === CLASSES.shaman && spec === SPECS.enhancement
  ) {
    return [
      ...getBaseSelectors(),
      { selector: getJewelrySelector(12), slot: SLOTS.trinket },
      { selector: getWeaponSelector(13), slot: SLOTS.mainHand },
      { selector: getWeaponSelector(14), slot: SLOTS.ranged },
    ];
  } if (
    (pClass === CLASSES.druid && spec === SPECS.restoration && preRaid)
        || (pClass === CLASSES.priest && !preRaid && spec !== SPECS.holy)
  ) {
    return [
      ...getBaseSelectors(),
      { selector: getJewelrySelector(12), slot: SLOTS.trinket },
      { selector: getWeaponSelector(13), slot: SLOTS.mainHand },
      { selector: getWeaponSelector(14), slot: SLOTS.offHand },
      { selector: getWeaponSelector(15), slot: SLOTS.twoHand },
      { selector: getWeaponSelector(16), slot: SLOTS.ranged },
    ];
  } if (pClass === CLASSES.priest && !preRaid && spec === SPECS.holy) {
    return [
      ...getBaseSelectors(),
      { selector: getJewelrySelector(12), slot: SLOTS.trinket },
      { selector: getJewelrySelector(13), slot: SLOTS.trinket },
      { selector: getWeaponSelector(14), slot: SLOTS.mainHand },
      { selector: getWeaponSelector(15), slot: SLOTS.offHand },
      { selector: getWeaponSelector(16), slot: SLOTS.twoHand },
      { selector: getWeaponSelector(17), slot: SLOTS.ranged },
    ];
  } if (
    (pClass === CLASSES.shaman && spec === SPECS.elemental)
        // remove preRaid filter once header is added
        || (pClass === CLASSES.shaman && spec === SPECS.restoration && preRaid)
        || (pClass === CLASSES.priest && preRaid)
        || (pClass === CLASSES.druid && spec === SPECS.restoration && !preRaid)
  ) {
    return [
      ...getBaseSelectors(),
      { selector: getJewelrySelector(12), slot: SLOTS.trinket },
      { selector: getWeaponSelector(13), slot: SLOTS.twoHand },
      { selector: getWeaponSelector(14), slot: SLOTS.mainHand },
      { selector: getWeaponSelector(15), slot: SLOTS.offHand },
      { selector: getWeaponSelector(16), slot: SLOTS.ranged },
    ];
  } if (
    pClass === CLASSES.warlock
  ) {
    return [
      ...getBaseSelectors(2),
      { selector: getJewelrySelector(14), slot: SLOTS.trinket },
      { selector: getWeaponSelector(15), slot: SLOTS.twoHand },
      { selector: getWeaponSelector(16), slot: SLOTS.mainHand },
      { selector: getWeaponSelector(17), slot: SLOTS.offHand },
      { selector: getWeaponSelector(18), slot: SLOTS.ranged },
    ];
  } if (
    // Issue currently #body-armor heading is missing from page
    (pClass === CLASSES.shaman && spec === SPECS.restoration && !preRaid)
  ) {
    return [
      ...getBaseSelectors(0, {
        bodyArmorOverrides: {
          sectionId: 'valor-points',
        },
      }),
      { selector: getJewelrySelector(12), slot: SLOTS.trinket },
      { selector: getWeaponSelector(13), slot: SLOTS.twoHand },
      { selector: getWeaponSelector(14), slot: SLOTS.mainHand },
      { selector: getWeaponSelector(15), slot: SLOTS.offHand },
      { selector: getWeaponSelector(16), slot: SLOTS.ranged },
    ];
  }

  return [];
};

const getIsBis = (rankText, index) => {
  const bisText = [
    'bis',
    'recommended',
    'recommended',
    'best in slot',
    'best',
  ];

  return index === 0 || bisText.some((text) => rankText.toLowerCase().includes(text));
};

const parseSpec = async (page, {
  class: pClass, spec, urlSpec, role,
}, preRaid) => {
  const url = getClassSpecListUrl({
    pClass, spec, urlSpec, role, preRaid,
  });
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  console.log(`===== Parsing: ${pClass} - ${spec} - ${role} - ${preRaid ? 'PreRaid' : 'BIS'} ========`);
  const results = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const { selector, slot } of getGearSelectorsBySpec(pClass, spec, preRaid)) {
    const itemRows = await page.locator(selector).filter({ hasNotText: 'Item' }).all();

    const slotItems = await Promise.all(itemRows.map(async (itemRow, index) => {
      const rankText = (await itemRow.locator('td:nth-child(1)').textContent()).trim();
      const isBis = getIsBis(rankText, index);
      const rowItems = [];
      /* Some certain items can have multiple versions
      (alliance / horde for example) so loop over links */
      // eslint-disable-next-line no-restricted-syntax
      for (const itemLink of await itemRow.locator('td:nth-child(2) a').all()) {
        const itemHref = await itemLink.getAttribute('href');
        const name = (await itemLink.textContent()).trim();
        const [, itemId] = itemHref.match(/item=(\d+)[/&]/);
        rowItems.push({
          name,
          itemId,
          slot,
          isBis,
        });
      }

      return rowItems;
    }));

    results.push(...slotItems.flat());
  }

  return results;
};

const addItemLink = async (links, link) => {
  const itemHref = await link.getAttribute('href');
  const name = (await link.textContent()).trim();
  const [, itemId] = itemHref.match(/item=(\d+)[/&]/);
  links.push({
    name,
    itemId,
    itemHref,
  });
};

const parseTier = async (context) => {
  const mainPage = await context.newPage();
  await mainPage.goto('https://www.wowhead.com/cata/guide/raids/dragon-soul/tier-13-sets');
  const tokenTypeRows = await mainPage.locator('#guide-body .wh-center:nth-of-type(5) .markup-table-wrapper tr').filter({ hasNotText: 'Classes' }).all();

  const tokenLinksByType = await Promise.all(tokenTypeRows.map(async (tokenTypeRow) => {
    const tokenLinks = [];
    // LFR Token loop
    // eslint-disable-next-line no-restricted-syntax
    for (const tokenLink of await tokenTypeRow.locator('td:nth-of-type(2) a').all()) {
      await addItemLink(tokenLinks, tokenLink);
    }
    // Normal Token loop
    // eslint-disable-next-line no-restricted-syntax
    for (const tokenLink of await tokenTypeRow.locator('td:nth-of-type(3) a').all()) {
      await addItemLink(tokenLinks, tokenLink);
    }
    // Heroic Token loop
    // eslint-disable-next-line no-restricted-syntax
    for (const tokenLink of await tokenTypeRow.locator('td:nth-of-type(4) a').all()) {
      await addItemLink(tokenLinks, tokenLink);
    }

    return tokenLinks;
  }));
  const tokenLinks = tokenLinksByType.flat();
  const tokenMappings = await Promise.all(tokenLinks.map(async ({ name, itemId, itemHref }) => {
    const tokenPage = await context.newPage();
    await tokenPage.goto(`${itemHref}#currency-for`);
    // await tokenPage.locator('a[href="#currency-for"]').click();
    const tokenItems = [];
    let tokenSlot = 'Unknown';
    // eslint-disable-next-line no-restricted-syntax
    for (const itemRow of await tokenPage.locator('#tab-currency-for tr.listview-row').all()) {
      const itemLink = await itemRow.locator('td:nth-of-type(3) a.listview-cleartext');
      tokenSlot = TOKEN_SLOT_TO_INV_SLOT_MAP[(await (await itemRow.locator('td:nth-of-type(8)')).textContent()).trim()];
      await addItemLink(tokenItems, itemLink);
    }

    await tokenPage.close();

    return {
      itemId,
      name,
      tokenSlot,
      tokenItems,
    };
  }));

  return tokenMappings;
};

const init = async ({ format = 'lua' }) => {
  if (!['lua', 'json'].includes(format)) throw new Error(`Invalid "format" argument: ${format}. Possible values are: "lua" or "json"`);

  await fs.mkdir('./bis')
    .then(() => console.log('created "/bis" directory.'))
    .catch((err) => {
      if (err && err.code === 'EEXIST') console.log('bis directory already created. Skipping "mkdir" command.');
      else throw err;
    });
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  // eslint-disable-next-line no-restricted-syntax
  for (const classSpecRole of CLASS_SPEC_ROLES) {
    const preRaid = await parseSpec(page, classSpecRole, true);
    const bis = await parseSpec(page, classSpecRole, false);
    await writeSpecFile([preRaid, bis], classSpecRole, format);
  }

  const tierMappings = await parseTier(context);
  await writeTierFile(tierMappings, format);
};

init(argv)
  .then(() => console.log('Parsing Complete!'))
  .then(() => process.exit(0));
