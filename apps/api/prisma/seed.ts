import { PrismaClient, UserRole, ProficiencyLevel, TaskType, TaskStatus, TaskDifficulty, PaymentType, ProductCategory, PricingModel, ProductStatus, HiringMode, ContractStatus, MilestoneStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// ── Helpers ──────────────────────────────────────────────────
function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
const NOW = new Date();

// ── Fixed IDs (stable across runs) ───────────────────────────
const IDS = {
  // Users
  adminUser:    '00000000-0000-0000-0000-000000000001',
  arjunUser:    '00000000-0000-0000-0000-000000000002',
  priyaUser:    '00000000-0000-0000-0000-000000000003',
  rohanUser:    '00000000-0000-0000-0000-000000000004',
  snehaUser:    '00000000-0000-0000-0000-000000000005',
  kiranUser:    '00000000-0000-0000-0000-000000000006',
  amitUser:     '00000000-0000-0000-0000-000000000007',
  deepaUser:    '00000000-0000-0000-0000-000000000008',
  vikramUser:   '00000000-0000-0000-0000-000000000009',
  techCorpUser: '00000000-0000-0000-0000-000000000010',
  neuralUser:   '00000000-0000-0000-0000-000000000011',
  infosysUser:  '00000000-0000-0000-0000-000000000012',
  buildUser:    '00000000-0000-0000-0000-000000000013',
  // Engineer profiles
  arjunProfile:  '00000000-0000-0000-0001-000000000001',
  priyaProfile:  '00000000-0000-0000-0001-000000000002',
  rohanProfile:  '00000000-0000-0000-0001-000000000003',
  snehaProfile:  '00000000-0000-0000-0001-000000000004',
  kiranProfile:  '00000000-0000-0000-0001-000000000005',
  amitProfile:   '00000000-0000-0000-0001-000000000006',
  deepaProfile:  '00000000-0000-0000-0001-000000000007',
  vikramProfile: '00000000-0000-0000-0001-000000000008',
  // Company profiles
  techCorpProfile: '00000000-0000-0000-0002-000000000001',
  neuralProfile:   '00000000-0000-0000-0002-000000000002',
  infosysProfile:  '00000000-0000-0000-0002-000000000003',
  buildProfile:    '00000000-0000-0000-0002-000000000004',
  // Tasks
  task1: '00000000-0000-0000-0003-000000000001',
  task2: '00000000-0000-0000-0003-000000000002',
  task3: '00000000-0000-0000-0003-000000000003',
  task4: '00000000-0000-0000-0003-000000000004',
  task5: '00000000-0000-0000-0003-000000000005',
  // Products
  prod1: '00000000-0000-0000-0004-000000000001',
  prod2: '00000000-0000-0000-0004-000000000002',
  prod3: '00000000-0000-0000-0004-000000000003',
  prod4: '00000000-0000-0000-0004-000000000004',
  prod5: '00000000-0000-0000-0004-000000000005',
  // Contracts
  contract1: '00000000-0000-0000-0005-000000000001',
  contract2: '00000000-0000-0000-0005-000000000002',
  contract3: '00000000-0000-0000-0005-000000000003',
  contract4: '00000000-0000-0000-0005-000000000004',
  // Wallets
  arjunWallet: '00000000-0000-0000-0006-000000000001',
  snehaWallet: '00000000-0000-0000-0006-000000000002',
};


async function seedUsers() {
  console.log('Creating users...');
  const users = [
    { id: IDS.adminUser,    clerkId: 'clerk_admin_001',    email: 'admin@neuronhire.in',      role: UserRole.admin },
    { id: IDS.arjunUser,    clerkId: 'clerk_eng_arjun',    email: 'arjun.sharma@dev.in',      role: UserRole.engineer },
    { id: IDS.priyaUser,    clerkId: 'clerk_eng_priya',    email: 'priya.nair@dev.in',        role: UserRole.engineer },
    { id: IDS.rohanUser,    clerkId: 'clerk_eng_rohan',    email: 'rohan.verma@dev.in',       role: UserRole.engineer },
    { id: IDS.snehaUser,    clerkId: 'clerk_eng_sneha',    email: 'sneha.patel@dev.in',       role: UserRole.engineer },
    { id: IDS.kiranUser,    clerkId: 'clerk_eng_kiran',    email: 'kiran.reddy@dev.in',       role: UserRole.engineer },
    { id: IDS.amitUser,     clerkId: 'clerk_eng_amit',     email: 'amit.joshi@dev.in',        role: UserRole.engineer },
    { id: IDS.deepaUser,    clerkId: 'clerk_eng_deepa',    email: 'deepa.menon@dev.in',       role: UserRole.engineer },
    { id: IDS.vikramUser,   clerkId: 'clerk_eng_vikram',   email: 'vikram.singh@dev.in',      role: UserRole.engineer },
    { id: IDS.techCorpUser, clerkId: 'clerk_co_techcorp',  email: 'hr@techcorp.in',           role: UserRole.company },
    { id: IDS.neuralUser,   clerkId: 'clerk_co_neural',    email: 'founder@aistartup.in',     role: UserRole.company },
    { id: IDS.infosysUser,  clerkId: 'clerk_co_infosys',   email: 'talent@bigenterprise.in',  role: UserRole.company },
    { id: IDS.buildUser,    clerkId: 'clerk_co_build',     email: 'new@startup.in',           role: UserRole.company },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, isEmailVerified: true },
    });
  }
  console.log('  Created 13 users (1 admin, 8 engineers, 4 companies)');
}

async function seedEngineerProfiles() {
  console.log('Creating engineer profiles...');

  const profiles = [
    {
      id: IDS.arjunProfile, userId: IDS.arjunUser,
      fullName: 'Arjun Sharma',
      bio: 'Senior AI engineer specialising in LLM applications, RAG pipelines, and multi-agent systems. 5+ years building production AI at scale.',
      location: 'Bengaluru, India',
      githubUrl: 'https://github.com/arjunsharma-ai',
      linkedinUrl: 'https://linkedin.com/in/arjunsharma-ai',
      yearsOfExperience: 5,
      hourlyRate: 4500,
      availabilityStatus: 'available_now',
      neuronScore: 820, neuronTier: 'elite',
      completenessScore: 95,
      basicInfoComplete: true, skillsComplete: true, experienceComplete: true,
      projectsComplete: true, pricingComplete: true, paymentComplete: true,
    },
    {
      id: IDS.priyaProfile, userId: IDS.priyaUser,
      fullName: 'Priya Nair',
      bio: 'ML engineer focused on computer vision and edge deployment. Built defect detection systems deployed in 12 factories.',
      location: 'Hyderabad, India',
      yearsOfExperience: 4,
      hourlyRate: 3200,
      availabilityStatus: 'available_now',
      neuronScore: 640, neuronTier: 'professional',
      completenessScore: 88,
      basicInfoComplete: true, skillsComplete: true, experienceComplete: true,
      projectsComplete: true, pricingComplete: true, paymentComplete: true,
    },
    {
      id: IDS.rohanProfile, userId: IDS.rohanUser,
      fullName: 'Rohan Verma',
      bio: 'NLP engineer specialising in multilingual AI and fine-tuning for Indian languages.',
      location: 'Mumbai, India',
      yearsOfExperience: 3,
      hourlyRate: 2800,
      availabilityStatus: 'available_now',
      neuronScore: 590, neuronTier: 'professional',
      completenessScore: 82,
      basicInfoComplete: true, skillsComplete: true, experienceComplete: true,
      projectsComplete: true, pricingComplete: true, paymentComplete: false,
    },
    {
      id: IDS.snehaProfile, userId: IDS.snehaUser,
      fullName: 'Sneha Patel',
      bio: 'AI automation engineer. Expert in n8n and Zapier workflows that save teams 20+ hours per week.',
      location: 'Ahmedabad, India',
      yearsOfExperience: 2,
      hourlyRate: 1800,
      availabilityStatus: 'available_now',
      neuronScore: 450, neuronTier: 'verified',
      completenessScore: 78,
      basicInfoComplete: true, skillsComplete: true, experienceComplete: true,
      projectsComplete: true, pricingComplete: true, paymentComplete: true,
    },
    {
      id: IDS.kiranProfile, userId: IDS.kiranUser,
      fullName: 'Kiran Reddy',
      bio: 'Data engineer building ML pipelines and feature stores on Airflow and dbt.',
      location: 'Pune, India',
      yearsOfExperience: 3,
      hourlyRate: 2200,
      availabilityStatus: 'available_now',
      neuronScore: 420, neuronTier: 'verified',
      completenessScore: 75,
      basicInfoComplete: true, skillsComplete: true, experienceComplete: true,
      projectsComplete: false, pricingComplete: true, paymentComplete: false,
    },
    {
      id: IDS.amitProfile, userId: IDS.amitUser,
      fullName: 'Amit Joshi',
      bio: 'AI enthusiast building my first ML projects. Learning PyTorch and TensorFlow.',
      location: 'Jaipur, India',
      yearsOfExperience: 0,
      hourlyRate: 800,
      availabilityStatus: 'available_now',
      neuronScore: 280, neuronTier: 'conditional',
      completenessScore: 55,
      basicInfoComplete: true, skillsComplete: true, experienceComplete: false,
      projectsComplete: false, pricingComplete: false, paymentComplete: false,
    },
    {
      id: IDS.deepaProfile, userId: IDS.deepaUser,
      fullName: 'Deepa Menon',
      bio: 'Backend engineer transitioning to AI. Strong Python and FastAPI background.',
      location: 'Chennai, India',
      yearsOfExperience: 4,
      hourlyRate: 2000,
      availabilityStatus: 'available_now',
      neuronScore: 0, neuronTier: 'conditional',
      completenessScore: 80,
      basicInfoComplete: true, skillsComplete: true, experienceComplete: true,
      projectsComplete: true, pricingComplete: false, paymentComplete: false,
    },
    {
      id: IDS.vikramProfile, userId: IDS.vikramUser,
      fullName: 'Vikram Singh',
      bio: 'Just getting started with AI.',
      location: 'Delhi, India',
      yearsOfExperience: 1,
      hourlyRate: 500,
      availabilityStatus: 'available_now',
      neuronScore: 0, neuronTier: 'conditional',
      completenessScore: 40,
      basicInfoComplete: true, skillsComplete: false, experienceComplete: false,
      projectsComplete: false, pricingComplete: false, paymentComplete: false,
    },
  ];

  for (const p of profiles) {
    await prisma.engineerProfile.upsert({
      where: { userId: p.userId },
      update: { neuronScore: p.neuronScore, neuronTier: p.neuronTier, completenessScore: p.completenessScore },
      create: { ...p, upiId: 'engineer@paytm' },
    });
  }
  console.log('  Created 8 engineer profiles');
}

