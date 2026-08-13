import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
    }

    triggerWinConfetti() {
        const count = 150;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const velocities = [];

        const colorPalette = [
            new THREE.Color(0xff2a2a), // Red
            new THREE.Color(0x2aff2a), // Green
            new THREE.Color(0x2a75ff), // Blue
            new THREE.Color(0xffd700), // Gold
            new THREE.Color(0xff8c00), // Orange
            new THREE.Color(0xff00ff)  // Magenta
        ];

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 1.5;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;

            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const speed = 4 + Math.random() * 8;

            velocities.push(new THREE.Vector3(
                speed * Math.sin(phi) * Math.cos(theta),
                speed * Math.sin(phi) * Math.sin(theta) + 3,
                speed * Math.cos(phi)
            ));
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.25,
            vertexColors: true,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });

        const pSystem = new THREE.Points(geometry, material);
        this.scene.add(pSystem);

        this.particles.push({
            mesh: pSystem,
            velocities: velocities,
            life: 1.0,
            decay: 0.015
        });
    }

    update(delta) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const pGroup = this.particles[i];
            pGroup.life -= pGroup.decay;

            if (pGroup.life <= 0) {
                this.scene.remove(pGroup.mesh);
                pGroup.mesh.geometry.dispose();
                pGroup.mesh.material.dispose();
                this.particles.splice(i, 1);
                continue;
            }

            pGroup.mesh.material.opacity = pGroup.life;

            const positions = pGroup.mesh.geometry.attributes.position.array;
            for (let j = 0; j < pGroup.velocities.length; j++) {
                const vel = pGroup.velocities[j];
                vel.y -= 9.8 * delta; // Gravity

                positions[j * 3] += vel.x * delta;
                positions[j * 3 + 1] += vel.y * delta;
                positions[j * 3 + 2] += vel.z * delta;
            }
            pGroup.mesh.geometry.attributes.position.needsUpdate = true;
        }
    }
}
