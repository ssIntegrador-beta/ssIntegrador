"use strict"

const express = require("express")
const app     = express()
const path    = require("path")

app.get('/', async (req, res) => {
    return res.sendFile(path.join(__dirname, '../app/index.html'))
})

const start = async () =>
    app.listen(3000, (err, address) => {

        if(err){
            console.error(err)
            process.exit(1)
        }

        console.log(`Server listening on 3000`)

    })

module.exports = start()