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
 * This script defines the App function and all logic to control and build the labyrinth.
 * Also it control and calls gameplay and A* algorithm functions.
 * @constructor it initializes the App
 */
var App = function() {

    var canvas = document.getElementById("canvas");
    var minCanvasWidth = 981;
    var minCanvasHeight =  500;
    var game;
    var aStar;
    var labBuilder;
    var isBuildingLab;

    function iniciar(oldLabyrinth) {
        isBuildingLab = true;
        if (oldLabyrinth == null) {
            var newLab =  emptyLabyrinth();
            setCanvasSize(newLab.rowCount, newLab.colCount);
            labBuilder = new LabyrinthBuilder(newLab);
        } else {
            labBuilder = new LabyrinthBuilder(oldLabyrinth);
        }
    }

    function emptyLabyrinth() {
        var linhas = 7;
        var colunas = 17;
        var horCost = 1;
        var verCost = 1;
        var diaCost = 1;

        var map = [];
        for (var i = 0; i < linhas; i++) {
            var array = [];
            for (var j = 0; j < colunas; j++) {
                array.push(new PositionSquare(i, j, TypePosition.ALLOWED));
            }
            map.push(array);
        }
        return new Labyrinth(linhas, colunas, horCost, verCost, diaCost, map, null, null);
    }

    function setCanvasSize(rowCount, colCount) {
        var canvas = document.getElementById("canvas");
        var canvasWidth = colCount * DimensionSquare + Padding.right + Padding.left ;
        var canvasHeight = rowCount * DimensionSquare + Padding.top + Padding.bottom;

        if (minCanvasWidth > canvasWidth) canvasWidth = minCanvasWidth;
        if (minCanvasHeight > canvasHeight) canvasHeight = minCanvasHeight;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
    }

    $("#play").on("click", function () {
        if(!labBuilder.isLabyrinthOk()) {
            $("#modal-erro div[name='modal-message']").html("You have not set up the labyrinth correctly! " +
                "Make sure you marked the start and end positions!!");
            $("#modal-erro").modal('show');
            return false;
        }

        labBuilder.stop();
        var costs = {};
        costs[TypeMovement.VERTICAL] = Number($("#pesoVertical").val());
        costs[TypeMovement.HORIZONTAL] = Number($("#pesoHorizontal").val());
        costs[TypeMovement.DIAGONAL] = Number($("#pesoDiagonal").val());
        var lab = labBuilder.buildLabyrinth();
        var configs = {
            start: lab.start,
            goal: lab.goal,
            map: lab.map,
            costs: costs
        };

        aStar = new AStarAlgorithm(configs);
        game = new Game(lab, aStar, "arquivo");
    });

    resources.load([
        'assets/textura.png',
        "assets/personagem.gif",
        "assets/left.png",
        "assets/right.png",
        "assets/baixo.png",
        "assets/cima.png",
        "assets/portal.png",
        "assets/Shrub48.gif",
        "assets/comemorar.png",
        "assets/dead.gif",
        "assets/footprints.gif",
        "assets/start.gif",
        "assets/erase.png"
    ]);
    resources.onReady(iniciar);

};

