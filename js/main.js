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

    // タイトルに「日本製」や「国産」が含まれているか確認
    if (!title.includes('日本製') && !title.includes('国産')) {
        return null;  // 「日本製」や「国産」じゃない場合は除外
    }

    // タイトルに「日本製素材使用」や「国産素材使用」を含む場合は除外
    if (title.includes('日本製素材使用') || title.includes('国産素材使用')) {
        return null;
    }

    // 日本語が含まれていない場合は、他の情報でタイトルを補完
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

    trackAmazonLinkClicks();
}

// AmazonリンクのクリックをGA4に送信
function trackAmazonLinkClicks() {
    const links = document.querySelectorAll('.amazon-link');

    links.forEach(link => {
        link.addEventListener('click', () => {
            const row = link.closest('tr');
            const asin = row?.dataset.asin || '';
            const name = row?.querySelector('td:nth-child(1)')?.textContent?.trim() || '';
            const manufacturer = row?.querySelector('td:nth-child(2)')?.textContent?.trim() || '';
            const category = row?.querySelector('td:nth-child(3)')?.textContent?.trim() || '';

            // GA4（gtag.js）が読み込まれている場合のみ送信
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
    });
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

// アマゾンリンクのクリックをトラッキング
document.querySelectorAll('a[href*="amazon.co.jp"]').forEach(function(link) {
    link.addEventListener('click', function(event) {
        var linkURL = event.target.href;  // クリックされたリンクのURLを取得

        // Google Analytics 4 イベント送信
        gtag('event', 'amazon_link_click', {
            'link_url': linkURL
        });
    });
});