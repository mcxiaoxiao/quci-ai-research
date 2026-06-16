import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const root = process.cwd();
const dataDir = path.join(root, 'data');
const appendixDir = path.join(root, 'report', 'appendix');

const academicQueries = [
  'Chinese poetry generation',
  'poetry generation',
  'songci generation',
  'Chinese lyrics generation',
  'lyrics generation',
  'rap lyrics generation',
  'music generation',
  'symbolic music generation',
  'text to music generation',
  'retrieval augmented generation',
  'active retrieval augmented generation',
  'constrained decoding',
  'grammar constrained decoding',
  'large language model instruction tuning',
  'parameter efficient fine tuning',
  'large language model hallucination',
  'style transfer poetry',
  'Chinese classical poetry',
  'Chinese poetry planning',
  'Chinese poetry memory',
  'controllable poetry generation',
  'music generation survey',
  'poetry generation survey',
  'poetry evaluation human AI collaboration',
  'QLoRA large language models',
  'LoRA large language models',
  'melody conditioned lyrics generation',
];

const includeRe = /poetry|lyrics?|music|retrieval|constrained|grammar|instruction|hallucination|style transfer|qlo?ra|parameter efficient|rag|songci|melody|audiocraft|musiclm|jukebox|suno|udio|aiva|soundraw|beatoven|mubert|boomy|text-to-music|text to music|classical poetry|Chinese poetry|Chinese lyrics/i;
const excludeRe = /power generation|quantum espresso|wrist injuries|schizophrenia|brain activity|deaf adults|deaf students|thermal|health risks to chinese opera actors|second-generation plink|educating the net generation|the making of early chinese classical poetry|recipe nlg|power, operation, and control|poetry of kings|the magical number 4 in short-term memory/i;

