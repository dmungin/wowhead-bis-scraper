const fs = require('node:fs/promises');
const handlebars = require('handlebars');
const _ = require('lodash');

const makeReadable = (item) => item.split('-').map((part) => _.upperFirst(part)).join(' ');

const writeSpecFile = async (data, {class: pClass, spec, role}) => {
    const templateString = await fs.readFile('./templates/bis.hbs', 'utf8');
    const template = handlebars.compile(templateString);
    const readableClass = makeReadable(pClass);
    const readableSpec = makeReadable(spec);
    const fileName = `./bis/${readableClass}${readableSpec}.lua`.replace(/\s/g, '');
    
    return fs.writeFile(
        fileName,
        template({
            currentPhaseItems: data, 
            class: readableClass, 
            spec: readableSpec
        })
    );
};

module.exports = {
    writeSpecFile,
};