"use strict"

const rootDir = `C:\\Integrador`

/**
 * Exporta as configurações básicas da aplicação
 * @type {{SERVER_PORT: number, OUTPUT_DIR: string, INPUT_DIR: string, ROOT_DIR: *}}
 */
module.exports = {
    SERVER_PORT: 3000, // Porta padrão do servidor HTTP
    ROOT_DIR: rootDir, // Diretório root da aplicação
    INPUT_DIR: `${rootDir}/Input`, // Diretório de escrita dos XMLs
    OUTPUT_DIR: `${rootDir}/Output`, // Diretório onde os XMLs do integrador serão recebidos
}