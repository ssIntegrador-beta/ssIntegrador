"use strict"

const parser = require("fast-xml-parser")

/**
 * Exporta o parser de XML
 * @param xml
 * @returns {any}
 */
module.exports = xml => {
    return parser.parse(xml)
}