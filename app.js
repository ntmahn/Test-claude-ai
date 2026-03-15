// ═══════════════════════════════════════════════════════════════
// NEXUS BD — Web3 Sales Intelligence Engine
// ═══════════════════════════════════════════════════════════════

const ANTHROPIC_API_KEY = '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';

const PACKAGES = {
  staking: {
    icon: '🔒',
    name: 'STAKING POOL',
    features: ['Custom staking smart contract', 'APY optimization engine', 'Yield aggregation dashboard', 'Anti-whale mechanics', 'Auto-compounding module']
  },
  growth: {
    icon: '🚀',
    name: 'User Growth-Hacking & Community Management',
    features: ['24/7 Discord/Telegram moderation', 'Viral referral programs', 'On-chain quest campaigns', 'Community ambassador network', 'Retention analytics dashboard']
  },
  kol: {
    icon: '📢',
    name: 'Top-Tier KOL Activation & Shilling',
    features: ['Tier-1 KOL network (500K–10M reach)', 'Coordinated launch campaigns', 'Alpha group distribution', 'Thread & spaces optimization', 'Performance-based tracking']
  },
  viral: {
    icon: '🌊',
    name: 'Viral & Brand Marketing Campaign',
    features: ['Meme & narrative strategy', 'Cross-platform viral loops', 'User-generated content mechanics', 'Trend-jacking playbook', 'Brand identity refresh']
  },
  pr: {
    icon: '📰',
    name: 'PR Booking & Distribution',
    features: ['CoinDesk / Decrypt / The Block', 'CoinTelegraph / BeInCrypto', 'Yahoo Finance / Bloomberg Crypto', '200+ crypto media outlets', 'SEO-optimized press releases']
  }
};

// Kept short to stay within rate limits
const SYSTEM_PROMPT = `You are a Web3 BD analyst. Agency products:
1. STAKING_POOL - staking infra, APY, yield
2. GROWTH - community mgmt, Discord/TG, referrals
3. KOL - influencer campaigns, alpha groups
4. VIRAL - meme/brand campaigns, trend-jacking
5. PR - CoinDesk/Decrypt/The Block/Cointelegraph/200+ outlets

Analyze the given Web3 project. Return ONLY raw JSON (no markdown fences):
{"project_name":"","tagline":"","category":"DeFi|NFT|GameFi|L1/L2|DAO|DEX|Infra|Meme|RWA|AI+Web3|Other","chain":"","token":null,"bd_score":0,"score_grade":"HOT LEAD|STRONG PROSPECT|WARM LEAD|COLD LEAD","score_reason":"","overview":{"description":"","founded":"","backers":"","tvl":"","market_cap":"","community":{"twitter_followers":"","discord_members":"","telegram_members":""},"recent_news":"","growth_stage":"Seed|Early|Growth|Established|Stagnant|Declining"},"pain_points":[{"title":"","description":"","severity":"critical|high|medium"}],"package_recommendations":[{"package_id":"staking|growth|kol|viral|pr","match_score":0,"is_recommended":false,"reason":""}],"pitches":{"twitter_dm":"","email_cold":"","telegram_intro":"","linkedin":""},"strategy_notes":""}`;

// ── UI State ──────────────────────────────────────────────────
let currentTab = 0;

