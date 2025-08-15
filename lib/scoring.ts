// Deterministic ATS scoring: weighted rubric computed locally for consistency

export type DeterministicScore = {
  score: number;
  missingKeywords: string[];
  breakdown: {
    mustHaveKeywords: number; // 0-25
    skills: number; // 0-20
    roleSeniority: number; // 0-15
    experience: number; // 0-15
    achievements: number; // 0-10
    educationCerts: number; // 0-5
    atsStructure: number; // 0-10
  };
};

const STOPWORDS = new Set(
  [
    'the','and','for','you','with','are','this','that','from','have','has','was','were','will','shall','than','then','but','not','all','any','can','may','per','via','our','your','their','they','them','her','his','its','over','into','onto','upon','who','what','where','when','why','how','as','of','in','on','to','by','is','it','or','an','a','at','be','we','i','he','she','me','my','us','we','it','if','do','does','did','done','also','etc','about','using','use','used'
  ]
);

const COMMON_SECTIONS = ['summary','objective','experience','work experience','professional experience','education','skills','projects','certifications'];

const KNOWN_SKILLS = new Set(
  [
    // programming & data
    'javascript','typescript','react','next.js','node','node.js','express','python','django','flask','java','spring','c#','dotnet','go','golang','rust','ruby','rails','php','laravel','scala','kotlin','swift','objective-c',
    'html','css','sass','tailwind','redux','graphql','rest','websocket','rxjs','vite','webpack','babel',
    'mysql','postgres','mongodb','redis','elasticsearch','kafka','rabbitmq','hadoop','spark','snowflake','bigquery','databricks','airflow',
  'aws','azure','gcp','docker','kubernetes','terraform','ansible','ci/cd','jenkins','github actions','gitlab ci','csharp','dotnet',
    // ml/ai
    'machine learning','deep learning','nlp','computer vision','pytorch','tensorflow','scikit-learn','pandas','numpy','matplotlib',
    // qa & misc
    'cypress','playwright','jest','mocha','vitest','storybook'
  ]
);

const ALIASES: Record<string, string> = {
  'nextjs': 'next.js', 'next': 'next.js',
  'nodejs': 'node', 'node': 'node', 'node.js': 'node',
  'reactjs': 'react',
  'typescript': 'typescript', 'ts': 'typescript',
  'javascript': 'javascript', 'js': 'javascript',
  'postgresql': 'postgres', 'postgre': 'postgres',
  'gcp': 'gcp', 'googlecloud': 'gcp', 'googlecloudplatform': 'gcp',
  'aws': 'aws', 'amazonwebservices': 'aws',
  'azure': 'azure', 'microsoftazure': 'azure',
  'ci': 'ci', 'cd': 'cd', 'cicd': 'ci/cd', 'ci-cd': 'ci/cd', 'ci/cd': 'ci/cd',
  'c#': 'csharp', 'csharp': 'csharp',
  '.net': 'dotnet', 'dotnet': 'dotnet',
  'frontend': 'frontend', 'front-end': 'frontend', 'front end': 'frontend',
  'backend': 'backend', 'back-end': 'backend', 'back end': 'backend',
  'ml': 'machine learning', 'dl': 'deep learning',
};

const PHRASE_REGEX_ALIASES: Array<[RegExp, string]> = [
  [/\bnext\s*\.?\s*js\b/i, 'next.js'],
  [/\bnode\s*\.?\s*js\b/i, 'node'],
  [/\breact\s*\.?\s*js\b/i, 'react'],
  [/\bgoogle\s+cloud(\s+platform)?\b/i, 'gcp'],
  [/\bamazon\s+web\s+services\b/i, 'aws'],
  [/\bcontinuous\s+integration\b/i, 'ci'],
  [/\bcontinuous\s+(delivery|deployment)\b/i, 'cd'],
  [/\bc\s*#\b/i, 'csharp'],
  [/\b\.net\b/i, 'dotnet'],
  [/\bpostgre?s(ql)?\b/i, 'postgres'],
  [/\bfront[-\s]?end\b/i, 'frontend'],
  [/\bback[-\s]?end\b/i, 'backend'],
];

// Topic clusters: broader concepts that should count towards skills relevance
const TOPIC_CLUSTERS: Record<string, string[]> = {
  'full stack': ['full stack','full-stack','frontend','backend','api','end-to-end','mern','mean','pern'],
  'chatbot': ['chatbot','conversational ai','assistant','bot','dialogflow','rasa','botpress','langchain','rag','prompt','llm','gpt','gemini'],
  'microservices': ['microservice','microservices','service mesh','istio','grpc','event-driven','saga','ddd','domain-driven'],
  'cloud': ['cloud','aws','azure','gcp','serverless','lambda','cloud functions','app engine','ecs','eks','aks'],
  'devops': ['devops','ci/cd','pipeline','terraform','kubernetes','docker','helm','ansible','monitoring','observability'],
  'data engineering': ['etl','elt','data pipeline','airflow','spark','kafka','data warehouse','bigquery','snowflake','dbt'],
  'testing': ['unit testing','integration testing','e2e','cypress','playwright','jest','qa','tdd','bdd'],
  'security': ['oauth','jwt','oidc','csp','xss','csrf','encryption','tls','iam','cognito','keycloak'],
  'architecture': ['scalability','performance','availability','latency','throughput','cost optimization','design patterns','clean architecture'],
  'mobile': ['react native','flutter','swift','kotlin','android','ios','expo'],
};

function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9+.#/\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalizeToken(w: string): string {
  if (!w) return w;
  const compact = w.replace(/[^a-z0-9]/g, '');
  // direct match
  if (ALIASES[w]) return ALIASES[w];
  if (ALIASES[compact]) return ALIASES[compact];
  return w;
}

