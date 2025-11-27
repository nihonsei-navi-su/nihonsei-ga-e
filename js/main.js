console.log('main.js loaded');

// 製品データを取得
let productsData = [];
let currentSort = { column: null, ascending: true };

// タイトルに日本語（ひらがな・カタカナ・漢字）が含まれているかどうか判定
function hasJapanese(str) {
    if (!str) return false;
    return /[\u3040-\u30FF\u4E00-\u9FFF]/.test(str);
}

// 製品一覧までスクロール
function scrollToProducts() {
    const section = document.querySelector('.products-section');
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// 「素材だけ日本」「原料だけ国産」を明示的に除外するためのフレーズ一覧
const EXCLUDE_MATERIAL_PHRASES = [
    '日本製素材使用',
    '日本製素材を使用',
    '日本製素材',
    '日本製原料使用',
    '日本製原料を使用',
    '日本製原料',
    '国産素材使用',
    '国産素材を使用',
    '国産素材',
    '国産原料使用',
    '国産原料を使用',
    '国産原料',
    '国産材使用',
    '国産材を使用',
    '国産材',
    '日本製部品',
    '日本製パーツ',
    '日本製生地',
    '日本製生地使用',
    '日本製生地を使用',
    '日本製の生地を使用',
    '日本製糸使用',
    '日本製糸を使用',
    '日本製の糸を使用',
    '日本製繊維使用',
    '日本製繊維を使用',
    '日本製センサー',
    '日本製センサー搭載',
    '日本製繊維ヒーター',
    '日本製ヒーター',
    '日本製ヒータ',
    '日本製モーター',
    '日本製モータ',
    '日本製レンズ',
    '日本製フィルター',
];

// 「日本製○○」「国産○○」の ○○ が素材・部品側の単語
const COMPONENT_WORDS = [
    '素材', '原料', '部品', 'パーツ',
    'センサー', 'センサ',
    'ヒーター', 'ヒータ',
    '繊維', 'ファイバー', 'fiber',
    'モーター', 'モータ',
    'チップ', 'IC',

    '生地', '布', '布地', '表地', '裏地',
    '糸', 'ヤーン', 'yarn', 'thread',
    '中綿', '中わた', '詰め物', '充填材',
    '芯', '芯材', '芯地',
    'フィルター', 'レンズ',
    '皮革', '革', 'レザー',

    'ユニット', 'モジュール', 'バルブ', 'ポンプ',
    'コンプレッサー', '基板', 'ボード',
];

// サイト全体のカテゴリ一覧（12カテゴリ）
const SITE_CATEGORIES = [
    '包丁・ナイフ',
    'フライパン・鍋',
    'ケトル・コーヒー用品',
    'ボウル・ざる・計量',
    'キッチンツール・調理小物',
    '食器・カトラリー',
    'キッチンマット・シンク周り',
    '食品・お茶・調味料',
    '生活雑貨・インテリア',
    'ホビー・クラフト',
    '服飾・アクセサリー',
    'ヘルス・ビューティー・日用品'
];

// サイト内カテゴリ（12カテゴリ）のラベルを決める
function determineSiteCategoryLabel(raw) {
    const title = (raw.title || raw.originalTitle || '').trim();
    const category = (raw.category || '').trim();
    const text = title + ' ' + category; // 日本語をまとめて判定

    // 1. 包丁・ナイフ
    if (/(包丁|ナイフ|ペティ|牛刀|三徳|菜切|柳刃|パン切り|中華包丁)/.test(text)) {
        return '包丁・ナイフ';
    }

    // 2. フライパン・鍋
    if (/(フライパン|いため鍋|炒め鍋|ソテーパン|卵焼き|玉子焼|天ぷら鍋|土鍋|鍋)/.test(text)) {
        return 'フライパン・鍋';
    }

    // 3. ケトル・コーヒー用品
    if (/(ケトル|ドリップケトル|ポット|コーヒー|コーヒーメーカー|ドリッパー|サーバー)/.test(text)) {
        return 'ケトル・コーヒー用品';
    }

    // 4. ボウル・ざる・計量
    if (/(ボウル|ボール|ざる|ザル|水切り|こし器|裏ごし|うらごし|メジャーカップ|計量カップ)/.test(text) ||
        category === '計量カップ') {
        return 'ボウル・ざる・計量';
    }

    // 5. キッチンツール・調理小物
    if (/(トング|ターナー|ヘラ|へら|スパチュラ|スケッパー|ピーラー|おろし器|おろし金|刷毛|ハケ|しゃもじ|キッチンはさみ|キッチンバサミ|キッチンばさみ)/.test(text) ||
        /(キッチンツール|調理小物|へら・スパチュラ)/.test(category)) {
        return 'キッチンツール・調理小物';
    }

    // 6. 食器・カトラリー
    if (/(皿|プレート|パスタ皿|カレー皿|マグカップ|マグ|カップ|湯呑|湯のみ|茶碗|丼|どんぶり|急須)/.test(text) ||
        /(スプーン|フォーク|カトラリー|箸)/.test(text) ||
        /(食器・キッチン|食器)/.test(category)) {
        return '食器・カトラリー';
    }

    // 7. キッチンマット・シンク周り
    if (/(滑り止め|すべり止め|キッチンマット|マット|カーペット)/.test(text) ||
        /(排水口|排水溝|ゴミ受け)/.test(text) ||
        category === '排水口カバー') {
        return 'キッチンマット・シンク周り';
    }

    // 8. 食品・お茶・調味料
    if (/(中国茶|ほうじ茶|煎茶|緑茶|番茶|麦茶|ハーブティー|茶葉|粉末ティー|よもぎ茶|はと麦茶|三年番茶)/.test(text) ||
        /(みりん|はちみつ|蜂蜜|ハチミツ|パン粉|干し芋|乾燥芋|ほしいも|蒲焼|うなぎ|鰻)/.test(text) ||
        /(高野豆腐|青汁|ドリンクギフト|はちみつ|魚介類・水産加工品ギフト|茶葉・粉末ティー|パン粉)/.test(category)) {
        return '食品・お茶・調味料';
    }

    // 9. 生活雑貨・インテリア
    if (/(カーテン|インテリア|収納|クッション|ラグ|マルチカバー|エコバッグ|買い物袋|レジ袋)/.test(text) ||
        /(カーテン)/.test(category)) {
        return '生活雑貨・インテリア';
    }

    // 10. ホビー・クラフト
    if (/(ギター|ベース|楽器|ストラップ|ピック|ホビー|クラフト|手芸|釣り|PEライン)/.test(text) ||
        /(楽器|ホビー|PEライン)/.test(category)) {
        return 'ホビー・クラフト';
    }

    // 11. 服飾・アクセサリー
    if (/(リング|指輪|ネックレス|ブレスレット|ピアス|イヤリング|アクセサリー|財布|バッグ|ベルト)/.test(text) ||
        /(インナーシャツ|ストッキング|ショーツ|クルーソックス|靴下)/.test(category)) {
        return '服飾・アクセサリー';
    }

    // 12. ヘルス・ビューティー・日用品
    if (/(石鹸|ソープ|シャンプー|リンス|コンディショナー|ローション|クリーム|マスク|入浴剤|バスソルト|タオル|フェイスタオル|バスタオル|爪切り|マスク)/.test(text) ||
        /(ビューティー|ドラッグストア|ヘルスケア|布マスク|爪切り|害獣・害虫対策用品)/.test(category)) {
        return 'ヘルス・ビューティー・日用品';
    }

    // どれにも当てはまらない場合は、汎用の受け皿
    return '生活雑貨・インテリア';
}

// 正規化された製品データを返す
function normalizeProduct(raw) {
    if (!raw) return null;

    const asin = raw.asin || '';
    let manufacturer = raw.manufacturer || '';
    const url = raw.url || '';

    const rawTitle = (raw.title || raw.name || '').trim();
    let title = rawTitle;

    // "ハリオ" を "HARIO" に変更
    if (manufacturer === 'ハリオ') {
        manufacturer = 'HARIO';
    }

    // まず「日本製」「国産」が含まれていなければ除外
    if (!title.includes('日本製') && !title.includes('国産')) {
        return null;
    }

    // 明示的NGフレーズが含まれていれば除外
    if (EXCLUDE_MATERIAL_PHRASES.some(phrase => title.includes(phrase))) {
        return null;
    }

    // 「日本製(の)?○○」「国産(の)?○○」で ○○ が部品・素材ワードなら除外
    if (COMPONENT_WORDS.length > 0) {
        const escaped = COMPONENT_WORDS.map(w =>
            w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        );
        const compPattern = new RegExp(
            '(日本製|国産)の?(?:' + escaped.join('|') + ')'
        );
        if (compPattern.test(title)) {
            return null;
        }
    }

    // サイト内カテゴリ（12カテゴリ）のラベルを決定
    const siteCategoryLabel = determineSiteCategoryLabel(raw);

    // タイトルに日本語が無い場合のフォールバック
    if (!hasJapanese(title)) {
        if (manufacturer && siteCategoryLabel) {
            title = `${manufacturer}（${siteCategoryLabel}）`;
        } else if (manufacturer) {
            title = manufacturer;
        } else if (siteCategoryLabel) {
            title = siteCategoryLabel;
        } else if (asin) {
            title = asin;
        } else {
            title = '日本製の製品';
        }
    }

    return {
        asin,
        title,
        manufacturer,
        category: siteCategoryLabel, // 12カテゴリのラベルをここに入れる
        url,
        madeInJapan: !!raw.madeInJapan,
        available: raw.available !== false
    };
}

// カテゴリカード（12カテゴリ）を自動生成
function renderCategoryCards() {
    const container = document.getElementById('category-cards-container');
    if (!container) return;

    container.innerHTML = SITE_CATEGORIES.map(cat => `
        <button class="category-card" data-category="${cat}">
            <h3>${cat}</h3>
        </button>
    `).join('');

    container.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const cat = card.dataset.category;
            const categorySelect = document.getElementById('category-filter');
            if (categorySelect) categorySelect.value = cat;
            filterProducts();
            scrollToProducts();
        });
    });
}

