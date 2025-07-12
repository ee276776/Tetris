// Firebase 認證和資料庫管理
class FirebaseManager {
    constructor() {
        this.auth = null;
        this.db = null;
        this.currentUser = null;
        this.init();
    }

    async init() {
        // 等待 Firebase 初始化
        const checkFirebase = () => {
            if (window.firebaseAuth && window.firebaseDb) {
                this.auth = window.firebaseAuth;
                this.db = window.firebaseDb;
                this.setupAuthListener();
                this.setupEventListeners();
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    }

    setupAuthListener() {
        // 監聽認證狀態變化
        this.auth.onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.showUserInfo(user.email);
                this.loadUserHighScores();
                this.loadGlobalHighScores();
                this.updateLastLoginTime();
            } else {
                this.currentUser = null;
                this.showAuthForm();
                this.hideUserInfo();
            }
        });
    }

    setupEventListeners() {
        // 登入按鈕事件
        document.getElementById('loginBtn').addEventListener('click', () => {
            this.handleLogin();
        });

        // 註冊按鈕事件
        document.getElementById('registerBtn').addEventListener('click', () => {
            this.handleRegister();
        });

        // 登出按鈕事件
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
    }

    async handleAuth() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            this.showError('請填寫完整的電子郵件和密碼');
            return;
        }

        try {
            // 這個函數現在不會被調用，保留兼容性
        } catch (error) {
            this.showError(error.message);
        }
    }

    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            this.showError('請填寫完整的電子郵件和密碼');
            return;
        }

        try {
            await this.login(email, password);
            this.clearForm();
            this.clearError();
        } catch (error) {
            console.error('登入錯誤:', error);
            this.showError(this.getErrorMessage(error));
        }
    }

    async handleRegister() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            this.showError('請填寫完整的電子郵件和密碼');
            return;
        }

        if (password.length < 6) {
            this.showError('密碼長度至少需要 6 個字符');
            return;
        }

        try {
            await this.register(email, password);
            this.clearForm();
            this.clearError();
        } catch (error) {
            console.error('註冊錯誤:', error);
            this.showError(this.getErrorMessage(error));
        }
    }

    async login(email, password) {
        const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
        console.log('登入成功:', userCredential.user.email);
    }

    async register(email, password) {
        const { createUserWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

        // 創建用戶帳號
        const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);

        // 在 users 集合中創建用戶資料
        await setDoc(doc(this.db, 'users', email), {
            account: email,
            createTime: serverTimestamp(),
            lastLoginTime: serverTimestamp()
        });

        console.log('註冊成功:', userCredential.user.email);
    }

    async logout() {
        const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        await signOut(this.auth);
        console.log('已登出');
    }

    async updateLastLoginTime() {
        if (!this.currentUser) return;

        const { doc, updateDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

        try {
            await updateDoc(doc(this.db, 'users', this.currentUser.email), {
                lastLoginTime: serverTimestamp()
            });
        } catch (error) {
            console.error('更新登入時間失敗:', error);
        }
    }

    async saveScore(score) {
        if (!this.currentUser) {
            console.log('未登入，無法保存分數');
            return;
        }

        const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

        try {
            await addDoc(collection(this.db, 'historyScores'), {
                account: this.currentUser.email,
                score: score,
                createTime: serverTimestamp()
            });

            console.log('分數保存成功:', score);
            // 重新載入高分記錄
            this.loadUserHighScores();
        } catch (error) {
            console.error('保存分數失敗:', error);
        }
    }    async loadUserHighScores() {
        if (!this.currentUser) return;

        const { collection, query, where, orderBy, limit, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        try {
            // 先取得該用戶的所有分數記錄
            const q = query(
                collection(this.db, 'historyScores'),
                where('account', '==', this.currentUser.email)
            );
            
            const querySnapshot = await getDocs(q);
            const scores = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                scores.push({
                    score: data.score,
                    createTime: data.createTime,
                    account: data.account
                });
            });
            
            // 在客戶端排序並取前10名
            scores.sort((a, b) => b.score - a.score);
            const top10Scores = scores.slice(0, 10);
            
            this.displayPersonalHighScores(top10Scores);
            // 同時載入全域高分榜
            this.loadGlobalHighScores();
        } catch (error) {
            console.error('載入個人高分記錄失敗:', error);
        }
    }

    async loadGlobalHighScores() {
        const { collection, query, orderBy, limit, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        try {
            // 取得所有分數記錄
            const q = query(
                collection(this.db, 'historyScores')
            );
            
            const querySnapshot = await getDocs(q);
            const scores = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                scores.push({
                    score: data.score,
                    createTime: data.createTime,
                    account: data.account
                });
            });
            
            // 在客戶端排序並取前10名
            scores.sort((a, b) => b.score - a.score);
            const top10Scores = scores.slice(0, 10);
            
            this.displayGlobalHighScores(top10Scores);
        } catch (error) {
            console.error('載入全域高分榜失敗:', error);
        }
    }

    displayPersonalHighScores(scores) {
        const highScoresList = document.getElementById('highScoresList');

        if (scores.length === 0) {
            highScoresList.innerHTML = '<div class="no-scores">還沒有分數記錄</div>';
            return;
        }

        const scoresHtml = scores.map((scoreData, index) => {
            const date = scoreData.createTime ? new Date(scoreData.createTime.seconds * 1000).toLocaleDateString() : '未知';
            return `<div class="score-item">
                <span class="rank">${index + 1}.</span>
                <span class="score">${scoreData.score.toLocaleString()}</span>
                <span class="date">${date}</span>
            </div>`;
        }).join('');

        highScoresList.innerHTML = scoresHtml;
    }

    displayGlobalHighScores(scores) {
        const globalScoresList = document.getElementById('globalScoresList');

        if (!globalScoresList) {
            console.warn('找不到全域高分榜元素');
            return;
        }

        if (scores.length === 0) {
            globalScoresList.innerHTML = '<div class="no-scores">還沒有全域分數記錄</div>';
            return;
        }

        const scoresHtml = scores.map((scoreData, index) => {
            const date = scoreData.createTime ? new Date(scoreData.createTime.seconds * 1000).toLocaleDateString() : '未知';
            const displayName = scoreData.account.split('@')[0]; // 只顯示 email 的用戶名部分
            return `<div class="score-item">
                <span class="rank">${index + 1}.</span>
                <span class="player">${displayName}</span>
                <span class="score">${scoreData.score.toLocaleString()}</span>
                <span class="date">${date}</span>
            </div>`;
        }).join('');

        globalScoresList.innerHTML = scoresHtml;
    }

    checkIfNewHighScore(score) {
        // 這個方法會被遊戲調用來檢查是否是新的最高分
        const highScoresList = document.getElementById('highScoresList');
        const scoreElements = highScoresList.querySelectorAll('.score-item .score');

        if (scoreElements.length === 0) return true; // 第一個分數

        const currentHighScore = parseInt(scoreElements[0].textContent.replace(/,/g, ''));
        return score > currentHighScore;
    }

    showAuthForm() {
        document.getElementById('authFormSection').style.display = 'block';
        document.getElementById('userInfo').style.display = 'none';
    }

    hideAuthForm() {
        document.getElementById('authFormSection').style.display = 'none';
    }

    showUserInfo(email) {
        document.getElementById('userEmail').textContent = email;
        document.getElementById('userInfo').style.display = 'block';
        document.getElementById('authFormSection').style.display = 'none';
    }

    hideUserInfo() {
        document.getElementById('userInfo').style.display = 'none';
        document.getElementById('authFormSection').style.display = 'block';
        document.getElementById('highScoresList').innerHTML = '<div class="no-scores">請先登入查看記錄</div>';

        // 清空全域高分榜
        const globalScoresList = document.getElementById('globalScoresList');
        if (globalScoresList) {
            globalScoresList.innerHTML = '<div class="no-scores">請先登入查看全域排行榜</div>';
        }
    }



    clearAuthForm() {
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        this.clearError();
    }

    clearError() {
        const errorElement = document.getElementById('authError');
        if (errorElement) {
            errorElement.textContent = '';
        }
    }

    showError(message) {
        const errorElement = document.getElementById('authError');
        if (!errorElement) return;

        // 轉換 Firebase 錯誤訊息為中文
        let chineseMessage = message;
        if (message.includes('invalid-email')) {
            chineseMessage = '無效的電子郵件格式';
        } else if (message.includes('user-not-found')) {
            chineseMessage = '找不到此用戶';
        } else if (message.includes('wrong-password')) {
            chineseMessage = '密碼錯誤';
        } else if (message.includes('email-already-in-use')) {
            chineseMessage = '此電子郵件已被使用';
        } else if (message.includes('weak-password')) {
            chineseMessage = '密碼強度不足，至少需要6個字符';
        } else if (message.includes('too-many-requests')) {
            chineseMessage = '嘗試次數過多，請稍後再試';
        }

        errorElement.textContent = chineseMessage;
    }
}

// 創建 Firebase 管理器實例
let firebaseManager;
window.addEventListener('load', () => {
    firebaseManager = new FirebaseManager();
    window.firebaseManager = firebaseManager; // 讓遊戲可以訪問
});
