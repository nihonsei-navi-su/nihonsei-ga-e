console.log('main.js loaded');

// 製品データを取得
let productsData = [];

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

/* ==============================
   カテゴリ最適化（自動付与）
   - 大分類10（サイト用）
   - サブカテゴリは Amazon 仕様（raw.category の階層から自動抽出）
   - サブカテゴリはHTML埋め込み不要（JSが動的に生成して差し込む）
============================== */

// サイト全体のカテゴリ一覧（大分類 10 固定）
const SITE_CATEGORIES = [
    '食品・飲料',
    'キッチン・調理用品',
    '生活用品・日用品',
    '家電・電子機器',
    'インテリア・家具',
    'ファッション・身につけるもの',
    '美容・健康',
    '工具・DIY・作業用品',
    'アウトドア・スポーツ',
    '文具・趣味・その他'
];

// 食品カテゴリから除外したいキーワード（調理器具・サプリなど）
const NON_FOOD_KEYWORDS = /(ボウル|ボール|ざる|ザル|colander|ストレーナー|水切りボウル|計量カップ|フライパン|鍋|ケトル|やかん|ドリップケトル|コーヒーミル|コーヒードリッパー|コーヒーサーバー|ドリッパー|コーヒーポット|ティーポット|急須|スプーン|フォーク|箸|包丁|ナイフ|まな板|キッチンツール|サプリ|サプリメント|健康補助食品|栄養補助食品|プロテイン)/;

/* ------------------------------
   Amazonカテゴリパス解析
   - raw.category が "ホーム&キッチン > キッチン用品 > ..." のような文字列で入っている前提に対応
   - 区切りが ">" "＞" "›" "/" "|" などでも吸収
------------------------------ */
function extractAmazonCategoryPath(raw) {
    const src =
        (raw.amazonCategoryPath && Array.isArray(raw.amazonCategoryPath) && raw.amazonCategoryPath.join(' > ')) ||
        raw.categoryPath ||
        raw.category ||
        '';

    const s = String(src).trim();
    if (!s) return [];

    // 代表的な区切り文字を統一して分割
    const parts = s
        .replace(/›/g, '>')
        .replace(/＞/g, '>')
        .replace(/\//g, '>')
        .replace(/\|/g, '>')
        .split('>')
        .map(x => x.trim())
        .filter(Boolean);

    return parts;
}

// Amazon root / sub を抽出（Amazon仕様：root=1階層、sub=2階層）
function extractAmazonRootSub(raw) {
    const path = extractAmazonCategoryPath(raw);
    const root = path[0] || '';
    const sub = path[1] || '';
    return { amazonRoot: root, amazonSub: sub, amazonPath: path };
}

/* ------------------------------
   サイト大分類（10）を決める
   - 1) Amazon root を優先的に参照してマッピング
   - 2) 足りない場合はタイトル/カテゴリ文字列からフォールバック判定
------------------------------ */
function mapAmazonRootToSiteMain(amazonRoot, rawText) {
    const root = (amazonRoot || '').trim();
    const text = (rawText || '').trim();

    // 食品・飲料（Amazon: "食品・飲料・お酒" など）
    if (/(食品|飲料|お酒)/.test(root) || /(食品|飲料|お茶|コーヒー|紅茶|調味料)/.test(text)) {
        return '食品・飲料';
    }

    // ビューティー / ドラッグストア（Amazon: "ビューティー", "ドラッグストア"）
    if (/(ビューティー|ドラッグストア|ヘルスケア)/.test(root) || /(ビューティー|ドラッグストア|ヘルスケア)/.test(text)) {
        return '美容・健康';
    }

    // ファッション
    if (/(ファッション)/.test(root) || /(服＆ファッション小物|ジュエリー|シューズ＆バッグ)/.test(text)) {
        return 'ファッション・身につけるもの';
    }

    // ペット用品
    if (/(ペット)/.test(root) || /(ペット用品|犬用品|猫用品)/.test(text)) {
        return '生活用品・日用品';
    }

    // ベビー
    if (/(ベビー|マタニティ)/.test(root) || /(ベビー|キッズ)/.test(text)) {
        return '生活用品・日用品';
    }

    // 家電＆カメラ
    if (/(家電|カメラ|PC|パソコン|周辺機器|オーディオ)/.test(root) || /(家電|TV|オーディオ|パソコン)/.test(text)) {
        return '家電・電子機器';
    }

    // ホーム＆キッチン
    if (/(ホーム|キッチン)/.test(root) || /(ホーム&キッチン|ホーム＆キッチン)/.test(text)) {
        // キッチン寄り語彙が強ければキッチンへ、それ以外は生活/インテリアへ
        if (/(包丁|鍋|フライパン|食器|調理|キッチン|カトラリー|まな板|ボウル|ざる|計量)/.test(text)) {
            return 'キッチン・調理用品';
        }
        if (/(家具|寝具|カーテン|インテリア|ラグ|クッション)/.test(text)) {
            return 'インテリア・家具';
        }
        return '生活用品・日用品';
    }

    // 産業・研究開発用品
    if (/(産業|研究|開発|工具)/.test(root) || /(工具|DIY|作業|計測)/.test(text)) {
        return '工具・DIY・作業用品';
    }

    // スポーツ＆アウトドア
    if (/(スポーツ|アウトドア)/.test(root) || /(キャンプ|登山|アウトドア|ゴルフ|釣り|トレーニング)/.test(text)) {
        return 'アウトドア・スポーツ';
    }

    // 文房具・オフィス用品 / 本 / ホビー 等
    if (/(文房具|オフィス|本|ホビー|楽器)/.test(root) || /(文房具|楽器|ホビー|クラフト)/.test(text)) {
        return '文具・趣味・その他';
    }

    return '文具・趣味・その他';
}

// サイト内カテゴリ（大分類10）を決める（フォールバック含む）
function determineSiteCategoryMain(raw) {
    const title = (raw.title || raw.originalTitle || raw.name || '').trim();
    const category = (raw.category || '').trim();
    const text = `${title} ${category}`;

    const { amazonRoot } = extractAmazonRootSub(raw);
    return mapAmazonRootToSiteMain(amazonRoot, text);
}

/* ------------------------------
   UI：サブカテゴリコンテナを必ず用意（HTML埋め込み不要）
------------------------------ */
function ensureSubCategoryContainer() {
    const cat = document.getElementById('category-buttons');
    if (!cat) return null;

    let container = document.getElementById('subcategory-buttons');
    if (!container) {
        container = document.createElement('div');
        container.id = 'subcategory-buttons';
        container.className = 'subcategory-buttons';
        cat.insertAdjacentElement('afterend', container);
    }
    return container;
}

/* ------------------------------
   正規化された製品データを返す
------------------------------ */
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

    // Amazon仕様のサブカテゴリ抽出
    const { amazonRoot, amazonSub, amazonPath } = extractAmazonRootSub(raw);

    // サイト用の大分類（10）
    const siteMain = determineSiteCategoryMain(raw);

    // タイトルに日本語が無い場合のフォールバック
    if (!hasJapanese(title)) {
        if (manufacturer && siteMain) {
            title = `${manufacturer}（${siteMain}）`;
        } else if (manufacturer) {
            title = manufacturer;
        } else if (siteMain) {
            title = siteMain;
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
        // サイト用（大分類10）
        category_main: siteMain,
        // Amazon仕様（root/sub）
        category_amazon_root: amazonRoot,
        category_amazon_sub: amazonSub,
        category_amazon_path: amazonPath,
        url,
        madeInJapan: !!raw.madeInJapan,
        available: raw.available !== false
    };
}

/* ------------------------------
   UI：カテゴリボタン（大分類）
------------------------------ */
function renderCategoryButtons() {
    const container = document.getElementById('category-buttons');
    if (!container) return;

    const html = SITE_CATEGORIES.map(cat => `
        <button class="category-button" data-category="${cat}">
            ${cat}
        </button>
    `).join('');

    container.innerHTML = html;

    // サブカテゴリ領域を（なければ）自動生成：HTMLに埋め込み不要
    ensureSubCategoryContainer();

    container.querySelectorAll('.category-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const currentActive = container.querySelector('.category-button.active');

            if (currentActive === btn) {
                btn.classList.remove('active'); // 解除
            } else {
                if (currentActive) currentActive.classList.remove('active');
                btn.classList.add('active');
            }

            renderSubCategoryControls(); // ★ 大分類に応じてサブカテゴリ更新
            filterProducts();
            scrollToProducts();
        });
    });
}

