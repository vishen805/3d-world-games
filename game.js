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
    food: 0,
    iron: 0,
    leather: 0
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
    hands: { damage: 1, gatherSpeed: 1, unlocked: true },
    axe: { damage: 3, gatherSpeed: 2, unlocked: false },
    pickaxe: { damage: 2, gatherSpeed: 3, unlocked: false },
    sword: { damage: 5, gatherSpeed: 0.5, unlocked: false },
    bow: { damage: 4, gatherSpeed: 0.5, unlocked: false, range: 15 },
    hammer: { damage: 6, gatherSpeed: 1, unlocked: false, buildBonus: true },
    fishingrod: { damage: 1, gatherSpeed: 1, unlocked: false, fishing: true }
};

// Building placement
let buildingMode = false;
let buildingType = null;
let buildingPreview = null;

// Animation states
let playerAnimationState = 'idle';
let animationTimer = 0;

// Food types
let foodTypes = {
    berries: { hunger: 20, health: 5 },
    fish: { hunger: 35, health: 10 },
    meat: { hunger: 50, health: 15 },
    bread: { hunger: 40, health: 8 }
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
    for (let i = 0; i < 15; i++) {
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
            amount: 2,
            foodType: 'berries'
        });
    }

    // Create iron deposits
    for (let i = 0; i < 10; i++) {
        const ironDeposit = createIronDeposit();
        let x, z;
        let validPosition = false;
        
        while (!validPosition) {
            x = (Math.random() - 0.5) * WORLD_SIZE * 0.6;
            z = (Math.random() - 0.5) * WORLD_SIZE * 0.6;
            validPosition = true;
            
            for (let obj of gameObjects) {
                const distance = Math.sqrt((x - obj.position.x) ** 2 + (z - obj.position.z) ** 2);
                if (distance < 10) {
                    validPosition = false;
                    break;
                }
            }
        }
        
        ironDeposit.position.set(x, 0, z);
        scene.add(ironDeposit);
        gameObjects.push({
            mesh: ironDeposit,
            type: 'iron',
            position: ironDeposit.position,
            health: 6,
            maxHealth: 6,
            resource: 'iron',
            amount: 3
        });
    }

    // Create animals for leather
    for (let i = 0; i < 8; i++) {
        const animal = createAnimal();
        let x, z;
        let validPosition = false;
        
        while (!validPosition) {
            x = (Math.random() - 0.5) * WORLD_SIZE * 0.5;
            z = (Math.random() - 0.5) * WORLD_SIZE * 0.5;
            validPosition = true;
            
            for (let obj of gameObjects) {
                const distance = Math.sqrt((x - obj.position.x) ** 2 + (z - obj.position.z) ** 2);
                if (distance < 12) {
                    validPosition = false;
                    break;
                }
            }
        }
        
        animal.position.set(x, 0, z);
        animal.userData = {
            health: 15,
            maxHealth: 15,
            speed: 0.02,
            direction: Math.random() * Math.PI * 2,
            changeDirectionTimer: 0,
            type: 'animal'
        };
        scene.add(animal);
        enemies.push(animal); // Add to enemies array for AI behavior
    }
}

function createIronDeposit() {
    const ironGroup = new THREE.Group();
    
    // Iron ore
    const ironGeometry = new THREE.OctahedronGeometry(2, 0);
    const ironMaterial = new THREE.MeshLambertMaterial({ color: 0x708090 });
    const iron = new THREE.Mesh(ironGeometry, ironMaterial);
    iron.position.y = 2;
    iron.castShadow = true;
    ironGroup.add(iron);
    
    // Add some sparkle effect
    for (let i = 0; i < 3; i++) {
        const sparkleGeometry = new THREE.SphereGeometry(0.1, 6, 6);
        const sparkleMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
        const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial);
        sparkle.position.set(
            (Math.random() - 0.5) * 3,
            1 + Math.random() * 2,
            (Math.random() - 0.5) * 3
        );
        ironGroup.add(sparkle);
    }
    
    return ironGroup;
}

