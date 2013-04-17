var readline = require('readline');
var board = require('./board4');

var LEGAL_INPUT = /^[0-6]$/;

var playerColor;

// default: 'X'
switch(process.argv[2].toLowerCase()) {
    case 'o':
        playerColor = board.Color.YELLOW;
        break;
    default:
        playerColor = board.Color.RED;
}

console.log('Human color: '+playerColor+' ('+board.Color.RED+' has first move)');
commandLine(playerColor);

function commandLine(humanColor) {
    var computerColor = board.invertColor(humanColor);
    var theBoard = new board.Board();

    // Red starts the game
    if (computerColor === board.Color.RED) {
        makeAMove(theBoard, computerColor);
    } else {
        theBoard.logBoard();
    }

    var rl = readline.createInterface(process.stdin, process.stdout);
    rl.setPrompt('connect4> ');
    rl.prompt();

    rl.on('line', function(line) {
        line = line.trim();
        if (line.length === 0) {
            // ignore empty lines
        } else if (line === ':q') {
            rl.close();
            return;
        } else if (!LEGAL_INPUT.test(line)) {
            console.log('Bitte eine Ziffer von 0–6 eingeben!')
        } else {
            var col = Number(line);
            if (theBoard.isColumnFull(col)) {
                console.log('Spalte is voll!');
            } else {
                theBoard.makeMove(col, humanColor);
                theBoard.logBoard();
                if (theBoard.isGameOver()) {
                    rl.close();
                    return;
                }
            }
        }
        makeAMove(theBoard, computerColor);
        if (theBoard.isGameOver()) {
            rl.close();
            return;
        }
        rl.prompt();
    }).on('close', function() {
        console.log('Game over!');
        process.exit(0);
    });
}

function makeAMove(theBoard, computerColor) {
    var opts = { bestCol: -1 };
    theBoard.computeMove(computerColor, opts);
    theBoard.makeMove(opts.bestCol, computerColor);
    theBoard.logBoard();
}