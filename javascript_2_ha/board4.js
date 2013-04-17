//---------------------- Various constants

var Color = {
    RED: 'X',
    YELLOW: 'O'
};

var Direction = {
    HORIZ: 'H',
    VERT: 'V',
    SLASH: 'S',
    BSLASH: 'B'
};
var RUN_LENGTH_MAX = 4;
var RUN_LENGTH_MIN = 3;
var DIM_X = 7;
var DIM_Y = 6;

//---------------------- Init

function Board() {
    this._board = createBoard();
    this._columnCount = [];
    for (var x = 0; x < DIM_X; x++) {
        this._columnCount[x] = 0;
    }
    this._freeCellCount = DIM_Y * DIM_X;
}

/**
 * Helper function: create the board.
 * Signature of returned array:
 * [[{color, count: { H:{'4','3'}, V:{'4','3'}, S:{'4','3'}, B:{'4','3'} }}]]
 */
function createBoard() {
    var board = [];
    for (var y = 0; y < DIM_Y; y++) {
        var row = [];
        for (var x = 0; x < DIM_X; x++) {
            var cell = {};
            cell.color = undefined;
            cell.count = {};
            getPropertyValues(Direction)
                .forEach(function (dir) {
                    cell.count[dir] = {};
                    getPropertyValues(Color)
                        .forEach(function (color) {
                            cell.count[dir][color] = 0;
                        });
                });
            row[x] = cell;
        }
        board[y] = row;
    }
    return board;
}

//---------------------- Convert from and to string, log

/**
 * @param str Cells are one of '.', 'X', 'O', separated by spaces.
 * Rows are separated by newlines. The inverse of {@link Board.prototype.toString}.
 */
Board.prototype.parseString = function (str) {
    var rows = str.split('\n');
    for (var y = 0; y < DIM_Y; y++) {
        var row = rows[y];
        for (var x = 0; x < DIM_X; x++) {
            var color = row.charAt(x * 2);
            if (color !== '.') {
                this.setColor(x, y, color);
            }
        }
    }
};
/**
 * HOMEWORK
 * Create a string representation of the board.
 * The exact(!) inverse of {@link Board.prototype.parseString}.
 */
Board.prototype.toString = function () {
    var str = '';
    for (var y = 0; y < DIM_Y; y++) {
        if (y > 0) {
            str += '\n';
        }
        for (var x = 0; x < DIM_X; x++) {
            if (x > 0) {
                str += ' ';
            }
            var color = this.getCell(x, y).color;
            str += (color ? color : '.');
        }
    }
    return str;
};

/**
 * Print the current board on the console.
 */
Board.prototype.logBoard = function () {
    console.log(this.toString());
    console.log('0 1 2 3 4 5 6');
};

//---------------------- Basic board stuff

function isLegalCoordinate(x, y) {
    return 0 <= x && x < DIM_X && 0 <= y && y < DIM_Y;
}

/**
 * Return the cell object at the given coordinate.
 */
Board.prototype.getCell = function (x, y) {
    if (!isLegalCoordinate(x, y)) {
        throw new Error('Illegal coordinate: '+x+', '+y);
    }
    return this._board[y][x];
};

/**
 * Sets the color of the cell at the given coordinate.
 * Updates the counts (statistical information)
 */
Board.prototype.setColor = function (x, y, color) {
    this._updateCounts(x, y, color, +1);
    this.getCell(x, y).color = color;
};
/**
 * Clears the cell at the given coordinate.
 * Updates the counts (statistical information)
 */
Board.prototype.clearColor = function (x, y) {
    var color = this.getCell(x, y).color;
    this._updateCounts(x, y, color, -1);
    this.getCell(x, y).color = undefined;
};

/**
 * HOMEWORK
 * Is column <code>col</code> completely filled with chips?
 * @returns {boolean}
 */
Board.prototype.isColumnFull = function (col) {
    return this._columnCount[col] >= DIM_Y;
};
/**
 * Is the board completely filled with chips?
 * @returns {boolean}
 */
Board.prototype.isBoardFull = function () {
    return this._freeCellCount === 0;
};

//---------------------- Game logic

Board.prototype.isGameOver = function (counts) {
    counts = counts || this.getCounts();
    return this.isBoardFull() || counts[Color.RED][4] > 0 || counts[Color.YELLOW][4] > 0;
};

