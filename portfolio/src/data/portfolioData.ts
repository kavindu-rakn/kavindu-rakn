export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  category: 'independent' | 'commercial';
  href?: string;
  status: 'live' | 'in_build';
}

export interface PortfolioData {
  identity: {
    fullName: string;
    role: string;
    headline: string;
    bioStatement: string;
  };
  socials: {
    email: string;
    github: string;
    linkedin: string;
  };
  techMatrix: {
    category: string;
    skills: string[];
  }[];
  projects: ProjectItem[];
}

export const portfolioData: PortfolioData = {
  identity: {
    fullName: "Kavindu Ranathunga",
    role: "Creative Technologist / Design Engineer",
    headline: "Creative Technologist / Design Engineer",
    bioStatement: "Engineering high-performance interactive software, robust backend architectures, and aesthetic 3D web systems with AI-assisted velocity.",
  },
  socials: {
    email: "kavindu.rakn@gmail.com",
    github: "https://github.com/kavindu-rakn",
    linkedin: "https://www.linkedin.com/in/kavindu-ranathunga/",
  },
  techMatrix: [
    {
      category: "Creative & Interface",
      skills: ["Design Engineering", "Micro-WebGL / OGL", "GLSL Shaders", "Physics & Haptics", "Tailwind CSS v4"],
    },
    {
      category: "Systems & Backend",
      skills: ["Backend Architecture", "TypeScript", "Node.js / Bun", "API & Schema Design", "Microservices"],
    },
    {
      category: "Infrastructure & Quality",
      skills: ["DevOps & CI/CD", "Automated QA & Testing", "Security Hardening", "Edge Compute", "AI-Assisted Engineering"],
    },
  ],
  projects: [
    // Category 1: Projects Built Independently
    {
      id: "luna",
      name: "Luna",
      description: "An immersive lunar explorer",
      category: "independent",
      status: "in_build",
    },
    {
      id: "prompta",
      name: "Prompta",
      description: "A hyper-futuristic vault for AI prompts and power users",
      category: "independent",
      status: "in_build",
    },
    {
      id: "horologia",
      name: "Horologia",
      description: "An exploded 3D mechanical watch inspection with community design lab",
      category: "independent",
      status: "in_build",
    },
    {
      id: "episoda",
      name: "Episoda",
      description: "A streamlined episode progress tracker",
      category: "independent",
      status: "in_build",
    },
    {
      id: "athena",
      name: "Athena",
      description: "An acropolis of Greek gods",
      category: "independent",
      status: "in_build",
    },
    {
      id: "subawitha",
      name: "Subawitha",
      description: "A sophisticated music experience for Sinhala classics",
      category: "independent",
      status: "in_build",
    },
    {
      id: "zchema",
      name: "Zchema",
      description: "A schema migration safety tool with catalog features",
      category: "independent",
      status: "in_build",
    },
    {
      id: "utilia",
      name: "Utilia",
      description: "A convenient all-in-one SAAS tool suite",
      category: "independent",
      status: "in_build",
    },
    {
      id: "circle-plus",
      name: "Circle+",
      description: "A revived Google Plus",
      category: "independent",
      status: "in_build",
    },

    // Category 2: Projects Built for Organizations / Clients
    {
      id: "district",
      name: "District",
      description: "A next-level e-commerce platform",
      category: "commercial",
      status: "in_build",
    },
    {
      id: "sunshare",
      name: "SunShare",
      description: "A solar microgrid management app",
      category: "commercial",
      status: "in_build",
    },
    {
      id: "hotel-tamarind-tree",
      name: "Hotel Tamarind Tree",
      description: "Official Website for Hotel Tamarind Tree",
      category: "commercial",
      status: "in_build",
    },
    {
      id: "suvana",
      name: "Suvana",
      description: "A two-way bridge between deaf and hearing Sri Lankans",
      category: "commercial",
      status: "in_build",
    },
    {
      id: "paperless",
      name: "Paperless",
      description: "Digitalized Sri Lanka Telecom paper application forms",
      category: "commercial",
      status: "in_build",
    },
    {
      id: "interna",
      name: "Interna",
      description: "A fully-fledged Internship management platform",
      category: "commercial",
      status: "in_build",
    },
  ],
};
