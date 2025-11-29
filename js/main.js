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

// サイト全体のカテゴリ一覧（12カテゴリ）
const SITE_CATEGORIES = [
    '食品・飲料・調味料',
    '包丁・ナイフ',
    'フライパン・鍋',
    'ケトル・コーヒー用品',
    'キッチンツール・調理小物',
    'ボウル・ざる・計量',
    '食器・カトラリー',
    'キッチンマット・シンク周り',
    '生活雑貨・インテリア',
    'ヘルス・ビューティー・日用品',
    'ペット用品',
    '服飾・アクセサリー',
    'ホビー・クラフト'
];

// 食品カテゴリから除外したいキーワード（調理器具・サプリなど）
const NON_FOOD_KEYWORDS = /(ボウル|ボール|ざる|ザル|colander|ストレーナー|水切りボウル|計量カップ|フライパン|鍋|ケトル|やかん|ドリップケトル|コーヒーミル|コーヒードリッパー|コーヒーサーバー|ドリッパー|コーヒーポット|ティーポット|急須|スプーン|フォーク|箸|包丁|ナイフ|まな板|キッチンツール|サプリ|サプリメント|健康補助食品|栄養補助食品|プロテイン)/;

// サイト内カテゴリのラベルを決める
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

    // 3. ケトル・コーヒー用品（マグカップ含む）
    if (
        /(ケトル|やかん|ドリップケトル|コーヒーミル|コーヒーグラインダー|コーヒードリッパー|コーヒーサーバー|ドリッパー|コーヒーポット|ティーポット|急須|マグ|マグカップ)/.test(text) ||
        /(コーヒー|ティーウェア)/.test(category)
    ) {
        return 'ケトル・コーヒー用品';
    }

    // 4. キッチンツール・調理小物（めん棒を追加）
    if (
        /(めん棒|麺棒|まな板|カッティングボード|おろし器|ピーラー|キッチンバサミ|キッチンはさみ|キッチンスケール|はかり|計量スプーン|しゃもじ|菜箸|トング|泡立て器|キッチンタイマー|保存容器|キッチンツール)/.test(text) ||
        /(キッチン用品|キッチンツール)/.test(category)
    ) {
        return 'キッチンツール・調理小物';
    }

    // 5. ボウル・ざる・計量
    if (/(ボウル|ボール|ざる|ザル|colander|ストレーナー|水切りボウル|計量カップ)/.test(text)) {
        return 'ボウル・ざる・計量';
    }

    // 6. 食器・カトラリー（マグは上のコーヒー用品で拾う）
    if (
        /(食器|プレート|皿|大皿|小皿|ランチプレート|茶碗|ちゃわん|飯碗|汁椀|お椀|カップ|湯のみ|グラス|コップ|カトラリー|箸|お箸|スプーン|フォーク|ナイフセット)/.test(text) ||
        /(食器)/.test(category)
    ) {
        return '食器・カトラリー';
    }

    // 7. キッチンマット・シンク周り
    if (
        /(キッチンマット|台所マット|シンクマット|シンク用マット|シンクラック|水切りラック|水切りかご|水切りカゴ|ディッシュラック|排水口カバー|排水口ネット|三角コーナー)/.test(text)
    ) {
        return 'キッチンマット・シンク周り';
    }

    // 8. 生活雑貨・インテリア
    if (
        /(カーテン|のれん|インテリア|収納|ボックス|収納ケース|クッション|ラグ|マット|マルチカバー|玄関マット|スリッパ|エコバッグ|買い物袋|レジ袋|タオルハンガー|ティッシュケース)/.test(text) ||
        /(カーテン|インテリア|収納用品)/.test(category)
    ) {
        return '生活雑貨・インテリア';
    }

    // 9. ヘルス・ビューティー・日用品（サプリ含む）
    if (
        /(石鹸|ソープ|シャンプー|リンス|コンディショナー|トリートメント|ローション|クリーム|乳液|マスク|フェイスマスク|入浴剤|バスソルト|タオル|フェイスタオル|バスタオル|爪切り|ネイルクリッパー|歯ブラシ|マウスウォッシュ)/.test(text) ||
        /(サプリ|サプリメント|ビタミン|ミネラル|プロテイン|アミノ酸|コラーゲン|グルコサミン|健康補助食品|栄養補助食品)/.test(text) ||
        /(ビューティー|ドラッグストア|ヘルスケア|布マスク|害獣・害虫対策用品)/.test(category)
    ) {
        return 'ヘルス・ビューティー・日用品';
    }

    // 10. ペット用品
    if (
        /(ペット|犬用|猫用|ドッグフード|キャットフード|犬用おやつ|猫用おやつ|ペットフード|ペットシーツ|ペットベッド|首輪|リード|ペットブラシ|ペット用シャンプー)/.test(text) ||
        /(ペット用品|ペットグッズ|犬用品|猫用品)/.test(category)
    ) {
        return 'ペット用品';
    }

    // 11. 服飾・アクセサリー
    if (
        /(リング|指輪|ネックレス|ブレスレット|バングル|ピアス|イヤリング|アクセサリー|帽子|ベルト|財布|ウォレット|ポーチ|ハンカチ)/.test(text) ||
        /(服＆ファッション小物|ジュエリー)/.test(category) ||
        /(インナーシャツ|ストッキング|ショーツ|クルーソックス|靴下)/.test(category)
    ) {
        return '服飾・アクセサリー';
    }

    // 12. ホビー・クラフト
    if (
        /(ギター|ベース|楽器|ストラップ|ピック|ホビー|クラフト|手芸|ソーイング|ミシン糸|編み物|釣り|ルアー|PEライン)/.test(text) ||
        /(楽器|ホビー)/.test(category)
    ) {
        return 'ホビー・クラフト';
    }

    // 13. 食品・飲料・調味料（最後に判定）
    if (
        !NON_FOOD_KEYWORDS.test(text) && // 調理器具・サプリなどは食品から除外
        (
            /(食品|食材|調味料|だし|出汁|味噌|みそ|醤油|しょうゆ|お茶|緑茶|日本茶|コーヒー|紅茶|ほうじ茶|玄米茶|米|お菓子|スナック|乾物|漬物|海苔|のり|昆布|だしパック|だしの素)/.test(text) ||
            /(食品|飲料|お茶|コーヒー|紅茶|調味料)/.test(category)
        )
    ) {
        return '食品・飲料・調味料';
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

    // ★ 日本製かどうか・素材だけ日本かどうかの判定は
    //    すべて Python 側で完了している前提。
    //    ここでは一切除外処理を行わない。

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

/* ------------------------------
   カテゴリボタン生成
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

    container.querySelectorAll('.category-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const currentActive = container.querySelector('.category-button.active');
            const clickedCategory = btn.dataset.category;

            if (currentActive === btn) {
                // もう一度押したら解除（すべて表示）
                btn.classList.remove('active');
            } else {
                if (currentActive) currentActive.classList.remove('active');
                btn.classList.add('active');
            }

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

    const activeCategoryBtn = document.querySelector('#category-buttons .category-button.active');
    const categoryFilter = activeCategoryBtn ? activeCategoryBtn.dataset.category : 'all';

    let filtered = productsData.slice();

    // 検索条件（タイトルとメーカー）
    if (searchTerm) {
        filtered = filtered.filter(p => {
            const name = (p.title || '').toLowerCase();
            const manufacturer = (p.manufacturer || '').toLowerCase();
            return name.includes(searchTerm) || manufacturer.includes(searchTerm);
        });
    }

    // カテゴリー条件（12カテゴリラベル）
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(p => (p.category || '').trim() === categoryFilter);
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
        const category = product.category || '';
        const amazonUrl = product.url || `https://www.amazon.co.jp/dp/${product.asin}`;

        return `
        <article class="product-card" data-asin="${product.asin}">
          <div class="product-meta">
            <h3 class="product-title">${name}</h3>
            ${manufacturer ? `<p class="product-brand">${manufacturer}</p>` : ''}
            <div class="product-tags">
              <span class="tag tag-japan">日本製・国産</span>
              ${category ? `<span class="tag">${category}</span>` : ''}
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
