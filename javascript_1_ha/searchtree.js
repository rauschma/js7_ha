var grid = require('../../js7_code/javascript_1_code/grid');

/**
 * @return Rate g for color. Higher scores are better.
 */
function rateGrid(g, color, opts) {
    opts = opts || {};
    var depth = (opts.depth !== undefined ? opts.depth : 4);

    var stats = computeStats(g);
    if (depth <= 0 || isLeaf(g, stats)) {
        return computeCompoundScore(stats, color);
    } else {
        var bestScore = -Infinity;
        // Make every possible move
        for(var y=0; y < grid.ROW_LEN; y++) {
            for(var x=0; x < grid.ROW_LEN; x++) {
                if (grid.getCell(g, x, y) === grid.COLOR_NONE) {
                    grid.setCell(g, x, y, color);
                    var score = rateGrid(g, grid.invertColor(color), { depth: depth - 1 });
                    if ((-score) > bestScore) {
                        bestScore = -score;
                        if (opts.bestCoord) {
                            opts.bestCoord.x = x;
                            opts.bestCoord.y = y;
                        }
                    }
                    grid.setCell(g, x, y, grid.COLOR_NONE);
                }
            }
        }
        if (opts.bestCoord && grid.getCell(g, opts.bestCoord.x, opts.bestCoord.y) !== grid.COLOR_NONE) {
            throw new Error('Internal error: ('+opts.bestCoord.x+','+opts.bestCoord.y+') '+grid.print(g));
        }
        return bestScore;
    }
}

function isGameOver(g) {
    return isLeaf(g, computeStats(g));
}

function isLeaf(g, stats) {
    return (
        stats.freeCount === 0
        || stats[grid.COLOR_O][grid.MAX_RUN] > 0
        || stats[grid.COLOR_X][grid.MAX_RUN] > 0
    );
}

function computeCompoundScore(stats, color) {
    return computeSingleScore(stats, color) - computeSingleScore(stats, grid.invertColor(color));
}
function computeSingleScore(stats, color) {
    return (stats[color][grid.MAX_RUN]*10) + stats[color][grid.MAX_RUN-1];
}

function computeStats(g) {
    var stats = {};
    grid.COLORS.forEach(function (color) {
        stats[color] = {};
        for (var i = grid.ROW_LEN; i >= grid.MIN_RUN; i--) {  // don't count single marks
            stats[color][i] = 0;
        }
    });

    // rows
    for(var y=0; y<grid.ROW_LEN; y++) {
        oneRow(stats, g, 0, y, 1, 0);
    }
    // columns
    for(var x=0; x<grid.ROW_LEN; x++) {
        oneRow(stats, g, x, 0, 0, 1);
    }
    // diagonals
    oneRow(stats, g, 0, 0, 1, 1);
    oneRow(stats, g, 2, 0, -1, 1);

    stats.freeCount = 0;
    for(var y=0; y < grid.ROW_LEN; y++) {
        for(var x=0; x < grid.ROW_LEN; x++) {
            if (grid.getCell(g, x, y) === grid.COLOR_NONE) {
                stats.freeCount++;
            }
        }
    }

    return stats;
}

function oneRow(stats, g, x, y, xinc, yinc) {
    var rowStats = {};
    rowStats[grid.COLOR_NONE] = 0;
    rowStats[grid.COLOR_O] = 0;
    rowStats[grid.COLOR_X] = 0;
    for(var steps = grid.ROW_LEN; steps > 0; steps--) {
        var color = grid.getCell(g, x, y);
        rowStats[color]++;
        x += xinc;
        y += yinc;
    }
    grid.COLORS.forEach(function (color) {
        if (rowStats[grid.invertColor(color)] === 0 && rowStats[color] >= grid.MIN_RUN) {
            stats[color][rowStats[color]]++;
        }
    });
}

exports.computeStats = computeStats;
exports.isGameOver = isGameOver;
exports.rateGrid = rateGrid;
