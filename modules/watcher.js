"use strict"

/**
 * Import o módulo responsável por escutar as mudanças nos diretórios
 */
const chokidar       = require("chokidar")

/**
 * Importa o FileSystem API do Node
 * @type {module:fs}
 */
const fs             = require("fs")

/**
 * Importa o diretório padrão que será escutado
 */
const { OUTPUT_DIR } = require("../config")

/**
 * Importa o gerenciador de eventos
 * @type {module:events.internal.EventEmitter}
 */
const notifier       = require("./notifier")

/**
 * Variável que vai receber o watcher
 * @type {null|FSWatcher}
 */
let outputWatcher = null

/**
 * Função responsável por criar o observador de diretório OUTPUT
 */
const watch = () => {

    console.log(`Monitorando mudanças no diretório: ${OUTPUT_DIR}`)

    /**
     * Começa a observar o diretório OUTPUT
     * @type {FSWatcher}
     */
    outputWatcher = chokidar.watch(OUTPUT_DIR, {
        ignoreInitial: true,
    })

    /**
     * Registra para receber quando um arquivo for adicionado
     */
    outputWatcher.on('add', fileNameWithPath => {

        /**
         * Lê o arquivo que foi adicionado
         * @type {string}
         */
        const file = fs.readFileSync(fileNameWithPath, 'utf-8')

        /**
         * Pega somente o nome do arquivo, ignorando o diretório dele
         * @type {string}
         */
        const fileName = fileNameWithPath.split('/').pop()

        /**
         * Emite um evento avisando que um arquivo foi adicionado, para como valor o nome do arquivo e o próprio arquivo
         */
        notifier.emit('output-file:added', {
            fileName,
            file
        })

        /**
         * Apaga o arquivo
         */
        fs.unlinkSync(fileNameWithPath)
    
    })
}

/**
 * Função responsável por remover o monitoramento da pasta de OUTPUT
 */
const unwatch = () => {
    if(outputWatcher){
        console.log(`Cancelando monitoramento do diretório ${OUTPUT_DIR}`)
        outputWatcher.close()
    }
}

/**
 * Exporta as funções
 * @type {{watch: *, unwatch: *}}
 */
module.exports = {
    watch,
    unwatch
}