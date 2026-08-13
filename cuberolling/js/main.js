import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CubeModel } from './cube.js';
import { CubeController } from './controls.js';
import { ParticleSystem } from './particles.js';
import { sounds } from './audio.js';

class GameApp {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.currentSize = 3; // Default 3x3
        this.moveCount = 0;
        
        this.timer = null;
        this.timerSeconds = 0;
        this.timerRunning = false;
        this.hasScrambled = false;

        this.initThree();
        this.initGame();
        this.initUI();
        this.initShortcuts();

        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    initThree() {
        // Scene setup
        this.scene = new THREE.Scene();

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        this.updateCameraDistance();

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.container.appendChild(this.renderer.domElement);

        // OrbitControls setup
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 0.8;
        this.controls.enableZoom = true;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 15;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
        this.scene.add(ambientLight);

        const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight1.position.set(5, 10, 7);
        this.scene.add(dirLight1);

        const dirLight2 = new THREE.DirectionalLight(0x60a5fa, 0.6);
        dirLight2.position.set(-5, -5, -5);
        this.scene.add(dirLight2);

        // Particle System
        this.particles = new ParticleSystem(this.scene);

        // Resize Listener
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    updateCameraDistance() {
        const dist = this.currentSize === 2 ? 6.5 : 8.5;
        this.camera.position.set(dist * 0.7, dist * 0.6, dist);
        this.camera.lookAt(0, 0, 0);
    }

    initGame() {
        if (this.cube) {
            this.cube.clear();
        }

        this.cube = new CubeModel(this.scene, this.currentSize);
        this.updateCameraDistance();

        this.cubeController = new CubeController(
            this.camera,
            this.renderer.domElement,
            this.cube,
            this.controls,
            () => this.onMovePerformed()
        );

        this.resetStats();
    }

    onMovePerformed() {
        this.moveCount++;
        this.updateStatsUI();

        if (!this.timerRunning && this.hasScrambled) {
            this.startTimer();
        }

        // Check if cube is solved after move
        setTimeout(() => {
            if (this.hasScrambled && this.cube.isSolved()) {
                this.onGameWin();
            }
        }, 300);
    }

    resetStats() {
        this.stopTimer();
        this.timerSeconds = 0;
        this.moveCount = 0;
        this.hasScrambled = false;
        this.updateStatsUI();
        this.updateBestRecordUI();
    }

    startTimer() {
        if (this.timerRunning) return;
        this.timerRunning = true;
        this.timer = setInterval(() => {
            this.timerSeconds++;
            this.updateStatsUI();
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.timerRunning = false;
    }

    formatTime(sec) {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    updateStatsUI() {
        document.getElementById('timer-display').innerText = this.formatTime(this.timerSeconds);
        document.getElementById('moves-display').innerText = this.moveCount;
    }

    updateBestRecordUI() {
        const key = `cuberolling_best_${this.currentSize}x${this.currentSize}`;
        const bestSec = localStorage.getItem(key);
        const bestEl = document.getElementById('best-display');

        if (bestSec) {
            bestEl.innerText = this.formatTime(parseInt(bestSec));
        } else {
            bestEl.innerText = '--:--';
        }
    }

    saveBestRecord() {
        const key = `cuberolling_best_${this.currentSize}x${this.currentSize}`;
        const bestSec = localStorage.getItem(key);

        if (!bestSec || this.timerSeconds < parseInt(bestSec)) {
            localStorage.setItem(key, this.timerSeconds);
            this.updateBestRecordUI();
            return true; // New record
        }
        return false;
    }

    onGameWin() {
        this.stopTimer();
        sounds.playWin();
        this.particles.triggerWinConfetti();

        const isNewRecord = this.saveBestRecord();

        // Show Win Modal
        const modal = document.getElementById('win-modal');
        const titleEl = document.getElementById('win-title');
        const finalTimeEl = document.getElementById('final-time');
        const finalMovesEl = document.getElementById('final-moves');

        titleEl.innerText = isNewRecord ? '🎉 최고 기록 경신!' : '👏 큐브 완성!';
        finalTimeEl.innerText = this.formatTime(this.timerSeconds);
        finalMovesEl.innerText = this.moveCount;

        modal.classList.add('active');
    }

    initUI() {
        // Mode switch buttons (2x2 vs 3x3)
        const mode2x2Btn = document.getElementById('mode-2x2');
        const mode3x3Btn = document.getElementById('mode-3x3');

        mode2x2Btn.addEventListener('click', () => {
            if (this.currentSize === 2) return;
            sounds.playClick();
            mode2x2Btn.classList.add('active');
            mode3x3Btn.classList.remove('active');
            this.currentSize = 2;
            this.initGame();
        });

        mode3x3Btn.addEventListener('click', () => {
            if (this.currentSize === 3) return;
            sounds.playClick();
            mode3x3Btn.classList.add('active');
            mode2x2Btn.classList.remove('active');
            this.currentSize = 3;
            this.initGame();
        });

        // Toolbar buttons
        document.getElementById('btn-scramble').addEventListener('click', () => {
            sounds.playClick();
            this.resetStats();
            this.cube.scramble(this.currentSize === 2 ? 10 : 18).then(() => {
                this.hasScrambled = true;
            });
        });

        const quickToggleBtn = document.getElementById('btn-toggle-quick');
        const controlsHint = document.querySelector('.controls-hint');
        if (quickToggleBtn && controlsHint) {
            const handleToggle = (e) => {
                e.preventDefault();
                e.stopPropagation();
                sounds.playClick();
                const isVisible = controlsHint.classList.toggle('visible-mobile');
                quickToggleBtn.classList.toggle('active', isVisible);
            };
            quickToggleBtn.addEventListener('click', handleToggle);
            quickToggleBtn.addEventListener('pointerdown', (e) => e.stopPropagation());

            // Outside click/touch dismiss
            document.addEventListener('pointerdown', (e) => {
                if (controlsHint.classList.contains('visible-mobile')) {
                    if (!controlsHint.contains(e.target) && !quickToggleBtn.contains(e.target)) {
                        controlsHint.classList.remove('visible-mobile');
                        quickToggleBtn.classList.remove('active');
                    }
                }
            });
        }

        document.getElementById('btn-undo').addEventListener('click', (e) => {
            e.stopPropagation();
            sounds.playClick();
            this.cube.undo();
        });

        document.getElementById('btn-redo').addEventListener('click', (e) => {
            e.stopPropagation();
            sounds.playClick();
            this.cube.redo();
        });

        document.getElementById('btn-reset').addEventListener('click', (e) => {
            e.stopPropagation();
            sounds.playClick();
            this.initGame();
        });

        const muteBtn = document.getElementById('btn-mute');
        muteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isMuted = sounds.toggleMute();
            muteBtn.innerText = isMuted ? '🔇' : '🔊';
        });

        // Modal close button
        document.getElementById('btn-modal-close').addEventListener('click', (e) => {
            e.stopPropagation();
            sounds.playClick();
            document.getElementById('win-modal').classList.remove('active');
            this.initGame();
        });

        // Key Buttons in side panel
        document.querySelectorAll('.key-btn').forEach(btn => {
            const handleKeyClick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const key = btn.dataset.key;
                this.triggerKeyRotation(key);
            };
            btn.addEventListener('click', handleKeyClick);
            btn.addEventListener('pointerdown', (e) => e.stopPropagation());
        });
    }

    triggerKeyRotation(key) {
        if (this.cube.isAnimating) return;

        const offset = (this.currentSize - 1) / 2;
        let axis = 'y';
        let pos = offset;
        let dir = 1;

        switch (key.toUpperCase()) {
            case 'U': axis = 'y'; pos = offset; dir = -1; break;
            case 'D': axis = 'y'; pos = -offset; dir = 1; break;
            case 'R': axis = 'x'; pos = offset; dir = -1; break;
            case 'L': axis = 'x'; pos = -offset; dir = 1; break;
            case 'F': axis = 'z'; pos = offset; dir = -1; break;
            case 'B': axis = 'z'; pos = -offset; dir = 1; break;
        }

        this.cube.rotateLayer(axis, pos, dir).then(success => {
            if (success) this.onMovePerformed();
        });
    }

    initShortcuts() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toUpperCase();
            if (['U', 'D', 'R', 'L', 'F', 'B'].includes(key)) {
                this.triggerKeyRotation(key);
            }
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate(now) {
        requestAnimationFrame(this.animate);
        this.controls.update();
        this.particles.update(0.016);
        this.renderer.render(this.scene, this.camera);
    }
}

// Launch app when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    new GameApp();
});
