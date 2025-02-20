const fs = require('node:fs/promises');
const handlebars = require('handlebars');
const _ = require('lodash');

const makeReadable = (item) => item.split('-').map((part) => _.upperFirst(part)).join(' ');

const writeLuaFile = async (items, readableClass, readableSpec) => {
  const templateString = await fs.readFile('./templates/bis.hbs', 'utf8');
  const template = handlebars.compile(templateString);
  const fileName = `./bis/${readableClass}${readableSpec}.lua`.replace(/\s/g, '');

  return fs.writeFile(
    fileName,
    template({
      items,
      class: readableClass,
      spec: readableSpec,
    }),
  );
};

const writeJsonFile = async (items, readableClass, readableSpec) => {
  const fileName = `./bis/${readableClass}${readableSpec}.json`.replace(/\s/g, '');

  return fs.writeFile(
    fileName,
    JSON.stringify({
      preRaid: items[0],
      bis: items[1],
    }, null, 4),
  );
};

const writeSpecFile = async (items, { class: pClass, spec }, format) => {
  const readableClass = makeReadable(pClass);
  const readableSpec = makeReadable(spec);

  return format === 'lua' ? writeLuaFile(items, readableClass, readableSpec) : writeJsonFile(items, readableClass, readableSpec);
};

module.exports = {
  writeSpecFile,
};