/**
 * HOMEWORK
 * Drop a chip whose color is <code>color</code> into column <code>col</code>.
 * @returns {number} the y coordinate to which the chip dropped.
 */
Board.prototype.makeMove = function (col, color) {
    if (this.isColumnFull(col)) {
        throw new Error('Column is full: '+col);
    }
    var y = DIM_Y - this._columnCount[col] - 1;
    this.setColor(col, y, color);
    return y;
};

//---------------------- Search tree

/**
 * HOMEWORK
 * What is the score of color for the current board?
 * @param color
 * @param opts Options: depth (search depth), bestCol (what column achieved the score?)
 * @returns the score of color
 */
Board.prototype.computeMove = function (color, opts) {
    opts = opts || {};
    var depth = opts.depth !== undefined ? opts.depth : 4;
    var counts = this.getCounts();
    if (depth <= 0 || this.isGameOver(counts)) {
        return _computeScore(counts, color);
    } else {
        var bestScore = -Infinity;
        for (var col = 0; col < DIM_X; col++) {
            if (!this.isColumnFull(col)) {
                var y = this.makeMove(col, color);
                var score = this.computeMove(invertColor(color), { depth: depth-1 });
                if ((-score) > bestScore) {
                    bestScore = -score;
                    if (opts.hasOwnProperty('bestCol')) {
                        opts.bestCol = col;
                    }
                }
                this.clearColor(col, y);
            }
        }
        return bestScore;
    }
};

function _computeScore(counts, color) {
    var otherColor = invertColor(color);
    return _computeSingleScore(counts, color) - _computeSingleScore(counts, otherColor);
}

/** HOMEWORK */
function _computeSingleScore(counts, color) {
    return (counts[color][4] * 100) + counts[color][3];
}

//---------------------- Counts

/**
 * Incremental update of the counts
 */
Board.prototype._updateCounts = function (x, y, color, incCount) {
    this._freeCellCount -= incCount;
    this._columnCount[x] += incCount;

    // In each case, we go back (down, left)
    this._updateCountsOneDirection(x, y, color, +1, +1, Direction.BSLASH, incCount);
    this._updateCountsOneDirection(x, y, color, -1, +1, Direction.SLASH, incCount);
    this._updateCountsOneDirection(x, y, color, -1, 0, Direction.HORIZ, incCount);
    this._updateCountsOneDirection(x, y, color, 0, +1, Direction.VERT, incCount);
};
Board.prototype._updateCountsOneDirection = function (x, y, color, incx, incy, direction, incCount) {
    var len = RUN_LENGTH_MAX;
    do {
        this.getCell(x, y).count[direction][color] += incCount;
        len--;
        x += incx;
        y += incy;
    } while (len > 0 && isLegalCoordinate(x, y));
};

/**
 * Summarizes the counts of all the cells in this board.
 * @returns an object with the signature { X: {'4','3'}, O: {'4','3'} }
 */
Board.prototype.getCounts = function () {
    var that = this;
    var counts = {};
    getPropertyValues(Color)
        .forEach(function (color) {
            counts[color] = {};
            for(var i=RUN_LENGTH_MIN; i <= RUN_LENGTH_MAX; i++) {
                counts[color][i] = 0;
            }
        });
    for (var y = 0; y < DIM_Y; y++) {
        for (var x = 0; x < DIM_X; x++) {
            getPropertyValues(Direction)
                .forEach(function (dir) {
                    getPropertyValues(Color)
                        .forEach(function (color) {
                            var otherColor = invertColor(color);
                            var directionCount = that.getCell(x, y).count[dir];
                            if (directionCount[color] >= RUN_LENGTH_MIN
                                && directionCount[otherColor] === 0) {
                                counts[color][directionCount[color]]++;
                            }
                        });
                });
        }
    }
    return counts;
};

//---------------------- Generic helpers

function getPropertyValues(obj) {
    return Object.keys(obj).map(function (key) {
        return obj[key];
    });
}

function invertColor(color) {
    switch(color) {
        case Color.RED:
            return Color.YELLOW;
        case Color.YELLOW:
            return Color.RED;
        default:
            throw new Error('Not a color: '+color);
    }
}

//---------------------- Exports

module.exports = {
    Color: Color,
    invertColor: invertColor,
    Board: Board
};