function createAnimal() {
    const animalGroup = new THREE.Group();
    
    // Animal body (deer-like)
    const bodyGeometry = new THREE.BoxGeometry(1.5, 1, 2);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.5;
    body.castShadow = true;
    animalGroup.add(body);
    
    // Animal head
    const headGeometry = new THREE.BoxGeometry(0.8, 0.8, 1);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xA0522D });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 1.8, 1.2);
    head.castShadow = true;
    animalGroup.add(head);
    
    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1, 8);
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    
    for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(
            i < 2 ? -0.5 : 0.5,
            0.5,
            i % 2 === 0 ? 0.7 : -0.7
        );
        leg.castShadow = true;
        animalGroup.add(leg);
    }
    
    return animalGroup;
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
            if (buildingMode) {
                exitBuildingMode();
            } else {
                openCraftingMenu();
            }
        } else if (event.code === 'KeyB') {
            if (buildingMode) {
                exitBuildingMode();
            } else {
                buildStructure();
            }
        } else if (event.code === 'Escape') {
            if (buildingMode) {
                exitBuildingMode();
            } else {
                closeCraftingMenu();
                closeBuildingMenu();
            }
        }
        
        // Tool selection (1-7 keys)
        const toolKeys = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7'];
        const toolNames = ['hands', 'axe', 'pickaxe', 'sword', 'bow', 'hammer', 'fishingrod'];
        
        const keyIndex = toolKeys.indexOf(event.code);
        if (keyIndex !== -1 && tools[toolNames[keyIndex]].unlocked) {
            selectTool(toolNames[keyIndex]);
        }
    });

    document.addEventListener('keyup', (event) => {
        keys[event.code] = false;
    });
    
    // Mouse controls for combat and building
    document.addEventListener('mousedown', (event) => {
        if (buildingMode) {
            if (event.button === 0) { // Left click - place building
                placeBuildingAtCursor();
            } else if (event.button === 2) { // Right click - cancel building
                exitBuildingMode();
            }
        } else {
            if (event.button === 0) { // Left click - attack
                attackWithTool();
            } else if (event.button === 2) { // Right click - use tool
                useTool();
            }
        }
    });
    
    // Mouse movement for building preview
    document.addEventListener('mousemove', (event) => {
        if (buildingMode && buildingPreview) {
            updateBuildingPreview(event);
        }
    });
    
    // Prevent context menu on right click
    document.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });
}

function selectTool(toolName) {
    if (tools[toolName].unlocked) {
        currentTool = toolName;
        updateToolbarUI();
        updateCurrentToolUI();
    }
}