async function seedSkills() {
  console.log('Creating skills...');
  const skillSets = [
    { profileId: IDS.arjunProfile, skills: [
      { skillName: 'Python',      proficiencyLevel: ProficiencyLevel.expert,       yearsOfExperience: 5 },
      { skillName: 'LangChain',   proficiencyLevel: ProficiencyLevel.expert,       yearsOfExperience: 3 },
      { skillName: 'OpenAI API',  proficiencyLevel: ProficiencyLevel.expert,       yearsOfExperience: 3 },
      { skillName: 'FastAPI',     proficiencyLevel: ProficiencyLevel.expert,       yearsOfExperience: 4 },
      { skillName: 'PostgreSQL',  proficiencyLevel: ProficiencyLevel.intermediate, yearsOfExperience: 3 },
      { skillName: 'Docker',      proficiencyLevel: ProficiencyLevel.intermediate, yearsOfExperience: 3 },
      { skillName: 'RAG Systems', proficiencyLevel: ProficiencyLevel.expert,       yearsOfExperience: 2 },
    ]},
    { profileId: IDS.priyaProfile, skills: [
      { skillName: 'Python',     proficiencyLevel: ProficiencyLevel.expert,       yearsOfExperience: 4 },
      { skillName: 'PyTorch',    proficiencyLevel: ProficiencyLevel.expert,       yearsOfExperience: 3 },
      { skillName: 'OpenCV',     proficiencyLevel: ProficiencyLevel.expert,       yearsOfExperience: 3 },
      { skillName: 'TensorFlow', proficiencyLevel: ProficiencyLevel.intermediate, yearsOfExperience: 2 },
      { skillName: 'ONNX',       proficiencyLevel: ProficiencyLevel.expert,       yearsOfExperience: 2 },
    ]},
    { profileId: IDS.rohanProfile, skills: [
      { skillName: 'Python',      proficiencyLevel: ProficiencyLevel.expert,       yearsOfExperience: 3 },
      { skillName: 'HuggingFace', proficiencyLevel: ProficiencyLevel.expert,       yearsOfExperience: 2 },
      { skillName: 'Hindi NLP',   proficiencyLevel: ProficiencyLevel.expert,       yearsOfExperience: 2 },
      { skillName: 'BERT',        proficiencyLevel: ProficiencyLevel.expert,       yearsOfExperience: 2 },
      { skillName: 'Llama',       proficiencyLevel: ProficiencyLevel.intermediate, yearsOfExperience: 1 },
    ]},
    { profileId: IDS.snehaProfile, skills: [
      { skillName: 'Python',     proficiencyLevel: ProficiencyLevel.intermediate, yearsOfExperience: 2 },
      { skillName: 'n8n',        proficiencyLevel: ProficiencyLevel.expert,       yearsOfExperience: 2 },
      { skillName: 'Zapier',     proficiencyLevel: ProficiencyLevel.expert,       yearsOfExperience: 2 },
      { skillName: 'OpenAI API', proficiencyLevel: ProficiencyLevel.intermediate, yearsOfExperience: 1 },
    ]},
    { profileId: IDS.kiranProfile, skills: [
      { skillName: 'Python',        proficiencyLevel: ProficiencyLevel.expert,       yearsOfExperience: 3 },
      { skillName: 'Apache Spark',  proficiencyLevel: ProficiencyLevel.intermediate, yearsOfExperience: 2 },
      { skillName: 'Airflow',       proficiencyLevel: ProficiencyLevel.expert,       yearsOfExperience: 2 },
      { skillName: 'dbt',           proficiencyLevel: ProficiencyLevel.expert,       yearsOfExperience: 2 },
    ]},
    { profileId: IDS.amitProfile, skills: [
      { skillName: 'Python',     proficiencyLevel: ProficiencyLevel.beginner, yearsOfExperience: 1 },
      { skillName: 'TensorFlow', proficiencyLevel: ProficiencyLevel.beginner, yearsOfExperience: 0 },
    ]},
    { profileId: IDS.deepaProfile, skills: [
      { skillName: 'Python',  proficiencyLevel: ProficiencyLevel.expert,       yearsOfExperience: 4 },
      { skillName: 'FastAPI', proficiencyLevel: ProficiencyLevel.expert,       yearsOfExperience: 3 },
      { skillName: 'Docker',  proficiencyLevel: ProficiencyLevel.intermediate, yearsOfExperience: 2 },
    ]},
  ];

  for (const { profileId, skills } of skillSets) {
    // Delete existing skills for idempotency
    await prisma.engineerSkill.deleteMany({ where: { engineerProfileId: profileId } });
    for (const skill of skills) {
      await prisma.engineerSkill.create({
        data: { id: uuidv4(), engineerProfileId: profileId, ...skill },
      });
    }
  }
  console.log('  Created skills for 7 engineers');
}

async function seedCompanyProfiles() {
  console.log('Creating company profiles...');
  const companies = [
    {
      id: IDS.techCorpProfile, userId: IDS.techCorpUser,
      companyName: 'TechCorp India Pvt Ltd',
      description: 'Leading fintech company building AI-powered payment and fraud detection systems for 50M+ users.',
      website: 'https://techcorp.in',
      industry: 'FinTech', size: '51-200', location: 'Bengaluru, India',
      trustScore: 88, websiteVerified: true, gstVerified: true,
      isHiring: true,
      hiringIntents: ['full_time', 'project', 'bounty'],
      aiRequirements: ['chatbots', 'agents', 'data'],
    },
    {
      id: IDS.neuralProfile, userId: IDS.neuralUser,
      companyName: 'NeuralForge AI',
      description: 'Early-stage startup building AI tools for healthcare diagnostics and patient management.',
      website: 'https://neuralforge.ai',
      industry: 'Healthcare AI', size: '1-10', location: 'Bengaluru, India',
      trustScore: 72, websiteVerified: true, gstVerified: false,
      isHiring: true,
      hiringIntents: ['freelance', 'project'],
      aiRequirements: ['nlp', 'automation', 'agents'],
    },
    {
      id: IDS.infosysProfile, userId: IDS.infosysUser,
      companyName: 'Infosys AI Division',
      description: 'Enterprise AI division of Infosys, building AI solutions for Fortune 500 clients.',
      website: 'https://infosys.com/ai',
      industry: 'Enterprise Software', size: '1000+', location: 'Bengaluru, India',
      trustScore: 95, websiteVerified: true, gstVerified: true,
      isHiring: true,
      hiringIntents: ['full_time'],
      aiRequirements: ['nlp', 'agents', 'mlops'],
    },
    {
      id: IDS.buildProfile, userId: IDS.buildUser,
      companyName: 'BuildFast Labs',
      description: 'EdTech startup using AI to personalise learning experiences.',
      website: 'https://buildfastlabs.in',
      industry: 'EdTech', size: '1-10', location: 'Pune, India',
      trustScore: 55, websiteVerified: false, gstVerified: false,
      isHiring: true,
      hiringIntents: ['freelance'],
      aiRequirements: ['chatbots', 'nlp'],
    },
  ];
  for (const c of companies) {
    await prisma.companyProfile.upsert({
      where: { userId: c.userId },
      update: { trustScore: c.trustScore, isHiring: c.isHiring },
      create: c,
    });
  }
  console.log('  Created 4 company profiles');
}

