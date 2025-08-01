// Game variables
let scene, camera, renderer, player;
let keys = {};
let gameObjects = [];
let resources = [];
let enemies = [];
let buildings = [];

// Player stats
let playerStats = {
    health: 100,
    maxHealth: 100,
    hunger: 100,
    maxHunger: 100,
    stamina: 100,
    maxStamina: 100
};

// Player inventory
let inventory = {
    wood: 0,
    stone: 0,
    food: 0
};

// Game settings
const WORLD_SIZE = 300;
const PLAYER_SPEED = 0.5;
const RESOURCE_COUNT = 50;
const ENEMY_COUNT = 8;
const GATHER_DISTANCE = 4;

// Time and environment
let gameTime = 0;
let dayLength = 120000; // 2 minutes per day
let isNight = false;

// Tools and equipment
let currentTool = 'hands';
let tools = {
    hands: { damage: 1, gatherSpeed: 1 },
    axe: { damage: 3, gatherSpeed: 2 },
    pickaxe: { damage: 2, gatherSpeed: 3 },
    sword: { damage: 5, gatherSpeed: 0.5 }
};

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87CEEB, 50, 300);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 25);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x87CEEB);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Add lights
    addLights();

    // Create world
    createTerrain();
    createTrees();
    createRocks();
    createLake();
    createRiver();

    // Create game objects
    createPlayer();
    createResources();
    createEnemies();

    // Set up controls
    setupControls();

    // Start game loop
    animate();
}

function addLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);
    
    // Store reference for day/night cycle
    window.sunLight = directionalLight;
    window.ambientLight = ambientLight;
}

function createTerrain() {
    // Create ground with some height variation
    const groundGeometry = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 128, 128);
    const vertices = groundGeometry.attributes.position.array;
    
    // Add some height variation
    for (let i = 0; i < vertices.length; i += 3) {
        vertices[i + 2] = Math.random() * 2 - 1; // Small height variation
    }
    groundGeometry.attributes.position.needsUpdate = true;
    groundGeometry.computeVertexNormals();
    
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x4a7c59 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
}

function createTrees() {
    for (let i = 0; i < 40; i++) {
        const tree = createTree();
        const x = (Math.random() - 0.5) * WORLD_SIZE * 0.8;
        const z = (Math.random() - 0.5) * WORLD_SIZE * 0.8;
        tree.position.set(x, 0, z);
        scene.add(tree);
        gameObjects.push({ 
            mesh: tree, 
            type: 'tree', 
            position: tree.position,
            health: 3,
            maxHealth: 3,
            resource: 'wood',
            amount: 3
        });
    }
}

function createTree() {
    const treeGroup = new THREE.Group();
    
    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.6, 0.9, 5, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 2.5;
    trunk.castShadow = true;
    treeGroup.add(trunk);
    
    // Tree leaves
    const leavesGeometry = new THREE.SphereGeometry(3.5, 8, 6);
    const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 6;
    leaves.castShadow = true;
    treeGroup.add(leaves);
    
    return treeGroup;
}

function createRocks() {
    for (let i = 0; i < 30; i++) {
        const rock = createRock();
        const x = (Math.random() - 0.5) * WORLD_SIZE * 0.8;
        const z = (Math.random() - 0.5) * WORLD_SIZE * 0.8;
        rock.position.set(x, 0, z);
        scene.add(rock);
        gameObjects.push({ 
            mesh: rock, 
            type: 'rock', 
            position: rock.position,
            health: 4,
            maxHealth: 4,
            resource: 'stone',
            amount: 2
        });
    }
}

function createRock() {
    const rockGeometry = new THREE.DodecahedronGeometry(1.5, 0);
    const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.y = 1.5;
    rock.castShadow = true;
    return rock;
}

function createLake() {
    const lakeGeometry = new THREE.CircleGeometry(12, 32);
    const lakeMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x4169E1, 
        transparent: true, 
        opacity: 0.8 
    });
    const lake = new THREE.Mesh(lakeGeometry, lakeMaterial);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(-30, 0.1, -30);
    scene.add(lake);
}

