const playwright = require('playwright');
const { writeSpecFile } = require('./writeSpecFile');
const {
  CLASSES, SPECS, SLOTS, CLASS_SPEC_ROLES,
} = require('./constants');

const getClassSpecListUrl = ({
  pClass, spec, urlSpec, role, preRaid = false,
}) => {
  const wowheadSpec = urlSpec || spec;
  const suffix = preRaid ? 'pre-raid' : 'pve';

  return `https://www.wowhead.com/cata/guide/classes/${pClass}/${wowheadSpec}/${role}-bis-gear-${suffix}`;
};

const getBodyArmorSelector = (order) => `#body-armor ~ :nth-child(${order} of div.markup-table-wrapper) tr`;
const getJewelrySelector = (order) => `#jewelry ~ :nth-child(${order} of div.markup-table-wrapper) tr`;
const getWeaponSelector = (order) => `#weapons ~ :nth-child(${order} of div.markup-table-wrapper) tr`;

/* Currently balance druid has 1 extra table so offset fixes this */
const getBaseSelectors = (offset = 0) => [
  { selector: getBodyArmorSelector(1 + offset), slot: SLOTS.head },
  { selector: getBodyArmorSelector(2 + offset), slot: SLOTS.shoulder },
  { selector: getBodyArmorSelector(3 + offset), slot: SLOTS.back },
  { selector: getBodyArmorSelector(4 + offset), slot: SLOTS.chest },
  { selector: getBodyArmorSelector(5 + offset), slot: SLOTS.wrist },
  { selector: getBodyArmorSelector(6 + offset), slot: SLOTS.hands },
  { selector: getBodyArmorSelector(7 + offset), slot: SLOTS.waist },
  { selector: getBodyArmorSelector(8 + offset), slot: SLOTS.legs },
  { selector: getBodyArmorSelector(9 + offset), slot: SLOTS.feet },
  { selector: getJewelrySelector(10 + offset), slot: SLOTS.neck },
  { selector: getJewelrySelector(11 + offset), slot: SLOTS.ring },

];

const getGearSelectorsBySpec = (pClass, spec, preRaid) => {
  if (
    (pClass === CLASSES.dk && spec === SPECS.blood)
        || (pClass === CLASSES.druid && spec === SPECS.bear)
        || (pClass === CLASSES.paladin && spec === SPECS.retribution)
  ) {
    return [
      ...getBaseSelectors(),
      { selector: getJewelrySelector(12), slot: SLOTS.trinket },
      { selector: getJewelrySelector(13), slot: SLOTS.trinket },
      { selector: getWeaponSelector(14), slot: SLOTS.twoHand },
      { selector: getWeaponSelector(15), slot: SLOTS.ranged },
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
    pClass === CLASSES.druid && spec === SPECS.balance
  ) {
    return [
      ...getBaseSelectors(1),
      { selector: getJewelrySelector(13), slot: SLOTS.trinket },
      { selector: getWeaponSelector(14), slot: SLOTS.mainHand },
      { selector: getWeaponSelector(15), slot: SLOTS.offHand },
      { selector: getWeaponSelector(16), slot: SLOTS.ranged },
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
    (pClass === CLASSES.druid && spec === SPECS.restoration)
        || (pClass === CLASSES.priest && !preRaid)
  ) {
    return [
      ...getBaseSelectors(),
      { selector: getJewelrySelector(12), slot: SLOTS.trinket },
      { selector: getWeaponSelector(13), slot: SLOTS.mainHand },
      { selector: getWeaponSelector(14), slot: SLOTS.offHand },
      { selector: getWeaponSelector(15), slot: SLOTS.twoHand },
      { selector: getWeaponSelector(16), slot: SLOTS.ranged },
    ];
  } if (
    (pClass === CLASSES.shaman && spec === SPECS.elemental)
        || (pClass === CLASSES.shaman && spec === SPECS.restoration)
        || (pClass === CLASSES.priest && preRaid)
        || pClass === CLASSES.warlock
  ) {
    return [
      ...getBaseSelectors(),
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

const init = async () => {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  // eslint-disable-next-line no-restricted-syntax
  for (const classSpecRole of CLASS_SPEC_ROLES) {
    const preRaid = await parseSpec(page, classSpecRole, true);
    const bis = await parseSpec(page, classSpecRole, false);
    await writeSpecFile([preRaid, bis], classSpecRole);
    // console.log(result);
  }
};

init()
  .then(() => console.log('Parsing Complete!'))
  .then(() => process.exit(0));
