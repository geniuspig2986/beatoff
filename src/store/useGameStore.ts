import { create } from 'zustand';

export type GameState = 'IDLE' | 'GET_READY' | 'RECORDING' | 'EVALUATING' | 'RESULT';

export type RecordedEvent = {
    timestamp: number;
    limb: string; // e.g., 'leftWrist', 'rightAnkle'
};

interface GameStore {
    // Config
    gameMode: 'SINGLE' | 'COOP';
    setGameMode: (mode: 'SINGLE' | 'COOP') => void;
    activeTheme: string;
    setActiveTheme: (theme: string) => void;

    // Twitter Integration
    twitterPermission: boolean | null;
    setTwitterPermission: (permission: boolean | null) => void;
    recordedVideoBlob: Blob | null;
    setRecordedVideoBlob: (blob: Blob | null) => void;

    // Active State
    gameState: GameState;
    setGameState: (state: GameState) => void;
    isModelLoaded: boolean;
    setIsModelLoaded: (loaded: boolean) => void;
    currentPlayer: 1 | 2;
    setCurrentPlayer: (player: 1 | 2) => void;

    // 60 seconds is the default length as requested, easy to change for testing
    timeLeft: number;
    setTimeLeft: (time: number) => void;
    decrementTime: () => void;

    // Recorded Data
    player1Sequence: RecordedEvent[];
    player2Sequence: RecordedEvent[];
    addEvent: (event: RecordedEvent) => void;

    // Results
    judgeFeedback: {
        roast: string;
        scoreP1: number;
        scoreP2?: number;
        winner?: 1 | 2 | 'TIE';
        audioUrl?: string; // The ElevenLabs TTS output url
    } | null;
    setJudgeFeedback: (feedback: GameStore['judgeFeedback']) => void;

    // Actions
    resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
    gameMode: 'COOP',
    setGameMode: (mode) => set({ gameMode: mode }),
    activeTheme: 'Ragtime Ruckus',
    setActiveTheme: (theme) => set({ activeTheme: theme }),

    twitterPermission: null,
    setTwitterPermission: (permission) => set({ twitterPermission: permission }),

    recordedVideoBlob: null,
    setRecordedVideoBlob: (blob) => set({ recordedVideoBlob: blob }),

    gameState: 'IDLE',
    setGameState: (state) => set({ gameState: state }),

    isModelLoaded: false,
    setIsModelLoaded: (loaded) => set({ isModelLoaded: loaded }),

    currentPlayer: 1,
    setCurrentPlayer: (player) => set({ currentPlayer: player }),

    timeLeft: 60,
    setTimeLeft: (time) => set({ timeLeft: time }),
    decrementTime: () => set((state) => ({ timeLeft: Math.max(0, state.timeLeft - 1) })),

    player1Sequence: [],
    player2Sequence: [],
    addEvent: (event) => set((state) => {
        if (state.gameState !== 'RECORDING') return state;
        if (state.currentPlayer === 1) {
            return { player1Sequence: [...state.player1Sequence, event] };
        } else {
            return { player2Sequence: [...state.player2Sequence, event] };
        }
    }),

    judgeFeedback: null,
    setJudgeFeedback: (feedback) => set({ judgeFeedback: feedback }),

    resetGame: () => set({
        gameState: 'IDLE',
        currentPlayer: 1,
        timeLeft: 60,
        player1Sequence: [],
        player2Sequence: [],
        judgeFeedback: null,
        twitterPermission: null,
        recordedVideoBlob: null,
    }),
}));