function updateToolbarUI() {
    document.querySelectorAll('.toolSlot').forEach(slot => {
        slot.classList.remove('active');
        const toolName = slot.dataset.tool;
        if (toolName === currentTool) {
            slot.classList.add('active');
        }
        if (!tools[toolName].unlocked) {
            slot.classList.add('disabled');
        } else {
            slot.classList.remove('disabled');
        }
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
        
        // Set walking animation
        if (playerAnimationState !== 'walking') {
            playerAnimationState = 'walking';
            animationTimer = 0;
        }
    } else {
        // Set idle animation
        if (playerAnimationState !== 'idle') {
            playerAnimationState = 'idle';
            animationTimer = 0;
        }
    }
    
    // Update player animations
    updatePlayerAnimation();
    
    // Regenerate stamina when not moving
    if (!isMoving && playerStats.stamina < playerStats.maxStamina) {
        playerStats.stamina += 0.3;
    }
    
    // Update camera to follow player
    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 25;
    camera.lookAt(player.position);
}

function updatePlayerAnimation() {
    animationTimer += 0.1;
    
    if (playerAnimationState === 'walking') {
        // Animate arms swinging
        const leftArm = player.children.find(child => child.position.x < 0 && child.position.y > 1.5);
        const rightArm = player.children.find(child => child.position.x > 0 && child.position.y > 1.5);
        
        if (leftArm && rightArm) {
            leftArm.rotation.x = Math.sin(animationTimer * 4) * 0.5;
            rightArm.rotation.x = -Math.sin(animationTimer * 4) * 0.5;
        }
    } else if (playerAnimationState === 'gathering') {
        // Animate gathering motion
        const rightArm = player.children.find(child => child.position.x > 0 && child.position.y > 1.5);
        if (rightArm) {
            rightArm.rotation.x = Math.sin(animationTimer * 8) * 0.8 - 0.5;
        }
    } else if (playerAnimationState === 'attacking') {
        // Animate attacking motion
        const rightArm = player.children.find(child => child.position.x > 0 && child.position.y > 1.5);
        if (rightArm) {
            rightArm.rotation.x = Math.sin(animationTimer * 10) * 1.2 - 0.3;
        }
        
        // Return to idle after animation
        if (animationTimer > 0.5) {
            playerAnimationState = 'idle';
            animationTimer = 0;
        }
    } else {
        // Idle - reset arm positions
        const leftArm = player.children.find(child => child.position.x < 0 && child.position.y > 1.5);
        const rightArm = player.children.find(child => child.position.x > 0 && child.position.y > 1.5);
        
        if (leftArm && rightArm) {
            leftArm.rotation.x = 0;
            rightArm.rotation.x = 0;
        }
    }
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
    const craftingPanel = document.getElementById('craftingPanel');
    craftingPanel.classList.remove('hidden');
    updateCraftingUI();
}

function closeCraftingMenu() {
    const craftingPanel = document.getElementById('craftingPanel');
    craftingPanel.classList.add('hidden');
}

function updateCraftingUI() {
    // Update Axe button
    const craftAxeBtn = document.getElementById('craftAxe');
    const axeRequirements = document.querySelector('#craftAxe').parentElement.querySelector('.itemRequirements');
    if (inventory.wood >= 5 && inventory.stone >= 2) {
        craftAxeBtn.disabled = false;
        axeRequirements.className = 'itemRequirements sufficient';
    } else {
        craftAxeBtn.disabled = true;
        axeRequirements.className = 'itemRequirements insufficient';
    }

    // Update Pickaxe button
    const craftPickaxeBtn = document.getElementById('craftPickaxe');
    const pickaxeRequirements = document.querySelector('#craftPickaxe').parentElement.querySelector('.itemRequirements');
    if (inventory.wood >= 3 && inventory.stone >= 4) {
        craftPickaxeBtn.disabled = false;
        pickaxeRequirements.className = 'itemRequirements sufficient';
    } else {
        craftPickaxeBtn.disabled = true;
        pickaxeRequirements.className = 'itemRequirements insufficient';
    }

    // Update Sword button
    const craftSwordBtn = document.getElementById('craftSword');
    const swordRequirements = document.querySelector('#craftSword').parentElement.querySelector('.itemRequirements');
    if (inventory.wood >= 2 && inventory.stone >= 3) {
        craftSwordBtn.disabled = false;
        swordRequirements.className = 'itemRequirements sufficient';
    } else {
        craftSwordBtn.disabled = true;
        swordRequirements.className = 'itemRequirements insufficient';
    }

    // Update Bow button
    const craftBowBtn = document.getElementById('craftBow');
    if (craftBowBtn) {
        const bowRequirements = document.querySelector('#craftBow').parentElement.querySelector('.itemRequirements');
        if (inventory.wood >= 4 && inventory.leather >= 2) {
            craftBowBtn.disabled = false;
            bowRequirements.className = 'itemRequirements sufficient';
        } else {
            craftBowBtn.disabled = true;
            bowRequirements.className = 'itemRequirements insufficient';
        }
    }

    // Update Hammer button
    const craftHammerBtn = document.getElementById('craftHammer');
    if (craftHammerBtn) {
        const hammerRequirements = document.querySelector('#craftHammer').parentElement.querySelector('.itemRequirements');
        if (inventory.wood >= 3 && inventory.iron >= 5) {
            craftHammerBtn.disabled = false;
            hammerRequirements.className = 'itemRequirements sufficient';
        } else {
            craftHammerBtn.disabled = true;
            hammerRequirements.className = 'itemRequirements insufficient';
        }
    }

    // Update Fishing Rod button
    const craftFishingRodBtn = document.getElementById('craftFishingRod');
    if (craftFishingRodBtn) {
        const fishingRodRequirements = document.querySelector('#craftFishingRod').parentElement.querySelector('.itemRequirements');
        if (inventory.wood >= 3 && inventory.leather >= 1) {
            craftFishingRodBtn.disabled = false;
            fishingRodRequirements.className = 'itemRequirements sufficient';
        } else {
            craftFishingRodBtn.disabled = true;
            fishingRodRequirements.className = 'itemRequirements insufficient';
        }
    }
}

function craftItem(itemType) {
    switch(itemType) {
        case 'axe':
            if (inventory.wood >= 5 && inventory.stone >= 2) {
                inventory.wood -= 5;
                inventory.stone -= 2;
                currentTool = 'axe';
                updateInventoryUI();
                updateCraftingUI();
                updateCurrentToolUI();
                showCraftingMessage('Axe crafted! You can now gather wood faster.');
            }
            break;
        case 'pickaxe':
            if (inventory.wood >= 3 && inventory.stone >= 4) {
                inventory.wood -= 3;
                inventory.stone -= 4;
                currentTool = 'pickaxe';
                updateInventoryUI();
                updateCraftingUI();
                updateCurrentToolUI();
                showCraftingMessage('Pickaxe crafted! You can now gather stone faster.');
            }
            break;
        case 'sword':
            if (inventory.wood >= 2 && inventory.stone >= 3) {
                inventory.wood -= 2;
                inventory.stone -= 3;
                currentTool = 'sword';
                updateInventoryUI();
                updateCraftingUI();
                updateCurrentToolUI();
                showCraftingMessage('Sword crafted! You can now fight enemies more effectively.');
            }
            break;
    }
}

function showCraftingMessage(message) {
    // Create a temporary message element
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(76, 175, 80, 0.9);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        font-weight: bold;
        z-index: 200;
        border: 2px solid #4CAF50;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        document.body.removeChild(messageDiv);
    }, 3000);
}