// カテゴリフィルタ（セレクト）を自動生成
function renderCategoryFilterOptions() {
    const select = document.getElementById('category-filter');
    if (!select) return;

    select.innerHTML = `
        <option value="all">すべて</option>
        ${SITE_CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
    `;
}

// データ読み込み
fetch('data/products.json')
    .then(response => response.json())
    .then(data => {
        productsData = data.map(normalizeProduct).filter(p => p !== null);

        // フッターの総件数（あれば更新）
        const footerCount = document.getElementById('footer-product-count');
        if (footerCount) {
            footerCount.textContent = `掲載製品数: ${productsData.length}件`;
        }

        initPage();
    })
    .catch(error => console.error('Error loading products:', error));

// ページ初期化
function initPage() {
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);

    if (filename === 'index.html' || filename === '') {
        initHomePage();
    } else if (filename === 'submit.html') {
        initSubmitPage();
    }
}

// ホームページ
function initHomePage() {
    // カテゴリカード＆フィルタを 12カテゴリで生成
    renderCategoryCards();
    renderCategoryFilterOptions();

    // 総商品数を表示
    const totalElement = document.getElementById('product-total');
    if (totalElement) {
        totalElement.textContent = `掲載製品数：${productsData.length}件`;
    }

    // メーカーフィルターのオプションを追加
    const manufacturerFilter = document.getElementById('manufacturer-filter');
    if (manufacturerFilter) {
        const manufacturers = [...new Set(productsData.map(p => p.manufacturer).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, 'ja'));
        manufacturers.forEach(m => {
            const option = document.createElement('option');
            option.value = m;
            option.textContent = m;
            manufacturerFilter.appendChild(option);
        });
    }

    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');

    if (searchInput && searchButton) {
        // リアルタイム検索（入力中）
        searchInput.addEventListener('input', filterProducts);

        // Enterキー対応
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                filterProducts();
                scrollToProducts();
            }
        });

        // ボタンクリック時
        searchButton.addEventListener('click', () => {
            filterProducts();
            scrollToProducts();
        });
    }

    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }

    if (manufacturerFilter) {
        manufacturerFilter.addEventListener('change', filterProducts);
    }

    const resetButton = document.getElementById('reset-filter');
    if (resetButton) {
        resetButton.addEventListener('click', resetFilters);
    }

    // ソート機能
    const sortableHeaders = document.querySelectorAll('.sortable');
    sortableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.column; // "name", "manufacturer", "category"
            sortProducts(column);
        });
    });

    // 初期表示
    displayProducts(productsData);
}

