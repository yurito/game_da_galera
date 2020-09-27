var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};


var game = new Phaser.Game(config);

function preload() {

    this.load.image('ship', 'assets/ship1.png');
    this.load.image('otherShip', 'assets/ship2.png');
    this.load.image('powerUp', 'assets/powerUp.png');

}

function create() {
    var self = this;
    this.socket = io();
    this.otherPlayers = this.physics.add.group();
    this.socket.on('currentPlayers', function (players) {
        Object.keys(players).forEach(function (id) {
            if (players[id].playerId === self.socket.id) {
                addPlayer(self, players[id]);
            } else {
                addOtherPlayers(self, players[id]);
            }
        });
    });

    this.socket.on('newPlayer', function (playerInfo) {
        addOtherPlayers(self, playerInfo)
    })

    this.socket.on('disconnect', function (playerId) {
        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
            if (playerId === otherPlayer.playerId) {
                otherPlayer.destroy();
            }
        })
    })

    this.socket.on('playerMoved', function (playerInfo) {

        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
            if (playerInfo.playerId === otherPlayer.playerId) {
                otherPlayer.setRotation(playerInfo.rotation),
                    otherPlayer.setPosition(playerInfo.x, playerInfo.y)
            }

        })

    })

    this.cursors = this.input.keyboard.createCursorKeys();

    this.blueScoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#0000FF' })
    this.redScoreText = this.add.text(580, 16, '', { fontSize: '32px', fill: '#FF0000' })


    this.socket.on('scoreUpdate', function (scores) {
        self.blueScoreText.setText('Blue: ' + scores.blue)
        self.redScoreText.setText('Red: ' + scores.red);

    })

    this.socket.on('powerUpLocation', function (powerUpLocation) {
        if (self.powerUp) self.powerUp.destroy();
        self.powerUp = self.physics.add.image(powerUpLocation.x, powerUpLocation.y, 'powerUp');
        self.physics.add.overlap(self.ship, self.powerUp, function () {
            this.socket.emit('powerUpCollected');
        }, null, self)

    })
}

function addPlayer(self, playerInfo) {
    self.ship = self.physics.add.image
        (playerInfo.x, playerInfo.y, 'ship')
        .setOrigin(0.5, 0.5)
        .setDisplaySize(53, 40)

    self.ship.setDrag(100);
    self.ship.setAngularDrag(100);
    self.ship.setMaxVelocity(200);
}
function addOtherPlayers(self, playerInfo) {

    const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'otherShip')
        .setOrigin(0.5, 0.5)
        .setDisplaySize(53, 40);

    if (playerInfo.team === 'blue') {
        otherPlayer.setTint(0x0000ff);
    } else {
        otherPlayer.setTint(0xff0000);
    }

    otherPlayer.playerId = playerInfo.playerId;
    self.otherPlayers.add(otherPlayer)
}

function update() {

    if (this.ship) {
        if (this.cursors.left.isDown) {
            this.ship.setAngularVelocity(-150)
        }
        else if (this.cursors.right.isDown) {
            this.ship.setAngularVelocity(150)
        } else {
            this.ship.setAngularVelocity(0)
        }

        if (this.cursors.up.isDown) {
            this.physics.velocityFromRotation
                (this.ship.rotation, 100, this.ship.body.acceleration);
        } else {
            this.ship.setAcceleration(0)
        }

        this.physics.world.wrap(this.ship, 5);

        var x = this.ship.x;
        var y = this.ship.y;
        var r = this.ship.roration;

        if (this.ship.oldPosition && (x !== this.ship.oldPosition.x ||
            y !== this.ship.oldPosition.y ||
            r !== this.ship.oldPosition.rotation)) {
            this.socket.emit('playerMovement',
                { x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation })
        }

        this.ship.oldPosition = {
            x: this.ship.x,
            y: this.ship.y,
            rotation: this.ship.rotation
        }


    }

}