function buildStructure() {
    const buildingPanel = document.getElementById('buildingPanel');
    buildingPanel.classList.remove('hidden');
    updateBuildingUI();
}

function closeBuildingMenu() {
    const buildingPanel = document.getElementById('buildingPanel');
    buildingPanel.classList.add('hidden');
}

function updateBuildingUI() {
    // Update House button
    const buildHouseBtn = document.getElementById('buildHouse');
    const houseRequirements = document.querySelector('#buildHouse').parentElement.querySelector('.itemRequirements');
    if (inventory.wood >= 10 && inventory.stone >= 5) {
        buildHouseBtn.disabled = false;
        houseRequirements.className = 'itemRequirements sufficient';
    } else {
        buildHouseBtn.disabled = true;
        houseRequirements.className = 'itemRequirements insufficient';
    }
}

function buildItem(itemType) {
    switch(itemType) {
        case 'house':
            if (inventory.wood >= 10 && inventory.stone >= 5) {
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
                updateBuildingUI();
                showCraftingMessage('House built! It provides protection during the night.');
            }
            break;
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
    
    // Update current tool display
    updateCurrentToolUI();
    
    // Update crafting and building UIs if they're open
    const craftingPanel = document.getElementById('craftingPanel');
    const buildingPanel = document.getElementById('buildingPanel');
    
    if (!craftingPanel.classList.contains('hidden')) {
        updateCraftingUI();
    }
    
    if (!buildingPanel.classList.contains('hidden')) {
        updateBuildingUI();
    }
}

function updateCurrentToolUI() {
    const currentToolElement = document.getElementById('currentTool');
    if (currentToolElement) {
        const toolName = currentTool.charAt(0).toUpperCase() + currentTool.slice(1);
        currentToolElement.textContent = `Current Tool: ${toolName}`;
        
        // Add tool-specific styling
        currentToolElement.className = 'current-tool';
        currentToolElement.classList.add(`tool-${currentTool}`);
    }
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

// Add event listeners for UI buttons
function setupUIEventListeners() {
    // Crafting panel event listeners
    document.getElementById('craftAxe').addEventListener('click', () => craftItem('axe'));
    document.getElementById('craftPickaxe').addEventListener('click', () => craftItem('pickaxe'));
    document.getElementById('craftSword').addEventListener('click', () => craftItem('sword'));
    document.getElementById('closeCrafting').addEventListener('click', closeCraftingMenu);
    
    // Building panel event listeners
    document.getElementById('buildHouse').addEventListener('click', () => buildItem('house'));
    document.getElementById('closeBuilding').addEventListener('click', closeBuildingMenu);
    
    // Close panels when clicking outside
    document.addEventListener('click', (event) => {
        const craftingPanel = document.getElementById('craftingPanel');
        const buildingPanel = document.getElementById('buildingPanel');
        
        if (!craftingPanel.classList.contains('hidden') &&
            !craftingPanel.contains(event.target) &&
            event.target.id !== 'craftingPanel') {
            closeCraftingMenu();
        }
        
        if (!buildingPanel.classList.contains('hidden') &&
            !buildingPanel.contains(event.target) &&
            event.target.id !== 'buildingPanel') {
            closeBuildingMenu();
        }
    });
}

// Enhanced crafting function with new tools
function craftItem(itemType) {
    switch(itemType) {
        case 'axe':
            if (inventory.wood >= 5 && inventory.stone >= 2) {
                inventory.wood -= 5;
                inventory.stone -= 2;
                tools.axe.unlocked = true;
                currentTool = 'axe';
                updateInventoryUI();
                updateCraftingUI();
                showCraftingMessage('Axe crafted! You can now gather wood faster.');
            }
            break;
        case 'pickaxe':
            if (inventory.wood >= 3 && inventory.stone >= 4) {
                inventory.wood -= 3;
                inventory.stone -= 4;
                tools.pickaxe.unlocked = true;
                currentTool = 'pickaxe';
                updateInventoryUI();
                updateCraftingUI();
                showCraftingMessage('Pickaxe crafted! You can now gather stone faster.');
            }
            break;
        case 'sword':
            if (inventory.wood >= 2 && inventory.stone >= 3) {
                inventory.wood -= 2;
                inventory.stone -= 3;
                tools.sword.unlocked = true;
                currentTool = 'sword';
                updateInventoryUI();
                updateCraftingUI();
                showCraftingMessage('Sword crafted! You can now fight enemies more effectively.');
            }
            break;
        case 'bow':
            if (inventory.wood >= 4 && inventory.leather >= 2) {
                inventory.wood -= 4;
                inventory.leather -= 2;
                tools.bow.unlocked = true;
                currentTool = 'bow';
                updateInventoryUI();
                updateCraftingUI();
                showCraftingMessage('Bow crafted! You can now attack from a distance.');
            }
            break;
        case 'hammer':
            if (inventory.wood >= 3 && inventory.iron >= 5) {
                inventory.wood -= 3;
                inventory.iron -= 5;
                tools.hammer.unlocked = true;
                currentTool = 'hammer';
                updateInventoryUI();
                updateCraftingUI();
                showCraftingMessage('Hammer crafted! Perfect for building and combat.');
            }
            break;
        case 'fishingrod':
            if (inventory.wood >= 3 && inventory.leather >= 1) {
                inventory.wood -= 3;
                inventory.leather -= 1;
                tools.fishingrod.unlocked = true;
                currentTool = 'fishingrod';
                updateInventoryUI();
                updateCraftingUI();
                showCraftingMessage('Fishing Rod crafted! You can now catch fish.');
            }
            break;
    }
}

// Enhanced building UI update
function updateBuildingUI() {
    // Update House button
    const buildHouseBtn = document.getElementById('buildHouse');
    const houseRequirements = document.querySelector('#buildHouse').parentElement.querySelector('.itemRequirements');
    if (inventory.wood >= 10 && inventory.stone >= 5) {
        buildHouseBtn.disabled = false;
        houseRequirements.className = 'itemRequirements sufficient';
    } else {
        buildHouseBtn.disabled = true;
        houseRequirements.className = 'itemRequirements insufficient';
    }

    // Update Watchtower button
    const buildWatchtowerBtn = document.getElementById('buildWatchtower');
    if (buildWatchtowerBtn) {
        const watchtowerRequirements = document.querySelector('#buildWatchtower').parentElement.querySelector('.itemRequirements');
        if (inventory.wood >= 15 && inventory.stone >= 10) {
            buildWatchtowerBtn.disabled = false;
            watchtowerRequirements.className = 'itemRequirements sufficient';
        } else {
            buildWatchtowerBtn.disabled = true;
            watchtowerRequirements.className = 'itemRequirements insufficient';
        }
    }

    // Update Workshop button
    const buildWorkshopBtn = document.getElementById('buildWorkshop');
    if (buildWorkshopBtn) {
        const workshopRequirements = document.querySelector('#buildWorkshop').parentElement.querySelector('.itemRequirements');
        if (inventory.wood >= 20 && inventory.stone >= 8 && inventory.iron >= 5) {
            buildWorkshopBtn.disabled = false;
            workshopRequirements.className = 'itemRequirements sufficient';
        } else {
            buildWorkshopBtn.disabled = true;
            workshopRequirements.className = 'itemRequirements insufficient';
        }
    }

    // Update Farm button
    const buildFarmBtn = document.getElementById('buildFarm');
    if (buildFarmBtn) {
        const farmRequirements = document.querySelector('#buildFarm').parentElement.querySelector('.itemRequirements');
        if (inventory.wood >= 12 && inventory.stone >= 3) {
            buildFarmBtn.disabled = false;
            farmRequirements.className = 'itemRequirements sufficient';
        } else {
            buildFarmBtn.disabled = true;
            farmRequirements.className = 'itemRequirements insufficient';
        }
    }
}

// Building placement system
function startBuildingMode(buildingTypeName) {
    buildingMode = true;
    buildingType = buildingTypeName;
    closeBuildingMenu();
    
    // Create preview building
    buildingPreview = createBuildingPreview(buildingTypeName);
    scene.add(buildingPreview);
    
    showCraftingMessage(`Building mode: ${buildingTypeName}. Left click to place, right click to cancel.`);
}

function createBuildingPreview(buildingTypeName) {
    let preview;
    
    switch(buildingTypeName) {
        case 'house':
            preview = createShelter();
            break;
        case 'watchtower':
            preview = createWatchtower();
            break;
        case 'workshop':
            preview = createWorkshop();
            break;
        case 'farm':
            preview = createFarm();
            break;
        default:
            preview = createShelter();
    }
    
    // Make preview semi-transparent with blue outline
    preview.traverse((child) => {
        if (child.isMesh) {
            child.material = child.material.clone();
            child.material.transparent = true;
            child.material.opacity = 0.5;
            child.material.color.setHex(0x4169E1); // Blue color
        }
    });
    
    return preview;
}

function updateBuildingPreview(event) {
    if (!buildingPreview) return;
    
    // Convert mouse position to world coordinates
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    // Create a ground plane for intersection
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(groundPlane, intersectPoint);
    
    if (intersectPoint) {
        buildingPreview.position.set(intersectPoint.x, 0, intersectPoint.z);
    }
}

function placeBuildingAtCursor() {
    if (!buildingPreview || !buildingType) return;
    
    const buildingCosts = {
        house: { wood: 10, stone: 5 },
        watchtower: { wood: 15, stone: 10 },
        workshop: { wood: 20, stone: 8, iron: 5 },
        farm: { wood: 12, stone: 3 }
    };
    
    const cost = buildingCosts[buildingType];
    let canBuild = true;
    
    // Check if player has enough resources
    for (const [resource, amount] of Object.entries(cost)) {
        if (inventory[resource] < amount) {
            canBuild = false;
            break;
        }
    }
    
    if (canBuild) {
        // Deduct resources
        for (const [resource, amount] of Object.entries(cost)) {
            inventory[resource] -= amount;
        }
        
        // Create actual building
        let building;
        switch(buildingType) {
            case 'house':
                building = createShelter();
                break;
            case 'watchtower':
                building = createWatchtower();
                break;
            case 'workshop':
                building = createWorkshop();
                break;
            case 'farm':
                building = createFarm();
                break;
        }
        
        building.position.copy(buildingPreview.position);
        scene.add(building);
        buildings.push(building);
        
        updateInventoryUI();
        showCraftingMessage(`${buildingType} built successfully!`);
        exitBuildingMode();
    } else {
        showCraftingMessage('Not enough resources!');
    }
}

function exitBuildingMode() {
    buildingMode = false;
    buildingType = null;
    
    if (buildingPreview) {
        scene.remove(buildingPreview);
        buildingPreview = null;
    }
}

// New building types
function createWatchtower() {
    const towerGroup = new THREE.Group();
    
    // Tower base
    const baseGeometry = new THREE.CylinderGeometry(3, 4, 2, 8);
    const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 1;
    base.castShadow = true;
    towerGroup.add(base);
    
    // Tower shaft
    const shaftGeometry = new THREE.CylinderGeometry(2, 2.5, 12, 8);
    const shaftMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.y = 8;
    shaft.castShadow = true;
    towerGroup.add(shaft);
    
    // Tower top
    const topGeometry = new THREE.CylinderGeometry(3, 2, 2, 8);
    const topMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 15;
    top.castShadow = true;
    towerGroup.add(top);
    
    return towerGroup;
}

function createWorkshop() {
    const workshopGroup = new THREE.Group();
    
    // Workshop base
    const baseGeometry = new THREE.BoxGeometry(12, 5, 8);
    const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 2.5;
    base.castShadow = true;
    workshopGroup.add(base);
    
    // Roof
    const roofGeometry = new THREE.ConeGeometry(8, 3, 4);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 6.5;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    workshopGroup.add(roof);
    
    // Chimney
    const chimneyGeometry = new THREE.BoxGeometry(1, 4, 1);
    const chimneyMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
    const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
    chimney.position.set(3, 7, 2);
    chimney.castShadow = true;
    workshopGroup.add(chimney);
    
    return workshopGroup;
}

function createFarm() {
    const farmGroup = new THREE.Group();
    
    // Farm fence
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 6; j++) {
            if (i === 0 || i === 7 || j === 0 || j === 5) {
                const fenceGeometry = new THREE.BoxGeometry(0.2, 2, 0.2);
                const fenceMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                const fence = new THREE.Mesh(fenceGeometry, fenceMaterial);
                fence.position.set(i * 2 - 7, 1, j * 2 - 5);
                fence.castShadow = true;
                farmGroup.add(fence);
            }
        }
    }
    
    // Crops
    for (let i = 1; i < 7; i++) {
        for (let j = 1; j < 5; j++) {
            const cropGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
            const cropMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
            const crop = new THREE.Mesh(cropGeometry, cropMaterial);
            crop.position.set(i * 2 - 7, 0.5, j * 2 - 5);
            crop.castShadow = true;
            farmGroup.add(crop);
        }
    }
    
    return farmGroup;
}

