"use strict"

/**
 * Importa o módulo de File System do NodeJS
 * @type {module:fs}
 */
const fs = require("fs")

/**
 * Importa o diretório de escrita da aplicação
 */
const { INPUT_DIR } = require("../config")

/**
 * Exporta o módulo responsável por escrever os arquivos XML
 * @param name
 * @param content
 * @param cb
 * @param dir
 */
module.exports = (name, content, cb, dir = INPUT_DIR) => {
    fs.writeFile(`${dir}/${name}`, content, cb)
}