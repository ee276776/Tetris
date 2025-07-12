// 遊戲配置
const GAME_CONFIG = {
    ROWS: 20,
    COLS: 10,
    BLOCK_SIZE: 30,
    COLORS: {
        I: '#00ffff', // 青色 - I形
        O: '#ffff00', // 黃色 - O形
        T: '#800080', // 紫色 - T形
        S: '#00ff00', // 綠色 - S形
        Z: '#ff0000', // 紅色 - Z形
        J: '#0000ff', // 藍色 - J形
        L: '#ffa500'  // 橙色 - L形
    }
};

// 俄羅斯方塊形狀定義
const TETROMINOS = {
    I: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    O: [
        [1, 1],
        [1, 1]
    ],
    T: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    S: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
    ],
    Z: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ],
    J: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    L: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
    ]
};

// 遊戲狀態
class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.holdCanvas = document.getElementById('holdCanvas');
        this.holdCtx = this.holdCanvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');

        this.board = Array(GAME_CONFIG.ROWS).fill().map(() => Array(GAME_CONFIG.COLS).fill(0));
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.canHold = true;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.dropTime = 0;
        this.dropInterval = 1000;

        this.setupEventListeners();
        this.generateNextPiece();
        this.spawnPiece();
        this.draw();
    }

    setupEventListeners() {
        // 鍵盤事件
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // 按鈕事件
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.restartGame());
    }

    generateNextPiece() {
        const pieces = Object.keys(TETROMINOS);
        const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
        this.nextPiece = {
            type: randomPiece,
            shape: TETROMINOS[randomPiece],
            x: 0,
            y: 0
        };
        this.drawNextPiece();
    }

    spawnPiece() {
        if (this.nextPiece) {
            this.currentPiece = {
                ...this.nextPiece,
                x: Math.floor(GAME_CONFIG.COLS / 2) - Math.floor(this.nextPiece.shape[0].length / 2),
                y: 0
            };
            this.generateNextPiece();
            this.canHold = true;

            // 檢查遊戲結束
            if (this.isCollision(this.currentPiece)) {
                this.gameOver();
            }
        }
    }

    handleKeyPress(e) {
        if (!this.gameRunning || this.gamePaused) return;

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.movePiece(0, 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.rotatePiece();
                break;
            case ' ':
                e.preventDefault();
                this.hardDrop();
                break;
            case 'Shift':
                e.preventDefault();
                this.holdCurrentPiece();
                break;
            case 't':
            case 'T':
                e.preventDefault();
                this.cheatClearBottomLine();
                break;
        }
    }

    movePiece(dx, dy) {
        const newPiece = {
            ...this.currentPiece,
            x: this.currentPiece.x + dx,
            y: this.currentPiece.y + dy
        };

        if (!this.isCollision(newPiece)) {
            this.currentPiece = newPiece;
            this.draw();
        } else if (dy > 0) {
            // 如果向下移動失敗，固定方塊
            this.placePiece();
        }
    }

    rotatePiece() {
        const rotated = this.rotateMatrix(this.currentPiece.shape);
        const newPiece = {
            ...this.currentPiece,
            shape: rotated
        };

        if (!this.isCollision(newPiece)) {
            this.currentPiece.shape = rotated;
            this.draw();
        }
    }

    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = Array(cols).fill().map(() => Array(rows).fill(0));

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                rotated[j][rows - 1 - i] = matrix[i][j];
            }
        }

        return rotated;
    }

    hardDrop() {
        while (!this.isCollision({ ...this.currentPiece, y: this.currentPiece.y + 1 })) {
            this.currentPiece.y++;
        }
        this.placePiece();
    }

    holdCurrentPiece() {
        if (!this.canHold) return;

        if (this.holdPiece === null) {
            this.holdPiece = {
                type: this.currentPiece.type,
                shape: TETROMINOS[this.currentPiece.type]
            };
            this.spawnPiece();
        } else {
            const temp = this.holdPiece;
            this.holdPiece = {
                type: this.currentPiece.type,
                shape: TETROMINOS[this.currentPiece.type]
            };
            this.currentPiece = {
                ...temp,
                x: Math.floor(GAME_CONFIG.COLS / 2) - Math.floor(temp.shape[0].length / 2),
                y: 0
            };
        }

        this.canHold = false;
        this.drawHoldPiece();
        this.draw();
    }

    isCollision(piece) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const newX = piece.x + x;
                    const newY = piece.y + y;

                    if (newX < 0 || newX >= GAME_CONFIG.COLS ||
                        newY >= GAME_CONFIG.ROWS ||
                        (newY >= 0 && this.board[newY][newX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    placePiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.type;
                    }
                }
            }
        }

        this.clearLines();
        this.spawnPiece();
        this.draw();
    }

    clearLines() {
        let linesCleared = 0;

        for (let y = GAME_CONFIG.ROWS - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(GAME_CONFIG.COLS).fill(0));
                linesCleared++;
                y++; // 重新檢查同一行
            }
        }

        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += this.calculateScore(linesCleared);
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
            this.updateScore();
        }
    }

    calculateScore(lines) {
        const baseScore = [0, 100, 300, 500, 800];
        return baseScore[lines] * this.level;
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }

    cheatClearBottomLine() {
        if (!this.gameRunning || this.gamePaused) return;

        // 顯示T字動畫
        this.showCheatAnimation();

        // 找到最下面有方塊的行
        let bottomLine = -1;
        for (let y = GAME_CONFIG.ROWS - 1; y >= 0; y--) {
            if (this.board[y].some(cell => cell !== 0)) {
                bottomLine = y;
                break;
            }
        }

        if (bottomLine >= 0) {
            // 消除最下面一行
            this.board.splice(bottomLine, 1);
            this.board.unshift(Array(GAME_CONFIG.COLS).fill(0));

            // 給予作弊分數
            this.lines += 1;
            this.score += 150 * this.level; // 作弊獲得的分數
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
            this.updateScore();

            this.draw();
        }
    }

    showCheatAnimation() {
        // 創建T字動畫元素
        const tElement = document.createElement('div');
        tElement.textContent = 'T';
        tElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 120px;
            font-weight: bold;
            color: #ff6b6b;
            text-shadow: 0 0 30px #ff6b6b, 0 0 60px #ff6b6b;
            z-index: 9999;
            pointer-events: none;
            opacity: 0;
            animation: cheatAnimation 1.5s ease-out forwards;
        `;

        // 添加CSS動畫
        if (!document.getElementById('cheatAnimationStyle')) {
            const style = document.createElement('style');
            style.id = 'cheatAnimationStyle';
            style.textContent = `
                @keyframes cheatAnimation {
                    0% {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.5) rotate(-180deg);
                    }
                    50% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1.2) rotate(0deg);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(1.5) rotate(180deg);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(tElement);

        // 1.5秒後移除元素
        setTimeout(() => {
            document.body.removeChild(tElement);
        }, 1500);
    }

    // 計算幽靈方塊的位置（方塊落下後的最終位置）
    getGhostPiecePosition() {
        if (!this.currentPiece) return null;

        // 創建一個副本，避免修改原始方塊
        const ghostPiece = {
            ...this.currentPiece,
            y: this.currentPiece.y
        };

        // 持續下移直到碰撞
        while (true) {
            const nextGhostPiece = {
                ...ghostPiece,
                y: ghostPiece.y + 1
            };
            
            if (this.isCollision(nextGhostPiece)) {
                break;
            }
            
            ghostPiece.y++;
        }

        return ghostPiece;
    }

    // 繪製幽靈方塊（半透明預覽）
    drawGhostPiece() {
        const ghostPiece = this.getGhostPiecePosition();
        if (!ghostPiece || ghostPiece.y === this.currentPiece.y) {
            return; // 如果幽靈方塊和當前方塊位置相同，就不繪製
        }

        // 繪製幽靈方塊
        for (let y = 0; y < ghostPiece.shape.length; y++) {
            for (let x = 0; x < ghostPiece.shape[y].length; x++) {
                if (ghostPiece.shape[y][x]) {
                    this.drawGhostBlock(
                        ghostPiece.x + x,
                        ghostPiece.y + y,
                        GAME_CONFIG.COLORS[ghostPiece.type]
                    );
                }
            }
        }
    }

    // 繪製幽靈方塊的單個方塊（增強顯眼度）
    drawGhostBlock(x, y, color) {
        const pixelX = x * GAME_CONFIG.BLOCK_SIZE;
        const pixelY = y * GAME_CONFIG.BLOCK_SIZE;

        // 保存當前狀態
        const oldAlpha = this.ctx.globalAlpha;

        // 1. 繪製半透明填充背景
        this.ctx.globalAlpha = 0.15;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(pixelX + 2, pixelY + 2, 
                         GAME_CONFIG.BLOCK_SIZE - 4, 
                         GAME_CONFIG.BLOCK_SIZE - 4);

        // 2. 繪製較粗的外邊框
        this.ctx.globalAlpha = 0.8;
        this.ctx.strokeStyle = this.lightenColor(color, 30);
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(pixelX + 1, pixelY + 1, 
                           GAME_CONFIG.BLOCK_SIZE - 2, 
                           GAME_CONFIG.BLOCK_SIZE - 2);

        // 3. 繪製內部邊框
        this.ctx.globalAlpha = 0.6;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(pixelX + 3, pixelY + 3, 
                           GAME_CONFIG.BLOCK_SIZE - 6, 
                           GAME_CONFIG.BLOCK_SIZE - 6);

        // 4. 繪製對角線
        this.ctx.globalAlpha = 0.4;
        this.ctx.strokeStyle = this.lightenColor(color, 50);
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        // 左上到右下的對角線
        this.ctx.moveTo(pixelX + 4, pixelY + 4);
        this.ctx.lineTo(pixelX + GAME_CONFIG.BLOCK_SIZE - 4, pixelY + GAME_CONFIG.BLOCK_SIZE - 4);
        // 右上到左下的對角線
        this.ctx.moveTo(pixelX + GAME_CONFIG.BLOCK_SIZE - 4, pixelY + 4);
        this.ctx.lineTo(pixelX + 4, pixelY + GAME_CONFIG.BLOCK_SIZE - 4);
        this.ctx.stroke();

        // 5. 添加閃爍效果的中心點
        this.ctx.globalAlpha = 0.7;
        this.ctx.fillStyle = '#ffffff';
        const centerX = pixelX + GAME_CONFIG.BLOCK_SIZE / 2;
        const centerY = pixelY + GAME_CONFIG.BLOCK_SIZE / 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
        this.ctx.fill();

        // 恢復透明度
        this.ctx.globalAlpha = oldAlpha;
    }

    draw() {
        // 清空畫布
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 繪製遊戲板
        this.drawBoard();

        // 繪製幽靈方塊（在當前方塊之前繪製）
        if (this.currentPiece && this.gameRunning) {
            this.drawGhostPiece();
        }

        // 繪製當前方塊
        if (this.currentPiece) {
            this.drawPiece(this.currentPiece, this.ctx);
        }

        // 繪製網格線
        this.drawGrid();
    }

    drawBoard() {
        for (let y = 0; y < GAME_CONFIG.ROWS; y++) {
            for (let x = 0; x < GAME_CONFIG.COLS; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, GAME_CONFIG.COLORS[this.board[y][x]], this.ctx);
                }
            }
        }
    }

    drawPiece(piece, context) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    this.drawBlock(
                        piece.x + x,
                        piece.y + y,
                        GAME_CONFIG.COLORS[piece.type],
                        context
                    );
                }
            }
        }
    }

    drawBlock(x, y, color, context) {
        const pixelX = x * GAME_CONFIG.BLOCK_SIZE;
        const pixelY = y * GAME_CONFIG.BLOCK_SIZE;

        // 主要方塊
        context.fillStyle = color;
        context.fillRect(pixelX, pixelY, GAME_CONFIG.BLOCK_SIZE, GAME_CONFIG.BLOCK_SIZE);

        // 3D效果邊框
        context.fillStyle = this.lightenColor(color, 20);
        context.fillRect(pixelX, pixelY, GAME_CONFIG.BLOCK_SIZE, 2);
        context.fillRect(pixelX, pixelY, 2, GAME_CONFIG.BLOCK_SIZE);

        context.fillStyle = this.darkenColor(color, 20);
        context.fillRect(pixelX, pixelY + GAME_CONFIG.BLOCK_SIZE - 2, GAME_CONFIG.BLOCK_SIZE, 2);
        context.fillRect(pixelX + GAME_CONFIG.BLOCK_SIZE - 2, pixelY, 2, GAME_CONFIG.BLOCK_SIZE);

        // 邊框
        context.strokeStyle = '#333';
        context.lineWidth = 1;
        context.strokeRect(pixelX, pixelY, GAME_CONFIG.BLOCK_SIZE, GAME_CONFIG.BLOCK_SIZE);
    }

    drawGrid() {
        // 繪製垂直線（列）
        this.ctx.strokeStyle = '#555';
        this.ctx.lineWidth = 1;

        for (let x = 0; x <= GAME_CONFIG.COLS; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * GAME_CONFIG.BLOCK_SIZE, 0);
            this.ctx.lineTo(x * GAME_CONFIG.BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }

        // 繪製水平線（行）- 讓行線更明顯
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 1;

        for (let y = 0; y <= GAME_CONFIG.ROWS; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * GAME_CONFIG.BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, y * GAME_CONFIG.BLOCK_SIZE);
            this.ctx.stroke();
        }

        // 每5行加強線條，讓計數更容易
        this.ctx.strokeStyle = '#888';
        this.ctx.lineWidth = 1.5;

        for (let y = 0; y <= GAME_CONFIG.ROWS; y += 5) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * GAME_CONFIG.BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, y * GAME_CONFIG.BLOCK_SIZE);
            this.ctx.stroke();
        }
    }

    drawHoldPiece() {
        this.holdCtx.fillStyle = '#111';
        this.holdCtx.fillRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);

        if (this.holdPiece) {
            const blockSize = 20;
            const offsetX = (this.holdCanvas.width - this.holdPiece.shape[0].length * blockSize) / 2;
            const offsetY = (this.holdCanvas.height - this.holdPiece.shape.length * blockSize) / 2;

            for (let y = 0; y < this.holdPiece.shape.length; y++) {
                for (let x = 0; x < this.holdPiece.shape[y].length; x++) {
                    if (this.holdPiece.shape[y][x]) {
                        this.holdCtx.fillStyle = GAME_CONFIG.COLORS[this.holdPiece.type];
                        this.holdCtx.fillRect(
                            offsetX + x * blockSize,
                            offsetY + y * blockSize,
                            blockSize,
                            blockSize
                        );
                        this.holdCtx.strokeStyle = '#333';
                        this.holdCtx.strokeRect(
                            offsetX + x * blockSize,
                            offsetY + y * blockSize,
                            blockSize,
                            blockSize
                        );
                    }
                }
            }
        }
    }

    drawNextPiece() {
        this.nextCtx.fillStyle = '#111';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        if (this.nextPiece) {
            const blockSize = 20;
            const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * blockSize) / 2;
            const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * blockSize) / 2;

            for (let y = 0; y < this.nextPiece.shape.length; y++) {
                for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                    if (this.nextPiece.shape[y][x]) {
                        this.nextCtx.fillStyle = GAME_CONFIG.COLORS[this.nextPiece.type];
                        this.nextCtx.fillRect(
                            offsetX + x * blockSize,
                            offsetY + y * blockSize,
                            blockSize,
                            blockSize
                        );
                        this.nextCtx.strokeStyle = '#333';
                        this.nextCtx.strokeRect(
                            offsetX + x * blockSize,
                            offsetY + y * blockSize,
                            blockSize,
                            blockSize
                        );
                    }
                }
            }
        }
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
            (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
            (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
    }

    startGame() {
        if (!this.gameRunning) {
            this.gameRunning = true;
            this.gamePaused = false;
            document.getElementById('startBtn').disabled = true;
            document.getElementById('pauseBtn').disabled = false;
            this.gameLoop();
        }
    }

    togglePause() {
        if (this.gameRunning) {
            this.gamePaused = !this.gamePaused;
            document.getElementById('pauseBtn').textContent = this.gamePaused ? '繼續' : '暫停';
            if (!this.gamePaused) {
                this.gameLoop();
            }
        }
    }

    restartGame() {
        this.board = Array(GAME_CONFIG.ROWS).fill().map(() => Array(GAME_CONFIG.COLS).fill(0));
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.canHold = true;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.dropTime = 0;
        this.dropInterval = 1000;

        this.generateNextPiece();
        this.spawnPiece();
        this.updateScore();
        this.draw();
        this.drawHoldPiece();

        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').textContent = '暫停';
        document.getElementById('gameOver').style.display = 'none';
    }

    gameOver() {
        this.gameRunning = false;
        document.getElementById('finalScore').textContent = this.score;

        // 檢查是否為新的個人最高分並保存分數
        if (window.firebaseManager && window.firebaseManager.currentUser) {
            // 保存分數到資料庫
            window.firebaseManager.saveScore(this.score);

            // 檢查是否為新的最高分
            if (window.firebaseManager.checkIfNewHighScore(this.score)) {
                document.getElementById('newHighScore').style.display = 'block';
            } else {
                document.getElementById('newHighScore').style.display = 'none';
            }
        } else {
            document.getElementById('newHighScore').style.display = 'none';
        }

        document.getElementById('gameOver').style.display = 'flex';
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
    }

    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;

        const now = Date.now();
        if (now - this.dropTime > this.dropInterval) {
            this.movePiece(0, 1);
            this.dropTime = now;
        }

        requestAnimationFrame(() => this.gameLoop());
    }
}

// 初始化遊戲
let game;
window.addEventListener('load', () => {
    game = new TetrisGame();
});
