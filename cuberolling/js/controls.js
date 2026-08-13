import * as THREE from 'three';

export class CubeController {
    constructor(camera, domElement, cubeModel, orbitControls, onMoveCallback) {
        this.camera = camera;
        this.domElement = domElement;
        this.cubeModel = cubeModel;
        this.orbitControls = orbitControls;
        this.onMoveCallback = onMoveCallback;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.isPointerDown = false;
        this.startPointerPos = new THREE.Vector2();
        this.selectedCubie = null;
        this.selectedNormal = null;
        this.selectedPoint = null;

        this.dragThreshold = 18; // pixels to distinguish click vs layer drag
        this.longPressTimer = null;
        this.pointerDownTime = 0;
        this.isHoldForOrbit = false;
        this.isInspectMode = false;
        this.onInspectStateChange = null;

        this.initEvents();
    }

    setInspectStateCallback(callback) {
        this.onInspectStateChange = callback;
    }

    setInspectMode(enabled) {
        this.isInspectMode = enabled;
        this.orbitControls.enabled = true;
        if (this.onInspectStateChange) {
            this.onInspectStateChange(this.isInspectMode);
        }
    }

    toggleInspectMode() {
        this.setInspectMode(!this.isInspectMode);
        return this.isInspectMode;
    }

    initEvents() {
        this.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));
        window.addEventListener('pointermove', this.onPointerMove.bind(this));
        window.addEventListener('pointerup', this.onPointerUp.bind(this));
        window.addEventListener('pointercancel', this.onPointerUp.bind(this));
    }

    getPointerPos(e) {
        const rect = this.domElement.getBoundingClientRect();
        return new THREE.Vector2(e.clientX - rect.left, e.clientY - rect.top);
    }

    getNormalizedMousePos(e) {
        const rect = this.domElement.getBoundingClientRect();
        return new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
    }

    onPointerDown(e) {
        if (this.cubeModel.isAnimating) return;

        // Clear any previous long press timer
        if (this.longPressTimer) clearTimeout(this.longPressTimer);

        // Ignore 3D cube selection if the user clicked on UI layer buttons or controls
        if (e.target.closest('.ui-layer') || e.target.closest('button')) {
            return;
        }

        // If Inspect mode is manually toggled ON, force OrbitControls and bypass layer selection
        if (this.isInspectMode) {
            this.selectedCubie = null;
            this.selectedNormal = null;
            this.orbitControls.enabled = true;
            return;
        }

        this.isPointerDown = true;
        this.isHoldForOrbit = false;
        this.pointerDownTime = performance.now();
        this.startPointerPos = this.getPointerPos(e);
        this.mouse = this.getNormalizedMousePos(e);

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.cubeModel.cubies);

        if (intersects.length > 0) {
            const hit = intersects[0];
            this.selectedCubie = hit.object;
            this.selectedPoint = hit.point;

            // Get hit face normal in world space
            const normal = hit.face.normal.clone();
            normal.transformDirection(hit.object.matrixWorld).normalize();

            // Round normal to nearest unit vector
            normal.x = Math.round(normal.x);
            normal.y = Math.round(normal.y);
            normal.z = Math.round(normal.z);

            this.selectedNormal = normal;
            
            // Long Press / Hold Detection:
            // If user holds for > 180ms, switch to camera orbit view and highlight Inspect button
            this.longPressTimer = setTimeout(() => {
                if (this.isPointerDown) {
                    this.isHoldForOrbit = true;
                    this.selectedCubie = null;
                    this.selectedNormal = null;
                    this.orbitControls.enabled = true; // Handover to OrbitControls for camera view
                    if (this.onInspectStateChange) {
                        this.onInspectStateChange(true); // Highlight Inspect button!
                    }
                }
            }, 180);

        } else {
            this.selectedCubie = null;
            this.selectedNormal = null;
            this.orbitControls.enabled = true;
        }
    }

    onPointerMove(e) {
        if (!this.isPointerDown) return;

        // If long press hold mode or inspect mode is active, let OrbitControls handle camera rotation
        if (this.isInspectMode || this.isHoldForOrbit || !this.selectedCubie || this.cubeModel.isAnimating) {
            return;
        }

        const currentPointerPos = this.getPointerPos(e);
        const delta = currentPointerPos.clone().sub(this.startPointerPos);

        if (delta.length() > this.dragThreshold) {
            const elapsedTime = performance.now() - this.pointerDownTime;
            
            // Clear timer once movement exceeds threshold
            if (this.longPressTimer) clearTimeout(this.longPressTimer);

            // If drag took too long (> 220ms), switch to orbit view instead of layer rotate
            if (elapsedTime > 220) {
                this.isHoldForOrbit = true;
                this.selectedCubie = null;
                this.selectedNormal = null;
                this.orbitControls.enabled = true;
                if (this.onInspectStateChange) {
                    this.onInspectStateChange(true);
                }
                return;
            }

            // Attempt layer drag. If swipe direction doesn't match grid alignment well, fallback to orbit
            const handled = this.handleLayerDrag(delta);
            
            this.isPointerDown = false; // Trigger once per drag
            this.selectedCubie = null;
            
            if (handled) {
                this.orbitControls.enabled = false;
            } else {
                this.orbitControls.enabled = true;
                if (this.onInspectStateChange) {
                    this.onInspectStateChange(true);
                }
            }
        }
    }

    onPointerUp() {
        if (this.longPressTimer) clearTimeout(this.longPressTimer);
        this.isPointerDown = false;
        this.isHoldForOrbit = false;
        this.selectedCubie = null;
        this.selectedNormal = null;
        this.orbitControls.enabled = true;

        // If not in manual toggle inspect mode, unhighlight inspect button on touch release
        if (!this.isInspectMode && this.onInspectStateChange) {
            this.onInspectStateChange(false);
        }
    }

    handleLayerDrag(screenDelta) {
        if (!this.selectedCubie || !this.selectedNormal) return false;

        const normal = this.selectedNormal;
        const pos = this.selectedCubie.position;

        // Possible rotation axes must be perpendicular to the hit face normal
        let possibleAxes = [];
        if (Math.abs(normal.x) > 0.9) possibleAxes = ['y', 'z'];
        else if (Math.abs(normal.y) > 0.9) possibleAxes = ['x', 'z'];
        else if (Math.abs(normal.z) > 0.9) possibleAxes = ['x', 'y'];

        let bestAxis = possibleAxes[0];
        let maxDot = -1;
        let finalDir = 1;

        // Use selected point if available, or cubie position
        const refPoint = this.selectedPoint ? this.selectedPoint.clone() : pos.clone();
        const startScreenPos = this.projectToScreen(refPoint);
        const currentDragVec = screenDelta.clone().normalize();

        possibleAxes.forEach(axis => {
            const axisVec = new THREE.Vector3();
            if (axis === 'x') axisVec.set(1, 0, 0);
            if (axis === 'y') axisVec.set(0, 1, 0);
            if (axis === 'z') axisVec.set(0, 0, 1);

            // 3D velocity vector on face surface caused by +1 positive rotation around 'axis'
            const vel3D = new THREE.Vector3().crossVectors(axisVec, normal).normalize();
            
            // Project the 3D velocity displacement to 2D screen space
            const movedPoint3D = refPoint.clone().add(vel3D);
            const movedScreenPos = this.projectToScreen(movedPoint3D);

            // Screen space motion vector caused by +1 rotation around 'axis' (X: right, Y: down)
            const screenVelVec = movedScreenPos.sub(startScreenPos).normalize();

            // Calculate dot product between user 2D swipe vector and +1 rotation 2D screen velocity
            const rawDot = currentDragVec.dot(screenVelVec);
            const dot = Math.abs(rawDot);

            if (dot > maxDot) {
                maxDot = dot;
                bestAxis = axis;
                // If user swipe aligns with +1 rotation screen velocity, finalDir is 1, else -1
                finalDir = rawDot >= 0 ? 1 : -1;
            }
        });

        // If swipe direction doesn't align cleanly with layer rotation tangent (maxDot < 0.55), cancel layer rotate
        if (maxDot < 0.55) {
            return false;
        }

        // Determine layer position along selected rotation axis
        const layerPos = Math.round(pos[bestAxis] * 100) / 100;

        // Execute rotation
        this.cubeModel.rotateLayer(bestAxis, layerPos, finalDir).then(success => {
            if (success && this.onMoveCallback) {
                this.onMoveCallback();
            }
        });
        return true;
    }

    getTangentDirection(normal, rotationAxis) {
        // Tangent vector direction resulting from rotation around 'rotationAxis'
        const axisVec = new THREE.Vector3();
        if (rotationAxis === 'x') axisVec.set(1, 0, 0);
        if (rotationAxis === 'y') axisVec.set(0, 1, 0);
        if (rotationAxis === 'z') axisVec.set(0, 0, 1);

        const tangent = new THREE.Vector3().crossVectors(axisVec, normal).normalize();
        return tangent;
    }

    projectToScreen(pos3D) {
        const vec = pos3D.clone().project(this.camera);
        const rect = this.domElement.getBoundingClientRect();
        return new THREE.Vector2(
            ((vec.x + 1) * rect.width) / 2,
            ((-vec.y + 1) * rect.height) / 2
        );
    }
}