function createRiver() {
    const riverGeometry = new THREE.PlaneGeometry(6, 60);
    const riverMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x4169E1, 
        transparent: true, 
        opacity: 0.8 
    });
    const river = new THREE.Mesh(riverGeometry, riverMaterial);
    river.rotation.x = -Math.PI / 2;
    river.position.set(20, 0.1, 0);
    scene.add(river);
}

function createPlayer() {
    const playerGroup = new THREE.Group();
    
    // Player body (Viking-style)
    const bodyGeometry = new THREE.BoxGeometry(1.4, 2, 0.8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 2;
    body.castShadow = true;
    playerGroup.add(body);
    
    // Player head
    const headGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFB6C1 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 3.2;
    head.castShadow = true;
    playerGroup.add(head);
    
    // Player legs
    const legGeometry = new THREE.CylinderGeometry(0.25, 0.25, 1.5, 8);
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.4, 0.75, 0);
    leftLeg.castShadow = true;
    playerGroup.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.4, 0.75, 0);
    rightLeg.castShadow = true;
    playerGroup.add(rightLeg);
    
    // Player arms
    const armGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.2, 8);
    const armMaterial = new THREE.MeshLambertMaterial({ color: 0xFFB6C1 });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-1, 2, 0);
    leftArm.castShadow = true;
    playerGroup.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(1, 2, 0);
    rightArm.castShadow = true;
    playerGroup.add(rightArm);
    
    player = playerGroup;
    player.position.set(0, 0, 0);
    scene.add(player);
}

function createResources() {
    // Create berry bushes for food
    for (let i = 0; i < 20; i++) {
        const bush = createBerryBush();
        let x, z;
        let validPosition = false;
        
        while (!validPosition) {
            x = (Math.random() - 0.5) * WORLD_SIZE * 0.7;
            z = (Math.random() - 0.5) * WORLD_SIZE * 0.7;
            validPosition = true;
            
            // Check distance from other objects
            for (let obj of gameObjects) {
                const distance = Math.sqrt((x - obj.position.x) ** 2 + (z - obj.position.z) ** 2);
                if (distance < 8) {
                    validPosition = false;
                    break;
                }
            }
        }
        
        bush.position.set(x, 0, z);
        scene.add(bush);
        gameObjects.push({ 
            mesh: bush, 
            type: 'bush', 
            position: bush.position,
            health: 1,
            maxHealth: 1,
            resource: 'food',
            amount: 2
        });
    }
}

function createBerryBush() {
    const bushGroup = new THREE.Group();
    
    // Bush base
    const bushGeometry = new THREE.SphereGeometry(1.2, 8, 6);
    const bushMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const bush = new THREE.Mesh(bushGeometry, bushMaterial);
    bush.position.y = 1.2;
    bush.castShadow = true;
    bushGroup.add(bush);
    
    // Berries
    for (let i = 0; i < 6; i++) {
        const berryGeometry = new THREE.SphereGeometry(0.1, 6, 6);
        const berryMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
        const berry = new THREE.Mesh(berryGeometry, berryMaterial);
        berry.position.set(
            (Math.random() - 0.5) * 2,
            1.2 + (Math.random() - 0.5) * 1,
            (Math.random() - 0.5) * 2
        );
        bushGroup.add(berry);
    }
    
    return bushGroup;
}

function createEnemies() {
    for (let i = 0; i < ENEMY_COUNT; i++) {
        const enemy = createEnemy();
        let x, z;
        let validPosition = false;
        
        while (!validPosition) {
            x = (Math.random() - 0.5) * WORLD_SIZE * 0.6;
            z = (Math.random() - 0.5) * WORLD_SIZE * 0.6;
            validPosition = true;
            
            // Keep enemies away from player spawn and other objects
            const distanceFromPlayer = Math.sqrt(x ** 2 + z ** 2);
            if (distanceFromPlayer < 20) {
                validPosition = false;
                continue;
            }
            
            for (let obj of gameObjects) {
                const distance = Math.sqrt((x - obj.position.x) ** 2 + (z - obj.position.z) ** 2);
                if (distance < 10) {
                    validPosition = false;
                    break;
                }
            }
        }
        
        enemy.position.set(x, 0, z);
        enemy.userData = {
            health: 20,
            maxHealth: 20,
            damage: 15,
            speed: 0.03,
            direction: Math.random() * Math.PI * 2,
            changeDirectionTimer: 0,
            attackCooldown: 0,
            type: 'hostile'
        };
        scene.add(enemy);
        enemies.push(enemy);
    }
}

