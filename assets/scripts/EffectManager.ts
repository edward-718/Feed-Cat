import { CatId } from './CatData';
import { EventManager, GameEventType } from './GameEvents';

export enum EffectType {
    FULL_SCREEN_CYBER = 'full_screen_cyber',
    FULL_SCREEN_PITIFUL = 'full_screen_pitiful',
    FULL_SCREEN_PIXEL = 'full_screen_pixel',
    CONTRIBUTION_BUBBLE = 'contribution_bubble',
    PROGRESS_SPARKLE = 'progress_sparkle',
    LEVEL_UP = 'level_up'
}

export interface EffectOptions {
    duration?: number;
    delay?: number;
    repeat?: number;
}

export interface BubbleData {
    id: string;
    userName: string;
    giftName: string;
    progressValue: number;
    createdAt: number;
}

export class EffectManager {
    private static _instance: EffectManager | null = null;
    private _activeBubbles: Map<string, BubbleData> = new Map();
    private _maxBubbles: number = 10;
    private _bubbleLifetime: number = 3000;
    private _isInitialized: boolean = false;

    static get instance(): EffectManager {
        if (!this._instance) {
            this._instance = new EffectManager();
        }
        return this._instance;
    }

    init(): void {
        if (this._isInitialized) return;

        this._registerEvents();
        this._isInitialized = true;
        console.log('EffectManager 初始化完成');
    }

    private _registerEvents(): void {
        EventManager.instance.on(GameEventType.EATING_START, () => {
            this._playEatingEffect();
        });

        EventManager.instance.on(GameEventType.EVOLUTION_START, () => {
            this._playEvolutionEffect();
        });

        EventManager.instance.on(GameEventType.CONTRIBUTION_BUBBLE, (data: any) => {
            this._addContributionBubble(data.userName, data.giftName, data.progressValue);
        });

        EventManager.instance.on(GameEventType.CAT_LEVEL_UP, (data: any) => {
            this._playLevelUpEffect(data);
        });
    }

    private _playEatingEffect(): void {
        const { CatManager } = require('./CatManager');
        const catId = CatManager.instance.currentCatId;
        this.playFullScreenEffect(catId);
    }

    private _playEvolutionEffect(): void {
        const { CatManager } = require('./CatManager');
        const catId = CatManager.instance.currentCatId;
        this.playFullScreenEffect(catId, { duration: 5000 });
    }

    private _playLevelUpEffect(data: any): void {
        console.log(`播放升级特效: Lv.${data.oldLevel} -> Lv.${data.newLevel}`);
        EventManager.instance.emit(GameEventType.FULL_SCREEN_EFFECT, {
            type: EffectType.LEVEL_UP,
            catId: data.catId,
            oldLevel: data.oldLevel,
            newLevel: data.newLevel
        });
    }

    playFullScreenEffect(catId: CatId, options?: EffectOptions): void {
        let effectType: EffectType;

        switch (catId) {
            case CatId.CYBER_CAT:
                effectType = EffectType.FULL_SCREEN_CYBER;
                break;
            case CatId.PITIFUL_CAT:
                effectType = EffectType.FULL_SCREEN_PITIFUL;
                break;
            case CatId.PIXEL_CAT:
                effectType = EffectType.FULL_SCREEN_PIXEL;
                break;
            default:
                effectType = EffectType.FULL_SCREEN_PITIFUL;
        }

        const duration = options?.duration ?? 4000;

        EventManager.instance.emit(GameEventType.FULL_SCREEN_EFFECT, {
            type: effectType,
            catId: catId,
            duration: duration
        });

        console.log(`播放全屏特效: ${effectType}`);
    }

    private _addContributionBubble(userName: string, giftName: string, progressValue: number): void {
        const bubbleId = `bubble_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const bubble: BubbleData = {
            id: bubbleId,
            userName: userName,
            giftName: giftName,
            progressValue: progressValue,
            createdAt: Date.now()
        };

        this._activeBubbles.set(bubbleId, bubble);

        if (this._activeBubbles.size > this._maxBubbles) {
            const oldestKey = this._activeBubbles.keys().next().value;
            if (oldestKey) {
                this._activeBubbles.delete(oldestKey);
            }
        }

        setTimeout(() => {
            this._activeBubbles.delete(bubbleId);
        }, this._bubbleLifetime);
    }

    getActiveBubbles(): BubbleData[] {
        return Array.from(this._activeBubbles.values()).sort(
            (a, b) => b.createdAt - a.createdAt
        );
    }

    playProgressSparkle(): void {
        EventManager.instance.emit(GameEventType.FULL_SCREEN_EFFECT, {
            type: EffectType.PROGRESS_SPARKLE
        });
    }

    getEffectForCat(catId: CatId): {
        idleEffect: string;
        excitedEffect: string;
        eatingEffect: string;
        evolvedEffect: string;
        particleColor: string;
    } {
        switch (catId) {
            case CatId.CYBER_CAT:
                return {
                    idleEffect: 'cyber_idle_glow',
                    excitedEffect: 'cyber_excited_pulse',
                    eatingEffect: 'cyber_eating_neon',
                    evolvedEffect: 'cyber_evolution',
                    particleColor: '#00ffff'
                };
            case CatId.PITIFUL_CAT:
                return {
                    idleEffect: 'pitiful_idle_hearts',
                    excitedEffect: 'pitiful_excited_sparkle',
                    eatingEffect: 'pitiful_eating_love',
                    evolvedEffect: 'pitiful_evolution',
                    particleColor: '#ffb6c1'
                };
            case CatId.PIXEL_CAT:
                return {
                    idleEffect: 'pixel_idle_pixels',
                    excitedEffect: 'pixel_excited_bounce',
                    eatingEffect: 'pixel_eating_explosion',
                    evolvedEffect: 'pixel_evolution',
                    particleColor: '#00ff00'
                };
            default:
                return {
                    idleEffect: 'default_idle',
                    excitedEffect: 'default_excited',
                    eatingEffect: 'default_eating',
                    evolvedEffect: 'default_evolved',
                    particleColor: '#ffffff'
                };
        }
    }

    get isInitialized(): boolean {
        return this._isInitialized;
    }

    reset(): void {
        this._activeBubbles.clear();
        this._isInitialized = false;
    }
}
