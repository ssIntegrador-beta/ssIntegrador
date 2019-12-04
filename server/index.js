"use strict"

/**
 * Importa o express para criar um servidor
 * @type {createApplication}
 */
const express = require("express")

/**
 * Importa o body-parser para fazer o "parse" das informações que vieram no request
 * @type {Parsers}
 */
const bodyParser = require("body-parser")

/**
 * Inicializa uma nova aplicação do express
 * @type {*|app}
 */
const app = express()

/**
 * Importa a porta do servidor HTTP
 */
const { SERVER_PORT } = require('../config')

/**
 * Importa o "controller" para gerenciar as requisições
 */
const handlers = require("./handlers")

/**
 * Adiciona os parsers de JSON e www-x-url-encoded
 */
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

/**
 * Aplica o CORS na aplicação para aceitar requisições externas
 */
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-Width, Content-Type, Accept, Authorization'
    );
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, PATCH, DELETE');
        return res.status(200).json({});
    }
    next();
});

/**
 * Regista as rotas do servidor HTTP
 */
app.get('/status', handlers.status)
app.post('/enviar-pagamento', handlers.enviarPagamento)

/**
 * Método responsável por iniciar o servidor HTTP quando a aplicação for inicializada
 * @returns {Promise<http.Server>}
 */
const startHTTPServer = async () => {

    return app.listen(SERVER_PORT, err => {

        if(err){
            console.error(err)
            process.exit(1)
        }

        console.log(`Server running on port ${SERVER_PORT}`)

    })

}

/**
 * Método responsável por finalizar o servidor HTTP quando a aplicação for finalizada
 */
const shutdownHTTPServer = () => {
    app.close(() => {
        console.log('Server closed')
    })
}

/**
 * Exporta as funções de iniciar/finalizar o servidor
 * @type {{startHTTPServer: *, shutdownHTTPServer: *}}
 */
module.exports = {
    startHTTPServer,
    shutdownHTTPServer,
}