// Enhanced setupUIEventListeners function
function setupUIEventListeners() {
    // Crafting panel event listeners
    document.getElementById('craftAxe').addEventListener('click', () => craftItem('axe'));
    document.getElementById('craftPickaxe').addEventListener('click', () => craftItem('pickaxe'));
    document.getElementById('craftSword').addEventListener('click', () => craftItem('sword'));
    
    // New tool crafting listeners
    const craftBowBtn = document.getElementById('craftBow');
    if (craftBowBtn) craftBowBtn.addEventListener('click', () => craftItem('bow'));
    
    const craftHammerBtn = document.getElementById('craftHammer');
    if (craftHammerBtn) craftHammerBtn.addEventListener('click', () => craftItem('hammer'));
    
    const craftFishingRodBtn = document.getElementById('craftFishingRod');
    if (craftFishingRodBtn) craftFishingRodBtn.addEventListener('click', () => craftItem('fishingrod'));
    
    document.getElementById('closeCrafting').addEventListener('click', closeCraftingMenu);
    
    // Building panel event listeners
    document.getElementById('buildHouse').addEventListener('click', () => startBuildingMode('house'));
    
    const buildWatchtowerBtn = document.getElementById('buildWatchtower');
    if (buildWatchtowerBtn) buildWatchtowerBtn.addEventListener('click', () => startBuildingMode('watchtower'));
    
    const buildWorkshopBtn = document.getElementById('buildWorkshop');
    if (buildWorkshopBtn) buildWorkshopBtn.addEventListener('click', () => startBuildingMode('workshop'));
    
    const buildFarmBtn = document.getElementById('buildFarm');
    if (buildFarmBtn) buildFarmBtn.addEventListener('click', () => startBuildingMode('farm'));
    
    document.getElementById('closeBuilding').addEventListener('click', closeBuildingMenu);
    
    // Toolbar event listeners
    document.querySelectorAll('.toolSlot').forEach(slot => {
        slot.addEventListener('click', () => {
            const toolName = slot.dataset.tool;
            if (tools[toolName].unlocked) {
                selectTool(toolName);
            }
        });
    });
    
    // Close panels when clicking outside
    document.addEventListener('click', (event) => {
        const craftingPanel = document.getElementById('craftingPanel');
        const buildingPanel = document.getElementById('buildingPanel');
        
        if (!craftingPanel.classList.contains('hidden') &&
            !craftingPanel.contains(event.target) &&
            event.target.id !== 'craftingPanel') {
            closeCraftingMenu();
        }
        
        if (!buildingPanel.classList.contains('hidden') &&
            !buildingPanel.contains(event.target) &&
            event.target.id !== 'buildingPanel') {
            closeBuildingMenu();
        }
    });
}

// Start the game when page loads
window.addEventListener('load', () => {
    init();
    setupUIEventListeners();
});