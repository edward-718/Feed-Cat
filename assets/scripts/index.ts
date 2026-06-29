import { GameManager, GameState } from './GameManager';
import { EffectManager } from './EffectManager';
import { ProgressBar } from './ui/ProgressBar';
import { CatInfoPanel } from './ui/CatInfoPanel';
import { ContributionBubble } from './ui/ContributionBubble';
import { GiftConfigData } from './GiftConfig';

export class GameApp {
    private static _instance: GameApp | null = null;
    private _progressBar: ProgressBar | null = null;
    private _catInfoPanel: CatInfoPanel | null = null;
    private _contributionBubble: ContributionBubble | null = null;
    private _catDisplayElement: HTMLElement | null = null;
    private _tipElement: HTMLElement | null = null;
    private _controlPanel: HTMLElement | null = null;
    private _isRunning: boolean = false;

    static get instance(): GameApp {
        if (!this._instance) {
            this._instance = new GameApp();
        }
        return this._instance;
    }

    async init(configData?: GiftConfigData): Promise<void> {
        console.log('=== 猫咪喂食游戏启动 ===');

        await GameManager.instance.init(configData);
        EffectManager.instance.init();

        this._createUI();
        this._createDebugControls();

        this._isRunning = true;
        GameManager.instance.startGame();

        console.log('=== 游戏启动完成 ===');
        console.log('使用下方控制面板测试礼物效果');
    }

