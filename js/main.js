// 製品データを取得
let productsData = [];
let currentSort = { column: null, ascending: true };

// タイトルに日本語（ひらがな・カタカナ・漢字）が含まれているかどうか判定
function hasJapanese(str) {
    if (!str) return false;
    return /[\u3040-\u30FF\u4E00-\u9FFF]/.test(str);
}


function scrollToProducts() {
    const section = document.querySelector('.products-section');
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth'
        });
    }
}

// カテゴリ統一マップ（A案）
const CATEGORY_MAP = {
    'ホーム＆キッチン': '調理器具',
    'キッチン用品': '調理器具',
    '食器・キッチン': '食器・陶器',
    '文房具': '文房具',
    'DIY・工具・ガーデン': '工具・DIY用品',
    'ビューティー': '美容・化粧品',
    'キッチン家電': 'キッチン家電',
    'ホーム用品': '調理器具',
    'パソコン・周辺機器': '工具・DIY用品'
    // それ以外（おもちゃ・ゲーム、ゲーム・ホビー、アパレル）は変換しない
};

function normalizeProduct(raw) {
    const asin = raw.asin || '';
    productsData = data.map(normalizeProduct).filter(product => product !== null);

    const category = raw.category || '';
    const url = raw.url || '';

    // 商品タイトル（nameやtitle）
    const rawTitle = (raw.title || raw.name || '').trim();
    let title = rawTitle;

    // ★タイトルに「日本製」または「国産」が含まれているか確認
    if (!title.includes('日本製') && !title.includes('国産')) {
        return null;  // 「日本製」や「国産」じゃない場合は除外
    }

    // ★「日本製素材使用」や「国産素材使用」をタイトルに含んでいる場合は除外
    if (title.includes('日本製素材使用') || title.includes('国産素材使用')) {
        return null;  // 「日本製素材使用」や「国産素材使用」の場合は除外
    }

    // ★タイトルに日本語が1文字も無い場合 → 日本語情報に差し替え
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
        manufacturer,  // 空欄のまま
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
        // ★ここを変更：生データを正規化してから保存
        productsData = data.map(normalizeProduct);

        // フッターの製品数カウンターを更新
        const footerCount = document.getElementById('footer-product-count');
        if (footerCount) {
            footerCount.textContent = `掲載製品数: ${data.length}件`;
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
        // ★ ここを追加：総商品数を表示
    const totalElement = document.getElementById('product-total');
    if (totalElement) {
        totalElement.textContent = `掲載製品数：${productsData.length}件`;
    }
    
        // 検索要素の存在チェック（任意）
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    if (!searchInput || !searchButton) {
        return; // 念のため早期リターン
    }

    // メーカーフィルターのオプションを追加
    const manufacturerFilter = document.getElementById('manufacturer-filter');
    const manufacturers = [...new Set(productsData.map(p => p.manufacturer || 'Unknown'))].filter(m => m).sort();
    manufacturers.forEach(m => {
        const option = document.createElement('option');
        option.value = m;
        option.textContent = m;
        manufacturerFilter.appendChild(option);
    });

    // カテゴリーカードのクリックイベント
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            document.getElementById('category-filter').value = category;
            filterProducts();
            // 製品一覧までスクロール
            document.querySelector('.products-section').scrollIntoView({ behavior: 'smooth' });
        });
    });

    // フィルター変更時
    document.getElementById('category-filter').addEventListener('change', filterProducts);
    document.getElementById('manufacturer-filter').addEventListener('change', filterProducts);
    document.getElementById('reset-filter').addEventListener('click', resetFilters);

    // リアルタイム検索（入力中）→ 画面は動かさない
    searchInput.addEventListener('input', filterProducts);

    // ボタンクリック時 → 検索 + テーブルへスクロール
    searchButton.addEventListener('click', () => {
        filterProducts();
        scrollToProducts();
    });

    // Enterキー対応 → 検索 + テーブルへスクロール
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();  // フォーム送信などを防ぐ
            filterProducts();
            scrollToProducts();
        }
});

    // ソート機能
    const sortableHeaders = document.querySelectorAll('.sortable');
    sortableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.column;
            sortProducts(column);
        });
    });

    // 初期表示
    displayProducts(productsData);
}

