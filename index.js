const playwright = require("playwright");
const { writeSpecFile } = require('./writeSpecFile');

const ROLES = {
    tank: 'tank',
    dps: 'dps',
    healer: 'healer'
};

const CLASSES = {
    dk: 'death-knight',
    druid: 'druid',
    hunter: 'hunter',
    mage: 'mage',
    paladin: 'paladin',
    priest: 'priest',
    rogue: 'rogue',
    shaman: 'shaman',
    warlock: 'warlock',
    warrior: 'warrior'
};

const SPECS = {
    blood: 'blood',
    frost: 'frost',
    unholy: 'unholy',
    balance: 'balance',
    feral: 'feral',
    cat: 'cat',
    bear: 'bear',
    restoration: 'restoration',
    beastMastery: 'beast-mastery',
    marksmanship: 'marksmanship',
    survival: 'survival',
    arcane: 'arcane',
    fire: 'fire',
    holy: 'holy',
    protection: 'protection',
    retribution: 'retribution',
    discipline: 'discipline',
    shadow: 'shadow',
    assassination: 'assassination',
    combat: 'combat',
    subtlety: 'subtlety',
    elemental: 'elemental',
    enhancement: 'enhancement',
    affliction: 'affliction',
    demonology: 'demonology',
    destruction: 'destruction',
    arms: 'arms',
    fury: 'fury'
};

const classSpecRoles = [
    { class: CLASSES.dk, spec: SPECS.blood, role: ROLES.tank },
    { class: CLASSES.dk, spec: SPECS.frost, role: ROLES.dps },
    { class: CLASSES.dk, spec: SPECS.unholy, role: ROLES.dps },
    { class: CLASSES.druid, spec: SPECS.balance, role: ROLES.dps }, 
    { class: CLASSES.druid, spec: SPECS.cat, urlSpec: SPECS.feral, role: ROLES.dps },
    { class: CLASSES.druid, spec: SPECS.bear, urlSpec: SPECS.feral, role: ROLES.tank },
    { class: CLASSES.druid, spec: SPECS.restoration, role: ROLES.healer },
    { class: CLASSES.hunter, spec: SPECS.beastMastery, role: ROLES.dps },
    { class: CLASSES.hunter, spec: SPECS.marksmanship, role: ROLES.dps },
    { class: CLASSES.hunter, spec: SPECS.survival, role: ROLES.dps },
    { class: CLASSES.mage, spec: SPECS.arcane, role: ROLES.dps },
    { class: CLASSES.mage, spec: SPECS.fire, role: ROLES.dps },
    { class: CLASSES.mage, spec: SPECS.frost, role: ROLES.dps },
    { class: CLASSES.paladin, spec: SPECS.holy, role: ROLES.healer },
    { class: CLASSES.paladin, spec: SPECS.protection, role: ROLES.tank },
    { class: CLASSES.paladin, spec: SPECS.retribution, role: ROLES.dps },
    { class: CLASSES.priest, spec: SPECS.discipline, role: ROLES.healer },
    { class: CLASSES.priest, spec: SPECS.holy, role: ROLES.healer },
    { class: CLASSES.priest, spec: SPECS.shadow, role: ROLES.dps },
    { class: CLASSES.rogue, spec: SPECS.assassination, role: ROLES.dps },
    { class: CLASSES.rogue, spec: SPECS.combat, role: ROLES.dps },
    { class: CLASSES.rogue, spec: SPECS.subtlety, role: ROLES.dps },
    { class: CLASSES.shaman, spec: SPECS.elemental, role: ROLES.dps },
    { class: CLASSES.shaman, spec: SPECS.enhancement, role: ROLES.dps },
    { class: CLASSES.shaman, spec: SPECS.restoration, role: ROLES.healer },
    { class: CLASSES.warlock, spec: SPECS.affliction, role: ROLES.dps },
    { class: CLASSES.warlock, spec: SPECS.demonology, role: ROLES.dps },
    { class: CLASSES.warlock, spec: SPECS.destruction, role: ROLES.dps },
    { class: CLASSES.warrior, spec: SPECS.arms, role: ROLES.dps },
    { class: CLASSES.warrior, spec: SPECS.fury, role: ROLES.dps },
    { class: CLASSES.warrior, spec: SPECS.protection, role: ROLES.tank }
];

const SLOTS = {
    head: 'Head',
    shoulder: 'Shoulder',
    back: 'Back',
    chest: 'Chest',
    wrist: 'Wrist',
    hands: 'Hands',
    waist: 'Waist',
    legs: 'Legs',
    feet: 'Feet',
    neck: 'Neck',
    ring: 'Ring',
    trinket: 'Trinket',
    twoHand: 'Two-Hand',
    mainHand: 'Main Hand',
    offHand: 'Off Hand',
    mainOffHand: 'Main Hand/Off Hand',
    ranged: 'Ranged/Relic'
}

const getClassSpecListUrl = (pClass, spec, urlSpec, role) => {
    const wowheadSpec = urlSpec || spec;

    return `https://www.wowhead.com/cata/guide/classes/${pClass}/${wowheadSpec}/${role}-bis-gear-pve`;
}
    
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

