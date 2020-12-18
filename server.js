const express = require('express')
const path = require('path')
const http = require('http')
const PORT = process.env.PORT || 3000
const socketio = require('socket.io')
const app = express()
const server = http.createServer(app)
const io = socketio(server)

// Set static folder
app.use(express.static(path.join(__dirname, "public")))

// Start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))

// Socket connection for the client

const connections = [null, null]

io.on('connection', socket => {
    console.log('New socket connection')
    //Find an avalable player number
    let playerIndex = -1;
    for (const i in connections) {
        if (connections[i] === null) {
        playerIndex = i
        break
        }
    }

    //Emit the player number
    socket.emit('player-number', playerIndex)

    console.log(`Player ${playerIndex} has connected`)

    //Dont let more than 2 players
    if (playerIndex === -1) return

    connections[playerIndex] = false

    // Tell everyone the player number who connected
    socket.broadcast.emit('player-connection', playerIndex)

    // Dinconnect
    socket.on('disconnect', () => {
        console.log(`Player ${playerIndex} disconnected`)
        connections[playerIndex] = null
        //Tell everyone what player numbe just disconnected
        socket.broadcast.emit('player-connection', playerIndex)
    })

    // when player is ready
    socket.on('player-ready', () => {
        socket.broadcast.emit('enemy-ready', playerIndex)
        connections[playerIndex] = true
    })

    //check player connections
    socket.on('check-players', () => {
        const players = []
        for (const i in connections) {
          connections[i] === null ? players.push({connected: false, ready: false}) : players.push({connected: true, ready: connections[i]})
        }
        socket.emit('check-players', players)
    })

    //fire received
    socket.on('fire', id => {
        console.log(`Shot fired from ${playerIndex}`, id)
    
        // emit the fire to the enemy
        socket.broadcast.emit('fire', id)
    })

    //fire reply
    socket.on('fire-reply', square => {
        console.log(square)
    
        // fire reply the enemy
        socket.broadcast.emit('fire-reply', square)
    })



})
