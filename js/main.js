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

// カテゴリ統一マップ
const CATEGORY_MAP = {
    'ホーム＆キッチン': '調理器具',
    'キッチン用品': '調理器具',
    'ホーム用品': '調理器具',
    '食器・キッチン': '食器・陶器',
    '文房具': '文房具',
    'DIY・工具・ガーデン': '工具・DIY用品',
    'ビューティー': '美容・化粧品',
    'キッチン家電': 'キッチン家電',
    'パソコン・周辺機器': '工具・DIY用品'
    // それ以外は元のカテゴリをそのまま使う
};

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

// 正規化された製品データを返す
function normalizeProduct(raw) {
    if (!raw) return null;

    const asin = raw.asin || '';
    let manufacturer = raw.manufacturer || '';
    const rawCategory = raw.category || '';
    const category = CATEGORY_MAP[rawCategory] || rawCategory;
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

    // ここまで通ったものだけ「日本製」として表示候補とする
    if (!hasJapanese(title)) {
        if (manufacturer && category) {
            title = `${manufacturer}（${category}）`;
        } else if (manufacturer) {
            title = manufacturer;
        } else if (category) {
            title = category;
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
        category,
        url,
        madeInJapan: !!raw.madeInJapan,
        available: raw.available !== false
    };
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

    // カテゴリーカードのクリックイベント
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category || 'all';
            const categorySelect = document.getElementById('category-filter');
            if (categorySelect) {
                categorySelect.value = category;
            }
            filterProducts();
            scrollToProducts();
        });
    });

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

    // カテゴリー条件
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
