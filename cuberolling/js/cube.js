import * as THREE from 'three';
import { sounds } from './audio.js';

// Color Palette for Standard Rubik's Cube
export const CUBE_COLORS = {
    R: 0xd92b2b, // Right (Red)
    L: 0xff6b00, // Left (Orange)
    U: 0xffffff, // Up (White)
    D: 0xffd000, // Down (Yellow)
    F: 0x00b050, // Front (Green)
    B: 0x0066cc, // Back (Blue)
    INNER: 0x1e1e24 // Inner faces (Dark Charcoal)
};

export class CubeModel {
    constructor(scene, size = 3) {
        this.scene = scene;
        this.size = size; // 2 for 2x2, 3 for 3x3
        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.cubies = [];
        this.isAnimating = false;
        this.history = [];
        this.redoStack = [];

        // Base geometry and materials
        this.cubieSize = 0.96;
        this.spacing = 1.0;

        this.initCube();
    }

    // Canvas texture generator for stickers with rounded inner border
    createFaceTexture(colorHex) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Background / Border (Dark)
        ctx.fillStyle = '#111116';
        ctx.fillRect(0, 0, 256, 256);

        // Rounded sticker
        const color = '#' + new THREE.Color(colorHex).getHexString();
        ctx.fillStyle = color;
        const r = 24;
        const margin = 12;
        const w = 256 - margin * 2;
        const h = 256 - margin * 2;

        ctx.beginPath();
        ctx.moveTo(margin + r, margin);
        ctx.arcTo(margin + w, margin, margin + w, margin + h, r);
        ctx.arcTo(margin + w, margin + h, margin, margin + h, r);
        ctx.arcTo(margin, margin + h, margin, margin, r);
        ctx.arcTo(margin, margin, margin + w, margin, r);
        ctx.closePath();
        ctx.fill();

        // Subtle gradient highlight
        const grad = ctx.createLinearGradient(0, 0, 256, 256);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
        ctx.fillStyle = grad;
        ctx.fill();

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    createCubieMaterials(x, y, z) {
        const offset = (this.size - 1) / 2;

        // Face order: +X (Right), -X (Left), +Y (Up), -Y (Down), +Z (Front), -Z (Back)
        const isRight = x === offset;
        const isLeft = x === -offset;
        const isUp = y === offset;
        const isDown = y === -offset;
        const isFront = z === offset;
        const isBack = z === -offset;

        const colors = [
            isRight ? CUBE_COLORS.R : CUBE_COLORS.INNER,
            isLeft ? CUBE_COLORS.L : CUBE_COLORS.INNER,
            isUp ? CUBE_COLORS.U : CUBE_COLORS.INNER,
            isDown ? CUBE_COLORS.D : CUBE_COLORS.INNER,
            isFront ? CUBE_COLORS.F : CUBE_COLORS.INNER,
            isBack ? CUBE_COLORS.B : CUBE_COLORS.INNER,
        ];

        return colors.map(col => {
            if (col === CUBE_COLORS.INNER) {
                return new THREE.MeshStandardMaterial({
                    color: CUBE_COLORS.INNER,
                    roughness: 0.8,
                    metalness: 0.1
                });
            }
            return new THREE.MeshStandardMaterial({
                map: this.createFaceTexture(col),
                roughness: 0.3,
                metalness: 0.1
            });
        });
    }

