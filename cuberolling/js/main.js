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

        // OrbitControls setup - Infinite 360 Free Rotation
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.rotateSpeed = 1.1;
        this.controls.enableZoom = true;
        this.controls.enablePan = false;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 25;
        this.controls.minPolarAngle = 0.0001;
        this.controls.maxPolarAngle = Math.PI - 0.0001;

        // Continuous 360-degree vertical flip handler:
        // Seamlessly rolls over top and bottom poles so camera never locks at 180 degrees!
        let prevPolar = this.controls.getPolarAngle();
        this.controls.addEventListener('change', () => {
            const currentPolar = this.controls.getPolarAngle();
            const eps = 0.025;
            
            // Near North Pole (Top) or South Pole (Bottom) limit
            if (currentPolar <= eps || currentPolar >= Math.PI - eps) {
                // Flip camera up vector or azimuthal angle smoothly for continuous 360 flipping
                if (Math.abs(currentPolar - prevPolar) > 0.001) {
                    this.controls.setAzimuthalAngle(this.controls.getAzimuthalAngle() + Math.PI);
                }
            }
            prevPolar = currentPolar;
        });

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
        // Auto-fit: compute the camera distance so the cube always fits fully on screen,
        // regardless of screen aspect ratio (portrait phones included).
        const cubeMaxRadius = (this.currentSize * Math.sqrt(3)) / 2; // half of the cube's space diagonal
        const aspect = window.innerWidth / window.innerHeight;
        const fovHalf = (this.camera.fov * Math.PI) / 360; // FOV/2 in radians
        const horizHalf = Math.atan(Math.tan(fovHalf) * aspect); // horizontal half-angle
        const minHalf = Math.min(fovHalf, horizHalf); // narrower half-angle limits the fit
        const dist = (cubeMaxRadius / Math.tan(minHalf)) * 1.15; // 15% margin so it never clips
        const clamped = Math.max(3, Math.min(25, dist));

        const len = this.camera.position.length();
        if (len > 0.01) {
            // Preserve the current viewing angle; only adjust the distance
            this.camera.position.normalize().multiplyScalar(clamped);
        } else {
            const dir = new THREE.Vector3(0.7, 0.6, 1).normalize();
            this.camera.position.copy(dir).multiplyScalar(clamped);
        }

        this.camera.lookAt(0, 0, 0);
        if (this.controls) {
            this.controls.target.set(0, 0, 0);
            this.controls.update();
        }
    }

    // Zoom the cube in/out by scaling the camera distance (keeps the current viewing angle)
    zoomBy(factor) {
        const len = this.camera.position.length();
        const newDist = THREE.MathUtils.clamp(len * factor, 3, 25);
        this.camera.position.normalize().multiplyScalar(newDist);
        this.camera.lookAt(0, 0, 0);
        if (this.controls) {
            this.controls.update();
        }
    }

    initGame() {
        if (this.cube) {
            this.cube.clear();
        }

        // Keep the free-look rotation (cube group orientation) across mode switches
        const prevGroupQuat = this.cube ? this.cube.group.quaternion.clone() : null;
        const prevInspectState = this.cubeController ? this.cubeController.isInspectMode : false;

        this.cube = new CubeModel(this.scene, this.currentSize);
        if (prevGroupQuat) {
            this.cube.group.quaternion.copy(prevGroupQuat);
        }
        this.updateCameraDistance();

        this.cubeController = new CubeController(
            this.camera,
            this.renderer.domElement,
            this.cube,
            this.controls,
            () => this.onMovePerformed()
        );

        // Register the inspect-state UI callback FIRST so the restore below syncs the button
        this.cubeController.setInspectStateCallback((isActive) => {
            const inspectBtn = document.getElementById('btn-inspect');
            if (inspectBtn) {
                inspectBtn.classList.toggle('active', isActive);
            }
        });

        // Restore inspect mode state if previously enabled before reset/mode switch
        if (prevInspectState) {
            this.cubeController.setInspectMode(true);
        }

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

        // Zoom buttons (cube zoom in/out)
        document.getElementById('btn-zoom-in').addEventListener('click', (e) => {
            e.stopPropagation();
            sounds.playClick();
            this.zoomBy(0.85); // move camera closer => zoom in
        });
        document.getElementById('btn-zoom-out').addEventListener('click', (e) => {
            e.stopPropagation();
            sounds.playClick();
            this.zoomBy(1.18); // move camera farther => zoom out
        });

        // Toolbar buttons
        document.getElementById('btn-scramble').addEventListener('click', (e) => {
            e.stopPropagation();
            sounds.playClick();
            this.resetStats();
            this.cube.scramble(this.currentSize === 2 ? 10 : 18).then(() => {
                this.hasScrambled = true;
            });
        });

        const inspectBtn = document.getElementById('btn-inspect');
        if (inspectBtn) {
            inspectBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                sounds.playClick();
                if (this.cubeController) {
                    this.cubeController.toggleInspectMode();
                }
            });
            inspectBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
        }

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
        // Re-fit the camera so the cube stays fully visible after orientation changes
        this.updateCameraDistance();
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
