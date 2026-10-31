// Starter content: edit to match what the workshop offers.
/**
 * Signage Basket — Product Catalog
 * Defines window.CATALOG keyed by category slug.
 */
window.CATALOG = window.CATALOG || {};

window.CATALOG["home-nameplates"] = {
  title: "Home Nameplates",
  page: "/house-nameplates",
  eyebrow: "Home Nameplates",
  h1: "House Nameplate Designs in Gandhidham, Gujarat",
  intro: "Custom villa, bungalow and apartment nameplates made to your exact size, name and finish, handcrafted in Gandhidham for residences across Gujarat.",
  filters: [
    { label: "All", tag: "all" },
    { label: "Hanging", tag: "hanging" },
    { label: "Wall-mounted", tag: "wall" },
    { label: "Metal", tag: "metal" },
    { label: "Round & Oval", tag: "round" },
    { label: "Wood", tag: "wood" },
    { label: "Stone & Marble", tag: "stone" },
    { label: "LED Backlit", tag: "led" }
  ],
  defaults: {
    finishes: ["Antique brass", "Polished brass", "Brushed steel", "Matte black"],
    sizes: ["Small", "Medium", "Large", "Custom size"],
    weather: "Outdoor-suitable finishes available. Tell us where it will be installed and we will recommend the right one.",
    care: "Wipe with a soft dry or slightly damp cloth. Avoid abrasive cleaners.",
    install: "We install on site across Gandhidham, Kutch and Gujarat, or deliver with mounting hardware across India. See Shipping & Installation.",
    textLabel: "Text on your nameplate"
  },
  items: [
    {
      slug: "hanging-brass-nameplate",
      name: "Hanging Brass Nameplate",
      material: "Brass finish",
      price: null,
      desc: "A timeless brass nameplate suspended with classic hanging chains. Perfect for bungalow gates and sheltered entrance pillars.",
      finishes: ["Antique brass", "Polished brass"],
      sizes: ["Small", "Medium", "Large", "Custom size"],
      tags: ["hanging", "metal"],
      plate: {
        scene: "plaster",
        shape: "rect",
        mat: "brass",
        mount: "hanging",
        font: "serif",
        lines: ["Patel Niwas", "A-7"]
      }
    },
    {
      slug: "classic-brass-wall-plate",
      name: "Classic Brass Wall Plate",
      material: "Brass finish",
      price: null,
      desc: "An elegant rectangular brass wall plate crafted for front doors and boundary pillars. Designed to give your home entrance a warm, dignified greeting.",
      finishes: ["Antique brass", "Polished brass"],
      sizes: ["Small", "Medium", "Large", "Custom size"],
      tags: ["wall", "metal"],
      plate: {
        scene: "plaster",
        shape: "rect",
        mat: "brass",
        mount: "wall",
        font: "serif",
        lines: ["Joshi Residence", "A-12"]
      }
    },
    {
      slug: "round-brass-house-number-plate",
      name: "Round Brass House Number Plate",
      material: "Brass finish",
      price: null,
      desc: "A distinguished circular brass plate highlighting your house number and family name. Mounts cleanly on door panels or entrance walls.",
      finishes: ["Antique brass", "Polished brass"],
      sizes: ["Small", "Medium", "Large", "Custom size"],
      tags: ["round", "metal"],
      plate: {
        scene: "stone",
        shape: "round",
        mat: "brass",
        mount: "wall",
        font: "serif",
        lines: ["42", "Shanti Villa"]
      }
    },
    {
      slug: "oval-steel-nameplate",
      name: "Oval Steel Nameplate",
      material: "Brushed steel finish",
      price: null,
      desc: "A sleek oval steel nameplate tailored for modern homes. Wall-mounted with discreet corner fixtures for a clean presentation.",
      finishes: ["Brushed steel", "Mirror finish"],
      sizes: ["Small", "Medium", "Large", "Custom size"],
      tags: ["round", "metal"],
      plate: {
        scene: "concrete",
        shape: "oval",
        mat: "steel",
        mount: "wall",
        font: "serif",
        lines: ["Trivedi", "A - 9"]
      }
    },
    {
      slug: "laser-cut-metal-name",
      name: "Laser-Cut Metal Name",
      material: "Metal cut-out letters",
      price: null,
      desc: "A floating laser-cut metal nameplate rendered in flowing script lettering. Creates striking cast shadows when mounted on textured walls.",
      finishes: ["Matte black", "Antique gold"],
      sizes: ["Small", "Medium", "Large", "Custom size"],
      tags: ["metal", "wall"],
      plate: {
        scene: "concrete",
        shape: "cutout",
        mat: "black",
        mount: "wall",
        font: "script",
        lines: ["Kapadia"]
      }
    },
    {
      slug: "modern-matte-black-plate",
      name: "Modern Matte Black Plate",
      material: "Matte black",
      price: null,
      desc: "A minimalist matte black architectural nameplate with clean typography. Fits contemporary villa portals and apartment entrances.",
      finishes: ["Matte black", "Black with gold text"],
      sizes: ["Small", "Medium", "Large", "Custom size"],
      tags: ["wall"],
      plate: {
        scene: "plaster",
        shape: "rect",
        mat: "black",
        mount: "wall",
        font: "sans",
        lines: ["THE MEHTAS", "BUNGALOW 7"]
      }
    },
    {
      slug: "round-black-gold-plate",
      name: "Round Black & Gold Plate",
      material: "Matte black with gold",
      price: null,
      desc: "A circular deep black face accented with shimmering gold lettering and inner border. Mounts flush to bring subtle grandeur to your threshold.",
      finishes: ["Matte black", "Black with gold text"],
      sizes: ["Small", "Medium", "Large", "Custom size"],
      tags: ["round"],
      plate: {
        scene: "stone",
        shape: "round",
        mat: "blackgold",
        mount: "wall",
        font: "script",
        lines: ["Sharma", "VILLA 21"]
      }
    },
    {
      slug: "walnut-wood-nameplate",
      name: "Walnut Wood Nameplate",
      material: "Wood finish",
      price: null,
      desc: "A warm natural wood-finish nameplate engraved with clear family details. Wall-mounted for sheltered doorways and interior lobby entrances.",
      finishes: ["Walnut", "Teak"],
      sizes: ["Small", "Medium", "Large", "Custom size"],
      tags: ["wood", "wall"],
      plate: {
        scene: "concrete",
        shape: "rect",
        mat: "wood",
        mount: "wall",
        font: "serif",
        lines: ["Desai Home", "GANDHIDHAM"]
      }
    },
    {
      slug: "white-marble-nameplate",
      name: "White Marble Nameplate",
      material: "Marble finish",
      price: null,
      desc: "A stately white marble-finish plaque inscribed with crisp lettering. Lends a solid, enduring presence to residence gates and main entrances.",
      finishes: ["White marble", "Black marble"],
      sizes: ["Small", "Medium", "Large", "Custom size"],
      tags: ["stone", "wall"],
      plate: {
        scene: "dark",
        shape: "rect",
        mat: "marble",
        mount: "wall",
        font: "serif",
        lines: ["Solanki Residence", "PLOT NO. 118"]
      }
    },
    {
      slug: "led-backlit-nameplate",
      name: "LED Backlit Nameplate",
      material: "Backlit acrylic",
      price: null,
      desc: "A contemporary backlit nameplate engineered for high nighttime visibility. Mounts flush on exterior walls with soft ambient halo illumination.",
      finishes: ["Warm white glow", "Cool white glow"],
      sizes: ["Small", "Medium", "Large", "Custom size"],
      tags: ["led", "wall"],
      plate: {
        scene: "dark",
        shape: "rect",
        mat: "led",
        mount: "wall",
        font: "serif",
        lines: ["Joshi Niwas", "A - 12"]
      }
    }
  ]
};