async function seedProjects() {
  console.log('Creating projects...');
  await prisma.engineerProject.deleteMany({ where: { engineerProfileId: { in: [IDS.arjunProfile, IDS.priyaProfile, IDS.rohanProfile, IDS.snehaProfile] } } });

  const projects = [
    // Arjun - 3 projects
    { engineerProfileId: IDS.arjunProfile, title: 'AI Customer Support Agent',
      description: 'Production-ready multi-agent customer support system using LangChain and GPT-4.',
      problemSolved: 'Reduced support ticket volume by 60% for a 50K user SaaS platform.',
      techStack: JSON.stringify(['LangChain', 'GPT-4', 'FastAPI', 'Redis', 'PostgreSQL']),
      aiModelUsed: 'GPT-4', architectureType: 'Multi-agent orchestration',
      performanceMetrics: JSON.stringify([{ label: 'Ticket Reduction', value: '60%' }, { label: 'CSAT', value: '4.8/5' }]),
      featured: true, displayOrder: 1 },
    { engineerProfileId: IDS.arjunProfile, title: 'RAG Document Q&A System',
      description: '50K document corpus with hybrid BM25 + dense retrieval achieving 94% accuracy.',
      problemSolved: 'Legal firm needed instant answers from 50K+ case documents.',
      techStack: JSON.stringify(['LangChain', 'Pinecone', 'FastAPI', 'Docker']),
      aiModelUsed: 'GPT-4', architectureType: 'RAG pipeline',
      performanceMetrics: JSON.stringify([{ label: 'Accuracy', value: '94%' }, { label: 'Latency', value: '180ms' }]),
      featured: true, displayOrder: 2 },
    { engineerProfileId: IDS.arjunProfile, title: 'Automated Code Review Bot',
      description: 'GitHub App that reviews PRs using Claude, flags security issues and suggests improvements.',
      problemSolved: 'Engineering team spending 3hrs/day on code reviews.',
      techStack: JSON.stringify(['Claude', 'GitHub API', 'Node.js', 'TypeScript']),
      aiModelUsed: 'Claude', architectureType: 'Event-driven agent',
      performanceMetrics: JSON.stringify([{ label: 'Review Time', value: '-80%' }, { label: 'Issues Caught', value: '94%' }]),
      featured: false, displayOrder: 3 },
    // Priya - 2 projects
    { engineerProfileId: IDS.priyaProfile, title: 'Real-time Defect Detection System',
      description: 'Computer vision system detecting manufacturing defects at 30fps with 99.2% accuracy.',
      problemSolved: 'Manual QA missing 8% of defects on production line.',
      techStack: JSON.stringify(['PyTorch', 'OpenCV', 'ONNX', 'FastAPI']),
      aiModelUsed: 'Custom PyTorch', architectureType: 'CNN inference pipeline',
      performanceMetrics: JSON.stringify([{ label: 'Accuracy', value: '99.2%' }, { label: 'FPS', value: '30' }]),
      featured: true, displayOrder: 1 },
    { engineerProfileId: IDS.priyaProfile, title: 'Face Recognition Attendance System',
      description: 'Deployed in 12 schools across Maharashtra. 99.8% recognition accuracy.',
      problemSolved: 'Manual attendance taking 20 minutes per class.',
      techStack: JSON.stringify(['PyTorch', 'OpenCV', 'FastAPI', 'PostgreSQL']),
      aiModelUsed: 'Custom PyTorch', architectureType: 'Face recognition pipeline',
      performanceMetrics: JSON.stringify([{ label: 'Accuracy', value: '99.8%' }, { label: 'Schools', value: '12' }]),
      featured: true, displayOrder: 2 },
    // Rohan - 2 projects
    { engineerProfileId: IDS.rohanProfile, title: 'Hindi-English Code-Switch Sentiment Analyzer',
      description: 'NLP model handling Hinglish text with 91% accuracy on social media data.',
      problemSolved: 'Brands unable to analyse mixed Hindi-English customer feedback.',
      techStack: JSON.stringify(['HuggingFace', 'BERT', 'Python', 'FastAPI']),
      aiModelUsed: 'mBERT', architectureType: 'Fine-tuned transformer',
      performanceMetrics: JSON.stringify([{ label: 'Accuracy', value: '91%' }, { label: 'Languages', value: '2' }]),
      featured: true, displayOrder: 1 },
    { engineerProfileId: IDS.rohanProfile, title: 'Legal Document Summarizer',
      description: 'Fine-tuned on 10K Indian court judgments. Reduces 50-page judgments to 1-page summaries.',
      problemSolved: 'Lawyers spending 4hrs reading each judgment.',
      techStack: JSON.stringify(['HuggingFace', 'Llama', 'Python', 'FastAPI']),
      aiModelUsed: 'Llama 3', architectureType: 'Fine-tuned LLM',
      performanceMetrics: JSON.stringify([{ label: 'Time Saved', value: '85%' }, { label: 'ROUGE-L', value: '0.72' }]),
      featured: true, displayOrder: 2 },
    // Sneha - 1 project
    { engineerProfileId: IDS.snehaProfile, title: '50-Step Lead Nurture Automation',
      description: 'n8n workflow automating lead qualification, scoring, and nurturing for a B2B SaaS.',
      problemSolved: 'Sales team spending 20hrs/week on manual lead follow-up.',
      techStack: JSON.stringify(['n8n', 'OpenAI API', 'HubSpot', 'Slack']),
      aiModelUsed: 'GPT-3.5', architectureType: 'Workflow automation',
      performanceMetrics: JSON.stringify([{ label: 'Hours Saved', value: '20/week' }, { label: 'Lead Conversion', value: '+34%' }]),
      featured: true, displayOrder: 1 },
  ];

  for (const p of projects) {
    await prisma.engineerProject.create({ data: { id: uuidv4(), ...p } });
  }
  console.log('  Created 8 projects across 4 engineers');
}

async function seedAssessments() {
  console.log('Creating assessments...');
  const assessments = [
    {
      userId: IDS.arjunUser, engineerProfileId: IDS.arjunProfile,
      sessionId: 'sess-arjun-001', skillsAssessed: ['LangChain', 'RAG Systems', 'FastAPI'],
      experienceLevel: 'senior',
      mcqQuestions: JSON.stringify([]), codingTasks: JSON.stringify([]),
      mcqScore: 88, codingScore: 90, caseScore: 85, overallScore: 88,
      modelKnowledge: 90, engineeringDepth: 88, systemDesign: 85,
      codingQuality: 92, practicalApp: 87, communication: 84,
      tier: 'elite', status: 'evaluated',
      startedAt: subDays(NOW, 90), submittedAt: subDays(NOW, 90), evaluatedAt: subDays(NOW, 89),
    },
    {
      userId: IDS.priyaUser, engineerProfileId: IDS.priyaProfile,
      sessionId: 'sess-priya-001', skillsAssessed: ['PyTorch', 'OpenCV', 'ONNX'],
      experienceLevel: 'mid',
      mcqQuestions: JSON.stringify([]), codingTasks: JSON.stringify([]),
      mcqScore: 74, codingScore: 76, caseScore: 70, overallScore: 74,
      modelKnowledge: 75, engineeringDepth: 78, systemDesign: 70,
      codingQuality: 76, practicalApp: 72, communication: 68,
      tier: 'professional', status: 'evaluated',
      startedAt: subDays(NOW, 60), submittedAt: subDays(NOW, 60), evaluatedAt: subDays(NOW, 59),
    },
    {
      userId: IDS.amitUser, engineerProfileId: IDS.amitProfile,
      sessionId: 'sess-amit-001', skillsAssessed: ['Python', 'TensorFlow'],
      experienceLevel: 'junior',
      mcqQuestions: JSON.stringify([]), codingTasks: JSON.stringify([]),
      mcqScore: 48, codingScore: 45, caseScore: 52, overallScore: 48,
      modelKnowledge: 50, engineeringDepth: 42, systemDesign: 48,
      codingQuality: 45, practicalApp: 50, communication: 55,
      tier: 'conditional', status: 'evaluated',
      startedAt: subDays(NOW, 30), submittedAt: subDays(NOW, 30), evaluatedAt: subDays(NOW, 29),
    },
  ];
  for (const a of assessments) {
    await prisma.assessment.upsert({
      where: { sessionId: a.sessionId },
      update: {},
      create: { id: uuidv4(), ...a, proctoringEvents: JSON.stringify([]) },
    });
  }
  console.log('  Created 3 assessments');
}

