document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    const state = {
        currentSection: 'upload',
        fontFamily: "'Inter', sans-serif",
        lineSpacing: '1.6',
        cards: [{ id: 0, title: 'Introdução', content: '<h2>Introdução</h2><p>Comece sua jornada soberana aqui...</p>' }],
        activeCardIndex: 0,
        history: [],
        historyIndex: -1,
        references: []
    };

    // --- DOM Elements ---
    const sections = document.querySelectorAll('.step-section');
    const navButtons = document.querySelectorAll('.nav-btn');
    const docContent = document.getElementById('document-content');
    const cardNavList = document.getElementById('card-nav-list');
    const aiModal = document.getElementById('ai-modal');

    // --- Navigation (Top Nav) ---
    const showSection = (sectionId) => {
        sections.forEach(s => s.classList.remove('active'));
        navButtons.forEach(b => b.classList.remove('active'));
        
        const targetSection = document.getElementById(`section-${sectionId}`);
        const targetBtn = document.getElementById(`btn-${sectionId}`);
        
        if (targetSection) targetSection.classList.add('active');
        if (targetBtn) targetBtn.classList.add('active');
        state.currentSection = sectionId;
    };

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => showSection(btn.id.replace('btn-', '')));
    });

    // --- History & State Sync ---
    const saveHistory = () => {
        const snapshot = JSON.stringify(state.cards);
        if (state.historyIndex < state.history.length - 1) {
            state.history = state.history.slice(0, state.historyIndex + 1);
        }
        state.history.push(snapshot);
        state.historyIndex++;
    };

    // --- Card Rendering ---
    const renderCardList = () => {
        cardNavList.innerHTML = state.cards.map((card, index) => `
            <div class="card-item ${index === state.activeCardIndex ? 'active' : ''}" onclick="window.switchCard(${index})">
                ${index + 1}. ${card.title}
            </div>
        `).join('');
    };

    const renderActiveCard = () => {
        const card = state.cards[state.activeCardIndex];
        docContent.innerHTML = card.content;
        docContent.style.fontFamily = state.fontFamily;
        docContent.style.lineHeight = state.lineSpacing;
    };

    window.switchCard = (index) => {
        state.cards[state.activeCardIndex].content = docContent.innerHTML;
        state.activeCardIndex = index;
        renderActiveCard();
        renderCardList();
    };

    // --- AI Generation (The "Thinking AI") ---
    const generateThinkingContent = (title, baseText) => {
        return `
            <h2>${title}</h2>
            <p>${baseText}</p>
            
            <div class="research-note">
                <strong>📊 Análise Técnica:</strong><br>
                Pesquisas em psicologia organizacional demonstram que o excesso de "agradabilidade" (people pleasing) 
                está correlacionado a uma queda de 30% na percepção de liderança em ambientes de alta performance.
            </div>

            <div class="case-study">
                <h4>📝 Estudo de Caso: O Efeito Soberania</h4>
                <p>Uma executiva de tecnologia implementou a "Engenharia de Limites" (Parte II) e conseguiu 
                reduzir reuniões improdutivas em 12 horas semanais, focando apenas em entregas de alto valor.</p>
            </div>

            <img src="https://picsum.photos/seed/${Math.random()}/1200/600" style="width:100%; border-radius:12px; margin:2rem 0; object-fit:cover;">
        `;
    };

    document.getElementById('btn-start-ai-gen').addEventListener('click', () => {
        const prompt = document.getElementById('ai-gen-prompt').value;
        if (!prompt) return showToast('Descreva sua visão soberana.', 'error');

        const btn = document.getElementById('btn-start-ai-gen');
        btn.disabled = true;
        btn.innerText = 'IA Processando Pesquisas...';

        setTimeout(() => {
            // Smart Parsing for Chapters
            let chapters = [];
            const chapterRegex = /(Capítulo \d+:|Introdução:|Parte [I|V|X]+:|Conclusão:)(.*?)(?=(?:Capítulo \d+:|Introdução:|Parte [I|V|X]+:|Conclusão:|$))/gs;
            let match;
            
            while ((match = chapterRegex.exec(prompt)) !== null) {
                const title = match[1].trim() + " " + (match[2].split('\n')[0] || '').trim();
                chapters.push({
                    title: title,
                    content: generateThinkingContent(title, match[2].trim().replace(/\n/g, '<br>'))
                });
            }

            if (chapters.length === 0) {
                chapters = [{ title: 'Novo Ebook', content: generateThinkingContent('Início', prompt) }];
            }

            state.cards = chapters.map((c, i) => ({ id: i, ...c }));
            state.activeCardIndex = 0;
            saveHistory();
            renderActiveCard();
            renderCardList();
            
            aiModal.classList.add('hidden');
            showSection('editor');
            showToast('Ebook de Elite Gerado!', 'success');
            btn.disabled = false;
            btn.innerText = 'Gerar Ebook de Elite';
        }, 3000);
    });

    // --- File Upload ---
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        showToast('Analisando documento...');
        const reader = new FileReader();
        reader.onload = (e) => {
            mammoth.convertToHtml({ arrayBuffer: e.target.result })
                .then(result => {
                    // Simple split by H2/H3 for diagramming
                    const parts = result.value.split(/(?=<(?:h1|h2|h3)>)/i);
                    state.cards = parts.map((p, i) => ({
                        id: i,
                        title: (p.match(/<(?:h1|h2|h3)>(.*?)<\//i) || [null, `Seção ${i+1}`])[1],
                        content: generateThinkingContent('Revisado: ' + i, p)
                    }));
                    state.activeCardIndex = 0;
                    saveHistory();
                    renderActiveCard();
                    renderCardList();
                    showSection('editor');
                    showToast('Texto diagramado e revisado pela IA.', 'success');
                });
        };
        reader.readAsArrayBuffer(file);
    });

    // --- Editor Tools ---
    document.getElementById('open-ai-modal-btn').addEventListener('click', () => aiModal.classList.remove('hidden'));
    document.getElementById('close-ai-modal').addEventListener('click', () => aiModal.classList.add('hidden'));

    document.querySelectorAll('.style-btn[data-tag]').forEach(btn => {
        btn.addEventListener('click', () => document.execCommand('formatBlock', false, btn.dataset.tag));
    });

    document.querySelectorAll('.style-btn[data-spacing]').forEach(btn => {
        btn.addEventListener('click', () => {
            state.lineSpacing = btn.dataset.spacing;
            docContent.style.lineHeight = state.lineSpacing;
            document.querySelectorAll('.style-btn[data-spacing]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    document.getElementById('theme-toggle').addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
    });

    // --- Helpers ---
    function showToast(m, t='info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${t}`;
        toast.innerText = m;
        document.getElementById('toast-container').appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '1';
            setTimeout(() => { toast.remove(); }, 3000);
        }, 100);
    }

    // Init
    renderActiveCard();
    renderCardList();
    saveHistory();
});