const officialSources = [
  {
    category: 'policy',
    topic: 'generative ai regulation',
    title: '生成式人工智能服务管理暂行办法',
    year: 2023,
    url: 'https://www.cac.gov.cn/',
    note: '中国生成式 AI 监管基础框架，定义服务提供者责任、数据合规和内容治理边界。',
  },
  {
    category: 'policy',
    topic: 'content labeling',
    title: '人工智能生成合成内容标识办法',
    year: 2025,
    url: 'https://www.cac.gov.cn/',
    note: '生成内容标识与传播规范，直接影响产品上线和内容审核流程。',
  },
  {
    category: 'policy',
    topic: 'filing stats',
    title: '生成式人工智能服务备案信息公告（截至 2024-12-31）',
    year: 2024,
    url: 'https://www.cac.gov.cn/',
    note: '备案数量 302、算法备案 238 的官方阶段性口径。',
  },
  {
    category: 'policy',
    topic: 'filing stats',
    title: '生成式人工智能服务备案信息公告（截至 2025-11-01）',
    year: 2025,
    url: 'https://www.cac.gov.cn/',
    note: '备案数量 611、算法备案 306 的较新官方口径。',
  },
  {
    category: 'industry report',
    topic: 'ai industry',
    title: '中国人工智能产业发展研究报告（2025）',
    year: 2025,
    url: 'https://www.caict.ac.cn/',
    note: '产业规模、企业数量、模型能力与应用情况的官方研究口径。',
  },
  {
    category: 'industry report',
    topic: 'gen ai industry',
    title: '生成式人工智能产业发展研究报告（2025）',
    year: 2025,
    url: 'https://www.caict.ac.cn/',
    note: '国内生成式 AI 产业规模进入万亿级别的关键参考。',
  },
  {
    category: 'culture report',
    topic: 'cultural statistics',
    title: '2024年文化和旅游发展统计公报',
    year: 2025,
    url: 'https://www.mct.gov.cn/',
    note: '公共图书馆、博物馆、文化馆、表演团体等机构规模的官方统计。',
  },
  {
    category: 'culture report',
    topic: 'digital innovation',
    title: '2024年度文化和旅游数字化创新典型案例',
    year: 2025,
    url: 'https://www.mct.gov.cn/',
    note: '文化和旅游数字化落地案例，证明垂直 AI 在公共文化系统里有真实需求。',
  },
  {
    category: 'heritage',
    topic: 'intangible heritage',
    title: '国家级非物质文化遗产代表性项目名录',
    year: 2025,
    url: 'https://www.mct.gov.cn/',
    note: '非遗项目总量和结构，是传统曲艺场景的重要需求底座。',
  },
  {
    category: 'heritage',
    topic: 'intangible heritage',
    title: '国家级非物质文化遗产代表性传承人名录',
    year: 2025,
    url: 'https://www.mct.gov.cn/',
    note: '传承人规模决定专家在环的可用性和成本。',
  },
  {
    category: 'heritage platform',
    topic: 'ancient books',
    title: '中华古籍智慧化服务平台',
    year: 2025,
    url: 'https://guji.nlc.cn/',
    note: '提供古籍数字化检索、OCR、断句、知识化服务，是 RAG 的关键数据底座。',
  },
  {
    category: 'heritage platform',
    topic: 'ancient books',
    title: '中华古籍资源库',
    year: 2025,
    url: 'https://www.nlc.cn/',
    note: '古籍与数字资源入口，支撑历史文本与曲艺资料检索。',
  },
  {
    category: 'law',
    topic: 'copyright',
    title: '生成式人工智能相关著作权司法实践与案例',
    year: 2024,
    url: 'https://www.court.gov.cn/',
    note: '生成内容著作权、训练数据边界和侵权争议的司法参考。',
  },
  {
    category: 'product',
    topic: 'music generation',
    title: 'MusicGen / AudioCraft 官方介绍',
    year: 2023,
    url: 'https://ai.meta.com/blog/musicgen-audiocraft-generation-audio/',
    note: 'Meta 官方音乐生成模型说明，体现文本到音乐的能力上限和数据依赖。',
  },
  {
    category: 'product',
    topic: 'music generation',
    title: 'OpenAI Jukebox 官方研究页',
    year: 2020,
    url: 'https://openai.com/research/jukebox',
    note: '早期音乐生成研究，证明“生成整首歌”可行但质量和版权问题一直存在。',
  },
  {
    category: 'product',
    topic: 'music generation',
    title: 'MusicLM 官方介绍',
    year: 2023,
    url: 'https://research.google/blog/musiclm-generating-music-from-text/',
    note: 'Google 官方文本到音乐模型页面，属于行业能力对照组。',
  },
  {
    category: 'product',
    topic: 'music generation',
    title: 'Stable Audio 官方页面',
    year: 2024,
    url: 'https://stability.ai/',
    note: '稳定音频生成产品的代表，说明商业化音乐生成已成立，但也受数据许可约束。',
  },
  {
    category: 'product',
    topic: 'music generation',
    title: 'Suno 官方页面',
    year: 2024,
    url: 'https://suno.com/',
    note: '面向大众的生成式音乐产品，证明用户愿意为“可听”买单。',
  },
  {
    category: 'product',
    topic: 'music generation',
    title: 'Udio 官方页面',
    year: 2024,
    url: 'https://www.udio.com/',
    note: '另一条主流消费级音乐生成路线，适合与传统曲艺生成做能力对比。',
  },
  {
    category: 'product',
    topic: 'music generation',
    title: 'AIVA 官方页面',
    year: 2024,
    url: 'https://www.aiva.ai/',
    note: 'AI 作曲与授权商业模式的代表产品。',
  },
  {
    category: 'news / media',
    topic: 'aiva',
    title: '第一个世界上正式的AI作曲家AIVA到底是怎样创作音乐的？',
    year: 2017,
    url: 'https://www.163.com/dy/article/CFOD8PR30511C9QL.html',
    note: '中文媒体对 AIVA 的早期介绍，说明中文语境很早就把它视为作曲型生成工具。',
  },
  {
    category: 'product',
    topic: 'music generation',
    title: 'Soundraw 官方页面',
    year: 2024,
    url: 'https://soundraw.io/',
    note: '可定制音乐生成产品，对“可控生成”很有参考意义。',
  },
  {
    category: 'product',
    topic: 'music generation',
    title: 'SOUNDRAW 商业使用页',
    year: 2024,
    url: 'https://soundraw.io/business',
    note: '突出商业许可、可用场景和企业采购路径。',
  },
  {
    category: 'product',
    topic: 'music generation',
    title: 'SOUNDRAW API',
    year: 2024,
    url: 'https://soundraw.io/api',
    note: 'API 计划与接入能力，支持平台级嵌入。',
  },
  {
    category: 'product',
    topic: 'music generation',
    title: 'SOUNDRAW License',
    year: 2024,
    url: 'https://soundraw.io/license',
    note: '说明版权许可、商业使用和训练数据口径。',
  },
  {
    category: 'product',
    topic: 'music generation',
    title: 'SOUNDRAW Enterprise',
    year: 2024,
    url: 'https://discover.soundraw.io/enterprise',
    note: '企业版入口，说明面向 B 端的工作流销售。',
  },
  {
    category: 'product',
    topic: 'music generation',
    title: 'SOUNDRAW API Inquiry',
    year: 2024,
    url: 'https://discover.soundraw.io/api/inquiry',
    note: '白标和 API 接入询价页，反映平台化路径。',
  },
  {
    category: 'product',
    topic: 'music generation',
    title: 'SOUNDRAW 商业解决方案博客',
    year: 2025,
    url: 'https://soundraw.io/blog/post/soundraws-ai-music-business-solutions-exploring-the-api-enterprise-and-academic-plans',
    note: '对 API、Enterprise 和 Academic 三类方案的官方解释。',
  },
  {
    category: 'product',
    topic: 'music generation',
    title: 'Beatoven 官方页面',
    year: 2024,
    url: 'https://www.beatoven.ai/',
    note: 'AI 配乐产品，体现 B2B 内容生成的商业路径。',
  },
  {
    category: 'product',
    topic: 'music generation',
    title: 'Mubert 官方页面',
    year: 2024,
    url: 'https://mubert.com/',
    note: '生成式音频和版权授权结合的商业样本。',
  },
  {
    category: 'product',
    topic: 'music generation',
    title: 'Boomy 官方页面',
    year: 2024,
    url: 'https://boomy.com/',
    note: '大众化音乐生成工具，对产品门槛和付费意愿有参考价值。',
  },
  {
    category: 'product',
    topic: 'music generation',
    title: 'Suno Pricing',
    year: 2025,
    url: 'https://suno.com/pricing',
    note: 'Suno 的订阅层级与商业使用边界。',
  },
  {
    category: 'product',
    topic: 'music generation',
    title: 'Udio Pricing',
    year: 2025,
    url: 'https://www.udio.com/pricing',
    note: 'Udio 的订阅层级与付费路径。',
  },
  {
    category: 'product',
    topic: 'music generation',
    title: 'Universal Music Group and Udio announce Udio’s first strategic agreements for new licensed AI music creation platform',
    year: 2025,
    url: 'https://www.universalmusic.com/universal-music-group-and-udio-announce-udios-first-strategic-agreements-for-new-licensed-ai-music-creation-platform/',
    note: 'Udio 转向授权化平台的重要商业信号。',
  },
  {
    category: 'product',
    topic: 'music generation',
    title: 'OPERA America: An AI revolution is coming in opera too?',
    year: 2024,
    url: 'https://www.operaamerica.org/magazine/spring-2024/an-ai-revolution-is-coming-in-opera-too/',
    note: '歌剧行业对 AI 的讨论偏项目制和实验性，而非标准 SaaS。',
  },
  {
    category: 'product',
    topic: 'music generation',
    title: 'Amadeus Code Pricing',
    year: 2025,
    url: 'https://amadeuscode.com/en/pricing',
    note: 'Amadeus Code 的定价与商业化入口。',
  },
  {
    category: 'product',
    topic: 'music generation',
    title: 'Amadeus Code News',
    year: 2025,
    url: 'https://amadeuscode.com/en/news',
    note: '连续新闻更新，说明产品并非静态页面。',
  },
  {
    category: 'product',
    topic: 'music generation',
    title: 'Amadeus Code Evoke Music',
    year: 2025,
    url: 'https://amadeuscode.com/en/evoke-music',
    note: '面向内容场景的 AI 音乐生成 / 分发产品。',
  },
  {
    category: 'product',
    topic: 'music generation',
    title: 'Amadeus Code FUJIYAMA AI SOUND',
    year: 2025,
    url: 'https://amadeuscode.com/en/fujiyama-ai-sound',
    note: '更偏底层的 AI 音频生成和样本源。',
  },
];