async function seedNeuronScoreHistory() {
  console.log('Creating NeuronScore history...');
  await prisma.neuronScoreHistory.deleteMany({ where: { engineerProfileId: IDS.arjunProfile } });
  const history = [
    { delta: 200, score: 200, prev: 0,   reason: 'Account created',              days: 90 },
    { delta: 120, score: 320, prev: 200, reason: 'Assessment completed: elite',  days: 89 },
    { delta: 80,  score: 400, prev: 320, reason: 'Profile 80% complete',         days: 75 },
    { delta: 50,  score: 450, prev: 400, reason: 'First project added',          days: 60 },
    { delta: 100, score: 550, prev: 450, reason: 'First contract completed',     days: 45 },
    { delta: 60,  score: 610, prev: 550, reason: '5-star review received',       days: 35 },
    { delta: 80,  score: 690, prev: 610, reason: 'Second contract completed',    days: 25 },
    { delta: 50,  score: 740, prev: 690, reason: 'Marketplace product published',days: 20 },
    { delta: 40,  score: 780, prev: 740, reason: 'Bounty won',                   days: 15 },
    { delta: 40,  score: 820, prev: 780, reason: 'Profile completeness 95%',     days: 5  },
  ];
  for (const h of history) {
    await prisma.neuronScoreHistory.create({
      data: {
        id: uuidv4(), engineerProfileId: IDS.arjunProfile,
        previousScore: h.prev, newScore: h.score, scoreDelta: h.delta,
        reason: h.reason, triggeredBy: 'system',
        createdAt: subDays(NOW, h.days),
      },
    });
  }
  console.log('  Created 10 NeuronScore history entries for Arjun');
}

async function seedTasks() {
  console.log('Creating tasks...');
  const tasks = [
    {
      id: IDS.task1, companyProfileId: IDS.techCorpProfile, userId: IDS.techCorpUser,
      title: 'Build an AI-powered UPI fraud detection system',
      type: TaskType.bounty, category: ['AI Agents', 'Data Analysis'],
      problemStatement: 'We process 2M UPI transactions daily and need an AI system to detect fraud in real-time with <10ms latency.',
      expectedOutcome: 'Production-ready fraud detection API with 99%+ precision, <10ms p99 latency, deployed on AWS.',
      deliverables: JSON.stringify([
        { title: 'Fraud detection model', description: 'Trained GNN model with evaluation report' },
        { title: 'REST API', description: 'FastAPI service with OpenAPI docs' },
        { title: 'Load test report', description: 'Performance at 50K TPS' },
      ]),
      techRequirements: ['Python', 'PyTorch', 'FastAPI', 'Redis', 'Kafka'],
      timeline: 21, deadline: addDays(NOW, 21),
      rewardAmount: 85000, paymentType: PaymentType.fixed, currency: 'INR',
      selectionCriteria: JSON.stringify({ criteria: ['accuracy', 'latency', 'code_quality'] }),
      minNeuronScore: 600, ndaRequired: false, difficulty: TaskDifficulty.hard,
      status: TaskStatus.open, escrowDeposited: true,
      aiEnriched: true, postingQuality: 9,
      participantCount: 2, submissionCount: 0,
      publishedAt: subDays(NOW, 3),
    },
    {
      id: IDS.task2, companyProfileId: IDS.neuralProfile, userId: IDS.neuralUser,
      title: 'Hindi chatbot for patient appointment scheduling',
      type: TaskType.bounty, category: ['NLP', 'Chatbots'],
      problemStatement: 'Our clinic needs a Hindi-language chatbot to handle appointment booking, reminders, and basic medical queries.',
      expectedOutcome: 'WhatsApp-integrated Hindi chatbot with 90%+ intent recognition accuracy.',
      deliverables: JSON.stringify([
        { title: 'Chatbot model', description: 'Fine-tuned Hindi NLP model' },
        { title: 'WhatsApp integration', description: 'Twilio WhatsApp API integration' },
      ]),
      techRequirements: ['Python', 'HuggingFace', 'Twilio', 'FastAPI'],
      timeline: 14, deadline: addDays(NOW, 14),
      rewardAmount: 35000, paymentType: PaymentType.fixed, currency: 'INR',
      selectionCriteria: JSON.stringify({ criteria: ['accuracy', 'hindi_quality'] }),
      minNeuronScore: 400, ndaRequired: false, difficulty: TaskDifficulty.medium,
      status: TaskStatus.open, escrowDeposited: true,
      aiEnriched: true, postingQuality: 8,
      participantCount: 1, submissionCount: 0,
      publishedAt: subDays(NOW, 2),
    },
    {
      id: IDS.task3, companyProfileId: IDS.infosysProfile, userId: IDS.infosysUser,
      title: 'Best AI-powered code review tool — Open Contest',
      type: TaskType.contest, category: ['AI Agents', 'Developer Tools'],
      problemStatement: 'Build the best AI code review tool. Top 3 solutions win prizes.',
      expectedOutcome: 'GitHub App that reviews PRs, flags issues, and suggests improvements.',
      deliverables: JSON.stringify([
        { title: 'GitHub App', description: 'Working GitHub App with PR review capability' },
        { title: 'Benchmark results', description: 'Performance on our test PR dataset' },
      ]),
      techRequirements: ['Python', 'LLM', 'GitHub API'],
      timeline: 30, deadline: addDays(NOW, 30),
      rewardAmount: 85000, paymentType: PaymentType.fixed, currency: 'INR',
      selectionCriteria: JSON.stringify({ criteria: ['accuracy', 'code_quality', 'ux'] }),
      minNeuronScore: 500, ndaRequired: false, difficulty: TaskDifficulty.expert,
      status: TaskStatus.open, escrowDeposited: true,
      isContest: true, maxWinners: 3,
      contestRanks: JSON.stringify([{ rank: 1, amount: 50000 }, { rank: 2, amount: 25000 }, { rank: 3, amount: 10000 }]),
      aiEnriched: true, postingQuality: 9,
      participantCount: 2, submissionCount: 0,
      publishedAt: subDays(NOW, 1),
    },
    {
      id: IDS.task4, companyProfileId: IDS.techCorpProfile, userId: IDS.techCorpUser,
      title: 'Automate invoice processing with OCR + LLM',
      type: TaskType.bounty, category: ['Automation', 'Finance'],
      problemStatement: 'Process 500+ invoices daily automatically.',
      expectedOutcome: 'Invoice processing pipeline with 98%+ extraction accuracy.',
      deliverables: JSON.stringify([{ title: 'Processing pipeline', description: 'End-to-end invoice automation' }]),
      techRequirements: ['Python', 'Claude', 'Tesseract', 'FastAPI'],
      timeline: 14, deadline: subDays(NOW, 1),
      rewardAmount: 28000, paymentType: PaymentType.fixed, currency: 'INR',
      selectionCriteria: JSON.stringify({ criteria: ['accuracy'] }),
      minNeuronScore: 300, ndaRequired: false, difficulty: TaskDifficulty.medium,
      status: TaskStatus.completed, escrowDeposited: true,
      aiEnriched: true, postingQuality: 7,
      participantCount: 1, submissionCount: 1,
      publishedAt: subDays(NOW, 20), completedAt: subDays(NOW, 1),
    },
    {
      id: IDS.task5, companyProfileId: IDS.neuralProfile, userId: IDS.neuralUser,
      title: 'Fine-tune Llama 3 on medical Q&A dataset',
      type: TaskType.direct, category: ['Fine-tuning', 'Healthcare'],
      problemStatement: 'Fine-tune Llama 3 8B on our 50K medical Q&A pairs for patient-facing chatbot.',
      expectedOutcome: 'Fine-tuned model with 85%+ accuracy on our medical benchmark.',
      deliverables: JSON.stringify([{ title: 'Fine-tuned model', description: 'LoRA adapters + evaluation report' }]),
      techRequirements: ['Python', 'HuggingFace', 'LoRA', 'CUDA'],
      timeline: 21, deadline: addDays(NOW, 21),
      rewardAmount: 55000, paymentType: PaymentType.fixed, currency: 'INR',
      selectionCriteria: JSON.stringify({ criteria: ['accuracy', 'efficiency'] }),
      minNeuronScore: 550, ndaRequired: true, difficulty: TaskDifficulty.expert,
      status: TaskStatus.open, escrowDeposited: true,
      aiEnriched: true, postingQuality: 8,
      participantCount: 0, submissionCount: 0,
      publishedAt: subDays(NOW, 1),
    },
  ];
  for (const t of tasks) {
    await prisma.task.upsert({
      where: { id: t.id },
      update: { status: t.status, participantCount: t.participantCount },
      create: t,
    });
  }
  console.log('  Created 5 tasks/bounties');
}