function enrichWithPhraseAliases(text: string, set: Set<string>) {
  for (const [re, canon] of PHRASE_REGEX_ALIASES) {
    if (re.test(text)) set.add(canon);
  }
}

function detectTopicsInText(text: string): Set<string> {
  const t = normalize(text);
  const set = new Set<string>();
  for (const [topic, terms] of Object.entries(TOPIC_CLUSTERS)) {
    for (const term of terms) {
      const pattern = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '.*');
      const re = new RegExp(`\\b${pattern}\\b`, 'i');
      if (re.test(t)) { set.add(topic); break; }
    }
  }
  return set;
}

function tokens(text: string): string[] {
  const t = normalize(text).split(' ');
  return t
    .map(canonicalizeToken)
    .filter(w => w && w.length >= 2 && !STOPWORDS.has(w));
}

function topKeywords(text: string, limit = 30): string[] {
  const freq = new Map<string, number>();
  for (const t of tokens(text)) {
    // collapse frameworks spellings
    const key = t.replace(/node\.js/, 'node').replace(/next\.js/, 'next.js');
    freq.set(key, (freq.get(key) || 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
    .filter(k => k.length >= 3)
    .slice(0, limit);
}

function unique<T>(arr: T[]): T[] { return [...new Set(arr)]; }

function estimateYears(text: string): number | null {
  const m = [...(text.matchAll(/(\d{1,2})\s*\+?\s*(?:years|yrs)/gi) || [])];
  if (!m.length) return null;
  return Math.max(...m.map(x => parseInt(x[1], 10)).filter(n => !isNaN(n)));
}

function hasSection(resume: string, name: string): boolean {
  const r = normalize(resume);
  const n = normalize(name);
  return r.includes(n);
}

function countBulletLines(text: string): number {
  const lines = (text || '').split(/\r?\n/);
  return lines.filter(l => /^\s*(?:[-*•])\s+/.test(l)).length;
}

function detectSeniorityLevel(text: string): number {
  const t = normalize(text);
  // scale: 0 intern, 1 junior, 2 mid, 3 senior, 4 lead, 5 principal/staff
  if (/principal|staff\b/.test(t)) return 5;
  if (/lead\b|tech lead|team lead/.test(t)) return 4;
  if (/senior\b|sr\./.test(t)) return 3;
  if (/mid\b|intermediate\b/.test(t)) return 2;
  if (/junior\b|jr\./.test(t)) return 1;
  if (/intern\b|entry\s*level/.test(t)) return 0;
  return 2; // default to mid
}

function sentenceSplit(text: string): string[] {
  return (text || '').split(/(?<=[.!?])\s+/g);
}

function extractWeightedKeywords(jd: string) {
  const sentences = sentenceSplit(jd);
  const requiredHints = /(must|required|minimum|need to|requirements|qualifications)/i;
  const preferredHints = /(preferred|nice to have|bonus|plus)/i;
  const reqTokens: string[] = [];
  const prefTokens: string[] = [];
  for (const s of sentences) {
    const toks = tokens(s);
    if (requiredHints.test(s)) reqTokens.push(...toks);
    else if (preferredHints.test(s)) prefTokens.push(...toks);
  }
  return {
    required: [...new Set(reqTokens)].filter(t => t.length >= 3),
    preferred: [...new Set(prefTokens)].filter(t => t.length >= 3),
  };
}

export function computeATSScore(resumeText: string, jobDescription: string): DeterministicScore {
  const resumeNorm = normalize(resumeText);
  const jdNorm = normalize(jobDescription);

  const jdTop = unique(topKeywords(jdNorm, 35));
  const resumeTokSet = new Set(tokens(resumeNorm));
  const jdTokSet = new Set(tokens(jdNorm));
  // Enrich sets with phrase aliases so variants match
  enrichWithPhraseAliases(resumeText, resumeTokSet);
  enrichWithPhraseAliases(jobDescription, jdTokSet);

  // Must-have vs preferred keyword weighting
  const { required, preferred } = extractWeightedKeywords(jobDescription);
  const importantJD = unique([...jdTop, ...jdTokSet]).filter(k => k.length >= 3);
  const reqMatched = required.filter(k => resumeTokSet.has(k));
  const prefMatched = preferred.filter(k => resumeTokSet.has(k));
  const reqCoverage = required.length ? reqMatched.length / required.length : (importantJD.length ? 0.5 : 0.0);
  const prefCoverage = preferred.length ? prefMatched.length / preferred.length : 0.5;
  const mustHaveKeywords = Math.round(Math.min(25, 25 * (0.75 * reqCoverage + 0.25 * prefCoverage)));

  // Skills coverage (0-20)
  const jdSkills = importantJD.filter(k => KNOWN_SKILLS.has(k));
  const resumeSkills = [...resumeTokSet].filter(k => KNOWN_SKILLS.has(k));
  const matchedSkills = resumeSkills.filter(k => jdSkills.includes(k));
  const skillsBase = jdSkills.length ? matchedSkills.length / jdSkills.length : (resumeSkills.length ? 0.5 : 0.0);
  // Topic coverage augments skills: consider broader concepts present in JD and resume
  const jdTopics = detectTopicsInText(jobDescription);
  const resumeTopics = detectTopicsInText(resumeText);
  const topicMatches = [...jdTopics].filter(t => resumeTopics.has(t)).length;
  const topicCoverage = jdTopics.size ? topicMatches / jdTopics.size : 0.5;
  const combined = Math.max(0, Math.min(1, 0.7 * skillsBase + 0.3 * topicCoverage));
  const skillsScore = Math.round(20 * combined);

  // Role & seniority fit (0-15)
  const jdSeniority = detectSeniorityLevel(jobDescription);
  const resumeSeniority = detectSeniorityLevel(resumeText);
  const seniorityDiff = Math.abs(jdSeniority - resumeSeniority);
  const roleSeniority = Math.max(0, 15 - seniorityDiff * 5); // 0 diff => 15, 1 => 10, 2 => 5, 3+ => 0

  // Experience depth (0-15): years + roles estimate
  const jdYears = estimateYears(jdNorm);
  const resumeYears = estimateYears(resumeNorm);
  let yearsRatioScore = 7;
  if (jdYears && resumeYears) yearsRatioScore = Math.max(0, Math.min(1, resumeYears / jdYears)) * 10;
  else if (jdYears && !resumeYears) yearsRatioScore = 3;
  else if (!jdYears && resumeYears) yearsRatioScore = Math.min(10, 6 + (resumeYears >= 5 ? 4 : 2));
  const rolesEstimate = (resumeText.match(/\b20\d{2}\b/g) || []).length; // crude roles/projects proxy
  const rolesScore = Math.min(5, Math.round(Math.min(1, rolesEstimate / 4) * 5));
  const experienceScore = Math.round(Math.min(15, yearsRatioScore + rolesScore));

  // Achievements & quantification (0-10)
  const quantMatches = (resumeText.match(/\b(\d+\s?%|\$\s?\d+[kKmM]?|\d+\s?(x|times))\b/g) || []).length;
  const impactVerbs = (resumeText.match(/increased|reduced|improved|optimized|grew|decreased|cut|boosted|accelerated|streamlined/gi) || []).length;
  let achievements = 0;
  if (quantMatches >= 5 || (quantMatches >= 3 && impactVerbs >= 2)) achievements = 10;
  else if (quantMatches >= 3 || (quantMatches >= 2 && impactVerbs >= 1)) achievements = 7;
  else if (quantMatches >= 1) achievements = 4;

  // Education & certifications (0-5)
  const jdEdu = /bachelor|master|phd|degree/i.test(jobDescription);
  const resumeEdu = /bachelor|b\.?s\.?|master|m\.?s\.?|phd|b\.tech|m\.tech|degree/i.test(resumeText);
  const jdCerts = /(aws|azure|gcp).*certified|pmp|scrum master|cism|cissp|cka|ckad/i.test(jobDescription);
  const resumeCerts = /(aws|azure|gcp).*certified|pmp|scrum master|cism|cissp|cka|ckad/i.test(resumeText);
  let educationCerts = 0;
  if (jdEdu) educationCerts += resumeEdu ? 3 : 1;
  else educationCerts += 2; // neutral if not specified
  if (jdCerts) educationCerts += resumeCerts ? 2 : 0;
  else educationCerts += 0; // no change
  educationCerts = Math.min(5, educationCerts);

  // ATS structure (0-10)
  let atsStructure = 0;
  const sectionsPresent = ['summary','experience','education','skills'].reduce((acc, s) => acc + (hasSection(resumeText, s) ? 1 : 0), 0);
  atsStructure += Math.min(4, sectionsPresent) * 2; // up to 8
  const bullets = countBulletLines(resumeText);
  if (bullets >= 3) atsStructure += 1;
  const tokenCount = tokens(resumeText).length;
  if (tokenCount >= 300 && tokenCount <= 1200) atsStructure += 1; // ideal length range
  atsStructure = Math.min(10, atsStructure);

  const total = Math.round(
    Math.max(0, Math.min(100,
      mustHaveKeywords + skillsScore + roleSeniority + experienceScore + achievements + educationCerts + atsStructure
    ))
  );

  const missingKeywords = importantJD.filter(k => !resumeTokSet.has(k)).slice(0, 20);

  return {
    score: total,
    missingKeywords,
    breakdown: {
      mustHaveKeywords,
      skills: skillsScore,
      roleSeniority,
      experience: experienceScore,
      achievements,
      educationCerts,
      atsStructure,
    },
  };
}