function showStep(stepNum, done = []) {
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById(`step${i}`);
    el.className = 'step-item';
    if (done.includes(i)) el.classList.add('done');
    else if (i === stepNum) el.classList.add('active');
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function startAnalysis() {
  const input = document.getElementById('projectInput').value.trim();
  if (!input) {
    document.getElementById('projectInput').focus();
    document.getElementById('projectInput').style.borderColor = '#ef4444';
    setTimeout(() => { document.getElementById('projectInput').style.borderColor = ''; }, 2000);
    return;
  }

  // Reset UI
  document.getElementById('analyzeBtn').disabled = true;
  document.getElementById('analyzeBtn').textContent = '⏳ Analyzing...';
  document.getElementById('errorCard').className = 'error-card';
  document.getElementById('resultsSection').className = 'results-section';
  document.getElementById('loadingSection').className = 'loading-section visible';

  showStep(1);
  document.getElementById('loadingStatus').textContent = 'Connecting to research pipeline...';

  try {
    // Simulate progressive steps while API call runs
    const apiPromise = callClaudeAPI(input);

    await sleep(800); showStep(2, [1]);
    document.getElementById('loadingStatus').textContent = 'Fetching social & community metrics...';
    await sleep(900); showStep(3, [1, 2]);
    document.getElementById('loadingStatus').textContent = 'Evaluating tokenomics & staking data...';
    await sleep(1000); showStep(4, [1, 2, 3]);
    document.getElementById('loadingStatus').textContent = 'Identifying growth gaps & pain points...';

    const data = await apiPromise;

    showStep(5, [1, 2, 3, 4]);
    document.getElementById('loadingStatus').textContent = 'Generating sales strategy...';
    await sleep(600);
    showStep(5, [1, 2, 3, 4, 5]);
    await sleep(400);

    renderResults(data);

  } catch (err) {
    showError(err.message);
  } finally {
    document.getElementById('analyzeBtn').disabled = false;
    document.getElementById('analyzeBtn').textContent = '⚡ Analyze';
    document.getElementById('loadingSection').className = 'loading-section';
  }
}

// ── API Call with retry ───────────────────────────────────────
async function callClaudeAPI(projectInput) {
  const userPrompt = `Research this Web3 project and return BD analysis JSON: ${projectInput}
Find: description, chain, token, market cap, TVL, Twitter/Discord/Telegram size, backers, recent news.
Identify 3-4 pain points. Score all 5 packages. Write 4 outreach pitches. BD score 0-100.`;

  const makeRequest = async () => {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after') || '60';
      throw { retryable: true, wait: parseInt(retryAfter) * 1000, message: `Rate limit hit. Retrying in ${retryAfter}s...` };
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw { retryable: false, message: err.error?.message || `API error ${response.status}` };
    }

    return response.json();
  };

  // Try up to 3 times with backoff
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await makeRequest();
      const textBlock = result.content?.find(b => b.type === 'text');
      if (!textBlock) throw { retryable: false, message: 'No text response from AI' };

      let jsonText = textBlock.text.trim()
        .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

      try {
        return JSON.parse(jsonText);
      } catch {
        const match = jsonText.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
        throw { retryable: false, message: 'Could not parse AI response. Please try again.' };
      }

    } catch (err) {
      lastError = err;
      if (!err.retryable || attempt === 3) break;
      const wait = err.wait || (attempt * 20000);
      document.getElementById('loadingStatus').textContent = `Rate limit — waiting ${Math.round(wait/1000)}s before retry ${attempt}/3...`;
      await sleep(wait);
    }
  }

  throw new Error(lastError?.message || 'Request failed after 3 attempts');
}