async function seedTaskParticipations() {
  console.log('Creating task participations...');
  const participations = [
    { taskId: IDS.task1, engineerProfileId: IDS.arjunProfile, userId: IDS.arjunUser,
      approach: 'I will use a Graph Neural Network with PyTorch Geometric, processing transaction graphs in real-time via Kafka.',
      estimatedTime: 18, approved: true },
    { taskId: IDS.task1, engineerProfileId: IDS.priyaProfile, userId: IDS.priyaUser,
      approach: 'Combining GNN with traditional ML features for ensemble approach.',
      estimatedTime: 20, approved: true },
    { taskId: IDS.task2, engineerProfileId: IDS.rohanProfile, userId: IDS.rohanUser,
      approach: 'Fine-tune IndicBERT on medical appointment domain data for Hindi intent classification.',
      estimatedTime: 12, approved: true },
    { taskId: IDS.task3, engineerProfileId: IDS.arjunProfile, userId: IDS.arjunUser,
      approach: 'Using Claude 3.5 Sonnet with custom prompts trained on 10K PR review examples.',
      estimatedTime: 25, approved: true },
    { taskId: IDS.task3, engineerProfileId: IDS.rohanProfile, userId: IDS.rohanUser,
      approach: 'Fine-tuned CodeLlama for code review with security vulnerability detection.',
      estimatedTime: 28, approved: true },
  ];
  for (const p of participations) {
    const existing = await prisma.taskParticipation.findUnique({
      where: { taskId_engineerProfileId: { taskId: p.taskId, engineerProfileId: p.engineerProfileId } },
    });
    if (!existing) {
      await prisma.taskParticipation.create({ data: { id: uuidv4(), ...p } });
    }
  }
  console.log('  Created 5 task participations');
}

async function seedProducts() {
  console.log('Creating marketplace products...');
  const products = [
    {
      id: IDS.prod1, engineerProfileId: IDS.arjunProfile, userId: IDS.arjunUser,
      name: 'SupportBot Pro — AI Customer Support Agent',
      slug: 'supportbot-pro-ai-customer-support',
      tagline: 'Deploy a production-ready AI support agent in 30 minutes',
      category: ProductCategory.ai_agents,
      tags: ['LangChain', 'GPT-4', 'Multi-agent', 'Support'],
      thumbnailUrl: 'https://neuronhire-uploads.s3.amazonaws.com/products/supportbot-thumb.png',
      description: 'A complete multi-agent customer support system that handles 67% of tickets without human intervention. Built on LangChain with 5 specialised agents.',
      demoUrl: 'https://demo.supportbot.pro',
      screenshots: [],
      techStack: JSON.stringify(['Python', 'LangChain', 'GPT-4', 'FastAPI', 'Redis']),
      aiModelUsed: 'GPT-4', architectureType: 'Multi-agent orchestration',
      pricingModel: PricingModel.one_time, priceINR: 4999,
      features: JSON.stringify([
        { icon: '🤖', text: '5 specialised agents (triage, knowledge, escalation, billing, feedback)' },
        { icon: '📉', text: '67% reduction in human escalations' },
        { icon: '🔗', text: 'CRM integrations (Zendesk, Freshdesk, HubSpot)' },
      ]),
      deliveryType: 'source_code',
      customizationAvailable: true,
      supportType: 'Email + GitHub Issues', supportDuration: '6 months',
      status: ProductStatus.published, publishedAt: subDays(NOW, 45),
      viewCount: 1240, purchaseCount: 23, rating: 4.8, reviewCount: 4,
    },
    {
      id: IDS.prod2, engineerProfileId: IDS.priyaProfile, userId: IDS.priyaUser,
      name: 'VisionGuard — Real-time Defect Detection API',
      slug: 'visionguard-defect-detection-api',
      tagline: '99.2% accuracy defect detection at 30fps via REST API',
      category: ProductCategory.apis_microservices,
      tags: ['Computer Vision', 'PyTorch', 'ONNX', 'Manufacturing'],
      thumbnailUrl: 'https://neuronhire-uploads.s3.amazonaws.com/products/visionguard-thumb.png',
      description: 'Production-ready defect detection API built on PyTorch and ONNX. Processes images at 30fps with 99.2% accuracy.',
      demoUrl: 'https://demo.visionguard.ai',
      screenshots: [],
      techStack: JSON.stringify(['Python', 'PyTorch', 'ONNX', 'FastAPI', 'Docker']),
      aiModelUsed: 'Custom PyTorch', architectureType: 'CNN inference pipeline',
      pricingModel: PricingModel.subscription, priceINR: 2999,
      features: JSON.stringify([
        { icon: '⚡', text: '30fps real-time processing' },
        { icon: '🎯', text: '99.2% accuracy on standard benchmarks' },
        { icon: '🔌', text: 'REST API with OpenAPI docs' },
      ]),
      deliveryType: 'api_access',
      customizationAvailable: false,
      supportType: 'Email', supportDuration: '12 months',
      status: ProductStatus.published, publishedAt: subDays(NOW, 30),
      viewCount: 680, purchaseCount: 8, rating: 4.6, reviewCount: 3,
    },
    {
      id: IDS.prod3, engineerProfileId: IDS.rohanProfile, userId: IDS.rohanUser,
      name: 'IndoNLP Dataset — 500K Hindi-English Sentence Pairs',
      slug: 'indonlp-dataset-hindi-english',
      tagline: 'The largest open Hindi-English parallel corpus for NLP training',
      category: ProductCategory.datasets_prompts,
      tags: ['Hindi', 'NLP', 'Dataset', 'Translation'],
      thumbnailUrl: 'https://neuronhire-uploads.s3.amazonaws.com/products/indonlp-thumb.png',
      description: '500K curated Hindi-English sentence pairs with domain labels. Ideal for fine-tuning translation and multilingual models.',
      demoUrl: 'https://huggingface.co/datasets/indonlp',
      screenshots: [],
      techStack: JSON.stringify(['Python', 'JSON', 'CSV']),
      aiModelUsed: 'N/A', architectureType: 'Dataset',
      pricingModel: PricingModel.one_time, priceINR: 1499,
      features: JSON.stringify([
        { icon: '📊', text: '500K sentence pairs across 12 domains' },
        { icon: '✅', text: 'Human-verified quality labels' },
        { icon: '🔄', text: 'Regular updates with new data' },
      ]),
      deliveryType: 'download',
      customizationAvailable: false,
      supportType: 'Community Discord', supportDuration: 'Lifetime',
      status: ProductStatus.published, publishedAt: subDays(NOW, 60),
      viewCount: 2100, purchaseCount: 41, rating: 4.4, reviewCount: 8,
    },
    {
      id: IDS.prod4, engineerProfileId: IDS.snehaProfile, userId: IDS.snehaUser,
      name: 'LeadFlow AI — Automated Lead Qualification Workflow',
      slug: 'leadflow-ai-lead-qualification',
      tagline: 'Qualify and nurture leads automatically with AI-powered n8n workflows',
      category: ProductCategory.automation_workflows,
      tags: ['n8n', 'Automation', 'Lead Generation', 'CRM'],
      thumbnailUrl: 'https://neuronhire-uploads.s3.amazonaws.com/products/leadflow-thumb.png',
      description: 'A 50-step n8n workflow that automatically qualifies leads, scores them with AI, and nurtures them through personalised sequences.',
      demoUrl: 'https://demo.leadflow.ai',
      screenshots: [],
      techStack: JSON.stringify(['n8n', 'OpenAI API', 'HubSpot', 'Slack', 'Gmail']),
      aiModelUsed: 'GPT-3.5', architectureType: 'Workflow automation',
      pricingModel: PricingModel.one_time, priceINR: 2499,
      features: JSON.stringify([
        { icon: '🔄', text: '50-step automated workflow' },
        { icon: '🤖', text: 'AI-powered lead scoring' },
        { icon: '📧', text: 'Personalised email sequences' },
      ]),
      deliveryType: 'source_code',
      customizationAvailable: true,
      supportType: 'Email', supportDuration: '3 months',
      status: ProductStatus.published, publishedAt: subDays(NOW, 20),
      viewCount: 890, purchaseCount: 17, rating: 4.7, reviewCount: 5,
    },
    {
      id: IDS.prod5, engineerProfileId: IDS.kiranProfile, userId: IDS.kiranUser,
      name: 'DataPipeline Kit — ML Feature Store Templates',
      slug: 'datapipeline-kit-feature-store',
      tagline: 'Production-ready Airflow + dbt templates for ML feature engineering',
      category: ProductCategory.saas_tools,
      tags: ['Airflow', 'dbt', 'Feature Store', 'MLOps'],
      thumbnailUrl: 'https://neuronhire-uploads.s3.amazonaws.com/products/datapipeline-thumb.png',
      description: 'A collection of Airflow DAGs and dbt models for building ML feature stores. Includes 20+ pre-built feature transformations.',
      demoUrl: '',
      screenshots: [],
      techStack: JSON.stringify(['Python', 'Airflow', 'dbt', 'Snowflake']),
      aiModelUsed: 'N/A', architectureType: 'Data pipeline',
      pricingModel: PricingModel.one_time, priceINR: 1999,
      features: JSON.stringify([
        { icon: '⚡', text: '20+ pre-built feature transformations' },
        { icon: '📦', text: 'Docker-ready deployment' },
      ]),
      deliveryType: 'source_code',
      customizationAvailable: false,
      supportType: 'GitHub Issues', supportDuration: '6 months',
      status: ProductStatus.draft,
      viewCount: 0, purchaseCount: 0, rating: null, reviewCount: 0,
    },
  ];
  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { purchaseCount: p.purchaseCount, viewCount: p.viewCount },
      create: p,
    });
  }
  console.log('  Created 5 products (4 published, 1 draft)');
}

