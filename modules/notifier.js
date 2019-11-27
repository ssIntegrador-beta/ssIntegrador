"use strict"

/**
 * Importa e cria um gerenciador de evento nativo do node
 * https://nodejs.org/api/events.html#events_class_eventemitter
 */
const events = require("events")
const eventEmitter = new events.EventEmitter()

module.exports = eventEmitter