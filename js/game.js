/*
 * Apache License 2.0
 * Copyright (c) 2016 - José Victor Alves de Souza - https://github.com/dudevictor/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
/**
 * This script defines the game function and all logic to render and control the canvas element
 * @param labyrinth a instance of {@link Labyrinth}
 * @constructor it initializes the Game
 */
var Game = function(labyrinth, aStar, nameFile) {

    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    var gameTime = 0;
    var playerSpeed = 150;
    var texture;
    var way = aStar.way().slice();
    var openned = aStar.openned().slice();
    var closed = aStar.closed().slice();
    var blockList = {};
    var selectedSquare = null;
    for (var i = 0; i < labyrinth.map.length; i++) {
        for (var j = 0; j < labyrinth.map[0].length; j++) {
            var square = labyrinth.map[i][j];
            if (square.type === TypePosition.BLOCKED) {
                blockList[square.generateIdentifier()] = square;
            }
        }
    }
    var start = labyrinth.start;

    var GameMove = function(squareTo) {
        this.squareTo = squareTo;
    };

    this.stop = function() {
        $(canvas).unbind();
        main = function() {};
        window.setTimeout(function() {
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#444444";
            ctx.fill();
            ctx.restore();
        }, 1000 / 30);

    };

    var requestAnimFrame = (function () {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (callback) {
                window.setTimeout(callback, 1000 / 30);
            };
    })();

    var lastTime;

    function main() {
        var now = Date.now();
        var dt = (now - lastTime) / 1000.0;

        if (isToPlay) {
            update(dt);
        }
        render();

        lastTime = now;

        requestAnimFrame(main);
    };

    function iniciar() {
        texture = ctx.createPattern(resources.get('assets/textura.png'), 'repeat');
        lastTime = Date.now();
        main();
    }

    var player = new Player(labyrinth.start);
    var goal = new Goal(labyrinth.goal);

    var gameMove = new GameMove(labyrinth.start);
    function update(dt) {
        gameTime += dt;
        updatePlayer(dt);
        player.sprite.update(dt);
        goal.sprite.update(dt);
    }

    function updatePlayer(dt) {
        if (checkIfPlayerIsOnSquare()) {
            player.square = gameMove.squareTo;
            var newSquare = aStar.next();
            if (newSquare != null) {
                gameMove = new GameMove(newSquare);
            } else {
                endGame();
            }
        }
        movePlayer(dt);
    }

    function checkIfPlayerIsOnSquare() {
        var x = Math.pow(player.pos[0] - gameMove.squareTo.center[0], 2);
        var y = Math.pow(player.pos[1] - gameMove.squareTo.center[1], 2);
        var result = Math.sqrt(x + y);
        if (result == 0) {
            return true;
        } else {
            return false;
        }

    }

    function movePlayer(dt) {
        var oldPos = player.pos;
        var x = player.pos[0];
        var y = player.pos[1];

        if (Math.abs(x - gameMove.squareTo.center[0]) <= 2) {
            x = gameMove.squareTo.center[0];
        } else if (x < gameMove.squareTo.center[0]) {
            x += dt*playerSpeed;
        } else if (x > gameMove.squareTo.center[0]) {
            x -= dt*playerSpeed;
        }

        if (Math.abs(y - gameMove.squareTo.center[1]) <= 2) {
            y = gameMove.squareTo.center[1];
        } else if (y < gameMove.squareTo.center[1]) {
            y += dt*playerSpeed;
        } else if (y > gameMove.squareTo.center[1]) {
            y -= dt*playerSpeed;
        }

        player.updatePosition([x, y]);
        player.updateSpriteMoviment(oldPos, [x, y]);

    }


    function render() {
        ctx.fillStyle = texture;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        renderOpenNClosed();
        if (selectedSquare == null) {
            renderWay(way);
        } else {
            renderWay(aStar.findWayBack(selectedSquare));
        }

        renderStartNGoal();

        var blockListDown = renderMapUp();
        ctx.save();
        ctx.translate(player.translate[0], player.translate[1]);
        player.sprite.render(ctx);
        ctx.restore();

        renderMapDown(blockListDown);

    }

    function renderOpenNClosed() {
        if (isShowClosed) {
            $.each(closed, function (key, closeMove) {
                ctx.save();
                ctx.fillStyle = "rgba(192, 72, 72, 0.35)";
                ctx.fillRect(closeMove.square.pos[0], closeMove.square.pos[1], DimensionSquare, DimensionSquare);
                ctx.restore();
            });
        }

        if (isShowOpen) {
            $.each(openned, function (key, openMove) {
                ctx.save();
                ctx.fillStyle = "rgba(60, 162, 162, 0.35)";
                ctx.fillRect(openMove.square.pos[0], openMove.square.pos[1], DimensionSquare, DimensionSquare);
                ctx.restore();
            });
        }
    }

    function renderStartNGoal() {
        ctx.save();
        ctx.translate(goal.translate[0], goal.translate[1]);
        goal.sprite.render(ctx);
        ctx.restore();

        var translate = start.translate;/*[start.pos[0] + Math.abs(DimensionStart.width/2 - DimensionSquare/2),
            start.pos[1] + Math.abs(DimensionStart.height/2 - DimensionSquare/2)];*/
        ctx.save();
        ctx.translate(translate[0], translate[1]);
        start.sprite.render(ctx);
        ctx.restore();
    }

    function renderWay(wayToDraw) {
        var footPrintImg = resources.get("assets/footprints.gif");

        $.each(wayToDraw, function(index, square) {
            if (!square.equals(start) && !square.equals(goal.square)) {
                ctx.save();
                var translate = square.pos;
                translate = [translate[0] + Math.abs(DimensionFootPrint / 2 - DimensionSquare / 2),
                    translate[1] + Math.abs(DimensionFootPrint / 2 - DimensionSquare / 2)];
                ctx.translate(translate[0], translate[1]);
                ctx.drawImage(footPrintImg, 0, 0, DimensionFootPrint, DimensionFootPrint);
                ctx.restore();
            }
        });
    }

    function renderMapUp() {
        var blockListCopy = jQuery.extend(true, {}, blockList);
        $.each(blockList, function(key, value) {
            if (player.pos[1] > value.center[1]) {
                ctx.save();
                ctx.translate(value.translate[0], value.translate[1]);
                value.sprite.render(ctx);
                ctx.restore();
                delete blockListCopy[key];
            }
        });
        return blockListCopy;
    }

    function renderMapDown(blockListDown) {
        $.each(blockListDown, function(key, value) {
            ctx.save();
            ctx.translate(value.translate[0], value.translate[1]);
            value.sprite.render(ctx);
            ctx.restore();
        });
    }

    function endGame() {
        if (player.square.equals(goal.square)) {
            player.updateSprite(PlayerSprites.VICTORY);
        } else {
            player.updateSprite(PlayerSprites.LOSE);
        }
        movePlayer = function(){};
        updatePlayer = function(){};
    }


    function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    //@TODO Remover todo este código para uma novo arquivo javascript
    $(canvas).on("click", function(evt) {
        $(canvas).hideBalloon();
        selectedSquare = null;
        var mousePos = getMousePos(canvas, evt);
        var i = Math.floor((mousePos.y- Padding.top) / DimensionSquare);
        var j = Math.floor((mousePos.x - Padding.left) / DimensionSquare);
        var selectedMove;
        $.each(openned, function(key, openMove) {
            if (openMove.square.index[0] == i && openMove.square.index[1] == j) {
                selectedMove = openMove;
                selectedMove.type = "Aberto";
                return false;
            }
        });
        if (selectedMove == null) {
            $.each(closed, function(key, closedMove) {
                if (closedMove.square.index[0] == i && closedMove.square.index[1] == j) {
                    selectedMove = closedMove;
                    selectedMove.type = "Fechado";
                    return false;
                }
            });
        }
        if (selectedMove != null) {
            selectedSquare = selectedMove.square;
            var balloonSets = {};
            if (selectedMove.square.pos[0] > canvas.width/2) {
                balloonSets.position = "left";
                balloonSets.tipPosition = 3;
                balloonSets.x = selectedMove.square.pos[0];
                balloonSets.y = canvas.height/2 - selectedMove.square.pos[1] - DimensionSquare/2;
            } else {
                balloonSets.position = "right";
                balloonSets.tipPosition = 2;
                balloonSets.x = selectedMove.square.pos[0] - canvas.width + DimensionSquare;
                balloonSets.y = canvas.height/2 - selectedMove.square.pos[1] - DimensionSquare/2;
            }
            setTimeout(function() {
                $("#baloon").find("h5").html(selectedMove.type);
                $("#baloon").find("label[name='cost']").html(selectedMove.cost.toFixed(2));
                $("#baloon").find("label[name='distance']").html(selectedMove.distance.toFixed(2));
                $("#baloon").find("label[name='priority']").html(selectedMove.priority.toFixed(2));
                $(canvas).showBalloon({
                    position: balloonSets.position,
                    offsetX: balloonSets.x,
                    offsetY: balloonSets.y,
                    indexTip: balloonSets.tipPosition,
                    contents: $("#baloon").html()
                });

                $("button[name='closeBaloon']").on("click", function() {
                    $(canvas).hideBalloon();
                    selectedSquare = null;
                });
            }, 400);
        }

    });

    iniciar();

};