// フィルター処理
function filterProducts() {
    const searchInputEl = document.getElementById('searchInput');
    const categoryFilterEl = document.getElementById('category-filter');
    const manufacturerFilterEl = document.getElementById('manufacturer-filter');

    const searchTerm = searchInputEl ? searchInputEl.value.toLowerCase().trim() : '';
    const categoryFilter = categoryFilterEl ? categoryFilterEl.value.trim() : 'all';
    const manufacturerFilter = manufacturerFilterEl ? manufacturerFilterEl.value.trim() : 'all';

    let filtered = productsData.slice();

    // 検索条件（タイトルとメーカーのみ）
    if (searchTerm) {
        filtered = filtered.filter(p => {
            const name = (p.title || '').toLowerCase();
            const manufacturer = (p.manufacturer || '').toLowerCase();
            return name.includes(searchTerm) || manufacturer.includes(searchTerm);
        });
    }

    // カテゴリー条件（category には 12カテゴリのラベルが入っている）
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(p => {
            const cat = (p.category || '').trim();
            return cat === categoryFilter;
        });
    }

    // メーカー条件
    if (manufacturerFilter !== 'all') {
        filtered = filtered.filter(p => (p.manufacturer || '').trim() === manufacturerFilter);
    }

    displayProducts(filtered);
}

