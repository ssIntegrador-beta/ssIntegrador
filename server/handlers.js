"use strict"

/**
 * Importa o gerenciador de eventos
 * @type {module:events.internal.EventEmitter}
 */
const notifier = require("../modules/notifier")

/**
 * Importa o escritor de XML
 * @type {(function(*, *=, *=, *=): void)|*}
 */
const write = require("../modules/writter")

/**
 * Importa o leitor de XML
 * @type {(function(*=): any)|*}
 */
const readXML = require("../modules/reader")

/**
 * Função responsável por transformar um data em uma string formatada para ser título de um arquivo
 * Ex.? 10/10/2010 22:22:22 -> 10-10-2010-22-22-22
 * @returns {string}
 */
const parseDateToString = () => {
    
    let date = new Date()

    date = date.toLocaleDateString({
        hour: "numeric",
        minute: "numeric",
        second: "minute"
    })

    return date.split(/\/|\s|:/).join("-")

}

/**
 * Método responsável enviar o pagamento para o integrador e receber uma resposta
 * 1. Lê o arquivo que foi recebido via POST
 * 2. Guarda o identificador do XML
 * 2. Grava o XML na pasta do integrador
 * 3. Escuta por um evento de gravação na pasta output
 * 4. Lê o arquivo
 * 5. Verifica o identificador do XML é o mesmo de antes
 * 6. Retorna uma resposta para o método que está gerenciando a requisição
 * @param arquivo
 * @param methodName
 */
const processFileAndWaitForResponse = (arquivo, methodName) => {

    console.log(arquivo)

    return new Promise((resolve, reject) => {

        /**
         * Notifica o sistema que está sendo processado alguma coisa
         */
        notifier.emit("start-processing")

        console.log("Requisição sendo processada")

        /**
         * Lê o arquivo XML
         * @type {any}
         */
        const data = readXML(arquivo)
        const xmlType = data.Integrador.Componente.Metodo.Attributes.Nome

        console.log("Leu o XML com sucesso")

        /**
         * Pega o identificador do XML
         *
         */
        const identificadorXMLOriginal = data.Integrador.Identificador.Valor

        /**
         * Gera um nome para o arquivo
         * @type {string}
         */
        const name = `${parseDateToString()}-${identificadorXMLOriginal}-${methodName}.xml`

        /**
         * Escreve o XML na pasta de input do integrador
         */
        write(name, arquivo, err => {

            console.log("Escreveu o XML com sucesso")

            /**
             * Caso tenha ocorrido um erro na gravação, avisa o interface e retorna para o cliente
             */
            if(err){
                notifier.emit("end-processing")
                return reject(err)
            }

            /**
             * Escuta o evento de arquivo adicionado na pasta OUTPUT do integrador
             */
            notifier.on("output-file:added", ({file}) => {

                try{
                    console.log("Arquivo output adicionado com sucesso")

                    /**
                     * Lê o arquivo XML
                     * @type {any}
                     */
                    const xml = readXML(file)

                    console.log(xml)

                    /**
                     * Pega o identificador do XML que foi colocado na pasta output
                     */
                    const identificadorXMLRetornado = xml.Integrador.Identificador.Valor

                    /**
                     * Verifica se o identificador do XML é o mesmo
                     */
                    if(identificadorXMLOriginal === identificadorXMLRetornado){

                        /**
                        * Avisa a interface que o sistema parou de processar
                        */
                        notifier.emit("end-processing")

                        /**
                         * Retorna uma resposta para a função que está processando a requisição
                         */
                        resolve({
                            xml,
                            file,
                            type: xmlType
                         })
                    }
                }catch(e){
                    console.log("Ocorreu um erro ao processar a resposta")
                    console.log(e)
                }

            })

        })

    })

}

const processXMLResponse = (xml, type) => {

    let resposta = ""

    if(type === "EnviarPagamento"){
        
        /**
         * Extrai algumas informações do XML
         */
        const { IdPagamento, Mensagem, StatusPagamento } = xml.Integrador.Resposta

        /**
         * Monta a resposta para o cliente
         * @type {string}
         */
        resposta = `282489,00000000000000000000000000000000000000000000,IdPagamento=${IdPagamento}|Mensagem=${Mensagem}|StatusPagamento=${StatusPagamento}`

    }
    else if(type === "VerificarStatusValidador"){

        const { Resposta } = xml.Integrador
        resposta = "227286,00000000000000000000000000000000000000000000,"

        Object.keys(Resposta).forEach(key => {
            resposta += `${key}=${Resposta[key]}|`
        })

    }
    else{
        resposta = xml
    }

    return resposta

}

/**
 * Exporta os
 */
module.exports = {
    /**
     * Retorna uma mensagem de sucesso informando que o integrador está ativo
     * @param req
     * @param res
     * @returns {Promise<*>}
     */
    status: async (req, res) => {
        return res
            .send("|sucesso|")
    },
    /**
     * Método responsável por processar o arquivo, montar uma resposta e enviar para o cliente
     * @param req
     * @param res
     */
    enviarPagamento: (req, res) => {

        processFileAndWaitForResponse(req.body.arquivo, "env-pag")
            .then(({xml, file, type}) => {

                let resposta = null

                if( !type.contains("NfeAutorizacaoLote12") ){
                    resposta = processXMLResponse(xml,type)
                }
                else{
                    resposta = file
                }
                
                return res.json(resposta)

            })
            .catch(err => {
                return res
                    .status(400)
                    .send(err)
            })

    }
}