async function seedContracts() {
  console.log('Creating contracts...');

  // Contract 1: Active hourly — Arjun + TechCorp
  await prisma.contract.upsert({
    where: { id: IDS.contract1 },
    update: {},
    create: {
      id: IDS.contract1,
      companyProfileId: IDS.techCorpProfile, engineerProfileId: IDS.arjunProfile,
      companyUserId: IDS.techCorpUser, engineerUserId: IDS.arjunUser,
      hiringMode: HiringMode.hourly_contract,
      title: 'AI Fraud Detection System Development',
      scope: 'Build and deploy a real-time fraud detection system for UPI transactions.',
      startDate: subDays(NOW, 10), rate: 4500, currency: 'INR',
      hourlyRate: 4500, estimatedHours: 40, walletBalance: 180000,
      status: ContractStatus.active,
      companySigned: true, engineerSigned: true,
      companySignedAt: subDays(NOW, 10), engineerSignedAt: subDays(NOW, 10),
      activatedAt: subDays(NOW, 10),
      ndaRequired: true, ipOwnership: 'company',
    },
  });

  // Contract 2: Active project with milestones — Priya + NeuralForge
  await prisma.contract.upsert({
    where: { id: IDS.contract2 },
    update: {},
    create: {
      id: IDS.contract2,
      companyProfileId: IDS.neuralProfile, engineerProfileId: IDS.priyaProfile,
      companyUserId: IDS.neuralUser, engineerUserId: IDS.priyaUser,
      hiringMode: HiringMode.project_contract,
      title: 'Medical Image Analysis System',
      scope: 'Build a computer vision system for medical image analysis and diagnosis assistance.',
      startDate: subDays(NOW, 20), rate: 95000, currency: 'INR',
      totalAmount: 95000,
      status: ContractStatus.active,
      companySigned: true, engineerSigned: true,
      companySignedAt: subDays(NOW, 20), engineerSignedAt: subDays(NOW, 20),
      activatedAt: subDays(NOW, 20),
      ndaRequired: true, ipOwnership: 'company',
    },
  });

  // Milestones for contract 2
  await prisma.milestonePayment.deleteMany({ where: { contractId: IDS.contract2 } });
  await prisma.milestonePayment.createMany({ data: [
    { id: uuidv4(), contractId: IDS.contract2, milestoneNumber: 1,
      title: 'Dataset preparation and model baseline',
      description: 'Prepare training dataset and establish baseline model performance.',
      amount: 20000, status: MilestoneStatus.paid,
      dueDate: subDays(NOW, 10), submittedAt: subDays(NOW, 12),
      approvedAt: subDays(NOW, 10), paidAt: subDays(NOW, 10) },
    { id: uuidv4(), contractId: IDS.contract2, milestoneNumber: 2,
      title: 'Model training and evaluation',
      description: 'Train final model and evaluate on test dataset.',
      amount: 35000, status: MilestoneStatus.submitted,
      dueDate: addDays(NOW, 3), submittedAt: subDays(NOW, 1) },
    { id: uuidv4(), contractId: IDS.contract2, milestoneNumber: 3,
      title: 'Deployment and integration',
      description: 'Deploy model to production and integrate with hospital system.',
      amount: 40000, status: MilestoneStatus.pending,
      dueDate: addDays(NOW, 14) },
  ]});

  // Contract 3: Completed — Sneha + TechCorp
  await prisma.contract.upsert({
    where: { id: IDS.contract3 },
    update: {},
    create: {
      id: IDS.contract3,
      companyProfileId: IDS.techCorpProfile, engineerProfileId: IDS.snehaProfile,
      companyUserId: IDS.techCorpUser, engineerUserId: IDS.snehaUser,
      hiringMode: HiringMode.project_contract,
      title: 'Invoice Processing Automation',
      scope: 'Automate invoice processing with OCR and LLM extraction.',
      startDate: subDays(NOW, 30), rate: 28000, currency: 'INR',
      totalAmount: 28000,
      status: ContractStatus.completed,
      companySigned: true, engineerSigned: true,
      companySignedAt: subDays(NOW, 30), engineerSignedAt: subDays(NOW, 30),
      activatedAt: subDays(NOW, 30), completedAt: subDays(NOW, 5),
      ndaRequired: false, ipOwnership: 'company',
    },
  });

  // Contract 4: Disputed — Rohan + BuildFast
  await prisma.contract.upsert({
    where: { id: IDS.contract4 },
    update: {},
    create: {
      id: IDS.contract4,
      companyProfileId: IDS.buildProfile, engineerProfileId: IDS.rohanProfile,
      companyUserId: IDS.buildUser, engineerUserId: IDS.rohanUser,
      hiringMode: HiringMode.project_contract,
      title: 'Hindi Chatbot for EdTech Platform',
      scope: 'Build a Hindi-language chatbot for student Q&A.',
      startDate: subDays(NOW, 25), rate: 45000, currency: 'INR',
      totalAmount: 45000,
      status: ContractStatus.disputed,
      companySigned: true, engineerSigned: true,
      companySignedAt: subDays(NOW, 25), engineerSignedAt: subDays(NOW, 25),
      activatedAt: subDays(NOW, 25),
      ndaRequired: false, ipOwnership: 'company',
    },
  });

  // Dispute for contract 4
  const existingDispute = await prisma.contractDispute.findFirst({ where: { contractId: IDS.contract4 } });
  if (!existingDispute) {
    await prisma.contractDispute.create({
      data: {
        id: uuidv4(), contractId: IDS.contract4,
        raisedBy: IDS.buildUser, againstUserId: IDS.rohanUser,
        reason: 'Deliverable does not match agreed scope',
        description: 'The chatbot was delivered but does not handle the 50 use cases specified in the contract. Only 30 use cases are implemented.',
        status: 'pending',
        raisedAt: subDays(NOW, 3),
        reviewDeadline: addDays(NOW, 4),
      },
    });
  }

  console.log('  Created 4 contracts (1 hourly active, 1 project active, 1 completed, 1 disputed)');
}