function createEnemy() {
    const enemyGroup = new THREE.Group();
    
    // Enemy body (troll-like)
    const bodyGeometry = new THREE.BoxGeometry(2, 2.5, 1.2);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 2.5;
    body.castShadow = true;
    enemyGroup.add(body);
    
    // Enemy head
    const headGeometry = new THREE.SphereGeometry(0.8, 12, 12);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 4.3;
    head.castShadow = true;
    enemyGroup.add(head);
    
    // Enemy eyes (red)
    const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.2, 4.4, 0.7);
    enemyGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.2, 4.4, 0.7);
    enemyGroup.add(rightEye);
    
    // Enemy arms
    const armGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.8, 8);
    const armMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-1.2, 2.5, 0);
    leftArm.castShadow = true;
    enemyGroup.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(1.2, 2.5, 0);
    rightArm.castShadow = true;
    enemyGroup.add(rightArm);
    
    return enemyGroup;
}

function setupControls() {
    document.addEventListener('keydown', (event) => {
        keys[event.code] = true;
        
        // Handle special actions
        if (event.code === 'KeyE') {
            gatherResource();
        } else if (event.code === 'KeyC') {
            openCraftingMenu();
        } else if (event.code === 'KeyB') {
            buildStructure();
        }
    });

    document.addEventListener('keyup', (event) => {
        keys[event.code] = false;
    });
    
    // Mouse controls for combat
    document.addEventListener('mousedown', (event) => {
        if (event.button === 0) { // Left click - attack
            attackWithTool();
        } else if (event.button === 2) { // Right click - use tool
            useTool();
        }
    });
    
    // Prevent context menu on right click
    document.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });
}

function updatePlayer() {
    const moveVector = new THREE.Vector3();
    let isMoving = false;
    
    if (keys['KeyW'] || keys['ArrowUp']) {
        moveVector.z -= 1;
        isMoving = true;
    }
    if (keys['KeyS'] || keys['ArrowDown']) {
        moveVector.z += 1;
        isMoving = true;
    }
    if (keys['KeyA'] || keys['ArrowLeft']) {
        moveVector.x -= 1;
        isMoving = true;
    }
    if (keys['KeyD'] || keys['ArrowRight']) {
        moveVector.x += 1;
        isMoving = true;
    }
    
    if (moveVector.length() > 0 && playerStats.stamina > 0) {
        moveVector.normalize();
        
        // Running consumes stamina
        if (keys['ShiftLeft'] && playerStats.stamina > 10) {
            moveVector.multiplyScalar(PLAYER_SPEED * 1.5);
            playerStats.stamina -= 0.5;
        } else {
            moveVector.multiplyScalar(PLAYER_SPEED);
        }
        
        const newPosition = player.position.clone().add(moveVector);
        
        // Keep player within world bounds
        if (Math.abs(newPosition.x) < WORLD_SIZE / 2 && Math.abs(newPosition.z) < WORLD_SIZE / 2) {
            player.position.add(moveVector);
        }
        
        // Face movement direction
        const angle = Math.atan2(moveVector.x, moveVector.z);
        player.rotation.y = angle;
    }
    
    // Regenerate stamina when not moving
    if (!isMoving && playerStats.stamina < playerStats.maxStamina) {
        playerStats.stamina += 0.3;
    }
    
    // Update camera to follow player
    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 25;
    camera.lookAt(player.position);
}

function gatherResource() {
    const playerPos = player.position;
    
    for (let i = gameObjects.length - 1; i >= 0; i--) {
        const obj = gameObjects[i];
        const distance = playerPos.distanceTo(obj.position);
        
        if (distance < GATHER_DISTANCE && obj.health > 0) {
            // Damage the resource
            obj.health -= tools[currentTool].gatherSpeed;
            
            if (obj.health <= 0) {
                // Give resources to player
                inventory[obj.resource] += obj.amount;
                
                // Remove from scene and array
                scene.remove(obj.mesh);
                gameObjects.splice(i, 1);
                
                updateInventoryUI();
            }
            break; // Only gather from one resource at a time
        }
    }
}