// フィルターリセット
function resetFilters() {
    const categoryFilter = document.getElementById('category-filter');
    const manufacturerFilter = document.getElementById('manufacturer-filter');
    const searchInput = document.getElementById('searchInput');

    if (categoryFilter) categoryFilter.value = 'all';
    if (manufacturerFilter) manufacturerFilter.value = 'all';
    if (searchInput) searchInput.value = '';

    currentSort = { column: null, ascending: true };
    document.querySelectorAll('.sortable').forEach(header => {
        header.classList.remove('sorted-asc', 'sorted-desc');
    });

    displayProducts(productsData);
}

// ソート処理
function sortProducts(column) {
    if (!column) return;

    // 同じ列をクリックした場合は昇順/降順を切り替え
    if (currentSort.column === column) {
        currentSort.ascending = !currentSort.ascending;
    } else {
        currentSort.column = column;
        currentSort.ascending = true;
    }

    // ソートアイコンを更新
    document.querySelectorAll('.sortable').forEach(h => {
        h.classList.remove('sorted-asc', 'sorted-desc');
    });
    const header = document.querySelector(`.sortable[data-column="${column}"]`);
    if (header) {
        header.classList.add(currentSort.ascending ? 'sorted-asc' : 'sorted-desc');
    }

    // 現在表示されている製品を取得
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));
    const currentProducts = rows.map(row => {
        const asin = row.dataset.asin;
        return productsData.find(p => p.asin === asin);
    }).filter(Boolean);

    const getKey = (p) => {
        if (column === 'name') return (p.title || '').toLowerCase();
        if (column === 'manufacturer') return (p.manufacturer || '').toLowerCase();
        if (column === 'category') return (p.category || '').toLowerCase();
        return '';
    };

    currentProducts.sort((a, b) => {
        const aValue = getKey(a);
        const bValue = getKey(b);
        if (aValue < bValue) return currentSort.ascending ? -1 : 1;
        if (aValue > bValue) return currentSort.ascending ? 1 : -1;
        return 0;
    });

    displayProducts(currentProducts);
}

// 製品を表示
function displayProducts(products) {
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;
    
    if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">製品が見つかりません</td></tr>';
        return;
    }

    const html = products.map(product => {
        const name = product.title || 'Unknown';
        const manufacturer = product.manufacturer || 'Unknown';
        const category = product.category || 'Unknown';
        const amazonUrl = product.url || `https://www.amazon.co.jp/dp/${product.asin}`;
        
        return `
        <tr data-asin="${product.asin}">
            <td>${name}</td>
            <td>${manufacturer}</td>
            <td>${category}</td>
            <td><a href="${amazonUrl}" class="amazon-link" target="_blank" rel="noopener">Amazonで見る</a></td>
        </tr>
        `;
    }).join('');

    tbody.innerHTML = html;
}

// 投稿フォームページ
function initSubmitPage() {
    const form = document.getElementById('submit-form');
    if (!form) return;
    const formMessage = document.getElementById('form-message');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (formMessage) {
            formMessage.style.display = 'block';
            formMessage.className = 'form-message success';
            formMessage.textContent = 'ご投稿ありがとうございます！';
        }
        
        form.reset();
        
        if (formMessage) {
            setTimeout(() => {
                formMessage.style.display = 'none';
            }, 5000);
        }
    });
}

// Amazon リンク クリック計測（GA4：1本に統一）
document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (!link) return;

    // Amazonリンクのみ計測
    if (!link.href || !link.href.includes('amazon.co.jp')) return;

    const row = link.closest('tr');
    const asin = row?.dataset.asin || '';
    const name = row?.querySelector('td:nth-child(1)')?.textContent?.trim() || '';
    const manufacturer = row?.querySelector('td:nth-child(2)')?.textContent?.trim() || '';
    const category = row?.querySelector('td:nth-child(3)')?.textContent?.trim() || '';

    // ここでクリック時のログを出す（デバッグ用）
    console.log('amazon_click fired', { asin, name, manufacturer, category, href: link.href });

    if (typeof gtag === 'function') {
        gtag('event', 'amazon_click', {
            product_asin: asin,
            product_name: name,
            product_manufacturer: manufacturer,
            product_category: category,
            link_url: link.href,
            page_path: location.pathname
        });
    }
});