async function seedWalletsAndTransactions() {
  console.log('Creating wallets and transactions...');

  // Arjun wallet
  await prisma.wallet.upsert({
    where: { userId: IDS.arjunUser },
    update: {},
    create: {
      id: IDS.arjunWallet, userId: IDS.arjunUser,
      balance: 126000, currency: 'INR',
      totalEarned: 256000, totalWithdrawn: 130000,
    },
  });

  // Sneha wallet
  await prisma.wallet.upsert({
    where: { userId: IDS.snehaUser },
    update: {},
    create: {
      id: IDS.snehaWallet, userId: IDS.snehaUser,
      balance: 23800, currency: 'INR',
      totalEarned: 30800, totalWithdrawn: 7000,
    },
  });

  // Arjun transactions
  const arjunWallet = await prisma.wallet.findUnique({ where: { userId: IDS.arjunUser } });
  if (arjunWallet) {
    const txCount = await prisma.walletTransaction.count({ where: { walletId: arjunWallet.id } });
    if (txCount === 0) {
      await prisma.walletTransaction.createMany({ data: [
        { id: uuidv4(), walletId: arjunWallet.id, type: 'credit', amount: 50000,
          balanceBefore: 0, balanceAfter: 50000,
          description: 'Contract milestone 1 — AI Fraud Detection', createdAt: subDays(NOW, 8) },
        { id: uuidv4(), walletId: arjunWallet.id, type: 'credit', amount: 28000,
          balanceBefore: 50000, balanceAfter: 78000,
          description: 'Bounty won — Invoice Processing', createdAt: subDays(NOW, 5) },
        { id: uuidv4(), walletId: arjunWallet.id, type: 'credit', amount: 4999,
          balanceBefore: 78000, balanceAfter: 82999,
          description: 'Product sale — SupportBot Pro', createdAt: subDays(NOW, 3) },
        { id: uuidv4(), walletId: arjunWallet.id, type: 'debit', amount: 30000,
          balanceBefore: 82999, balanceAfter: 52999,
          description: 'Withdrawal to UPI — arjun@paytm', createdAt: subDays(NOW, 2) },
        { id: uuidv4(), walletId: arjunWallet.id, type: 'credit', amount: 4999,
          balanceBefore: 52999, balanceAfter: 57998,
          description: 'Product sale — SupportBot Pro', createdAt: subDays(NOW, 1) },
        { id: uuidv4(), walletId: arjunWallet.id, type: 'credit', amount: 68002,
          balanceBefore: 57998, balanceAfter: 126000,
          description: 'Contract payment — hourly billing week 1', createdAt: subDays(NOW, 0) },
      ]});
    }
  }

  // Sneha transactions
  const snehaWallet = await prisma.wallet.findUnique({ where: { userId: IDS.snehaUser } });
  if (snehaWallet) {
    const txCount = await prisma.walletTransaction.count({ where: { walletId: snehaWallet.id } });
    if (txCount === 0) {
      await prisma.walletTransaction.createMany({ data: [
        { id: uuidv4(), walletId: snehaWallet.id, type: 'credit', amount: 25200,
          balanceBefore: 0, balanceAfter: 25200,
          description: 'Bounty payment — Invoice Processing (after 10% platform fee)', createdAt: subDays(NOW, 5) },
        { id: uuidv4(), walletId: snehaWallet.id, type: 'credit', amount: 2249,
          balanceBefore: 25200, balanceAfter: 27449,
          description: 'Product sale — LeadFlow AI (after 10% platform fee)', createdAt: subDays(NOW, 2) },
        { id: uuidv4(), walletId: snehaWallet.id, type: 'debit', amount: 3649,
          balanceBefore: 27449, balanceAfter: 23800,
          description: 'Withdrawal to UPI — sneha@paytm', createdAt: subDays(NOW, 1) },
      ]});
    }
  }
  console.log('  Created 2 wallets with transaction history');
}

async function seedMessages() {
  console.log('Creating messages...');

  // Conversation: Arjun <-> TechCorp
  const [p1, p2] = [IDS.arjunUser, IDS.techCorpUser].sort();
  const existingConv = await prisma.conversation.findUnique({
    where: { participant1Id_participant2Id: { participant1Id: p1, participant2Id: p2 } },
  });
  let convId: string;
  if (!existingConv) {
    const conv = await prisma.conversation.create({
      data: { id: uuidv4(), participant1Id: p1, participant2Id: p2, lastMessageAt: subDays(NOW, 0) },
    });
    convId = conv.id;
    await prisma.message.createMany({ data: [
      { id: uuidv4(), conversationId: convId, senderId: IDS.techCorpUser,
        content: 'Hi Arjun, we reviewed your proposal for the fraud detection system. Very impressed with your GNN approach.',
        createdAt: subDays(NOW, 9) },
      { id: uuidv4(), conversationId: convId, senderId: IDS.arjunUser,
        content: 'Thank you! I have 3 years of experience with PyTorch Geometric specifically for financial fraud graphs. Happy to share some benchmarks.',
        createdAt: subDays(NOW, 9) },
      { id: uuidv4(), conversationId: convId, senderId: IDS.techCorpUser,
        content: 'That would be great. Can you start next Monday? We have the Kafka setup ready.',
        createdAt: subDays(NOW, 8) },
      { id: uuidv4(), conversationId: convId, senderId: IDS.arjunUser,
        content: 'Monday works perfectly. I will need access to the transaction schema and a sample dataset to start.',
        createdAt: subDays(NOW, 8) },
      { id: uuidv4(), conversationId: convId, senderId: IDS.techCorpUser,
        content: 'Sharing the schema now. Sample dataset will be ready by Friday.',
        createdAt: subDays(NOW, 7) },
      { id: uuidv4(), conversationId: convId, senderId: IDS.arjunUser,
        content: 'Got it. I have reviewed the schema — the transaction graph structure is well-designed. This will work well with PyG.',
        createdAt: subDays(NOW, 5) },
      { id: uuidv4(), conversationId: convId, senderId: IDS.techCorpUser,
        content: 'Quick update — we need the first prototype by end of week 2. Is that feasible?',
        createdAt: subDays(NOW, 2) },
      { id: uuidv4(), conversationId: convId, senderId: IDS.techCorpUser,
        content: 'Also, can you join a call tomorrow at 3pm IST to discuss the evaluation metrics?',
        createdAt: subDays(NOW, 0) },
    ]});
  } else {
    convId = existingConv.id;
  }

  // Message request: NeuralForge -> Kiran (pending)
  const existingReq = await prisma.messageRequest.findUnique({
    where: { fromUserId_toUserId: { fromUserId: IDS.neuralUser, toUserId: IDS.kiranUser } },
  });
  if (!existingReq) {
    await prisma.messageRequest.create({
      data: {
        id: uuidv4(), fromUserId: IDS.neuralUser, toUserId: IDS.kiranUser,
        message: 'Hi Kiran, we saw your profile and are interested in discussing a data pipeline project for our healthcare platform. We need Airflow + dbt expertise.',
        status: 'pending',
      },
    });
  }
  console.log('  Created 1 conversation with 8 messages, 1 pending message request');
}

async function seedAnalyticsData() {
  console.log('Creating analytics data...');

  // Profile views for Arjun — last 30 days
  const viewCounts = [4,6,5,7,8,5,4,6,7,9,8,6,5,7,8,10,9,7,6,8,9,11,8,7,6,8,9,7,5,6];
  for (let i = 0; i < 30; i++) {
    const date = subDays(NOW, 29 - i);
    date.setHours(0, 0, 0, 0);
    await prisma.engineerAnalytics.upsert({
      where: { engineerProfileId_date: { engineerProfileId: IDS.arjunProfile, date } },
      update: {},
      create: {
        id: uuidv4(), engineerProfileId: IDS.arjunProfile, date,
        profileViews: viewCounts[i],
        proposalsSent: i % 5 === 0 ? 1 : 0,
        proposalsAccepted: i % 10 === 0 ? 1 : 0,
        earnings: i % 7 === 0 ? 50000 : 0,
        topKeywords: JSON.stringify([
          { keyword: 'langchain developer', count: Math.floor(viewCounts[i] * 0.4) },
          { keyword: 'rag system', count: Math.floor(viewCounts[i] * 0.3) },
          { keyword: 'llm engineer', count: Math.floor(viewCounts[i] * 0.3) },
        ]),
      },
    });
  }

  // Profile views for Priya — last 30 days
  const priyaViews = [2,3,2,4,3,2,3,4,3,2,3,4,5,3,2,3,4,3,2,3,4,3,2,3,4,3,2,3,2,3];
  for (let i = 0; i < 30; i++) {
    const date = subDays(NOW, 29 - i);
    date.setHours(0, 0, 0, 0);
    await prisma.engineerAnalytics.upsert({
      where: { engineerProfileId_date: { engineerProfileId: IDS.priyaProfile, date } },
      update: {},
      create: {
        id: uuidv4(), engineerProfileId: IDS.priyaProfile, date,
        profileViews: priyaViews[i],
        proposalsSent: 0, proposalsAccepted: 0, earnings: 0,
        topKeywords: JSON.stringify([{ keyword: 'computer vision engineer', count: priyaViews[i] }]),
      },
    });
  }
  console.log('  Created 60 days of analytics data for 2 engineers');
}

