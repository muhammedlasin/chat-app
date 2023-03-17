const express = require("express")
const path = require("path")
const app = express()
const publicDirectory = path.join(__dirname, '../public')
const port = process.env.PORT || 3000
const http = require("http")
const server = http.createServer(app)
const socketio = require("socket.io")
const io = socketio(server)
const { generateMessage, generateLocation } = require("./utils/messages")
const { removeUser, addUser, getUser, getUsersInRoom } = require("./utils/users")

app.use(express.static(publicDirectory))

io.on('connection', (socket) => {
    console.log("New Socket connection")

    socket.on('join', ({ username, room }, callback) => {

        const { error, user } = addUser({ id: socket.id, username, room })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)
        socket.emit('message', generateMessage('Admin', 'Welcome'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })


    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback()
    })

    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id)
        const url = `https://google.com/maps?q=${location.latitude},${location.longitude}`
        io.to(user.room).emit('location', generateLocation(user.username, url))
        callback()
    })


    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))

            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log(`The chat app is running on port ${port}`)
})