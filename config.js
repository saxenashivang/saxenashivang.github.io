/* ============================================================
   PORTFOLIO CONFIG
   This is the ONLY file you need to edit to personalize the
   site. Fill in your details below and refresh the page.
   ============================================================ */

const CONFIG = {
  // ---------- Basics ----------
  name: "Shivang Saxena",
  firstName: "Shivang", // used for the logo & greeting
  tagline: "I build distributed systems and AI orchestration that feel instant.",
  // Roles cycle in the hero section with a typewriter effect
  roles: [
    "SDE III @ HighLevel",
    "Senior Full-Stack Engineer",
    "AI Orchestration Builder",
    "Distributed Systems Engineer",
    "Node.js & Go Expert",
  ],
  location: "India",
  email: "shivang5198@gmail.com",
  // Character avatar shown on the Character screen (path to an image).
  // Leave blank to show your initials instead.
  avatar: "assets/avatar.svg",

  // Short paragraph(s) for the About section
  about: [
    "Senior Full-Stack Engineer with 5+ years building distributed AI orchestration and low-latency systems at scale. Currently SDE III at HighLevel, working on the FSB dashboard.",
    "I'm an expert in Node.js and Go, specializing in multi-agent workflows, RAG pipelines, vector search, and fintech platforms. Along the way I've shipped backends serving 2M+ API requests a day at <100ms P95, built voice AI that responds in under 300ms, and cut cloud bills by 80%.",
    "When I'm not shipping, I'm exploring new tech and writing about what I learn.",
  ],

  // Link to your resume (PDF in the repo, Google Drive link, etc.)
  resumeUrl: "resume.pdf",

  // ---------- Social links (leave blank to hide) ----------
  socials: {
    github: "https://github.com/saxenashivang",
    linkedin: "https://www.linkedin.com/in/shivangsaxena",
    twitter: "",
    instagram: "",
  },

  // ---------- Skills ----------
  // Grouped by category — categories become inventory tabs.
  // Items can be a string (rarity auto-assigned) or
  // { name, rarity } with rarity: common | rare | epic | legendary.
  skills: [
    {
      category: "Backend & Languages",
      icon: "⚙️",
      items: [
        { name: "Node.js (NestJS)", rarity: "legendary" },
        { name: "Golang", rarity: "legendary" },
        { name: "TypeScript", rarity: "epic" },
        { name: "JavaScript", rarity: "epic" },
        { name: "SQL", rarity: "rare" },
        { name: "Python", rarity: "rare" },
        { name: "C++", rarity: "rare" },
      ],
    },
    {
      category: "AI & Data",
      icon: "🤖",
      items: [
        { name: "LLM Orchestration", rarity: "legendary" },
        { name: "RAG Pipelines", rarity: "epic" },
        { name: "Vector Databases", rarity: "epic" },
        { name: "LangChain", rarity: "rare" },
        { name: "Semantic Search", rarity: "rare" },
      ],
    },
    {
      category: "Architecture",
      icon: "🏗️",
      items: [
        { name: "Microservices", rarity: "legendary" },
        { name: "Event-Driven Systems", rarity: "epic" },
        { name: "gRPC", rarity: "epic" },
        { name: "Kafka", rarity: "epic" },
        { name: "WebSockets", rarity: "rare" },
        { name: "GraphQL", rarity: "rare" },
      ],
    },
    {
      category: "Databases",
      icon: "🗄️",
      items: [
        { name: "PostgreSQL", rarity: "epic" },
        { name: "Redis", rarity: "epic" },
        { name: "MongoDB", rarity: "rare" },
        { name: "ClickHouse", rarity: "rare" },
        { name: "Vector Stores", rarity: "rare" },
      ],
    },
    {
      category: "Infrastructure",
      icon: "☁️",
      items: [
        { name: "Kubernetes", rarity: "legendary" },
        { name: "AWS", rarity: "epic" },
        { name: "GCP", rarity: "epic" },
        { name: "Docker", rarity: "rare" },
        { name: "Terraform", rarity: "rare" },
        { name: "CI/CD (Jenkins)", rarity: "common" },
      ],
    },
  ],

  // ---------- Professional Journey ----------
  // Most recent first. `period` containing "Present" shows IN PROGRESS.
  experience: [
    {
      role: "SDE III",
      company: "HighLevel",
      companyUrl: "https://www.gohighlevel.com",
      period: "Mar 2026 — Present",
      location: "Remote, India",
      points: [
        "Working on the FSB dashboard — building and scaling core dashboard experiences for one of the world's largest agency-focused SaaS platforms.",
        "Shipping features end-to-end across the stack, from API design to polished frontend experiences.",
      ],
      tags: ["Full-Stack", "SaaS", "Dashboards"],
    },
    {
      role: "SDE III — Full Stack",
      company: "Battery Smart",
      companyUrl: "https://www.batterysmart.in",
      period: "Sep 2024 — Nov 2024",
      location: "India",
      points: [
        "Rapidly delivered 5+ production features across internal admin portals and customer-facing web apps using Node.js and React, improving operational efficiency for battery-swapping logistics.",
      ],
      tags: ["Node.js", "React"],
    },
    {
      role: "SDE III — Full Stack",
      company: "Mool",
      companyUrl: "",
      period: "Dec 2022 — Aug 2024",
      location: "India",
      points: [
        "Architected a distributed backend serving 5K+ concurrent users and 2M+ API requests/day across 5 Node.js microservices — 99.9% uptime and <100ms P95 latency via gRPC and Redis caching.",
        "Built a production RAG pipeline indexing 10M+ financial documents with <200ms semantic search (Pinecone/Weaviate), powering 50K+ monthly analyst queries and replacing hours of manual research with seconds.",
        "Engineered a multi-agent orchestration system processing 100K+ tool invocations/day with distributed session state in Redis and intelligent workflow routing.",
        "Delivered real-time Voice AI with <300ms end-to-end latency (STT → LLM → TTS over WebSocket), supporting 1K+ concurrent voice sessions at 99.5% uptime.",
        "Integrated financial account aggregators processing $10M+ monthly transactions across 50+ institutions with PCI-DSS compliant payments and multi-tenant RBAC for 10K+ users — zero PII breaches.",
        "Cut cloud infrastructure costs 80% ($50K → $10K/month) through Kubernetes spot-instance orchestration and autoscaling for GPU workloads.",
        "Migrated a monolith to event-driven microservices (Kafka, 10K events/sec) — 10x deployment frequency, P95 API latency down from 2s to <100ms.",
      ],
      tags: ["Node.js", "gRPC", "Kafka", "Redis", "Kubernetes", "RAG", "LLM"],
    },
    {
      role: "R&D Engineer → Senior R&D Engineer",
      company: "Deqode Labs",
      companyUrl: "https://deqode.com",
      period: "Mar 2021 — Nov 2022",
      location: "India",
      points: [
        "Led a 5-engineer team delivering a blockchain analytics platform processing 100K+ transactions/sec with <50ms query latency — generating $500K ARR from enterprise dashboards.",
        "Architected the SimplyNFT marketplace handling $2M+ in NFT transactions for 10K+ users using NestJS and Ethereum smart contracts (Solidity), at 99.8% uptime.",
        "Built real-time blockchain analytics processing 1M+ events/day via Kafka, enabling sub-second insights across 500+ crypto assets.",
        "Productionized open-source BI tools (Metabase, ToolJet) for 20+ enterprise clients at 99.7% SLA through custom caching and high-availability PostgreSQL replication.",
      ],
      tags: ["NestJS", "Solidity", "Kafka", "PostgreSQL"],
    },
    {
      role: "Software Engineer",
      company: "Appointy Inc",
      companyUrl: "https://www.appointy.com",
      period: "Oct 2020 — Mar 2021",
      location: "India",
      points: [
        "Engineered high-concurrency microservices for MatterSuite serving 50K+ legal professionals at 99.9% SLA — 25% workflow-efficiency gains from migrating a monolith to event-driven Go services (gRPC, Pub/Sub).",
        "Reduced query latency 60% (500ms → 200ms) for a case-management system handling 100K+ documents/day via PostgreSQL partitioning, connection pooling, and read replicas.",
      ],
      tags: ["Go", "gRPC", "PostgreSQL"],
    },
    {
      role: "Product Developer Intern",
      company: "Appointy Inc",
      companyUrl: "https://www.appointy.com",
      period: "Feb 2020 — Sep 2020",
      location: "India",
      points: [
        "Built domain-driven microservices in Go (gRPC, PostgreSQL) supporting 10K+ concurrent connections with connection pooling and context-aware timeouts.",
        "Developed internal CLI tooling that automated deployment workflows — 40% faster releases and zero manual configuration errors.",
      ],
      tags: ["Go", "gRPC", "CLI"],
    },
  ],

  // ---------- Education (rendered as unlocked trophies) ----------
  education: [
    {
      degree: "BE, Computer Science & Engineering",
      school: "LNCT Bhopal",
      period: "2017 — 2020",
      details: "CGPA: 7.86 · Core Member, GDSC LNCT Bhopal",
    },
    {
      degree: "System Design & Distributed Systems",
      school: "Scaler Academy",
      period: "2019 — 2021",
      details: "Data Structures, Algorithms, and Distributed Systems at Scale",
    },
    {
      degree: "Winner, Smart India Hackathon",
      school: "IIT BHU",
      period: "2019",
      details: "National-level hackathon winner",
    },
    {
      degree: "Diploma, Computer Science & Engineering",
      school: "Govt. Polytechnic",
      period: "2013 — 2016",
      details: "74.04%",
    },
  ],

  // ---------- Projects (Side Quests — leave empty array to hide) ----------
  projects: [
    {
      title: "Voice AI Engine",
      description: "Real-time STT → LLM → TTS pipeline over WebSockets with <300ms end-to-end latency, holding 1K+ concurrent voice sessions at 99.5% uptime — human-like responsiveness through stream optimization.",
      tech: ["Node.js", "WebSockets", "LLM", "Streaming"],
      liveUrl: "",
      repoUrl: "",
    },
    {
      title: "RAG Research Copilot",
      description: "Semantic search over 10M+ financial documents answering in <200ms, powering 50K+ analyst queries a month — turned hours of manual research into seconds.",
      tech: ["Pinecone", "Weaviate", "LangChain", "Vector Search"],
      liveUrl: "",
      repoUrl: "",
    },
    {
      title: "SimplyNFT Marketplace",
      description: "NFT marketplace that processed $2M+ in transactions for 10K+ users, with MetaMask wallet integration, gas-optimized Solidity contracts, and 99.8% uptime.",
      tech: ["NestJS", "Solidity", "Ethereum"],
      liveUrl: "",
      repoUrl: "",
    },
    {
      title: "Multi-Agent Orchestrator",
      description: "Agent workflow engine processing 100K+ tool invocations/day with distributed session state, context retention across 20+ concurrent conversations, and intelligent routing.",
      tech: ["Node.js", "Redis", "LLM Agents"],
      liveUrl: "",
      repoUrl: "",
    },
  ],

  // ---------- Blog ----------
  // To publish a post:
  //   1. Add a markdown file to the posts/ folder (e.g. posts/my-post.md)
  //   2. Add an entry here. `file` is the path to the markdown file.
  // Most recent first.
  blog: {
    enabled: true,
    posts: [
      {
        slug: "agentic-rag-guide",
        title: "The Complete Guide to Agentic RAG Engineering",
        date: "2026-06-12",
        summary: "From embeddings and hybrid retrieval to ReAct agents, HyDE, and RAGAS evaluation — everything I learned building a production RAG system over 10M+ documents.",
        tags: ["rag", "llm", "ai-engineering", "agents"],
        file: "posts/agentic-rag-guide.md",
      },
      {
        slug: "hello-world",
        title: "Hello, World — Why I Built This Site",
        date: "2026-06-12",
        summary: "Kicking off my blog with a short note on why I built this portfolio and what I plan to write about.",
        tags: ["meta", "writing"],
        file: "posts/hello-world.md",
      },
    ],
  },

  // ---------- Game settings (all optional) ----------
  game: {
    // Subtitle on the title screen. Defaults to "THE PORTFOLIO · <first role>".
    subtitle: "THE PORTFOLIO · SENIOR FULL-STACK ENGINEER",
    // Your level badge. Leave 0 to auto-compute from experience/skills/posts.
    level: 0,
    // Base stats shown on the Character screen (0–99). Leave empty to
    // auto-derive from your skill categories.
    stats: [
      { label: "Backend Engineering", value: 95 },
      { label: "Distributed Systems", value: 92 },
      { label: "AI / LLM Systems", value: 90 },
      { label: "Cloud & DevOps", value: 88 },
      { label: "Frontend", value: 82 },
      { label: "Coffee Resistance", value: 99 },
    ],
  },

  // ---------- Footer ----------
  footerNote: "Designed & built with ❤️",
};
