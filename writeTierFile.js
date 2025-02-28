const fs = require('node:fs/promises');
const handlebars = require('handlebars');

const writeLuaFile = async (tierMappings) => {
  const templateString = await fs.readFile('./templates/tierMappings.hbs', 'utf8');
  const template = handlebars.compile(templateString);
  const fileName = './bis/TierMappings.lua';

  return fs.writeFile(
    fileName,
    template({ tierMappings }),
  );
};

const writeJsonFile = async (tierMappings) => {
  const fileName = './bis/TierMappings.json';

  return fs.writeFile(
    fileName,
    JSON.stringify(tierMappings, null, 4),
  );
};

const writeTierFile = async (tierMappings, format) => (format === 'lua' ? writeLuaFile(tierMappings) : writeJsonFile(tierMappings));

module.exports = {
  writeTierFile,
};