// ── Render Results ────────────────────────────────────────────
function renderResults(data) {
  // Project name + meta
  document.getElementById('resProjectName').textContent = data.project_name || 'Project Analysis';
  const meta = document.getElementById('resMeta');
  meta.innerHTML = `
    <div class="meta-tag live">● LIVE ANALYSIS</div>
    <div class="meta-tag">${data.category || '—'}</div>
    <div class="meta-tag">${data.chain || '—'}</div>
    ${data.token ? `<div class="meta-tag">${data.token}</div>` : ''}
    <div class="meta-tag">${data.overview?.growth_stage || '—'}</div>
  `;

  // Score
  const score = data.bd_score || 0;
  const scoreColor = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  document.getElementById('scoreNum').textContent = score;
  document.getElementById('scoreNum').style.color = scoreColor;
  document.getElementById('scoreGrade').textContent = data.score_grade || '—';
  document.getElementById('scoreGrade').style.color = scoreColor;
  document.getElementById('scoreDesc').textContent = data.score_reason || '';
  // Animate circle
  setTimeout(() => {
    const offset = 188.4 * (1 - score / 100);
    const fill = document.getElementById('scoreFill');
    fill.style.strokeDashoffset = offset;
    fill.style.stroke = scoreColor;
  }, 200);

  // Overview Grid
  const og = data.overview || {};
  document.getElementById('overviewGrid').innerHTML = `
    <div class="result-card accent-blue">
      <div class="card-icon blue">📋</div>
      <div class="card-title">Project Summary</div>
      <div class="card-content">
        <p style="margin-bottom:12px">${og.description || '—'}</p>
        <div class="stat-row"><span class="stat-label">Founded</span><span class="stat-val">${og.founded || 'Unknown'}</span></div>
        <div class="stat-row"><span class="stat-label">Backers</span><span class="stat-val" style="text-align:right;max-width:200px">${og.backers || 'Unknown'}</span></div>
        <div class="stat-row"><span class="stat-label">Recent</span><span class="stat-val" style="text-align:right;max-width:200px;font-size:11px">${og.recent_news || '—'}</span></div>
      </div>
    </div>
    <div class="result-card accent-cyan">
      <div class="card-icon cyan">📊</div>
      <div class="card-title">Market & Traction</div>
      <div class="card-content">
        <div class="stat-row">
          <span class="stat-label">Market Cap</span>
          <span class="stat-val ${marketClass(og.market_cap)}">${og.market_cap || 'Unknown'}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">TVL</span>
          <span class="stat-val">${og.tvl || 'N/A'}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Twitter</span>
          <span class="stat-val">${og.community?.twitter_followers || 'Unknown'}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Discord</span>
          <span class="stat-val">${og.community?.discord_members || 'Unknown'}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Telegram</span>
          <span class="stat-val">${og.community?.telegram_members || 'Unknown'}</span>
        </div>
      </div>
    </div>
  `;

  // Pain Points
  const painList = document.getElementById('painPointsList');
  const pains = data.pain_points || [];
  painList.innerHTML = pains.map((p, i) => `
    <div class="pain-item">
      <div class="pain-num">${i + 1}</div>
      <div class="pain-content">
        <div class="pain-title" style="color:${p.severity === 'critical' ? '#ef4444' : p.severity === 'high' ? '#f59e0b' : '#94a3b8'}">
          ${severityIcon(p.severity)} ${p.title}
        </div>
        <div class="pain-desc">${p.description}</div>
      </div>
    </div>
  `).join('');

  // Packages
  const pkgGrid = document.getElementById('packagesGrid');
  const recs = data.package_recommendations || [];
  pkgGrid.innerHTML = recs.map(rec => {
    const pkg = PACKAGES[rec.package_id];
    if (!pkg) return '';
    return `
      <div class="pkg-card ${rec.is_recommended ? 'recommended' : ''}">
        ${rec.is_recommended ? '<div class="pkg-recommend-badge">TOP PICK</div>' : ''}
        <div class="pkg-icon">${pkg.icon}</div>
        <div class="pkg-name">${pkg.name}</div>
        <div class="pkg-match">
          <div class="match-bar-bg">
            <div class="match-bar-fill" style="width:${rec.match_score}%"></div>
          </div>
          <div class="match-pct">${rec.match_score}%</div>
        </div>
        <div class="pkg-why">${rec.reason}</div>
        <ul class="pkg-features">
          ${pkg.features.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>
    `;
  }).join('');

  // Pitch Scripts
  const pitches = data.pitches || {};
  const pitchDefs = [
    { key: 'twitter_dm', label: 'Twitter DM' },
    { key: 'telegram_intro', label: 'Telegram / Discord' },
    { key: 'email_cold', label: 'Cold Email' },
    { key: 'linkedin', label: 'LinkedIn' }
  ].filter(p => pitches[p.key]);

  document.getElementById('pitchTabs').innerHTML = pitchDefs.map((p, i) => `
    <button class="pitch-tab ${i === 0 ? 'active' : ''}" onclick="switchTab(${i})">${p.label}</button>
  `).join('');

  document.getElementById('pitchContents').innerHTML = pitchDefs.map((p, i) => `
    <div class="pitch-content ${i === 0 ? 'active' : ''}" id="pitch-${i}">
      <div class="pitch-text">${escapeHtml(pitches[p.key] || '')}</div>
      <button class="copy-btn" onclick="copyText('pitch-${i}')">📋 Copy</button>
    </div>
  `).join('');

  // Strategy Notes
  document.getElementById('strategyNotes').innerHTML = `<p>${data.strategy_notes || '—'}</p>`;

  // Show results
  document.getElementById('resultsSection').className = 'results-section visible';

  // Animate reveals
  setTimeout(() => {
    document.querySelectorAll('.reveal').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 80);
    });
    // Animate package bars
    document.querySelectorAll('.match-bar-fill').forEach(bar => {
      const width = bar.style.width;
      bar.style.width = '0%';
      setTimeout(() => { bar.style.width = width; }, 300);
    });
  }, 100);

  document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Tab switching ─────────────────────────────────────────────
function switchTab(idx) {
  document.querySelectorAll('.pitch-tab').forEach((t, i) => {
    t.className = 'pitch-tab' + (i === idx ? ' active' : '');
  });
  document.querySelectorAll('.pitch-content').forEach((c, i) => {
    c.className = 'pitch-content' + (i === idx ? ' active' : '');
  });
}

// ── Copy to clipboard ─────────────────────────────────────────
function copyText(containerId) {
  const el = document.getElementById(containerId);
  const text = el?.querySelector('.pitch-text')?.textContent || '';
  navigator.clipboard.writeText(text).then(() => {
    const btn = el?.querySelector('.copy-btn');
    if (btn) { btn.textContent = '✅ Copied!'; setTimeout(() => { btn.innerHTML = '📋 Copy'; }, 2000); }
  });
}

// ── Helpers ───────────────────────────────────────────────────
function showError(msg) {
  document.getElementById('errorText').textContent = msg;
  document.getElementById('errorCard').className = 'error-card visible';
  document.getElementById('loadingSection').className = 'loading-section';
}

function severityIcon(s) {
  if (s === 'critical') return '🔴';
  if (s === 'high') return '🟡';
  return '🔵';
}

function marketClass(val) {
  if (!val || val === 'Unknown') return '';
  const n = parseFloat(val.replace(/[^0-9.]/g, ''));
  if (val.includes('B') && n > 1) return 'good';
  if (val.includes('M') && n > 100) return '';
  return 'warn';
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
}

// ── Enter key support ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('projectInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') startAnalysis();
  });
});
