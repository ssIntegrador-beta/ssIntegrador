"use strict"

const parser = require("fast-xml-parser")

/**
 * Exporta o parser de XML
 * @param xml
 * @returns {any}
 */
module.exports = xml => {

    const options = {
        attributeNamePrefix : "",
        attrNodeName: "Attributes",
        textNodeName : "#text",
        ignoreAttributes : false,
        ignoreNameSpace : false,
        allowBooleanAttributes : false,
        parseNodeValue : true,
        parseAttributeValue : true,
        trimValues: true,
    }

    return parser.parse(xml, options)
}