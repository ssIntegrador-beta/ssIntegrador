"use strict"

const { ipcRenderer } = require("electron")
const chokidar   = require("chokidar")
const fs         = require("fs")
const homedir    = require("os").homedir()
const ssoticaDir = '.ssotica/'
const rootDir   = `${homedir}/${ssoticaDir}`
const inputDir  = `${rootDir}/input`
const outputDir  = `${rootDir}/output`

if(!fs.existsSync(rootDir)){
    console.log(`Criando o diretório ${ssoticaDir} em ${homedir}`)
    fs.mkdirSync(rootDir)
    fs.mkdirSync(inputDir)
    fs.mkdirSync(outputDir)
    console.log('Diretório criado com sucesso')
}

const watchCb = (eventName, file) => {

    let fileName = file.split('/').pop()
    file = fs.readFileSync(file, 'utf-8')

    eventEmitter.emit(eventName, {
        fileName,
        file,
        dir: {
            input: inputDir,
            output: outputDir,
            root: rootDir
        }
    })
}

const inputWatcher = chokidar.watch(inputDir, {
    ignoreInitial: true,
})

inputWatcher.on('add', file => {
    watchCb('input-file:added', file)
})

const outputWatcher = chokidar.watch(outputDir, {
    ignoreInitial: true
})

outputWatcher.on('add', file => {
    watchCb('output-file:added', file)
})

ipcRenderer.on('app:quit', () => {
    console.log('Finalizando app')
    inputWatcher.close()
    outputWatcher.close()
})