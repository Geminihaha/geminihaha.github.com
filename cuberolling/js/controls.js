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
        // In inspect mode we rotate the cube group directly (rotateCubeFree).
        // Keep OrbitControls disabled to avoid double-rotation conflicts.
        this.orbitControls.enabled = !enabled;
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

        // If Inspect mode is manually toggled ON, rotate the cube group directly and bypass layer selection
        if (this.isInspectMode) {
            this.isPointerDown = true;
            this.startPointerPos = this.getPointerPos(e);
            this.lastPos = this.startPointerPos.clone();
            this.selectedCubie = null;
            this.selectedNormal = null;
            this.orbitControls.enabled = false;
            return;
        }

        this.isPointerDown = true;
        this.isHoldForOrbit = false;
        this.pointerDownTime = performance.now();
        this.startPointerPos = this.getPointerPos(e);
        this.lastPos = this.startPointerPos.clone();
        this.mouse = this.getNormalizedMousePos(e);

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.cubeModel.cubies);

        if (intersects.length > 0) {
            const hit = intersects[0];
            this.selectedCubie = hit.object;
            this.selectedPoint = hit.point;

            // Lock orbit camera view IMMEDIATELY on touch down to prevent camera jitter during swipe!
            this.orbitControls.enabled = false;

            // Get hit face normal in world space
            const normal = hit.face.normal.clone();
            normal.transformDirection(hit.object.matrixWorld).normalize();

            // Round normal to nearest unit vector
            normal.x = Math.round(normal.x);
            normal.y = Math.round(normal.y);
            normal.z = Math.round(normal.z);

            this.selectedNormal = normal;
            
            // Long Press / Hold Detection:
            // If user holds for > 350ms, switch to free cube rotation and highlight Inspect button
            this.longPressTimer = setTimeout(() => {
                if (this.isPointerDown) {
                    this.isHoldForOrbit = true;
                    this.selectedCubie = null;
                    this.selectedNormal = null;
                    // Keep OrbitControls disabled: free-look rotates the cube group directly,
                    // so OrbitControls must NOT also grab the same drag (would double-rotate).
                    this.orbitControls.enabled = false;
                    if (this.onInspectStateChange) {
                        this.onInspectStateChange(true); // Highlight Inspect button!
                    }
                }
            }, 350);

        } else {
            this.selectedCubie = null;
            this.selectedNormal = null;
            this.orbitControls.enabled = true;
        }
    }

    rotateCubeFree(deltaX, deltaY) {
        const rotateSpeed = 0.006;

        // Camera local Right and Up vectors in world space
        const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion).normalize();
        const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion).normalize();

        // Quaternion for horizontal drag (rotate around camera Up vector)
        const qY = new THREE.Quaternion().setFromAxisAngle(camUp, deltaX * rotateSpeed);
        
        // Quaternion for vertical drag (rotate around camera Right vector - 100% Pole-Lock Free!)
        const qX = new THREE.Quaternion().setFromAxisAngle(camRight, deltaY * rotateSpeed);

        const qCombined = new THREE.Quaternion().multiplyQuaternions(qX, qY);

        // Premultiply quaternion to cube group for 100% singularity-free unlimited 3D rotation
        this.cubeModel.group.quaternion.premultiply(qCombined);
    }

    onPointerMove(e) {
        if (!this.isPointerDown) return;

        // Track pointer movement delta for free cube rotation
        const currentPointerPos = this.getPointerPos(e);
        const screenDelta = currentPointerPos.clone().sub(this.startPointerPos);
        const moveX = e.movementX || (currentPointerPos.x - (this.lastPos ? this.lastPos.x : currentPointerPos.x));
        const moveY = e.movementY || (currentPointerPos.y - (this.lastPos ? this.lastPos.y : currentPointerPos.y));
        this.lastPos = currentPointerPos.clone();

        // Inspect mode / long-press hold: rotate the cube group directly (OrbitControls stays disabled)
        if (this.isInspectMode || this.isHoldForOrbit) {
            this.rotateCubeFree(moveX, moveY);
            return;
        }

        // No cubie selected (touched empty space): let OrbitControls handle the camera orbit alone
        if (!this.selectedCubie) {
            return;
        }

        if (this.cubeModel.isAnimating) return;

        if (screenDelta.length() > this.dragThreshold) {
            const elapsedTime = performance.now() - this.pointerDownTime;
            
            // Clear timer once movement exceeds threshold
            if (this.longPressTimer) clearTimeout(this.longPressTimer);

            // If drag took too long (> 220ms), switch to free cube rotation instead of layer rotate
            if (elapsedTime > 220) {
                this.isHoldForOrbit = true;
                this.selectedCubie = null;
                this.selectedNormal = null;
                this.orbitControls.enabled = false;
                return;
            }

            // Attempt layer drag. If the swipe direction doesn't match a layer rotation well,
            // continue the SAME drag as free cube rotation (no inspect-button flash).
            const handled = this.handleLayerDrag(screenDelta);

            if (handled) {
                this.isPointerDown = false; // Trigger once per drag
                this.selectedCubie = null;
                this.orbitControls.enabled = false;
            } else {
                this.isHoldForOrbit = true;
                this.selectedCubie = null;
                this.selectedNormal = null;
                this.orbitControls.enabled = false;
            }
        }
    }

    onPointerUp() {
        if (this.longPressTimer) clearTimeout(this.longPressTimer);
        this.isPointerDown = false;
        this.isHoldForOrbit = false;
        this.selectedCubie = null;
        this.selectedNormal = null;
        this.lastPos = null;
        this.orbitControls.enabled = !this.isInspectMode;

        // If not in manual toggle inspect mode, unhighlight inspect button on touch release
        if (!this.isInspectMode && this.onInspectStateChange) {
            this.onInspectStateChange(false);
        }
    }

    handleLayerDrag(screenDelta) {
        if (!this.selectedCubie || !this.selectedNormal) return false;

        // Make sure the cube group's world matrix is up to date (free-look rotation may have changed it)
        this.cubeModel.group.updateMatrixWorld(true);

        // Work in the cube's LOCAL coordinate space:
        // 1) Convert the world-space hit normal to group-local space so the rotation-axis
        //    selection matches the faces the user actually sees on the (possibly rotated) cube.
        const localNormal = this.selectedNormal.clone().transformDirection(
            this.cubeModel.group.matrixWorld.clone().invert()
        );
        localNormal.x = Math.round(localNormal.x);
        localNormal.y = Math.round(localNormal.y);
        localNormal.z = Math.round(localNormal.z);

        const normal = localNormal;
        const pos = this.selectedCubie.position; // already in group-local space

        // Possible rotation axes must be perpendicular to the hit face normal (local axes)
        let possibleAxes = [];
        if (Math.abs(normal.x) > 0.9) possibleAxes = ['y', 'z'];
        else if (Math.abs(normal.y) > 0.9) possibleAxes = ['x', 'z'];
        else if (Math.abs(normal.z) > 0.9) possibleAxes = ['x', 'y'];

        let bestAxis = possibleAxes[0];
        let maxDot = -1;
        let finalDir = 1;

        // Use selected point if available (world space), else cubie position converted to world
        let refPoint = this.selectedPoint
            ? this.selectedPoint.clone()
            : pos.clone().applyMatrix4(this.cubeModel.group.matrixWorld);
        const startScreenPos = this.projectToScreen(refPoint);
        const currentDragVec = screenDelta.clone().normalize();

        possibleAxes.forEach(axis => {
            const localAxisVec = new THREE.Vector3();
            if (axis === 'x') localAxisVec.set(1, 0, 0);
            if (axis === 'y') localAxisVec.set(0, 1, 0);
            if (axis === 'z') localAxisVec.set(0, 0, 1);

            // Convert the local rotation axis into world space so screen projection stays correct
            const axisVec = localAxisVec.clone().transformDirection(this.cubeModel.group.matrixWorld).normalize();

            // 3D velocity vector on face surface caused by +1 positive rotation around 'axis' (world space)
            const vel3D = new THREE.Vector3().crossVectors(axisVec, this.selectedNormal).normalize();
            
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

        // Determine layer position along selected rotation axis with exact grid snapping (group-local)
        const offset = (this.cubeModel.size - 1) / 2;
        const layerPos = this.cubeModel.snapToGrid(pos[bestAxis], offset);

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