/* ------------------------------
   UI：サブカテゴリ（Amazon仕様：自動生成）
   - HTML埋め込み不要（JSが category-buttons の直後に作る）
------------------------------ */
function getActiveMainCategory() {
    const activeCategoryBtn = document.querySelector('#category-buttons .category-button.active');
    return activeCategoryBtn ? activeCategoryBtn.dataset.category : 'all';
}

function getActiveSubCategory() {
    const container = document.getElementById('subcategory-buttons');
    if (!container) return 'all';
    const activeSubBtn = container.querySelector('.subcategory-button.active');
    return activeSubBtn ? activeSubBtn.dataset.subcategory : 'all';
}

function renderSubCategoryControls() {
    const container = ensureSubCategoryContainer();
    if (!container) return;

    const main = getActiveMainCategory();
    if (main === 'all') {
        container.innerHTML = '';
        return;
    }

    // main に属する商品の Amazon sub を収集（空は除外）
    const subs = Array.from(new Set(
        productsData
            .filter(p => (p.category_main || '') === main)
            .map(p => (p.category_amazon_sub || '').trim())
            .filter(Boolean)
    )).sort((a, b) => a.localeCompare(b, 'ja'));

    // サブカテゴリが取れない場合は出さない
    if (subs.length === 0) {
        container.innerHTML = '';
        return;
    }

    const html = [
        `<div class="subcategory-header">サブカテゴリ（Amazon）</div>`,
        `<div class="subcategory-row">`,
        `<button class="subcategory-button active" data-subcategory="all">すべて</button>`,
        ...subs.map(sc => `<button class="subcategory-button" data-subcategory="${sc}">${sc}</button>`),
        `</div>`
    ].join('');

    container.innerHTML = html;

    container.querySelectorAll('.subcategory-button').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.subcategory-button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            filterProducts();
            scrollToProducts();
        });
    });
}