function attackWithTool() {
    const playerPos = player.position;
    const attackRange = 5;
    
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const distance = playerPos.distanceTo(enemy.position);
        
        if (distance < attackRange) {
            enemy.userData.health -= tools[currentTool].damage;
            
            if (enemy.userData.health <= 0) {
                scene.remove(enemy);
                enemies.splice(i, 1);
                
                // Drop some food when enemy dies
                inventory.food += 1;
                updateInventoryUI();
            }
            break;
        }
    }
}

function useTool() {
    // Tool-specific actions can be implemented here
    console.log(`Using ${currentTool}`);
}

function openCraftingMenu() {
    // Simple crafting system
    if (inventory.wood >= 5 && inventory.stone >= 2) {
        if (confirm('Craft Axe? (5 Wood + 2 Stone)')) {
            inventory.wood -= 5;
            inventory.stone -= 2;
            currentTool = 'axe';
            updateInventoryUI();
            alert('Axe crafted! You can now gather wood faster.');
        }
    } else if (inventory.wood >= 3 && inventory.stone >= 4) {
        if (confirm('Craft Pickaxe? (3 Wood + 4 Stone)')) {
            inventory.wood -= 3;
            inventory.stone -= 4;
            currentTool = 'pickaxe';
            updateInventoryUI();
            alert('Pickaxe crafted! You can now gather stone faster.');
        }
    } else if (inventory.wood >= 2 && inventory.stone >= 3) {
        if (confirm('Craft Sword? (2 Wood + 3 Stone)')) {
            inventory.wood -= 2;
            inventory.stone -= 3;
            currentTool = 'sword';
            updateInventoryUI();
            alert('Sword crafted! You can now fight enemies more effectively.');
        }
    } else {
        alert('Not enough resources to craft anything!');
    }
}

function buildStructure() {
    if (inventory.wood >= 10 && inventory.stone >= 5) {
        if (confirm('Build Shelter? (10 Wood + 5 Stone)')) {
            inventory.wood -= 10;
            inventory.stone -= 5;
            
            // Create a simple shelter near player
            const shelter = createShelter();
            shelter.position.set(
                player.position.x + 8,
                0,
                player.position.z
            );
            scene.add(shelter);
            buildings.push(shelter);
            
            updateInventoryUI();
            alert('Shelter built! It provides protection during the night.');
        }
    } else {
        alert('Need 10 Wood and 5 Stone to build a shelter!');
    }
}

function createShelter() {
    const shelterGroup = new THREE.Group();
    
    // Shelter walls
    const wallGeometry = new THREE.BoxGeometry(8, 4, 0.5);
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    // Front wall
    const frontWall = new THREE.Mesh(wallGeometry, wallMaterial);
    frontWall.position.set(0, 2, 3.75);
    frontWall.castShadow = true;
    shelterGroup.add(frontWall);
    
    // Back wall
    const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
    backWall.position.set(0, 2, -3.75);
    backWall.castShadow = true;
    shelterGroup.add(backWall);
    
    // Side walls
    const sideWallGeometry = new THREE.BoxGeometry(0.5, 4, 8);
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-3.75, 2, 0);
    leftWall.castShadow = true;
    shelterGroup.add(leftWall);
    
    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(3.75, 2, 0);
    rightWall.castShadow = true;
    shelterGroup.add(rightWall);
    
    // Roof
    const roofGeometry = new THREE.BoxGeometry(9, 0.5, 9);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 4.25, 0);
    roof.castShadow = true;
    shelterGroup.add(roof);
    
    return shelterGroup;
}

