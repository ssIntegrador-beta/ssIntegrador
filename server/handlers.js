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
     * Método responsável enviar o pagamento para o integrador e receber uma resposta
     * 1. Lê o arquivo que foi recebido via POST
     * 2. Guarda o identificador do XML
     * 2. Grava o XML na pasta do integrador
     * 3. Escuta por um evento de gravação na pasta output
     * 4. Lê o arquivo
     * 5. Verifica o identificador do XML é o mesmo de antes
     * 6. Retorna uma resposta para o cliente
     * @param req
     * @param res
     */
    enviarPagamento: (req, res) => {

        /**
         * Notifica o sistema que está sendo processado alguma coisa
         */
        notifier.emit("start-processing")

        /**
         * Pega o arquivo que foi enviado via POST
         */
        const { arquivo } = req.body

        console.log("Requisição sendo processada")

        /**
         * Lê o arquivo XML
         * @type {any}
         */
        const data = readXML(arquivo)

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
        const name = `${parseDateToString()}-${Valor}-env-pag.xml`

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
                return res
                    .status(400)
                    .send(err)
            }

            /**
             * Escuta o evento de arquivo adicionado na pasta OUTPUT do integrador
             */
            notifier.on("output-file:added", ({file}) => {

                console.log("Arquivo output adicionado com sucesso")

                /**
                 * Lê o arquivo XML
                 * @type {any}
                 */
                const xml = readXML(file)

                /**
                 * Pega o identificador do XML que foi colocado na pasta output
                 */
                const identificadorXMLRetornado = xml.Integrador.Identificador.Valor

                /**
                 * Verifica se o identificador do XML é o mesmo
                 */
                if(identificadorXMLOriginal === identificadorXMLRetornado){

                    /**
                     * Extrai algumas informações do XML
                     */
                    const { IdPagamento, Mensagem, StatusPagamento } = xml.Integrador.Resposta

                    /**
                     * Monta a resposta para o cliente
                     * @type {string}
                     */
                    const resposta = `282489,00000000000000000000000000000000000000000000,IdPagamento=${IdPagamento}|Mensagem=${Mensagem}|StatusPagamento=${StatusPagamento}`

                    /**
                     * Avisa a interface que o sistema parou de processar
                     */
                    notifier.emit("end-processing")

                    /**
                     * Envia a resposta para o cliente
                     */
                    return res.json(resposta)
                }

            })

        })

    }
}