async function seedProductReviews() {
  console.log('Creating product reviews...');

  // Need a purchase first for each review (schema requires purchaseId)
  // Create dummy purchases for seeding reviews
  const reviewData = [
    { productId: IDS.prod1, buyerId: IDS.techCorpUser, rating: 5,
      title: 'Exceptional product, saved us weeks of development',
      review: 'The SupportBot Pro reduced our support ticket volume by 60% in the first month. The multi-agent architecture is well-designed and easy to customise.',
      pros: ['Easy to deploy', 'Well documented', 'Responsive support'],
      cons: ['Requires OpenAI API key'] },
    { productId: IDS.prod1, buyerId: IDS.neuralUser, rating: 5,
      title: 'Best AI product on NeuronHire',
      review: 'Deployed in production within 2 hours. The CRM integration with HubSpot worked out of the box.',
      pros: ['Quick setup', 'CRM integration', 'Good documentation'],
      cons: [] },
    { productId: IDS.prod1, buyerId: IDS.infosysUser, rating: 4,
      title: 'Solid product with minor customisation needed',
      review: 'Works great for standard use cases. Needed some customisation for our enterprise requirements but the code is clean.',
      pros: ['Clean code', 'Modular architecture'],
      cons: ['Enterprise features need customisation'] },
    { productId: IDS.prod4, buyerId: IDS.techCorpUser, rating: 5,
      title: 'Incredible automation, saves 20 hours per week',
      review: 'The LeadFlow workflow is exactly what we needed. Our sales team now focuses only on qualified leads.',
      pros: ['Saves time', 'Easy to configure', 'AI scoring is accurate'],
      cons: [] },
  ];

  for (const r of reviewData) {
    // Create a purchase record for the review
    const purchaseId = uuidv4();
    const existingPurchase = await prisma.purchase.findFirst({
      where: { productId: r.productId, buyerId: r.buyerId },
    });
    if (!existingPurchase) {
      await prisma.purchase.create({
        data: {
          id: purchaseId, productId: r.productId, buyerId: r.buyerId,
          priceINR: 4999, currency: 'INR',
          licenseKey: `NH-${uuidv4().substring(0, 8).toUpperCase()}`,
          licenseActive: true, accessGranted: true,
          status: 'completed',
          disputeEligible: false,
          disputeDeadline: addDays(NOW, 30),
          purchasedAt: subDays(NOW, 10),
        },
      });
      const existingReview = await prisma.productReview.findFirst({
        where: { productId: r.productId, buyerId: r.buyerId },
      });
      if (!existingReview) {
        await prisma.productReview.create({
          data: {
            id: uuidv4(), productId: r.productId, purchaseId,
            buyerId: r.buyerId, rating: r.rating,
            title: r.title, review: r.review,
            pros: r.pros, cons: r.cons, verified: true,
          },
        });
      }
    }
  }
  console.log('  Created 4 product reviews');
}

async function seedExperiences() {
  console.log('Creating work experiences...');
  await prisma.engineerExperience.deleteMany({ where: { engineerProfileId: { in: [IDS.arjunProfile, IDS.priyaProfile] } } });
  await prisma.engineerExperience.createMany({ data: [
    { id: uuidv4(), engineerProfileId: IDS.arjunProfile,
      title: 'Senior LLM Engineer', company: 'Sarvam AI',
      location: 'Bengaluru, India', current: true,
      startDate: new Date('2023-01-01'), endDate: null,
      description: 'Leading the RAG infrastructure team. Built the core retrieval pipeline serving 10M+ queries/day.',
      achievements: ['10M+ queries/day', '40% latency reduction', 'Team of 4'] },
    { id: uuidv4(), engineerProfileId: IDS.arjunProfile,
      title: 'ML Engineer', company: 'Ola Electric',
      location: 'Bengaluru, India', current: false,
      startDate: new Date('2021-06-01'), endDate: new Date('2022-12-31'),
      description: 'Built predictive maintenance models for EV battery systems. Reduced unplanned downtime by 35%.',
      achievements: ['35% downtime reduction', 'Rs 2Cr saved annually', '50K vehicles'] },
    { id: uuidv4(), engineerProfileId: IDS.priyaProfile,
      title: 'Computer Vision Engineer', company: 'Bosch India',
      location: 'Hyderabad, India', current: false,
      startDate: new Date('2021-07-01'), endDate: new Date('2023-06-30'),
      description: 'Built defect detection systems for automotive manufacturing lines.',
      achievements: ['99.2% accuracy', '12 factories deployed', 'Rs 5Cr quality savings'] },
    { id: uuidv4(), engineerProfileId: IDS.priyaProfile,
      title: 'ML Engineer', company: 'Freelance',
      location: 'Remote', current: true,
      startDate: new Date('2023-07-01'), endDate: null,
      description: 'Building computer vision and edge AI solutions for manufacturing and retail clients.',
      achievements: ['8 clients', '100% on-time delivery'] },
  ]});
  console.log('  Created work experiences for 2 engineers');
}

// ── Main orchestrator ────────────────────────────────────────
async function main() {
  const isFresh = process.argv.includes('--fresh');
  if (isFresh) {
    console.log('--fresh flag detected: wiping all data...');
    // Delete in reverse dependency order
    await prisma.walletTransaction.deleteMany();
    await prisma.wallet.deleteMany();
    await prisma.productReview.deleteMany();
    await prisma.purchase.deleteMany();
    await prisma.contractDispute.deleteMany();
    await prisma.milestonePayment.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.taskParticipation.deleteMany();
    await prisma.task.deleteMany();
    await prisma.product.deleteMany();
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.messageRequest.deleteMany();
    await prisma.neuronScoreHistory.deleteMany();
    await prisma.assessment.deleteMany();
    await prisma.engineerAnalytics.deleteMany();
    await prisma.engineerProject.deleteMany();
    await prisma.engineerExperience.deleteMany();
    await prisma.engineerSkill.deleteMany();
    await prisma.engineerProfile.deleteMany();
    await prisma.companyProfile.deleteMany();
    await prisma.user.deleteMany();
    console.log('  All data wiped.');
  }

  const results: { section: string; status: 'ok' | 'error'; error?: string }[] = [];

  const sections: { name: string; fn: () => Promise<void> }[] = [
    { name: 'Users',              fn: seedUsers },
    { name: 'Engineer Profiles',  fn: seedEngineerProfiles },
    { name: 'Skills',             fn: seedSkills },
    { name: 'Experiences',        fn: seedExperiences },
    { name: 'Projects',           fn: seedProjects },
    { name: 'Company Profiles',   fn: seedCompanyProfiles },
    { name: 'Assessments',        fn: seedAssessments },
    { name: 'NeuronScore History',fn: seedNeuronScoreHistory },
    { name: 'Tasks',              fn: seedTasks },
    { name: 'Task Participations',fn: seedTaskParticipations },
    { name: 'Products',           fn: seedProducts },
    { name: 'Product Reviews',    fn: seedProductReviews },
    { name: 'Contracts',          fn: seedContracts },
    { name: 'Wallets',            fn: seedWalletsAndTransactions },
    { name: 'Messages',           fn: seedMessages },
    { name: 'Analytics',          fn: seedAnalyticsData },
  ];

  console.log('');
  console.log('NeuronHire Seed Starting...');
  console.log('================================');

  for (const section of sections) {
    try {
      await section.fn();
      results.push({ section: section.name, status: 'ok' });
    } catch (err: any) {
      console.error(`  ERROR in ${section.name}:`, err.message);
      results.push({ section: section.name, status: 'error', error: err.message });
    }
  }

  console.log('');
  console.log('================================');
  console.log('Seed Complete. Summary:');
  for (const r of results) {
    const icon = r.status === 'ok' ? 'OK' : 'FAIL';
    console.log(`  [${icon}] ${r.section}${r.error ? ': ' + r.error : ''}`);
  }
  const failed = results.filter(r => r.status === 'error').length;
  console.log('');
  console.log(`${results.length - failed}/${results.length} sections succeeded.`);
  if (failed > 0) process.exit(1);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

