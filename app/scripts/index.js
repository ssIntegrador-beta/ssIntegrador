"use strict"

const events     = require("events")
const eventEmitter = new events.EventEmitter()

let $inputEl, $outputEl

const getInputElement = () => $inputEl = $inputEl || document.getElementById('input')
const getOutputElement = () => $outputEl = $outputEl || document.getElementById('output')

window.addEventListener('DOMContentLoaded', () => {
    getInputElement()
    getOutputElement()
})

eventEmitter.on('input-file:added', ({file, fileName, dir}) => {

    let p = document.createElement('p')
    p.textContent = file

    $inputEl.innerHTML += `O arquivo <b>"${fileName}"</b> foi criado em <b>${dir.input}</b>.<br>`
    $inputEl.appendChild(p)
    $inputEl.innerHTML += '<br>'

})

eventEmitter.on('output-file:added', ({file, fileName, dir}) => {

    let p = document.createElement('p')
    p.textContent = file

    $outputEl.innerHTML += `O arquivo <b>"${fileName}"</b> foi criado em <b>${dir.output}</b>.<br>`
    $outputEl.appendChild(p)
    $outputEl.innerHTML += '<br>'

})