function updateEnemies() {
    enemies.forEach(enemy => {
        const userData = enemy.userData;
        const playerDistance = enemy.position.distanceTo(player.position);
        
        // AI behavior
        if (playerDistance < 15) {
            // Chase player
            const direction = new THREE.Vector3()
                .subVectors(player.position, enemy.position)
                .normalize();
            
            enemy.position.add(direction.multiplyScalar(userData.speed * 1.5));
            enemy.lookAt(player.position);
            
            // Attack player if close enough
            if (playerDistance < 3 && userData.attackCooldown <= 0) {
                playerStats.health -= userData.damage;
                userData.attackCooldown = 60; // 1 second cooldown
                
                if (playerStats.health <= 0) {
                    alert('Game Over! You were defeated by enemies.');
                    location.reload();
                }
            }
        } else {
            // Wander randomly
            userData.changeDirectionTimer++;
            
            if (userData.changeDirectionTimer > 180) {
                userData.direction = Math.random() * Math.PI * 2;
                userData.changeDirectionTimer = 0;
            }
            
            const moveX = Math.cos(userData.direction) * userData.speed;
            const moveZ = Math.sin(userData.direction) * userData.speed;
            
            const newX = enemy.position.x + moveX;
            const newZ = enemy.position.z + moveZ;
            
            if (Math.abs(newX) < WORLD_SIZE / 2 - 10 && Math.abs(newZ) < WORLD_SIZE / 2 - 10) {
                enemy.position.x = newX;
                enemy.position.z = newZ;
            } else {
                userData.direction += Math.PI;
            }
            
            enemy.rotation.y = userData.direction;
        }
        
        // Update cooldowns
        if (userData.attackCooldown > 0) {
            userData.attackCooldown--;
        }
    });
}

function updateSurvivalStats() {
    // Hunger decreases over time
    playerStats.hunger -= 0.02;
    
    // Health decreases if hungry
    if (playerStats.hunger <= 0) {
        playerStats.health -= 0.1;
        playerStats.hunger = 0;
    }
    
    // Eat food automatically if hungry and have food
    if (playerStats.hunger < 50 && inventory.food > 0) {
        inventory.food--;
        playerStats.hunger = Math.min(playerStats.maxHunger, playerStats.hunger + 30);
        updateInventoryUI();
    }
    
    // Clamp values
    playerStats.health = Math.max(0, Math.min(playerStats.maxHealth, playerStats.health));
    playerStats.hunger = Math.max(0, Math.min(playerStats.maxHunger, playerStats.hunger));
    playerStats.stamina = Math.max(0, Math.min(playerStats.maxStamina, playerStats.stamina));
    
    // Update UI
    updateSurvivalUI();
    
    // Game over if health reaches 0
    if (playerStats.health <= 0) {
        alert('Game Over! You died from starvation or injuries.');
        location.reload();
    }
}

function updateDayNightCycle() {
    gameTime += 16.67; // Assuming 60 FPS
    const dayProgress = (gameTime % dayLength) / dayLength;
    
    // Determine if it's night (between 0.75 and 0.25 of the cycle)
    const wasNight = isNight;
    isNight = dayProgress > 0.75 || dayProgress < 0.25;
    
    if (isNight !== wasNight) {
        if (isNight) {
            console.log('Night falls...');
        } else {
            console.log('Dawn breaks...');
        }
    }
    
    // Adjust lighting based on time of day
    if (isNight) {
        window.sunLight.intensity = 0.2;
        window.ambientLight.intensity = 0.1;
        scene.fog.color.setHex(0x191970); // Dark blue
        renderer.setClearColor(0x191970);
    } else {
        const lightIntensity = 0.3 + 0.7 * Math.sin(dayProgress * Math.PI * 2);
        window.sunLight.intensity = Math.max(0.2, lightIntensity);
        window.ambientLight.intensity = Math.max(0.1, lightIntensity * 0.5);
        scene.fog.color.setHex(0x87CEEB); // Sky blue
        renderer.setClearColor(0x87CEEB);
    }
}

function updateSurvivalUI() {
    document.getElementById('health').textContent = 
        `Health: ${Math.round(playerStats.health)}/${playerStats.maxHealth}`;
    document.getElementById('hunger').textContent =
        `Hunger: ${Math.round(playerStats.hunger)}/${playerStats.maxHunger}`;
    document.getElementById('stamina').textContent =
        `Stamina: ${Math.round(playerStats.stamina)}/${playerStats.maxStamina}`;
}

function updateInventoryUI() {
    document.getElementById('wood').textContent = `Wood: ${inventory.wood}`;
    document.getElementById('stone').textContent = `Stone: ${inventory.stone}`;
    document.getElementById('food').textContent = `Food: ${inventory.food}`;
}

function animate() {
    requestAnimationFrame(animate);
    
    updatePlayer();
    updateEnemies();
    updateSurvivalStats();
    updateDayNightCycle();
    
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the game when page loads
window.addEventListener('load', init);