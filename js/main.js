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

// データ読み込み
fetch('data/products.json')
    .then(response => response.json())
    .then(data => {
        // データを正しく取得してから、normalizeProductを実行
        productsData = data.map(normalizeProduct).filter(product => product !== null);

        // 製品数を表示する処理
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
            document.getElementById('category-filter').value = category;
            filterProducts();
            document.querySelector('.products-section').scrollIntoView({ behavior: 'smooth' });
        });
    });

    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    if (!searchInput || !searchButton) {
        return;
    }

    // フィルター変更時
    document.getElementById('category-filter').addEventListener('change', filterProducts);
    document.getElementById('manufacturer-filter').addEventListener('change', filterProducts);
    document.getElementById('reset-filter').addEventListener('click', resetFilters);

    // リアルタイム検索（入力中）
    searchInput.addEventListener('input', filterProducts);

    // ボタンクリック時 → 検索 + テーブルへスクロール
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

    displayProducts(filtered);
}

// 製品を表示
function displayProducts(products) {
    const tbody = document.getElementById('products-tbody');
    
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