const titleRank = (title) => title.toLowerCase().replace(/\s+/g, ' ').trim();

async function fetchOpenAlex(query) {
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=5`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'quci-ai-research/1.0 (Codex research build)',
    },
  });
  if (!res.ok) {
    throw new Error(`OpenAlex request failed for "${query}": ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return (data.results || []).map((work) => ({
    category: 'academic',
    topic: query,
    title: work.display_name || '',
    year: work.publication_year || '',
    url: work.doi || work.primary_location?.landing_page_url || '',
    author: work.authorships?.[0]?.author?.display_name || '',
    note: `Query match: ${query}`,
  }));
}

function dedupe(rows) {
  const seen = new Map();
  for (const row of rows) {
    const key = titleRank(row.title || row.url);
    if (!seen.has(key)) {
      seen.set(key, { ...row, topics: [row.topic] });
      continue;
    }
    const existing = seen.get(key);
    if (row.topic && !existing.topics.includes(row.topic)) {
      existing.topics.push(row.topic);
    }
    if (!existing.url && row.url) {
      existing.url = row.url;
    }
    if (!existing.author && row.author) {
      existing.author = row.author;
    }
  }
  return [...seen.values()];
}

function sortAcademic(rows) {
  return [...rows].sort((a, b) => {
    const yearDiff = (Number(b.year) || 0) - (Number(a.year) || 0);
    if (yearDiff !== 0) return yearDiff;
    return String(a.title).localeCompare(String(b.title), 'en');
  });
}