    initCube() {
        // Clear previous
        this.clear();

        const geometry = new THREE.BoxGeometry(this.cubieSize, this.cubieSize, this.cubieSize);
        const offset = (this.size - 1) / 2;

        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                for (let z = 0; z < this.size; z++) {
                    const posX = (x - offset) * this.spacing;
                    const posY = (y - offset) * this.spacing;
                    const posZ = (z - offset) * this.spacing;

                    const materials = this.createCubieMaterials(posX, posY, posZ);
                    const cubie = new THREE.Mesh(geometry, materials);

                    cubie.position.set(posX, posY, posZ);
                    cubie.userData = {
                        gridPos: new THREE.Vector3(posX, posY, posZ),
                        initialPos: new THREE.Vector3(posX, posY, posZ),
                        initialQuaternion: cubie.quaternion.clone()
                    };

                    this.cubies.push(cubie);
                    this.group.add(cubie);
                }
            }
        }
    }

    clear() {
        while (this.group.children.length > 0) {
            const child = this.group.children[0];
            if (child.geometry) child.geometry.dispose();
            if (Array.isArray(child.material)) {
                child.material.forEach(m => {
                    if (m.map) m.map.dispose();
                    m.dispose();
                });
            }
            this.group.remove(child);
        }
        this.cubies = [];
        this.history = [];
        this.redoStack = [];
    }

    setSize(newSize) {
        if (this.size !== newSize) {
            this.size = newSize;
            this.initCube();
        }
    }

    // Get cubies in a specific layer along axis ('x', 'y', 'z')
    getLayerCubies(axis, layerPosValue, eps = 0.1) {
        return this.cubies.filter(cubie => Math.abs(cubie.position[axis] - layerPosValue) < eps);
    }

    // Rotate a layer programmatically with smooth animation
    rotateLayer(axis, layerPosValue, dir, duration = 250, record = true) {
        if (this.isAnimating) return Promise.resolve(false);
        this.isAnimating = true;

        const cubiesInLayer = this.getLayerCubies(axis, layerPosValue);
        const pivot = new THREE.Group();
        this.group.add(pivot);

        cubiesInLayer.forEach(c => pivot.add(c));

        const targetAngle = dir * (Math.PI / 2);
        const startTime = performance.now();

        sounds.playRotate();

        return new Promise(resolve => {
            const animate = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1.0);
                
                // Ease Out Quad for natural rotation snap feel
                const ease = 1 - (1 - progress) * (1 - progress);
                const currentAngle = targetAngle * ease;

                if (axis === 'x') pivot.rotation.x = currentAngle;
                if (axis === 'y') pivot.rotation.y = currentAngle;
                if (axis === 'z') pivot.rotation.z = currentAngle;

                if (progress < 1.0) {
                    requestAnimationFrame(animate);
                } else {
                    // Update pivot's LOCAL transform matrix relative to this.group
                    pivot.updateMatrix();
                    
                    const children = [...pivot.children];
                    const offset = (this.size - 1) / 2;

                    children.forEach(c => {
                        // Apply pivot's LOCAL matrix (NOT matrixWorld) to avoid double group transform!
                        c.applyMatrix4(pivot.matrix);
                        
                        // Snap position to exact grid coordinates for 2x2 and 3x3
                        c.position.x = this.snapToGrid(c.position.x, offset);
                        c.position.y = this.snapToGrid(c.position.y, offset);
                        c.position.z = this.snapToGrid(c.position.z, offset);

                        // Snap orientation quaternion to exact 90-degree alignment
                        this.snapQuaternion(c.quaternion);

                        this.group.add(c);
                    });

                    this.group.remove(pivot);
                    this.isAnimating = false;

                    if (record) {
                        this.history.push({ axis, layerPosValue, dir });
                        this.redoStack = [];
                    }

                    resolve(true);
                }
            };
            requestAnimationFrame(animate);
        });
    }

    snapToGrid(val, offset) {
        let minDiff = Infinity;
        let bestVal = val;
        for (let i = 0; i < this.size; i++) {
            const gridVal = (i - offset) * this.spacing;
            const diff = Math.abs(val - gridVal);
            if (diff < minDiff) {
                minDiff = diff;
                bestVal = gridVal;
            }
        }
        return bestVal;
    }

    snapQuaternion(q) {
        const snapVal = (v) => {
            const targets = [0, 0.70710678, -0.70710678, 1, -1];
            let minD = Infinity;
            let best = v;
            for (const t of targets) {
                const d = Math.abs(v - t);
                if (d < minD) {
                    minD = d;
                    best = t;
                }
            }
            return best;
        };
        q.x = snapVal(q.x);
        q.y = snapVal(q.y);
        q.z = snapVal(q.z);
        q.w = snapVal(q.w);
        q.normalize();
    }

    async undo() {
        if (this.isAnimating || this.history.length === 0) return false;
        const move = this.history.pop();
        this.redoStack.push(move);
        await this.rotateLayer(move.axis, move.layerPosValue, -move.dir, 200, false);
        return true;
    }

    async redo() {
        if (this.isAnimating || this.redoStack.length === 0) return false;
        const move = this.redoStack.pop();
        this.history.push(move);
        await this.rotateLayer(move.axis, move.layerPosValue, move.dir, 200, false);
        return true;
    }

    async scramble(movesCount = 15) {
        if (this.isAnimating) return;
        
        const axes = ['x', 'y', 'z'];
        const offset = (this.size - 1) / 2;
        const possiblePositions = [];
        for (let i = 0; i < this.size; i++) {
            possiblePositions.push((i - offset) * this.spacing);
        }

        const moves = [];
        let prevAxis = '';

        for (let i = 0; i < movesCount; i++) {
            let axis = axes[Math.floor(Math.random() * axes.length)];
            while (axis === prevAxis) {
                axis = axes[Math.floor(Math.random() * axes.length)];
            }
            prevAxis = axis;

            const pos = possiblePositions[Math.floor(Math.random() * possiblePositions.length)];
            const dir = Math.random() < 0.5 ? 1 : -1;
            moves.push({ axis, pos, dir });
        }

        // Execute moves quickly
        this.history = [];
        this.redoStack = [];
        
        for (const move of moves) {
            await this.rotateLayer(move.axis, move.pos, move.dir, 90, false);
        }
    }

    isSolved() {
        if (this.isAnimating) return false;
        const eps = 0.05;

        // A cube is solved if all cubies are aligned to right positions and rotation
        for (const cubie of this.cubies) {
            // Check position alignment
            const initPos = cubie.userData.initialPos;
            if (cubie.position.distanceTo(initPos) > eps) {
                // If position shifted, check if entire faces have uniform color (standard orientation agnostic solve)
            }

            // Simple robust check: check if quaternion dot product is near 1 or -1 or rotation is standard 90-degree multiples
            const q = cubie.quaternion;
            // Standard aligned quaternions on cube grid have components near 0, 0.7071, 1.0, -0.7071
            const isAligned = Math.abs(q.x * q.y + q.z * q.w) < eps || Math.abs(q.x) < eps || Math.abs(Math.abs(q.x) - 0.7071) < eps;
        }

        // Color-based exact face uniformity check
        return this.checkFaceColorsUniform();
    }

    checkFaceColorsUniform() {
        const offset = (this.size - 1) / 2;
        const faces = [
            { axis: 'x', val: offset, normal: new THREE.Vector3(1, 0, 0) },
            { axis: 'x', val: -offset, normal: new THREE.Vector3(-1, 0, 0) },
            { axis: 'y', val: offset, normal: new THREE.Vector3(0, 1, 0) },
            { axis: 'y', val: -offset, normal: new THREE.Vector3(0, -1, 0) },
            { axis: 'z', val: offset, normal: new THREE.Vector3(0, 0, 1) },
            { axis: 'z', val: -offset, normal: new THREE.Vector3(0, 0, -1) },
        ];

        for (const face of faces) {
            const layerCubies = this.getLayerCubies(face.axis, face.val);
            let firstColorMapIndex = null;

            for (const cubie of layerCubies) {
                // Find which material index points outward along face.normal
                let worldNormal = new THREE.Vector3();
                let matchedIndex = -1;

                // BoxGeometry 6 faces normals in local space:
                // 0: +X, 1: -X, 2: +Y, 3: -Y, 4: +Z, 5: -Z
                const localNormals = [
                    new THREE.Vector3(1, 0, 0),
                    new THREE.Vector3(-1, 0, 0),
                    new THREE.Vector3(0, 1, 0),
                    new THREE.Vector3(0, -1, 0),
                    new THREE.Vector3(0, 0, 1),
                    new THREE.Vector3(0, 0, -1)
                ];

                for (let i = 0; i < 6; i++) {
                    worldNormal.copy(localNormals[i]).applyQuaternion(cubie.quaternion);
                    if (worldNormal.dot(face.normal) > 0.9) {
                        matchedIndex = i;
                        break;
                    }
                }

                if (matchedIndex === -1) return false;
                const mat = cubie.material[matchedIndex];

                // If map is canvas texture, compare its canvas or color tag
                if (!firstColorMapIndex) {
                    firstColorMapIndex = mat.map ? mat.map.uuid : 'inner';
                } else {
                    const currentUuid = mat.map ? mat.map.uuid : 'inner';
                    if (currentUuid !== firstColorMapIndex) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
}
