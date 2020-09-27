var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

var players = {};

var powerup = {
    x: Math.floor(Math.random() * 700) + 45,
    y: Math.floor(Math.random() * 500) + 45
}

var scores = {
    blue: 0,
    red: 0
}

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html')
});

io.on('connection', function (socket) {
    console.log('um boneco entrou: ', socket.id);
    players[socket.id] = {
        rotation: 0,
        x: Math.floor(Math.random() * 700) + 40,
        y: Math.floor(Math.random() * 500) + 40,
        playerId: socket.id,
        team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue'
    }

    socket.emit('currentPlayers', players);

    socket.emit('powerUpLocation', powerup);

    socket.emit('scoreUpdate', scores);

    socket.broadcast.emit('newPlayer', players[socket.id]);

    socket.on('disconnect', function () {
        console.log('O boneco quitou ', socket.id);
        delete players[socket.id];
        io.emit('disconnect', socket.id)
    })

    socket.on('playerMovement', function (movementData) {
        players[socket.id] = movementData

        socket.broadcast.emit('playerMoved', players[socket.id])
    })

    socket.on('powerUpCollected', function () {
        if (players[socket.id].team === 'red') {
            scores.red += 10;
        } else {
            scores.blue += 10;
        }

        powerup.x = Math.floor(Math.random() * 700) + 45
        powerup.y = Math.floor(Math.random() * 500) + 45

        io.emit('powerUpLocation', powerup);
        io.emit('scoreUpdate', scores)
    })

})

server.listen(8081, function () {
    console.log
        (`Agora o servidor subiu, bora jogar galera! ${server.address().port}`)
})