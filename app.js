let challenges = [];
let activeChallenge = null;
let currentTab = 'question';

async function init() {
    try {
        const response = await fetch('manifest.json');
        challenges = await response.json();
        renderChallengeList();
        lucide.createIcons();
        
        document.getElementById('stat-challenges').textContent = challenges.length;
    } catch (error) {
        console.error('Error loading manifest:', error);
    }
}

function renderChallengeList() {
    const list = document.getElementById('challenge-list');
    list.innerHTML = challenges.map(c => `
        <div class="challenge-item" onclick="selectChallenge('${c.id}')" data-id="${c.id}">
            <h3>${c.title}</h3>
            <span>${c.category}</span>
        </div>
    `).join('');
}

async function selectChallenge(id) {
    activeChallenge = challenges.find(c => c.id === id);
    
    document.querySelectorAll('.challenge-item').forEach(el => {
        el.classList.toggle('active', el.dataset.id === id);
    });
    
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('challenge-view').style.display = 'block';
    
    document.getElementById('current-title').textContent = activeChallenge.title;
    document.getElementById('current-badge').textContent = activeChallenge.category;
    
    loadContent();
}

async function loadContent() {
    const display = document.getElementById('content-display');
    const actionPanel = document.getElementById('code-actions');
    display.innerHTML = '<p style="color: var(--text-secondary);">Loading content...</p>';
    
    const dir = activeChallenge.directory;
    const fileName = currentTab === 'question' ? 'Question.md' : 'Solution.R';
    const filePath = `${encodeURIComponent(dir)}/${fileName}`;

    actionPanel.style.display = currentTab === 'solution' ? 'flex' : 'none';

    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error('File not found');
        const text = await response.text();
        
        if (currentTab === 'question') {
            display.innerHTML = marked.parse(text);
        } else {
            display.innerHTML = `<pre id="code-block" class="language-r"><code>${escapeHtml(text)}</code></pre>`;
            Prism.highlightAllUnder(display);
        }
    } catch (error) {
        display.innerHTML = `<p style="color: #ef4444;">Error loading ${fileName}: Ensure the file exists in the repository.</p>`;
    }
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab').forEach(el => {
        el.classList.toggle('active', el.textContent.toLowerCase() === tab);
    });
    loadContent();
}

function copyCode() {
    const code = document.querySelector('#code-block code').innerText;
    navigator.clipboard.writeText(code).then(() => {
        const btn = document.querySelector('.action-btn[title="Copy Code"]');
        const icon = btn.querySelector('i');
        icon.setAttribute('data-lucide', 'check');
        lucide.createIcons();
        setTimeout(() => {
            icon.setAttribute('data-lucide', 'copy');
            lucide.createIcons();
        }, 2000);
    });
}

function downloadSolution() {
    const code = document.querySelector('#code-block code').innerText;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Solution_${activeChallenge.id}.R`;
    a.click();
}

document.getElementById('challenge-search').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const items = document.querySelectorAll('.challenge-item');
    items.forEach(item => {
        const title = item.querySelector('h3').textContent.toLowerCase();
        item.style.display = title.includes(term) ? 'block' : 'none';
    });
});

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

document.addEventListener('DOMContentLoaded', init);