window.CATALOG["glow-signs"] = {
  title: "LED & Glow Signs",
  page: "/led-glow-signs",
  eyebrow: "LED & Glow Signs",
  h1: "LED Glow Sign Designs in Gandhidham, Gujarat",
  intro: "Brilliant front-lit, halo-lit, and neon-style illuminated signs designed and fabricated for retail and commercial spaces.",
  filters: [
    { label: "All", tag: "all" },
    { label: "Halo-lit", tag: "halo" },
    { label: "Front-lit", tag: "front" },
    { label: "Boards", tag: "board" },
    { label: "Neon-style", tag: "neon" },
    { label: "Facade", tag: "facade" }
  ],
  defaults: {
    finishes: ["Warm white", "Cool white"],
    sizes: ["Small", "Medium", "Large", "Custom size"],
    weather: "Outdoor-suitable builds available. Tell us where it will be installed and we will recommend the right one.",
    care: "Wipe the face with a soft damp cloth. Switch off the power before cleaning.",
    install: "We install on site across Gandhidham, Kutch and Gujarat. Power and wiring requirements are shared before installation.",
    textLabel: "Text on your sign"
  },
  items: [
    {
      slug: "halo-lit-logo-letters",
      name: "Halo-Lit Logo Letters",
      material: "Backlit acrylic and metal",
      tags: ["halo"],
      price: null,
      desc: "Dimensional backlit letters crafted from metal with an acrylic diffuser base. Projects a soft warm ambient glow against your facade.",
      plate: {
        scene: "dark",
        type: "glowletters",
        style: "halo",
        font: "sans",
        lines: ["ORBIT", "STUDIO"]
      }
    },
    {
      slug: "front-lit-led-letters",
      name: "Front-Lit LED Letters",
      material: "Illuminated acrylic faces",
      tags: ["front"],
      price: null,
      desc: "Brightly illuminated acrylic face letters offering outstanding day and night contrast. Essential for busy high-street storefronts and commercial plazas.",
      plate: {
        scene: "dark",
        type: "glowletters",
        style: "front",
        font: "sans",
        lines: ["BRAND", "DESIGN CO."]
      }
    },
    {
      slug: "led-shop-name-board",
      name: "LED Shop Name Board",
      material: "LED-lit signboard",
      tags: ["board", "front"],
      price: null,
      desc: "A bold rectangular illuminated shop signboard engineered for crisp visibility. Ideal for storefront fascias and retail outlets.",
      plate: {
        scene: "dark",
        type: "ledboard",
        style: "front",
        font: "sans",
        lines: ["METRO MART", "GROCERY & MORE"]
      }
    },
    {
      slug: "neon-style-led-sign",
      name: "Neon-Style LED Sign",
      material: "LED flex, neon style",
      tags: ["neon"],
      price: null,
      desc: "Vibrant neon-effect signage fabricated using flexible silicone LED tubing. Delivers an eye-catching aesthetic for cafes, bistros, and creative spaces.",
      plate: {
        scene: "dark",
        type: "glowletters",
        style: "neon",
        font: "script",
        lines: ["Cafe Aroma"]
      }
    },
    {
      slug: "facade-glow-sign",
      name: "Facade Glow Sign",
      material: "Halo-lit facade letters",
      tags: ["facade", "halo"],
      price: null,
      desc: "Architectural halo-illuminated lettering mounted directly across exterior building elevations. Creates a commanding nighttime identity for corporate headquarters.",
      plate: {
        scene: "facade",
        type: "glowletters",
        style: "halo",
        font: "sans",
        lines: ["HARBOR"]
      }
    },
    {
      slug: "acp-fascia-signboard",
      name: "ACP Fascia Signboard",
      material: "ACP with backlit lettering",
      tags: ["board", "halo"],
      price: null,
      desc: "Durable aluminum composite panel fascia sign featuring halo-backlit typography. Perfect for long showroom entrances and corporate building fronts.",
      plate: {
        scene: "dark",
        type: "ledboard",
        style: "halo",
        font: "serif",
        lines: ["ARBOR & CO."]
      }
    },
    {
      slug: "push-through-acrylic-sign",
      name: "Push-Through Acrylic Sign",
      material: "Push-through acrylic",
      tags: ["front", "board"],
      price: null,
      desc: "Dimensional acrylic letters precision pushed through an opaque aluminum face. Emits crisp light through both the face and sides of each letter.",
      plate: {
        scene: "dark",
        type: "ledboard",
        style: "front",
        font: "sans",
        lines: ["FORGE FITNESS"]
      }
    },
    {
      slug: "clinic-glow-board",
      name: "Clinic Glow Board",
      material: "Illuminated board",
      tags: ["board"],
      price: null,
      desc: "A clean illuminated board designed for doctors, clinics, and professional consultants. Ensures clear patient guidance and professional presentation day and night.",
      plate: {
        scene: "dark",
        type: "ledboard",
        style: "front",
        font: "sans",
        lines: ["CARE CLINIC", "Dr. Name, Physician"]
      }
    }
  ]
};

