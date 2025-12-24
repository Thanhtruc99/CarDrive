import * as THREE from 'three';
import { GLTFLoader } from 'gltf'; 

const scene = new THREE.Scene();

// Créer une caméra
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;
camera.position.y = 2;

// Créer un renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Ajouter une lumière ambiante
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); 
scene.add(ambientLight);

// Ajouter une lumière directionnelle
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); 
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Ajouter une lumière ponctuelle pour éclairer davantage
const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(0, 10, 0);
scene.add(pointLight);

// Créer la voiture
let car;
let mixer; 
const loader = new GLTFLoader();
loader.load('./models/truck.glb', (gltf) => {
    car = gltf.scene;

    // Ajuster l'échelle de la voiture 
    car.scale.set(0.005, 0.005, 0.005); 

    // Positionner la voiture
    car.position.y = 0; 
    car.position.z = 0; 
    car.rotation.y = Math.PI / 2; // Tourner la voiture de 90 degrés vers la gauche
    scene.add(car);

    // Créer un AnimationMixer pour gérer les animations
    mixer = new THREE.AnimationMixer(car);
    gltf.animations.forEach((clip) => {
        mixer.clipAction(clip).play(); 
    });
}, undefined, (error) => {
    console.error('Erreur lors du chargement du modèle de la voiture :', error);
});

// Ajouter le sol 
let ground;
loader.load('./models/ground.glb', (gltf) => {
    ground = gltf.scene;
    ground.position.y = -3;
    ground.position.z = -50; // Placer le sol à une distance pour créer un effet de course
    ground.scale.set(1.1, 1, 5); // Refaire la taille
    scene.add(ground);
}, undefined, (error) => {
    console.error('Erreur lors du chargement du modèle du sol :', error);
});

// Créer des obstacles
const obstacles = [];
function createRandomObstacle() {
    loader.load('./models/cube1.glb', (gltf) => {
        const obstacle = gltf.scene;

        // Ajuster la taille de l'obstacle
        obstacle.scale.set(0.7, 0.7, 0.7); 
        obstacle.position.y = 0.5;

        // Position aléatoire selon les axes x et z
        let validPosition = false;
        let attempts = 0;

        while (!validPosition && attempts < 10) {
            obstacle.position.x = Math.random() * 8 - 4; 
            obstacle.position.z = -Math.random() * 30 - 20; 

            validPosition = true;
            for (const existingObstacle of obstacles) {
                if (obstacle.position.distanceTo(existingObstacle.position) < 1.5) {
                    validPosition = false;
                    break;
                }
            }
            attempts++;
        }

        if (validPosition) {
            scene.add(obstacle);
            obstacles.push(obstacle);
        }
    }, undefined, (error) => {
        console.error('Erreur lors du chargement du modèle de l\'obstacle :', error);
    });
}

// Créer 5 obstacles au départ
for (let i = 0; i < 5; i++) {
    createRandomObstacle();
}

// La vitesse et la distance
let speed = 0.1;
let distance = 0;
let gameStarted = false; 

// Augmenter la vitesse chaque fois que 500m sont parcourus
function checkAndIncreaseSpeed() {
    if (distance > 0 && distance % 500 === 0 && speed < 10.0) {
        speed += 0.03; 
    }
}

// Fonction animate
function animate() {
    if (gameStarted) {
        // Déplacer la voiture
        if (keyState['ArrowLeft'] && car && car.position.x > -4.5) {
            car.position.x -= 0.1;
        }
        if (keyState['ArrowRight'] && car && car.position.x < 4.5) {
            car.position.x += 0.1;
        }

        // Déplacer les obstacles vers le joueur
        obstacles.forEach(obstacle => {
            obstacle.position.z += speed;
            // Vérifier si l'obstacle est sorti du cadre
            if (obstacle.position.z > 5) {
                // Réinitialiser la position de l'obstacle à une distance aléatoire
                obstacle.position.z = -Math.random() * 30 - 25;
                obstacle.position.x = Math.random() * 8 - 3; 
            }
            // Vérifier les collisions
            if (car && car.position.distanceTo(obstacle.position) < 1.5) {
                alert("Vous avez eu un accident ! Game Over.");
                resetGame();
            }
        });

        // Déplacer le sol
        if (ground) {
            ground.position.z += speed;

            // Réinitialiser la position du sol si elle va trop loin
            if (ground.position.z > 0) {
                ground.position.z = -50;
            }
        }

        // Augmenter la distance basée sur la vitesse
        distance += speed * 10;
        document.getElementById('distanceCounter').innerText = `Distance : ${Math.floor(distance)} m`;

        checkAndIncreaseSpeed();

        // Mettre à jour le mixer d'animation
        if (mixer) {
            mixer.update(0.01); 
        }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// Stocker l'état des bouttons 
const keyState = {};
document.addEventListener('keydown', (event) => {
    keyState[event.key] = true;
});
document.addEventListener('keyup', (event) => {
    keyState[event.key] = false;
});

// Fonction de réinitialisation du jeu
function resetGame() {
    if (car) car.position.set(0, 0.25, 0);
    obstacles.forEach(obstacle => {
        obstacle.position.z = -Math.random() * 30 - 20;
        obstacle.position.x = Math.random() * 8 - 4;
    });
    distance = 0; 
    speed = 0.1; 
    gameStarted = false;
    document.getElementById('startMessage').style.display = 'block';
}

// Événement de pression de la touche Entrée pour commencer le jeu
document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !gameStarted) {
        gameStarted = true; 
        document.getElementById('startMessage').style.display = 'none';
    }
});

animate();

// Ajuster la taille lors du changement de fenêtre
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});
