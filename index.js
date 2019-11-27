"use strict"

/**
 * Importa o Electron e alguns módulos nativos do node
 * @type {Electron}
 */
const electron     = require("electron")
const url          = require("url")
const path         = require("path")

/**
 * Importa o módulo responsável por gerenciar os eventos
 */
const notifier = require("./modules/notifier")

/**
 * Importando alguns componentes do electron
 * app -> Responsável por gerar/gerenciar a instância do electron (Docs: https://electronjs.org/docs/api/app)
 * BrowserWindow -> Responsável por gerar/gerenciar todas as janelas da aplicação (Docs: https://electronjs.org/docs/api/browser-window)
 * Menu -> Responsável por gerar/gerenciar os menus da aplicação (Docs: https://electronjs.org/docs/api/menu)
 * Tray -> Responsável por gerar/gerenciar a aplicação em modo bandeja (Docs: https://electronjs.org/docs/api/tray)
 */
const { app, BrowserWindow, Menu, Tray } = electron

/**
 * Importa o módulo de inicialização e finalização do servidor HTTP
 */
const { shutdownHTTPServer, startHTTPServer } = require("./server")

/**
 * Importa os módulos para fazer o monitoramento da pasta output
 */
const { watch: watchFiles, unwatch: unwatchFiles } = require("./modules/watcher")

/**
 * Variável que armazenará a janela principal da aplicação
 * @type {Electron.BrowserWindow}
 */
let mainWindow = null

/**
 * Variável que armazenará a bandeja da aplicação
 * @type {null|Electron.Tray}
 */
let tray = null

/**
 * Responsável por gerenciar se a aplicação foi fechada pelo X padrão na topbar ou se foi fechado via bandeja
 * @type {boolean}
 */
let wasClosedByTray = false

/**
 * Inicia o servidor HTTP
 */
startHTTPServer()

/**
 * Escuta os arquivos da pasta output
 */
watchFiles()

/**
 * Método responsável por criar a janela principal da aplicação
 */
const createMainWindow = () => {

    /**
     * Cria uma nova janela
     * @type {Electron.BrowserWindow}
     */
    mainWindow = new BrowserWindow({
        icon: path.join(__dirname, 'app/assets/logo.png'),
        resizable: false,
        width: 700,
        height: 500,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
        },
    })

    /**
     * Carrega o arquivo HTML da aplicação
     */
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'app/index.html'),
        protocol: 'file:',
        slashes: true,
    }))

    /**
     * Gerencia o evento de close
     */
    mainWindow.on('close', (event) => {

        /**
         * Caso o item não tenha sido fechado via bandeja, o sistema vai cancelar o evento e apenas esconder a aplicação
         * para a bandeja
         */
        if(wasClosedByTray) {
            event.preventDefault()
            mainWindow.hide()
        }
    })

}

/**
 * Método responsável por criar a bandeja da aplicação
 */
const createTray = () => {

    /**
     * Cria uma nova bandeja
     * @type {Electron.Tray}
     */
    tray = new Tray(path.join(__dirname, 'app/assets/logo.png'))

    /**
     * Cria um menu customizado com as regras da bandeja
     * @type {Electron.Menu}
     */
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Abrir Integrador',
            click: function(){
                mainWindow.show()
            }
        },
        {
            label: 'Fechar Integrador',
            click: function(){
                mainWindow.hide()
            }
        },
        {
            label: 'Finalizar Integrador',
            click: function(){
                wasClosedByTray = true
                app.isQuiting = true
                app.quit()
            }
        }
    ])

    tray.setToolTip('Integrador ssÓtica')
    /**
     * Atualiza o menu da bandeja
     */
    tray.setContextMenu(contextMenu)

}

/**
 * Aguarda a aplicação ser totalmente carregada para criar a janela e a bandeja
 */
app.on('ready', () => {
    
    createMainWindow()
    createTray()

    notifier.on("start-processing", () => {
        mainWindow.webContents.send("start-processing")
    })

    notifier.on("end-processing", () => {
        mainWindow.webContents.send("end-processing")
    })

})

/**
 * Escuta se a aplicação vai ser fechada para desligar o servidor, remover o monitoramento da pasta output e avisar para as janelas
 */
app.on('before-quit', () => {
    console.log('Aplicação será fechada')
    shutdownHTTPServer()
    unwatchFiles()
    mainWindow.webContents.send('app:quit')
})