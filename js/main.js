let productsData = [];
let currentSort = { column: null, ascending: true };

// タイトルに日本語（ひらがな・カタカナ・漢字）が含まれているかどうか判定
function hasJapanese(str) {
    if (!str) return false;
    return /[\u3040-\u30FF\u4E00-\u9FFF]/.test(str);
}

// 正規化された製品データを返す
function normalizeProduct(raw) {
    if (!raw) return null;

    const asin = raw.asin || '';
    let manufacturer = raw.manufacturer || '';
    const category = raw.category || '';
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
        productsData = data.map(normalizeProduct).filter(product => product !== null);

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
    // カテゴリーカードのクリックイベント
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            console.log("Selected Category:", category);  // クリックしたカテゴリが正しく取得されるか確認
            document.getElementById('category-filter').value = category;  // カテゴリーフィルターを更新
            filterProducts();  // フィルタリングを実行
            document.querySelector('.products-section').scrollIntoView({ behavior: 'smooth' });
        });
    });

    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    if (!searchInput || !searchButton) {
        return;
    }

    document.getElementById('category-filter').addEventListener('change', filterProducts);
    document.getElementById('manufacturer-filter').addEventListener('change', filterProducts);
    document.getElementById('reset-filter').addEventListener('click', resetFilters);

    searchInput.addEventListener('input', filterProducts);

    searchButton.addEventListener('click', () => {
        filterProducts();
        scrollToProducts();
    });

    displayProducts(productsData);
}

// フィルター処理
function filterProducts() {
    const searchInputEl = document.getElementById('searchInput');
    const searchTerm = searchInputEl ? searchInputEl.value.toLowerCase() : '';
    const categoryFilter = document.getElementById('category-filter').value;
    const manufacturerFilter = document.getElementById('manufacturer-filter').value;
    let filtered = productsData;

    console.log("Filtering with category:", categoryFilter);  // フィルタリングの進行状況を確認

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
        filtered = filtered.filter(p => p.category === categoryFilter);
    }

    // メーカー条件
    if (manufacturerFilter !== 'all') {
        filtered = filtered.filter(p => p.manufacturer === manufacturerFilter);
    }

    console.log("Filtered products:", filtered);  // フィルタリング後の製品リストを確認
    displayProducts(filtered);
}

// 製品を表示
function displayProducts(products) {
    const tbody = document.getElementById('products-tbody');
    
    // フィルタリング後に製品がない場合、メッセージを表示
    if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">製品が見つかりません</td></tr>';
        return;
    }

    const html = products.map(product => {
        const name = product.title || 'Unknown';
        const manufacturer = product.manufacturer || 'Unknown';
        const category = product.category || 'Unknown';
        const amazonUrl = product.url || `https://www.amazon.co.jp/dp/${product.asin}`;
        
        return `
        <tr>
            <td>${name}</td>
            <td>${manufacturer}</td>
            <td>${category}</td>
            <td><a href="${amazonUrl}" target="_blank">Amazonで見る</a></td>
        </tr>
        `;
    }).join('');

    tbody.innerHTML = html;
}

// フィルターリセット
function resetFilters() {
    document.getElementById('category-filter').value = 'all';
    document.getElementById('manufacturer-filter').value = 'all';
    displayProducts(productsData);
}