window.CATALOG["3d-letters"] = {
  title: "3D Letter Signs",
  page: "/3d-letter-signs",
  eyebrow: "3D Letter Signs",
  h1: "3D Letter Sign Designs in Gandhidham, Gujarat",
  intro: "Dimensional acrylic and metal lettering crafted with clean precision for architectural walls and facades.",
  filters: [
    { label: "All", tag: "all" },
    { label: "Gold", tag: "gold" },
    { label: "White", tag: "white" },
    { label: "Black", tag: "black" },
    { label: "Steel", tag: "steel" }
  ],
  defaults: {
    finishes: ["Gold", "Silver", "Matte black", "White"],
    sizes: ["Small", "Medium", "Large", "Custom size"],
    weather: "Suitable for indoor and outdoor walls. Tell us the location and we will recommend the right finish.",
    care: "Dust with a soft dry cloth. Avoid abrasive cleaners.",
    install: "We install on site across Gandhidham, Kutch and Gujarat, or send with a fixing template across India.",
    textLabel: "Text on your sign"
  },
  items: [
    {
      slug: "brushed-gold-3d-letters",
      name: "Brushed Gold 3D Letters",
      material: "Gold-finish letters",
      tags: ["gold"],
      price: null,
      desc: "Refined three-dimensional letters finished with a warm brushed gold tone. Adds timeless elegance to studio entryways and feature walls.",
      plate: {
        scene: "concrete",
        type: "letters3d",
        style: "gold",
        font: "sans",
        lines: ["STUDIO"]
      }
    },
    {
      slug: "white-acrylic-3d-letters",
      name: "White Acrylic 3D Letters",
      material: "Acrylic letters",
      tags: ["white"],
      price: null,
      desc: "Crisp white solid acrylic dimensional letters with precision-routed edges. Stands out distinctly against dark accent walls and contemporary surfaces.",
      plate: {
        scene: "dark",
        type: "letters3d",
        style: "white",
        font: "sans",
        lines: ["FORGE"]
      }
    },
    {
      slug: "matte-black-3d-letters",
      name: "Matte Black 3D Letters",
      material: "Matte black letters",
      tags: ["black"],
      price: null,
      desc: "Sophisticated matte black architectural letters offering deep tactile contrast. A popular choice for luxury ateliers and minimalist office interiors.",
      plate: {
        scene: "plaster",
        type: "letters3d",
        style: "black",
        font: "serif",
        lines: ["ATELIER"]
      }
    },
    {
      slug: "stainless-steel-3d-letters",
      name: "Stainless Steel 3D Letters",
      material: "Steel-finish letters",
      tags: ["steel"],
      price: null,
      desc: "Durable stainless steel finished letters built to withstand weathering and time. Delivers an authoritative corporate identity for exterior boundaries.",
      plate: {
        scene: "dark",
        type: "letters3d",
        style: "steel",
        font: "sans",
        lines: ["NORTHWIND"]
      }
    },
    {
      slug: "serif-gold-3d-name",
      name: "Serif Gold 3D Name",
      material: "Gold-finish letters",
      tags: ["gold"],
      price: null,
      desc: "Classic serif typography rendered in dimensional gold finish lettering. Brings an established heritage feel to law chambers and financial offices.",
      plate: {
        scene: "dark",
        type: "letters3d",
        style: "gold",
        font: "serif",
        lines: ["Arbor & Co."]
      }
    },
    {
      slug: "layered-3d-logo-sign",
      name: "Layered 3D Logo Sign",
      material: "Layered acrylic",
      tags: ["white", "black"],
      price: null,
      desc: "Multi-layered acrylic emblem and lettering combining contrasting depths and tones. Creates a rich dimensional centerpiece for corporate lobbies.",
      plate: {
        scene: "plaster",
        type: "letters3d",
        style: "black",
        font: "sans",
        lines: ["ORBIT"]
      }
    }
  ]
};