function escapeCsv(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function renderMarkdownTable(rows) {
  const header = [
    '| ID | 类别 | 主题 | 标题 | 年份 | 说明 | 链接 |',
    '|---|---|---|---|---:|---|---|',
  ];
  const body = rows.map((row) => {
    const link = row.url ? `[link](${row.url})` : '';
    const title = row.title ? row.title.replace(/\|/g, '\\|') : '';
    const note = (row.note || '').replace(/\|/g, '\\|');
    return `| ${row.id} | ${row.category} | ${row.topic || ''} | ${title} | ${row.year || ''} | ${note} | ${link} |`;
  });
  return [...header, ...body].join('\n');
}

async function main() {
  await mkdir(dataDir, { recursive: true });
  await mkdir(appendixDir, { recursive: true });

  const fetched = (await Promise.all(academicQueries.map(fetchOpenAlex))).flat();
  const filtered = fetched.filter((row) => includeRe.test(row.title) && !excludeRe.test(row.title));
  const academic = sortAcademic(dedupe(filtered));

  const official = officialSources.map((row, idx) => ({
    id: `O${String(idx + 1).padStart(2, '0')}`,
    source_type: 'official',
    ...row,
  }));

  const academicRows = academic.map((row, idx) => ({
    id: `A${String(idx + 1).padStart(3, '0')}`,
    source_type: 'academic',
    ...row,
    topic: Array.isArray(row.topics) ? row.topics.slice(0, 3).join(' / ') : row.topic,
  }));

  const sources = [...official, ...academicRows];
  const jsonPath = path.join(dataDir, 'sources.json');
  await writeFile(jsonPath, JSON.stringify(sources, null, 2), 'utf8');

  const csvHeader = ['id', 'source_type', 'category', 'topic', 'title', 'year', 'url', 'author', 'note'];
  const csvRows = [csvHeader.join(',')];
  for (const row of sources) {
    csvRows.push([
      row.id,
      row.source_type,
      row.category || '',
      row.topic || '',
      row.title || '',
      row.year || '',
      row.url || '',
      row.author || '',
      row.note || '',
    ].map(escapeCsv).join(','));
  }
  await writeFile(path.join(dataDir, 'sources.csv'), csvRows.join('\n'), 'utf8');

  const appendixLines = [
    '# 附录 A. 证据索引',
    '',
    `本附录共收录 **${sources.length}** 条证据，其中官方 / 产品 / 政策来源 ${official.length} 条，学术来源 ${academicRows.length} 条。`,
    '',
    '下面的表格按来源代码排序，便于正文回查。',
    '',
    renderMarkdownTable(sources),
    '',
  ];
  await writeFile(path.join(appendixDir, 'evidence-index.md'), appendixLines.join('\n'), 'utf8');

  const summary = {
    generated_at: new Date().toISOString(),
    source_count: sources.length,
    official_count: official.length,
    academic_count: academicRows.length,
  };
  await writeFile(path.join(dataDir, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');

  console.log(`Collected ${sources.length} sources (${official.length} official + ${academicRows.length} academic).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