const getGearSelectorsBySpec = (pClass, spec) => {
    if (
        pClass === CLASSES.dk && spec === SPECS.blood ||
        pClass === CLASSES.druid && spec === SPECS.bear ||
        pClass === CLASSES.paladin && spec === SPECS.retribution
    ) {
        return [
            ...getBaseSelectors(),
            { selector: getJewelrySelector(12), slot: SLOTS.trinket },
            { selector: getJewelrySelector(13), slot: SLOTS.trinket },
            { selector: getWeaponSelector(14), slot: SLOTS.twoHand },
            { selector: getWeaponSelector(15), slot: SLOTS.ranged },
        ];
    } else if (
        pClass === CLASSES.paladin && spec === SPECS.protection ||
        pClass === CLASSES.warrior && spec === SPECS.protection ||
        pClass === CLASSES.dk && spec === SPECS.frost ||
        pClass === CLASSES.paladin && spec === SPECS.holy ||
        pClass === CLASSES.rogue ||
        pClass === CLASSES.mage
    ) {
        return [
            ...getBaseSelectors(),
            { selector: getJewelrySelector(12), slot: SLOTS.trinket },
            { selector: getWeaponSelector(13), slot: SLOTS.mainHand },
            { selector: getWeaponSelector(14), slot: SLOTS.offHand },
            { selector: getWeaponSelector(15), slot: SLOTS.ranged },
        ];
        
    }  else if (
        pClass === CLASSES.druid && spec === SPECS.balance
    ) {
        return [
            ...getBaseSelectors(1),
            { selector: getJewelrySelector(13), slot: SLOTS.trinket },
            { selector: getWeaponSelector(14), slot: SLOTS.mainHand },
            { selector: getWeaponSelector(15), slot: SLOTS.offHand },
            { selector: getWeaponSelector(16), slot: SLOTS.ranged },
        ];
        
    } else if (
        pClass === CLASSES.dk && spec === SPECS.unholy ||
        pClass === CLASSES.druid && spec === SPECS.cat ||
        pClass === CLASSES.hunter ||
        pClass === CLASSES.warrior && spec === SPECS.arms ||
        pClass === CLASSES.warrior && spec === SPECS.fury
    ) {
        return [
            ...getBaseSelectors(),
            { selector: getJewelrySelector(12), slot: SLOTS.trinket },
            { selector: getWeaponSelector(13), slot: SLOTS.twoHand },
            { selector: getWeaponSelector(14), slot: SLOTS.ranged },
        ];
        
    } else if (
        pClass === CLASSES.shaman && spec === SPECS.enhancement
    ) {
        return [
            ...getBaseSelectors(),
            { selector: getJewelrySelector(12), slot: SLOTS.trinket },
            { selector: getWeaponSelector(13), slot: SLOTS.mainHand },
            { selector: getWeaponSelector(14), slot: SLOTS.ranged },
        ];
        
    } else if (
        pClass === CLASSES.druid && spec === SPECS.restoration ||
        pClass === CLASSES.priest
    ) {
        return [
            ...getBaseSelectors(),
            { selector: getJewelrySelector(12), slot: SLOTS.trinket },
            { selector: getWeaponSelector(13), slot: SLOTS.mainHand },
            { selector: getWeaponSelector(14), slot: SLOTS.offHand },
            { selector: getWeaponSelector(15), slot: SLOTS.twoHand },
            { selector: getWeaponSelector(16), slot: SLOTS.ranged },
        ];
        
    } else if (
        pClass === CLASSES.shaman && spec === SPECS.elemental ||
        pClass === CLASSES.shaman && spec === SPECS.restoration ||
        pClass === CLASSES.warlock
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
}

const waitForOneOf = async (locators) => {
    const res = await Promise.race([
        ...locators.map(async (locator, index) => {
        let timedOut = false;
        await locator.waitFor({ state: 'visible' }).catch(() => timedOut = true);
        return [ timedOut ? -1 : index, locator ];
        }),
    ]);
    if (res[0] === -1) {
        throw new Error('no locator visible before timeout');
    }
    return res;
};

const parseSpec = async (page, { class: pClass, spec, urlSpec, role }) => {
    // const page = await context.newPage();
    const url = getClassSpecListUrl(pClass, spec, urlSpec, role);
    await page.goto(url, {waitUntil: 'domcontentloaded'});

    console.log(`===== Parsing: ${pClass} - ${spec} - ${role} ========`);
    const results = [];
    for (const {selector, slot} of getGearSelectorsBySpec(pClass, spec, role)) {
        const itemRows = await page.locator(selector).filter({ hasNotText: 'Item'}).all()

        const slotItems = await Promise.all(itemRows.map(async (itemRow) => { 
            const isBis = (await itemRow.locator('td:nth-child(1)').textContent()).trim() === 'Best';
            const rowItems = [];
            /* Some certain items can have multiple versions (alliance / horde for example) so loop over links */
            for (const itemLink of await itemRow.locator('td:nth-child(2) a').all()) {
                const itemHref = await itemLink.getAttribute('href');
                const name = (await itemLink.textContent()).trim();
                const [,itemId] = itemHref.match(/item=(\d+)[\/&]/);
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
}


const init = async () => {
    const browser = await playwright.chromium.launch({
        headless: false,
        
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    for ( const classSpecRole of classSpecRoles) {
        const result = await parseSpec(page, classSpecRole);
        await writeSpecFile(result, classSpecRole);
        console.log(result);
    }
}

init();