window.CATALOG["office-boards"] = {
  title: "Acrylic Office Boards",
  page: "/acrylic-office-boards",
  eyebrow: "Acrylic Office Boards",
  h1: "Acrylic Office Board Designs in Gandhidham, Gujarat",
  intro: "Professional corporate directory boards, door plaques, and regulatory office signage mounted on precision standoffs.",
  filters: [
    { label: "All", tag: "all" },
    { label: "Company", tag: "company" },
    { label: "Directory", tag: "directory" },
    { label: "Door plates", tag: "door" },
    { label: "Info boards", tag: "info" }
  ],
  defaults: {
    finishes: ["White acrylic", "Black acrylic", "Brushed steel"],
    sizes: ["Small", "Medium", "Large", "Custom size"],
    weather: "Made for indoor use. Outdoor boards on request.",
    care: "Wipe with a soft damp cloth. Avoid abrasive cleaners.",
    install: "Supplied with standoffs and fixings, or installed by us across Gandhidham, Kutch and Gujarat.",
    textLabel: "Text on your board"
  },
  items: [
    {
      slug: "white-acrylic-company-board",
      name: "White Acrylic Company Board",
      material: "Acrylic with standoffs",
      tags: ["company"],
      price: null,
      desc: "A clean white acrylic company plaque supported by metallic wall standoffs. Provides an uncluttered greeting for executive offices and creative studios.",
      plate: {
        scene: "walnut",
        type: "board",
        style: "white",
        font: "sans",
        lines: ["ARBOR & CO.", "ARCHITECTS · INTERIORS"]
      }
    },
    {
      slug: "black-acrylic-directory-board",
      name: "Black Acrylic Directory Board",
      material: "Black acrylic",
      tags: ["directory"],
      price: null,
      desc: "A formal black acrylic multi-tenant floor directory with crisp gold accents. Helps visitors navigate multi-level office buildings effortlessly.",
      plate: {
        scene: "concrete",
        type: "board",
        style: "directory",
        font: "sans",
        lines: ["DIRECTORY", "Reception", "Accounts", "Conference Room", "Director's Cabin"]
      }
    },
    {
      slug: "steel-company-info-board",
      name: "Steel Company Info Board",
      material: "Brushed steel",
      tags: ["info", "company"],
      price: null,
      desc: "A brushed steel corporate statutory plate presenting registered office details and GSTIN. Built for longevity and regulatory compliance.",
      plate: {
        scene: "concrete",
        type: "board",
        style: "steel",
        font: "sans",
        lines: ["ARBOR & CO. PVT. LTD.", "Registered Office", "Address line, City - 000000", "GSTIN: 00AAAAA0000A0Z0"]
      }
    },
    {
      slug: "office-door-name-plate",
      name: "Office Door Name Plate",
      material: "Acrylic",
      tags: ["door"],
      price: null,
      desc: "A compact acrylic door plaque tailored for executive cabins and department heads. Fastens neatly beside office entrances with stainless fixtures.",
      plate: {
        scene: "plaster",
        type: "board",
        style: "white",
        font: "serif",
        lines: ["Mr. A. Sharma", "MANAGING DIRECTOR"]
      }
    },
    {
      slug: "doctor-cabin-plate",
      name: "Doctor Cabin Plate",
      material: "Brushed steel",
      tags: ["door"],
      price: null,
      desc: "A professional brushed steel door plate designed for clinics, hospitals, and consulting rooms. Shows doctor credentials with dignified simplicity.",
      plate: {
        scene: "plaster",
        type: "board",
        style: "steel",
        font: "serif",
        lines: ["Dr. A. Mehta", "M.D. (Medicine)"]
      }
    },
    {
      slug: "department-info-sign",
      name: "Department Info Sign",
      material: "Black acrylic",
      tags: ["info"],
      price: null,
      desc: "A sleek black acrylic directional sign indicating department names and floor locations. Keeps corporate facilities structured and clearly identified.",
      plate: {
        scene: "dark",
        type: "board",
        style: "black",
        font: "sans",
        lines: ["ACCOUNTS", "Ground Floor"]
      }
    }
  ]
};

