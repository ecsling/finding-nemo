    export interface DemoAnnotation {
    name: string;
    description: string;
    category: string;
    annotatedImage: string; // Path to image in public folder
    }

    export interface DemoModel {
    id: string;
    name: string;
    path: string; // Path to GLB file in public folder
    annotation: DemoAnnotation; // Single default annotation for the entire model
    }

export const DEMO_MODELS: DemoModel[] = [
{
    id: "cargo-asset-set",
    name: "Cargo Asset Set",
    path: "/assets/cargo_asset_set.glb",
    annotation: {
    name: "Cargo Asset Set",
    description: "A collection of maritime cargo assets used in container shipping operations. This model includes various cargo handling equipment and storage systems.",
    category: "Maritime Equipment",
    annotatedImage: "/annotations/cargo-asset-annotate.jpeg"
    }
},
{
    id: "cargo-ship",
    name: "Cargo Ship",
    path: "/assets/cargo_ship.glb",
    annotation: {
    name: "Cargo Ship",
    description: "A detailed cargo vessel model used for maritime container transport. Features standard shipping infrastructure and cargo holds.",
    category: "Vessel",
    annotatedImage: "/annotations/cargo-ship-annotate.jpeg"
    }
},
{
    id: "kelvin-seamounts",
    name: "Kelvin Seamounts",
    path: "/assets/kelvin_seamounts_atlantico_norte.glb",
    annotation: {
    name: "Kelvin Seamounts - North Atlantic",
    description: "Bathymetric terrain model of the Kelvin Seamounts region in the North Atlantic. Used for underwater navigation and search area visualization.",
    category: "Bathymetry",
    annotatedImage: "/annotations/kelvin-annotate.jpeg"
    }
},
{
    id: "san-pedro-preserve",
    name: "San Pedro Underwater Archaeological Preserve",
    path: "/assets/san_pedro_underwater_archaeological_preserve.glb",
    annotation: {
    name: "San Pedro Preserve",
    description: "Underwater archaeological site model featuring seafloor terrain and preserved maritime structures. Used for search and recovery operations planning.",
    category: "Bathymetry",
    annotatedImage: "/annotations/san-pedro-annotate.jpeg"
    }
},
{
    id: "shipping-container",
    name: "Shipping Container",
    path: "/assets/shipping_container.glb",
    annotation: {
    name: "Shipping Container",
    description: "Standard ISO shipping container model. The primary cargo unit for maritime transport operations and the focus of container recovery missions.",
    category: "Cargo",
    annotatedImage: "/annotations/container-annotate.jpeg"
    }
}
];

    export const getDemoAnnotation = (modelId: string): DemoAnnotation | null => {
    const model = DEMO_MODELS.find(m => m.id === modelId);
    return model?.annotation || null;
    };
