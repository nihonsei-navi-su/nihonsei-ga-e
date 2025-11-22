// 製品データを取得
let productsData = [];
let currentSort = { column: null, ascending: true };

function scrollToProducts() {
    const section = document.querySelector('.products-section');
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth'
        });
    }
}

// JSONのフィールド名をサイト内部用にそろえる
function normalizeProduct(raw) {
    // JSON側の name / title をまとめて扱う
    const title = raw.title || raw.name || '';

    return {
        // 元のフィールドはそのまま残す
        ...raw,

        // 一覧表示や検索が参照するタイトル系
        name: raw.name || title,                  // 念のため name もそろえる
        title: title,
        title_ja: raw.title_ja || title,
        title_en: raw.title_en || '',
        original_english_title: raw.original_english_title || '',

        // メーカー名：brand / maker / manufacturer をまとめて manufacturer に統一
        manufacturer: raw.manufacturer || raw.maker || raw.brand || 'Unknown',

        // カテゴリ：文字列をそのまま使う
        category: (raw.category && raw.category.name) ? raw.category.name : (raw.category || ''),

        // Amazon URL：JSONにあればそれを優先、なければ asin から生成
        url: raw.url || raw.amazonUrl || (raw.asin ? `https://www.amazon.co.jp/dp/${raw.asin}` : ''),

        // コメント：今は無いので空文字
        comment: raw.comment || ''
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
    const searchTerm = document.getElementById('searchInput') ? document.getElementById('searchInput').value.toLowerCase() : '';
    const categoryFilter = document.getElementById('category-filter').value;
    const manufacturerFilter = document.getElementById('manufacturer-filter').value;
    let filtered = productsData;

    // 検索条件
    if (searchTerm) {
        filtered = filtered.filter(p => {
            const name = p.title_ja || p.name || '';
            const manufacturer = p.manufacturer || '';
            return name.toLowerCase().includes(searchTerm) || 
                   manufacturer.toLowerCase().includes(searchTerm);
        });
    }

    // カテゴリー条件
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(p => {
            const cat = p.category?.name || p.category;
            return cat === categoryFilter;
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
        let aValue = column === 'name' ? (a.title_ja || a.name) : 
                     column === 'category' ? (a.category?.name || a.category) : a[column];
        let bValue = column === 'name' ? (b.title_ja || b.name) : 
                     column === 'category' ? (b.category?.name || b.category) : b[column];

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
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">製品が見つかりません</td></tr>';
        return;
    }

    const html = products.map(product => {
        // 日本語が含まれているかチェック
        const hasJapanese = (str) => str && /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(str);
        
        // title_jaが日本語なら優先、英語ならoriginal_english_titleを使う
        let name = 'Unknown';
        if (hasJapanese(product.title_ja)) {
            name = product.title_ja;
        } else if (hasJapanese(product.original_english_title)) {
            name = product.original_english_title;
        } else if (product.title && product.title !== 'エラーです。' && hasJapanese(product.title)) {
            // titleフィールドからAmazon.co.jpを除外して日本語部分を抽出
            const titleMatch = product.title.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF][^:]*/);
            name = titleMatch ? titleMatch[0].trim() : product.title_en || product.title_ja || 'Unknown';
        } else if (product.title === 'エラーです。') {
            // 「エラーです。」の場合は英語タイトルを使用
            name = product.title_en || product.title_ja || 'Unknown';
        } else {
            name = product.title_en || product.title_ja || product.title || 'Unknown';
        }
        
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