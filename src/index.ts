import './styles/style.scss';
import * as THREE from 'three';
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader.js';
import {ColladaLoader} from 'three/examples/jsm/loaders/ColladaLoader.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {OBJLoader2} from  'three/examples/jsm/loaders/OBJLoader2';
import {MTLLoader} from  'three/examples/jsm/loaders/MTLLoader';
import {MtlObjBridge} from 'three/examples/jsm/loaders/obj2/bridge/MtlObjBridge.js';

import {Preloader} from './preloader';
import { MeshToonMaterial } from 'three';

class Game {
    scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 100000);
	renderer = new THREE.WebGLRenderer({alpha: true});
    clock = new THREE.Clock();
    controls: OrbitControls;
    environmentProxy: THREE.Object3D;
    carProxy: THREE.Group;
    fbxLoader: FBXLoader;
	colladaLoader: ColladaLoader;
	objectLoader: OBJLoader2;
    MTLLoader: MTLLoader;
    mouse = new THREE.Vector2();
    raycaster = new THREE.Raycaster();

    constructor() {
        const manager = new THREE.LoadingManager();
        this.fbxLoader = new FBXLoader(manager);
		this.colladaLoader = new ColladaLoader(manager);
		this.objectLoader = new OBJLoader2(manager);
        this.MTLLoader = new MTLLoader(manager);
        
		new Preloader({
			manager,
			onComplete: (): void => {
                this.initCamera();
				this.render();
			}
		});

        this.init();
    }

    init = () => {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.loadEnvironment();
        this.loadCar();
        this.initLights();

        window.addEventListener('click', this.onclick, false );
    }

    onclick = (event: MouseEvent ) => {
        this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera );

        for(const box of this.environmentProxy.children) {
            const intersect = this.raycaster.intersectObject(box);
            
            if (intersect.length) {
                console.log(intersect)
            }

		}
    }

	initCamera = (): void => {
		// const target = this.player.object.position.clone();
		// target.y = this.player.height / 2;
		
		this.camera.position.set(1, 1, 1);
		this.scene.add(this.camera);
		this.camera.lookAt(0, 0, 0);

		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.controls.enableKeys = false;
		this.controls.target = new THREE.Vector3(0, 0, 0)
		this.controls.maxDistance = 300;
	}

    loadEnvironment = (): void => {
        const invisiblePartsNames = [
            // 'SkyBox',
            'CarProxyB',
            'ConeProxy',
            'ShadowBounds',
            'CarShadow',
            'Track1bridgebits',
            'Collider',
            'Kitchen'
        ]

        const isInvisible = (child: THREE.Mesh) => {
            return invisiblePartsNames.some((name) => child.name.includes(name))
            && !child.name.includes('ProxyKitchen')
        }

		this.MTLLoader.load('/static/racing-map/rctimetrial.mtl', (materials) => {
			this.objectLoader.addMaterials(MtlObjBridge.addMaterialsFromMtlLoader(materials), true);

			this.objectLoader.load('/static/racing-map/rctimetrial.obj', (object) => {
				object.traverse(function (child) {
					if (child instanceof THREE.Mesh) {
                        if (isInvisible(child)) {
                            child.visible = false;
                        } else {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
					}
                });

				this.environmentProxy = object;
				this.scene.add(object);
			})
		})
    }
    
    loadCar = (): void => {
        const invisiblePartsNames = [
            'Wheel',
            'CarProxyB',
            'CarShadow'
        ]

        const skinParts = [
            'Bonnet',
            'Xtra',
            'Engine',
            'Seat'
        ]

        const activeSkin = '1';

        this.fbxLoader.load('/static/racing-map/car.fbx', (object) => {
            console.log(object)
            object.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    if (skinParts.some((name) => child.name.includes(name)) && ! child.name.includes(activeSkin)) {
                        child.visible = false;
                    } else {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                }
                });
            this.carProxy = object;
            this.scene.add(object);
        })
    }

    initLights = () => {
        const light = new THREE.DirectionalLight(0xffffbf, 0.1);
		light.position.set(0, 20, 10);
        const ambient = new THREE.AmbientLight( 0xffffff );

        this.scene.add(light);
        this.scene.add(ambient);
    }
    
	render = () => {
        requestAnimationFrame(this.render);

        this.renderer.render(this.scene, this.camera);
    }
}

// debug
// @ts-ignore
window.THREE = THREE;
// @ts-ignore
window.game = new Game();