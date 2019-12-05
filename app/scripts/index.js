"use strict"

const { ipcRenderer } = require("electron")

document.addEventListener('DOMContentLoaded', () => {

    /**
     * Gerencia se alguma nota está sendo processada no momento
     * @type {boolean}
     */
    let isProcessing = false

    /**
     * Botão de status da aplicação(online|offline|processando)
     * @type {Element}
     */
    let buttonStatus = document.querySelector('.app-status-button')

    /**
     * Verifica o status de conexão de internet e atualiza o botão
     */
    const handleNetworkStatus = () => {
        if(!isProcessing){
            updateButtonUI(
                navigator.onLine ? 'online' : 'offline',
                navigator.onLine ? 'Conectado' : 'Desconectado'
            )
        }
    }

    /**
     * Atualiza a classe e o texto do botão dependendo do seu status
     * @param className
     * @param text
     */
    const updateButtonUI = (className, text) => {
        buttonStatus.classList  = 'app-status-button '+className

        setTimeout(() => buttonStatus.textContent = text, 200)
    }

    /**
     * Atualiza o estado do botão para processando
     */
    ipcRenderer.on('start-processing', () => {
        isProcessing = true
        updateButtonUI('loading', 'Processando')
    })

    /**
     * Atualiza o estado do botão de acordo com o estado da internet
     */
    ipcRenderer.on('end-processing', () => {
        isProcessing = false
        handleNetworkStatus()
    })

    ipcRenderer.on("update:start", text => {
        updateButtonUI("loading", text)
    })

    ipcRenderer.on("update:end", () => {
        handleNetworkStatus()
    })

    /**
     * Adiciona os eventos de mudança de internet
     */
    window.addEventListener('online',  handleNetworkStatus)
    window.addEventListener('offline',  handleNetworkStatus)

    handleNetworkStatus()

})