window.CATALOG["wall-branding"] = {
  title: "Interior Wall Branding",
  page: "/wall-branding",
  eyebrow: "Interior Wall Branding",
  h1: "Interior Wall Branding Designs in Gandhidham, Gujarat",
  intro: "Bespoke reception feature walls, wooden slat branding, and corporate recognition displays that elevate your space.",
  filters: [
    { label: "All", tag: "all" },
    { label: "Reception", tag: "reception" },
    { label: "Gym & Studio", tag: "studio" },
    { label: "Panels", tag: "panel" }
  ],
  defaults: {
    finishes: ["Gold", "White", "Black"],
    sizes: ["Small wall", "Medium wall", "Large wall", "Custom size"],
    weather: "Made for indoor walls.",
    care: "Dust with a soft dry cloth.",
    install: "We install on site across Gandhidham, Kutch and Gujarat after a site visit or photos and measurements of the wall.",
    textLabel: "Text on your wall"
  },
  items: [
    {
      slug: "reception-logo-wall",
      name: "Reception Logo Wall",
      material: "3D letters on slat wall",
      tags: ["reception"],
      price: null,
      desc: "Dimensional gold lettering mounted across a warm walnut fluted slat wall. Sets a commanding first impression right behind your reception desk.",
      plate: {
        scene: "walnut",
        type: "reception",
        style: "gold",
        font: "serif",
        lines: ["ARBOR & CO."]
      }
    },
    {
      slug: "studio-logo-wall",
      name: "Studio Logo Wall",
      material: "3D letters with LED line",
      tags: ["studio"],
      price: null,
      desc: "Bold dimensional lettering highlighted by an integrated horizontal glowing LED beam. Perfect for fitness studios, crossfit gyms, and creator spaces.",
      plate: {
        scene: "dark",
        type: "studio",
        style: "white",
        font: "sans",
        lines: ["FORGE", "FITNESS STUDIO"]
      }
    },
    {
      slug: "wall-of-fame-panel",
      name: "Wall of Fame Panel",
      material: "Wood panel with name plates",
      tags: ["panel"],
      price: null,
      desc: "A rich timber honor panel with individual black frames and gold dedication plates. Celebrates key leaders, founders, and company milestones.",
      plate: {
        scene: "walnut",
        type: "frames",
        style: "gold",
        font: "sans",
        lines: ["WALL OF FAME", "NAME HERE"]
      }
    },
    {
      slug: "feature-wall-logo",
      name: "Feature Wall Logo",
      material: "Backlit logo on feature wall",
      tags: ["reception", "studio"],
      price: null,
      desc: "A striking illuminated brand mark mounted against a dark textured accent wall. Delivers an artistic modern backdrop for photography and video calls.",
      plate: {
        scene: "dark",
        type: "studio",
        style: "white",
        font: "serif",
        lines: ["ATELIER", "INTERIORS"]
      }
    },
    {
      slug: "lobby-brand-wall",
      name: "Lobby Brand Wall",
      material: "Slat wall with logo",
      tags: ["reception"],
      price: null,
      desc: "Crisp white dimensional corporate letters anchored on architectural wood slats. Transforms open entrance lobbies into refined branded environments.",
      plate: {
        scene: "walnut",
        type: "reception",
        style: "white",
        font: "sans",
        lines: ["NORTHWIND"]
      }
    }
  ]
};
