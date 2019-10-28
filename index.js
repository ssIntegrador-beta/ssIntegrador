"use strict"

const electron = require("electron")
const { fork } = require("child_process")
const url      = require("url")
const path     = require("path")

const { app, screen, BrowserWindow, Menu, Tray } = electron

let mainWindow = null
let tray = null

const server = fork(`${__dirname}/server/index.js`)

app.on('ready', function () {

    const {width, height} = screen.getPrimaryDisplay().workAreaSize

    mainWindow = new BrowserWindow({
        icon: path.join(__dirname, 'app/assets/logo.png'),
        resizable: false,
        width: width / 2,
        height: height - 300,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true
        },
    })

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'app/index.html'),
        protocol: 'file:',
        slashes: true,
    }))

    tray = new Tray(path.join(__dirname, 'app/assets/logo.png'))

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
                app.isQuiting = true
                app.quit()
            }
        }
    ])

    tray.setToolTip('Integrador ssÓtica')
    tray.setContextMenu(contextMenu)

})

app.on('quit', function () {
    console.log('Aplicação fechada')
    server.kill()
    mainWindow.webContents.send('app:quit')
})

app.on('before-quit', () => {
    mainWindow.webContents.send('app:quit')
})