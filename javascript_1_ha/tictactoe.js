var readline = require('readline');
var grid = require('../../js7_code/javascript_1_code/grid');
var searchtree = require('./searchtree');

var LEGAL_INPUT = /^[0-8]$/;

var playerColor;

// default: 'X'
switch(process.argv[2].toLowerCase()) {
    case 'o':
        playerColor = grid.COLOR_O;
        break;
    default:
        playerColor = grid.COLOR_X;
}

console.log('Human color: '+playerColor+' (X has first move)');
commandLine(playerColor);

function commandLine(humanColor) {
    var computerColor = grid.invertColor(humanColor);
    var theGrid = grid.create();

    // X starts the game
    if (computerColor === grid.COLOR_X) {
        if (makeAMove(theGrid, computerColor) === 'GAME_OVER') {
            throw new Error('Game unexpectedly over: '+grid.print(theGrid));
        }
    }

    var rl = readline.createInterface(process.stdin, process.stdout);
    rl.setPrompt('tictactoe> ');
    rl.prompt();

    rl.on('line', function(line) {
        line = line.trim();
        if (line.length === 0) {
            // ignore empty lines
        } else if (line === ':q') {
            rl.close();
            return;
        } else if (!LEGAL_INPUT.test(line)) {
            console.log('Bitte eine Ziffer von 0–8 eingeben!')
        } else {
            var digit = Number(line);
            var x = digit % grid.ROW_LEN;
            var y = Math.floor(digit / grid.ROW_LEN);
            grid.setCell(theGrid, x, y, humanColor);
            console.log(grid.print(theGrid));
            if (searchtree.isGameOver(theGrid)) {
                rl.close();
                return;
            }
        }
        makeAMove(theGrid, computerColor);
        if (searchtree.isGameOver(theGrid)) {
            rl.close();
            return;
        }
        rl.prompt();
    }).on('close', function() {
        console.log('Game over!');
        process.exit(0);
    });
}

function makeAMove(g, computerColor) {
    var bestCoord = {};
    searchtree.rateGrid(g, computerColor, { bestCoord: bestCoord });
    if (!(bestCoord.hasOwnProperty('x') && bestCoord.hasOwnProperty('y'))) {
        throw new Error('Can’t make a move: '+grid.print(g));
    }
    grid.setCell(g, bestCoord.x, bestCoord.y, computerColor);
    console.log(grid.print(g));
}