    private _createUI(): void {
        const gameContainer = document.getElementById('game-container');
        if (!gameContainer) {
            console.warn('找不到 game-container，使用 body 作为容器');
            document.body.id = 'game-container';
        }

        const container = document.getElementById('game-container') || document.body;
        container.style.cssText = `
            position: relative;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            overflow: hidden;
            font-family: 'Microsoft YaHei', sans-serif;
            margin: 0;
            padding: 0;
        `;

        this._catDisplayElement = document.createElement('div');
        this._catDisplayElement.id = 'cat-display';
        this._catDisplayElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -60%);
            width: 300px;
            height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 120px;
            transition: transform 0.3s ease;
            animation: catIdle 3s ease-in-out infinite;
        `;
        this._catDisplayElement.textContent = '🐱';
        container.appendChild(this._catDisplayElement);

        const catInfoContainer = document.createElement('div');
        catInfoContainer.id = 'cat-info-container';
        catInfoContainer.style.cssText = `
            position: absolute;
            top: 30px;
            left: 50%;
            transform: translateX(-50%);
            width: 320px;
            z-index: 50;
        `;
        container.appendChild(catInfoContainer);
        this._catInfoPanel = new CatInfoPanel('cat-info-container');

        const progressContainer = document.createElement('div');
        progressContainer.id = 'progress-container';
        progressContainer.style.cssText = `
            position: absolute;
            bottom: 180px;
            left: 50%;
            transform: translateX(-50%);
            width: 80%;
            max-width: 500px;
            z-index: 50;
        `;
        container.appendChild(progressContainer);
        this._progressBar = new ProgressBar('progress-container');

        this._contributionBubble = new ContributionBubble('game-container');

        this._tipElement = document.createElement('div');
        this._tipElement.className = 'game-tips';
        this._tipElement.style.cssText = `
            position: absolute;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
            line-height: 1.8;
            z-index: 50;
        `;
        this._tipElement.innerHTML = `
            <div>🎁 送 <span style="color:#00ffff">能力药丸</span> 选帅猫 | 
            <span style="color:#ffb6c1">甜甜圈</span> 选可怜猫 | 
            <span style="color:#00ff00">棒棒糖</span> 选淘气猫</div>
            <div style="margin-top:5px;opacity:0.7;">送任何礼物都能涨进度条哦~</div>
        `;
        container.appendChild(this._tipElement);

        this._addAnimations();
        this._registerCatAnimation();
    }

    private _addAnimations(): void {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes catIdle {
                0%, 100% { transform: translate(-50%, -60%) scale(1); }
                50% { transform: translate(-50%, -62%) scale(1.02); }
            }
            @keyframes catExcited {
                0%, 100% { transform: translate(-50%, -60%) scale(1) rotate(0deg); }
                25% { transform: translate(-50%, -65%) scale(1.05) rotate(-3deg); }
                75% { transform: translate(-50%, -65%) scale(1.05) rotate(3deg); }
            }
            @keyframes catEating {
                0%, 100% { transform: translate(-50%, -60%) scale(1); }
                50% { transform: translate(-50%, -55%) scale(1.1); }
            }
            @keyframes catEvolved {
                0% { transform: translate(-50%, -60%) scale(1); filter: brightness(1); }
                50% { transform: translate(-50%, -70%) scale(1.3); filter: brightness(2) hue-rotate(180deg); }
                100% { transform: translate(-50%, -60%) scale(1); filter: brightness(1); }
            }
            @keyframes sparkle {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(200%); }
            }
        `;
        document.head.appendChild(style);
    }

    private _registerCatAnimation(): void {
        const { EventManager, GameEventType } = require('./GameEvents');
        
        EventManager.instance.on(GameEventType.CAT_STATE_CHANGED, (data: any) => {
            this._updateCatAnimation(data.newState);
        });

        EventManager.instance.on(GameEventType.CAT_SELECTED, (data: any) => {
            this._updateCatAppearance(data.catId);
        });

        this._updateCatAppearance('pitiful_cat');
    }

    private _updateCatAnimation(state: string): void {
        if (!this._catDisplayElement) return;

        this._catDisplayElement.style.animation = 'none';
        
        requestAnimationFrame(() => {
            if (this._catDisplayElement) {
                switch (state) {
                    case 'idle':
                        this._catDisplayElement.style.animation = 'catIdle 3s ease-in-out infinite';
                        break;
                    case 'excited':
                        this._catDisplayElement.style.animation = 'catExcited 0.5s ease-in-out infinite';
                        break;
                    case 'eating':
                        this._catDisplayElement.style.animation = 'catEating 0.3s ease-in-out infinite';
                        break;
                    case 'evolved':
                        this._catDisplayElement.style.animation = 'catEvolved 1s ease-in-out 3';
                        break;
                    default:
                        this._catDisplayElement.style.animation = 'catIdle 3s ease-in-out infinite';
                }
            }
        });
    }

    private _updateCatAppearance(catId: string): void {
        if (!this._catDisplayElement) return;

        let emoji = '🐱';
        let filter = '';

        switch (catId) {
            case 'cyber_cat':
                emoji = '😺';
                filter = 'hue-rotate(180deg) saturate(1.5) brightness(1.2)';
                break;
            case 'pitiful_cat':
                emoji = '😿';
                filter = 'saturate(0.8) brightness(0.9)';
                break;
            case 'pixel_cat':
                emoji = '😸';
                filter = 'saturate(2) contrast(1.2)';
                break;
        }

        this._catDisplayElement.textContent = emoji;
        this._catDisplayElement.style.filter = filter;
    }

    private _createDebugControls(): void {
        const container = document.getElementById('game-container') || document.body;

        this._controlPanel = document.createElement('div');
        this._controlPanel.className = 'debug-controls';
        this._controlPanel.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            padding: 15px 20px;
            border-radius: 15px;
            color: white;
            z-index: 200;
            font-family: 'Microsoft YaHei', sans-serif;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;

        const title = document.createElement('div');
        title.style.cssText = `
            text-align: center;
            margin-bottom: 10px;
            font-weight: bold;
            font-size: 14px;
            color: #ffd700;
        `;
        title.textContent = '🎮 测试控制面板';
        this._controlPanel.appendChild(title);

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
            max-width: 400px;
        `;

        const gifts = [
            { name: '仙女棒', cat: null, color: '#ff6b6b' },
            { name: '棒棒糖', cat: 'pixel_cat', color: '#00ff00' },
            { name: '大啤酒', cat: null, color: '#feca57' },
            { name: '人气票', cat: null, color: '#48dbfb' },
            { name: '仙女棒花束', cat: null, color: '#ff9ff3' },
            { name: '能力药丸', cat: 'cyber_cat', color: '#00ffff' },
            { name: '甜甜圈', cat: 'pitiful_cat', color: '#ffb6c1' },
            { name: '礼花筒', cat: null, color: '#ffd700' }
        ];

        for (const gift of gifts) {
            const btn = document.createElement('button');
            btn.textContent = gift.name;
            btn.style.cssText = `
                padding: 8px 12px;
                border: none;
                border-radius: 8px;
                background: ${gift.color};
                color: white;
                font-size: 12px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s ease;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
            `;
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'scale(1.05)';
                btn.style.boxShadow = `0 0 10px ${gift.color}`;
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = 'none';
            });
            btn.addEventListener('click', () => {
                this.simulateGift(gift.name);
            });
            buttonContainer.appendChild(btn);
        }

        this._controlPanel.appendChild(buttonContainer);

        const resetBtn = document.createElement('button');
        resetBtn.textContent = '🔄 重置游戏';
        resetBtn.style.cssText = `
            display: block;
            margin: 12px auto 0;
            padding: 8px 20px;
            border: none;
            border-radius: 8px;
            background: #e74c3c;
            color: white;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        resetBtn.addEventListener('click', () => {
            this.resetGame();
        });
        this._controlPanel.appendChild(resetBtn);

        container.appendChild(this._controlPanel);
    }

    simulateGift(giftName: string, userName: string = '测试用户'): void {
        if (!this._isRunning) return;
        GameManager.instance.simulateGift(giftName, userName);
    }

    resetGame(): void {
        GameManager.instance.resetGame();
        GameManager.instance.startGame();
        console.log('游戏已重置');
    }

    get isRunning(): boolean {
        return this._isRunning;
    }
}

if (typeof window !== 'undefined') {
    (window as any).GameApp = GameApp;
    (window as any).GameManager = GameManager;

    window.addEventListener('DOMContentLoaded', async () => {
        try {
            await GameApp.instance.init();
        } catch (e) {
            console.error('游戏初始化失败:', e);
        }
    });
}

export { GameManager, GameState };