/* ------------------------------
   データ読み込み
------------------------------ */
fetch('data/products.json')
    .then(response => response.json())
    .then(data => {
        productsData = data.map(normalizeProduct).filter(p => p !== null);

        // フッターの総件数（あれば更新）
        const footerCount = document.getElementById('footer-product-count');
        if (footerCount) {
            footerCount.textContent = `掲載製品数：${productsData.length}件`;
        }

        initPage();
    })
    .catch(error => console.error('Error loading products:', error));

/* ------------------------------
   ページ初期化
------------------------------ */
function initPage() {
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);

    if (filename === 'index.html' || filename === '') {
        initHomePage();
    } else if (filename === 'submit.html') {
        initSubmitPage();
    }
}

/* ------------------------------
   ホームページ初期化
------------------------------ */
function initHomePage() {
    renderCategoryButtons();
    renderSubCategoryControls(); // 初期は非表示（all）

    // 総商品数を表示
    const totalElement = document.getElementById('product-total');
    if (totalElement) {
        totalElement.textContent = `掲載製品数：${productsData.length}件`;
    }

    // 検索欄（リアルタイム）
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterProducts();
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                filterProducts();
                scrollToProducts();
            }
        });
    }

    // 初期表示
    displayProducts(productsData);
}

/* ------------------------------
   フィルター処理
------------------------------ */
function filterProducts() {
    const searchInputEl = document.getElementById('search-input');
    const searchTerm = searchInputEl ? searchInputEl.value.toLowerCase().trim() : '';

    const categoryFilter = getActiveMainCategory(); // 大分類
    const subFilter = getActiveSubCategory();       // Amazon sub（大分類選択時のみ）

    let filtered = productsData.slice();

    // 検索条件（タイトルとメーカー）
    if (searchTerm) {
        filtered = filtered.filter(p => {
            const name = (p.title || '').toLowerCase();
            const manufacturer = (p.manufacturer || '').toLowerCase();
            return name.includes(searchTerm) || manufacturer.includes(searchTerm);
        });
    }

    // 大分類
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(p => (p.category_main || '').trim() === categoryFilter);
    }

    // サブカテゴリ（Amazon仕様）
    if (categoryFilter !== 'all' && subFilter !== 'all') {
        filtered = filtered.filter(p => (p.category_amazon_sub || '').trim() === subFilter);
    }

    displayProducts(filtered);
}

/* ------------------------------
   商品カード描画
------------------------------ */
function displayProducts(products) {
    const container = document.getElementById('products-container');
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = '<p>条件に一致する日本製・国産の製品が見つかりませんでした。</p>';
        return;
    }

    const html = products.map(product => {
        const name = product.title || '不明な商品';
        const manufacturer = product.manufacturer || '';
        const main = product.category_main || '';
        const aRoot = product.category_amazon_root || '';
        const aSub = product.category_amazon_sub || '';
        const amazonUrl = product.url || `https://www.amazon.co.jp/dp/${product.asin}`;

        // 表示ラベル：サイト大分類 + Amazon sub（ある場合）
        const label = aSub ? `${main}（${aSub}）` : main;

        return `
        <article class="product-card" data-asin="${product.asin}">
          <div class="product-meta">
            <h3 class="product-title">${name}</h3>
            ${manufacturer ? `<p class="product-brand">${manufacturer}</p>` : ''}
            <div class="product-tags">
              <span class="tag tag-japan">日本製・国産</span>
              ${label ? `<span class="tag">${label}</span>` : ''}
              ${aRoot && aSub ? `<span class="tag tag-muted">${aRoot}</span>` : ''}
            </div>
          </div>
          <div class="product-actions">
            <a href="${amazonUrl}" class="btn btn-primary amazon-link" target="_blank" rel="noopener">
              Amazonで見る
            </a>
          </div>
        </article>
        `;
    }).join('');

    container.innerHTML = html;
}

/* ------------------------------
   投稿フォームページ（submit.html 用）
------------------------------ */
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

/* ------------------------------
   Amazon リンク クリック計測（GA4）
------------------------------ */
document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (!link) return;

    // Amazonリンクのみ計測
    if (!link.href || !link.href.includes('amazon.co.jp')) return;

    const card = link.closest('.product-card');
    const asin = card?.dataset.asin || '';
    const name = card?.querySelector('.product-title')?.textContent?.trim() || '';
    const manufacturer = card?.querySelector('.product-brand')?.textContent?.trim() || '';
    const category = card?.querySelector('.tag:not(.tag-japan)')?.textContent?.trim() || '';

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

/* ------------------------------
   トップへ戻るボタン
------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;

    // スクロールしたら表示
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            btn.style.display = 'flex';
        } else {
            btn.style.display = 'none';
        }
    });

    // クリックでスムーズスクロール
    btn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});