// フィルター処理
function filterProducts() {
    const searchInputEl = document.getElementById('searchInput');
    const searchTerm = searchInputEl ? searchInputEl.value.toLowerCase() : '';
    const categoryFilter = document.getElementById('category-filter').value;
    const manufacturerFilter = document.getElementById('manufacturer-filter').value;
    let filtered = productsData;

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
            const selected = categoryFilter.trim();
            return cat === selected || cat.includes(selected);
        });
    }

    // メーカー条件
    if (manufacturerFilter !== 'all') {
        filtered = filtered.filter(p => p.manufacturer === manufacturerFilter);
    }

    displayProducts(filtered);
}

// フィルターリセット
function resetFilters() {
    document.getElementById('category-filter').value = 'all';
    document.getElementById('manufacturer-filter').value = 'all';
    currentSort = { column: null, ascending: true };
    
    // ソートアイコンをリセット
    document.querySelectorAll('.sortable').forEach(header => {
        header.classList.remove('sorted-asc', 'sorted-desc');
    });
    
    displayProducts(productsData);
}

// ソート処理
function sortProducts(column) {
    const header = document.querySelector(`[data-column="${column}"]`);
    
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
    header.classList.add(currentSort.ascending ? 'sorted-asc' : 'sorted-desc');

    // 現在表示されている製品を取得
    const tbody = document.getElementById('products-tbody');
    const currentProducts = Array.from(tbody.querySelectorAll('tr')).map(row => {
        const asin = row.dataset.asin;
        return productsData.find(p => p.asin === asin);
    });

    // ソート実行
    currentProducts.sort((a, b) => {
        let aValue;
        let bValue;

        if (column === 'name') {
            aValue = a.title || '';
            bValue = b.title || '';
        } else if (column === 'category') {
            aValue = a.category || '';
            bValue = b.category || '';
        } else {
            aValue = a[column] ?? '';
            bValue = b[column] ?? '';
        }

        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return currentSort.ascending ? -1 : 1;
        if (aValue > bValue) return currentSort.ascending ? 1 : -1;
        return 0;
    });

    displayProducts(currentProducts);
}


// 製品を表示
function displayProducts(products) {
    const tbody = document.getElementById('products-tbody');
    
    // 製品数カウンターを更新
    const countElement = document.getElementById('product-count');
    if (countElement) {
        countElement.textContent = `${products.length}件の製品`;
    }
    
    if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">製品が見つかりません</td></tr>';
        return;
    }

    const html = products.map(product => {
        const name = product.title || 'Unknown';
        const manufacturer = product.manufacturer || 'Unknown';
        const category = product.category || 'Unknown';
        const amazonUrl = product.url || product.amazonUrl || `https://www.amazon.co.jp/dp/${product.asin}`;
        
        return `
        <tr data-asin="${product.asin}">
            <td>${name}</td>
            <td>${manufacturer}</td>
            <td>${category}</td>
            <td class="comment-cell">
                ${product.comment || '-'}
            </td>
            <td>
                <a href="${amazonUrl}" class="amazon-link" target="_blank" rel="noopener">
                    Amazonで見る
                </a>
            </td>
        </tr>
        `;
    }).join('');

    tbody.innerHTML = html;
}


// 投稿フォームページ
function initSubmitPage() {
    const form = document.getElementById('submit-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formMessage = document.getElementById('form-message');
        formMessage.style.display = 'block';
        formMessage.className = 'form-message success';
        formMessage.textContent = 'ご投稿ありがとうございます！';
        
        form.reset();
        
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 5000);
    });
}