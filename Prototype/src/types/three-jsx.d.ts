// React Three Fiber JSX type extensions
// This file augments the global JSX namespace with Three.js element types

import type { Object3DNode, ExtendedColors, Overwrite, NodeProps, Vector3 as R3FVector3 } from '@react-three/fiber';
import type {
    Group,
    Mesh,
    Object3D,
    BoxGeometry,
    PlaneGeometry,
    CylinderGeometry,
    TorusGeometry,
    SphereGeometry,
    MeshStandardMaterial,
    MeshBasicMaterial,
    MeshPhongMaterial,
    AmbientLight,
    DirectionalLight,
    PointLight,
    SpotLight,
} from 'three';

type ThreeElement<T> = ExtendedColors<Overwrite<Partial<T>, NodeProps<T, typeof Object3D>>>;

declare global {
    namespace JSX {
        interface IntrinsicElements {
            group: ThreeElement<Group>;
            mesh: ThreeElement<Mesh>;
            primitive: { object: Object3D;[key: string]: any };

            // Geometries
            boxGeometry: Object3DNode<BoxGeometry, typeof BoxGeometry>;
            planeGeometry: Object3DNode<PlaneGeometry, typeof PlaneGeometry>;
            cylinderGeometry: Object3DNode<CylinderGeometry, typeof CylinderGeometry>;
            torusGeometry: Object3DNode<TorusGeometry, typeof TorusGeometry>;
            sphereGeometry: Object3DNode<SphereGeometry, typeof SphereGeometry>;

            // Materials
            meshStandardMaterial: Object3DNode<MeshStandardMaterial, typeof MeshStandardMaterial>;
            meshBasicMaterial: Object3DNode<MeshBasicMaterial, typeof MeshBasicMaterial>;
            meshPhongMaterial: Object3DNode<MeshPhongMaterial, typeof MeshPhongMaterial>;

            // Lights
            ambientLight: Object3DNode<AmbientLight, typeof AmbientLight>;
            directionalLight: Object3DNode<DirectionalLight, typeof DirectionalLight>;
            pointLight: Object3DNode<PointLight, typeof PointLight>;
            spotLight: Object3DNode<SpotLight, typeof SpotLight>;
        }
    }
}

export { };
