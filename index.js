"use strict"

/**
 * Importa o Electron e alguns módulos nativos do node
 * @type {Electron}
 */
const electron     = require("electron")
const url          = require("url")
const path         = require("path")
const AutoLaunch   = require("auto-launch")
const { autoUpdater }  = require("electron-updater")

const sendStatusToWindow = text => {
    console.log(text)
    mainWindow.webContents.send("update:start", text)
}

autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('Procurando por atualizações...')
})
autoUpdater.on('update-available', (ev, info) => {
    sendStatusToWindow('Encontramos uma atualização disponível')
})
autoUpdater.on('update-not-available', (ev, info) => {
    sendStatusToWindow('Nenhuma atualizaçao disponível')
    setTimeout(() => mainWindow.webContents.send("update:end"), 5000)
})
autoUpdater.on('error', (ev, err) => {
    sendStatusToWindow('Ocorreu um erro ao atualizar a aplicação')
})
autoUpdater.on('download-progress', (ev, progressObj) => {
    sendStatusToWindow(`Baixando atualização "${progressObj.percent}"%`)
})
autoUpdater.on('update-downloaded', (ev, info) => {
    sendStatusToWindow('Instalando atualizações')
})

autoUpdater.on('update-downloaded', (ev, info) => {
    setTimeout(function() {
        mainWindow.webContents.send("update:end")
        autoUpdater.quitAndInstall()
    }, 2000)
})


/**
 * Importa o módulo responsável por gerenciar os eventos
 */
const notifier = require("./modules/notifier")

const dispatch = (type, payload) => mainWindow.webContents.send(type, payload)

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
        if(!wasClosedByTray) {
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
                wasClosedByTray = false
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

const createAuthLaunch = () => {
    const launcher = new AutoLaunch({
        name: "ssIntegrador"
    })

    launcher.enable()
    .finally(() => {
        
        launcher.isEnabled()
        .then(isEnabled => {
            if(isEnabled){
                dispatch("auth-launch:enabled")
                console.log("Auto Launch ativado")
            }
            else{
                dispatch("auth-launch:disabled")
                console.log("Auth launch não está ativado")
            }
        })
        .catch(console.log)

    })

}

/**
 * Aguarda a aplicação ser totalmente carregada para criar a janela e a bandeja
 */
app.on('ready', () => {
    
    createMainWindow()
    createTray()
    createAuthLaunch()
    autoUpdater.checkForUpdates()

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