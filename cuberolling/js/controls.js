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

        this.initEvents();
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
            // If user holds for > 180ms, assume user wants to orbit view instead of layer rotate
            this.longPressTimer = setTimeout(() => {
                if (this.isPointerDown) {
                    this.isHoldForOrbit = true;
                    this.selectedCubie = null;
                    this.selectedNormal = null;
                    this.orbitControls.enabled = true; // Handover to OrbitControls for camera view
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

        // If long press hold mode was activated, let OrbitControls handle camera rotation
        if (this.isHoldForOrbit || !this.selectedCubie || this.cubeModel.isAnimating) {
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
                return;
            }

            // Attempt layer drag. If swipe direction doesn't match grid alignment well, fallback to orbit
            const handled = this.handleLayerDrag(delta);
            
            this.isPointerDown = false; // Trigger once per drag
            this.selectedCubie = null;
            
            // If layer swipe succeeded, keep orbitControls DISABLED until finger is lifted (onPointerUp)
            // This prevents entire cube camera from rotating during quick layer swipe!
            if (handled) {
                this.orbitControls.enabled = false;
            } else {
                this.orbitControls.enabled = true;
            }
        }
    }

    onPointerUp() {
        if (this.longPressTimer) clearTimeout(this.longPressTimer);
        this.isPointerDown = false;
        this.isHoldForOrbit = false;
        this.selectedCubie = null;
        this.selectedNormal = null;
        this.orbitControls.enabled = true; // Re-enable orbit controls on touch release
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

        // Determine 3D motion vector projected onto camera 2D screen space
        let bestAxis = possibleAxes[0];
        let maxDot = -1;
        let finalDir = 1;

        const center3D = this.selectedCubie.position.clone();
        const centerScreen = this.projectToScreen(center3D);

        possibleAxes.forEach(axis => {
            // Check rotation around this axis
            const tangentUnit = this.getTangentDirection(normal, axis);
            const tangent3D = center3D.clone().add(tangentUnit);
            const tangentScreen = this.projectToScreen(tangent3D);

            // Screen space tangent vector (X: right positive, Y: down positive)
            const screenTangentVec = tangentScreen.sub(centerScreen).normalize();
            // Screen space drag vector (X: right positive, Y: down positive)
            const currentDragVec = screenDelta.clone().normalize();

            // Calculate dot product directly in consistent 2D screen space
            const dot = Math.abs(currentDragVec.dot(screenTangentVec));
            if (dot > maxDot) {
                maxDot = dot;
                bestAxis = axis;
                // Sign mapping for intuitive swipe direction (swiping down moves layer down)
                const sign = currentDragVec.dot(screenTangentVec) >= 0 ? -1 : 1;
                finalDir = sign;
            }
        });

        // If swipe direction doesn't align cleanly with layer rotation tangent (maxDot < 0.60), cancel layer rotate
        if (maxDot < 0.60) {
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
