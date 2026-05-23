#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import html
import re
from pathlib import Path
from datetime import date

ROOT = Path("/Users/user/nihonsei-ga-e")
PRODUCTS_JSON = ROOT / "data" / "products.json"
PRODUCTS_DIR = ROOT / "products"
CATEGORY_DIR = ROOT / "category"
SITEMAP_XML = ROOT / "sitemap.xml"
ROBOTS_TXT = ROOT / "robots.txt"

SITE_URL = "https://nihonsei-ga-e.com"

CATEGORY_RULES = [
    ("食品・飲料", "food", r"食品|飲料|お茶|茶|コーヒー|紅茶|調味料|味噌|醤油|米|菓子|ジュース"),
    ("キッチン・調理用品", "kitchen", r"包丁|鍋|フライパン|まな板|食器|箸|スプーン|フォーク|調理|キッチン|ボウル|ザル|急須|ケトル"),
    ("生活用品・日用品", "daily", r"タオル|洗剤|掃除|収納|スリッパ|マスク|歯ブラシ|日用品|生活|バス|トイレ"),
    ("家電・電子機器", "electronics", r"家電|電子|電気|ライト|照明|加湿器|扇風機|ヒーター|オーディオ|カメラ|充電"),
    ("インテリア・家具", "interior", r"家具|椅子|机|棚|寝具|布団|枕|カーテン|ラグ|マット|クッション|インテリア"),
    ("ファッション・身につけるもの", "fashion", r"服|シャツ|靴下|帽子|バッグ|財布|ベルト|下着|肌着|ファッション|アクセサリー"),
    ("美容・健康", "beauty", r"美容|健康|化粧|コスメ|シャンプー|石鹸|サプリ|爪|ヘア|スキンケア"),
    ("工具・DIY・作業用品", "tools", r"工具|DIY|作業|ドライバー|レンチ|ニッパー|測定|計測|作業用品"),
    ("アウトドア・スポーツ", "outdoor", r"アウトドア|キャンプ|登山|釣り|スポーツ|ゴルフ|トレーニング|保冷|水筒"),
    ("文具・趣味・その他", "hobby", r"文具|文房具|ペン|ノート|紙|印鑑|ホビー|楽器|本|クラフト|趣味"),
]

CATEGORY_DESCRIPTIONS = {
    "食品・飲料": "日本製・国産の食品・飲料を探している方向けに、Amazonで購入できる商品をまとめています。調味料、お茶、コーヒー、菓子類など、日常的に使いやすい国産品を確認できます。",
    "キッチン・調理用品": "日本製の包丁、鍋、フライパン、まな板、食器など、キッチンで使う国産調理用品を掲載しています。燕三条をはじめ、日本のものづくりと相性のよいカテゴリです。",
    "生活用品・日用品": "タオル、掃除用品、収納用品、スリッパ、バス用品など、日本製・国産の日用品をまとめています。毎日使うものだからこそ、日本製を選びたい方向けのカテゴリです。",
    "家電・電子機器": "日本製・国産表記のある家電・電子機器を掲載しています。照明、加湿器、生活家電、周辺機器など、Amazonで探しにくい日本製品を確認できます。",
    "インテリア・家具": "日本製・国産の家具、寝具、ラグ、クッション、インテリア用品をまとめています。暮らしの質を高める国内製造品を探す方向けのカテゴリです。",
    "ファッション・身につけるもの": "日本製の衣類、靴下、バッグ、財布、帽子、肌着など、身につける国産品を掲載しています。素材や縫製にこだわりたい方向けです。",
    "美容・健康": "日本製・国産の美容用品、健康用品、石鹸、シャンプー、スキンケア用品などをまとめています。肌に触れるものを日本製で探したい方向けのカテゴリです。",
    "工具・DIY・作業用品": "日本製の工具、DIY用品、作業用品、計測用品などを掲載しています。精度や耐久性を重視して国産品を探す方向けです。",
    "アウトドア・スポーツ": "日本製・国産のアウトドア用品、キャンプ用品、スポーツ用品、水筒、保冷用品などをまとめています。屋外で使う道具を日本製で探したい方向けです。",
    "文具・趣味・その他": "日本製の文具、ノート、ペン、印鑑、クラフト用品、趣味用品などを掲載しています。細部の品質にこだわる国産品を探せます。",
}
def esc(value):
    return html.escape(str(value or ""), quote=True)


def load_products():
    with PRODUCTS_JSON.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        raise ValueError("products.json が配列ではありません")

    products = []
    seen = set()

    for item in data:
        asin = str(item.get("asin", "")).strip()
        if not asin or asin in seen:
            continue
        seen.add(asin)
        products.append(item)

    return products


def get_title(item):
    return str(item.get("title") or item.get("name") or item.get("originalTitle") or "").strip()


def detect_category(item):
    title = get_title(item)
    category = str(item.get("category") or "").strip()
    text = f"{title} {category}"

    for name, slug, pattern in CATEGORY_RULES:
        if re.search(pattern, text):
            return name, slug

    return "文具・趣味・その他", "hobby"


def build_product_html(item):
    asin = esc(item.get("asin", ""))
    title = esc(get_title(item) or "日本製・国産の商品")
    manufacturer = esc(item.get("manufacturer", ""))
    category_name, category_slug = detect_category(item)
    amazon_url = esc(item.get("url") or f"https://www.amazon.co.jp/dp/{asin}")
    related_items = []

    for other in ALL_PRODUCTS:
        other_asin = str(other.get("asin", "")).strip()

        if not other_asin or other_asin == asin:
            continue

        other_category_name, other_category_slug = detect_category(other)

        if other_category_slug != category_slug:
            continue

        related_items.append(other)

        if len(related_items) >= 12:
            break

    related_html = []

    for related in related_items:
        r_asin = esc(related.get("asin", ""))
        r_title = esc(get_title(related))

        related_html.append(
            f'<li><a href="../products/{r_asin}.html">{r_title}</a></li>'
        )

    related_html = "\n".join(related_html)

    page_url = f"{SITE_URL}/products/{asin}.html"

    schema_json = f"""
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "{title}",
  "brand": {{
    "@type": "Brand",
    "name": "{manufacturer}"
  }},
  "category": "{esc(category_name)}",
  "url": "{page_url}",
  "isRelatedTo": {{
    "@type": "WebSite",
    "name": "日本製がいい！",
    "url": "{SITE_URL}"
  }}
}}
</script>

<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {{
      "@type": "ListItem",
      "position": 1,
      "name": "トップ",
      "item": "{SITE_URL}/"
    }},
    {{
      "@type": "ListItem",
      "position": 2,
      "name": "{esc(category_name)}",
      "item": "{SITE_URL}/category/{category_slug}.html"
    }},
    {{
      "@type": "ListItem",
      "position": 3,
      "name": "{title}",
      "item": "{page_url}"
    }}
  ]
}}
</script>
"""

    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>{title} | 日本製がいい！</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="{title}。日本製・国産の商品を探せるAmazon非公式検索サイト「日本製がいい！」の掲載商品ページです。">
  <link rel="canonical" href="{page_url}">
  <link rel="stylesheet" href="../css/style.css">
  {schema_json}
</head>
<body>
  <header class="site-header">
    <div class="container header-inner">
      <div class="site-logo">
        <a href="../index.html">
          <img src="../img/pic-header220-48pix.png" alt="日本製がいい！" class="header-logo">
        </a>
      </div>
      <nav class="site-nav">
        <ul>
          <li><a href="../index.html">トップ</a></li>
          <li><a href="../about.html">サイトについて</a></li>
          <li><a href="../category/{category_slug}.html">カテゴリ</a></li>
          <li><a href="../contact.html">お問い合わせ</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main>
    <section class="products-section">
      <div class="container">
        <article class="product-card">
          <div class="product-meta">
            <h1 class="product-title">{title}</h1>
            {"<p class='product-brand'>" + manufacturer + "</p>" if manufacturer else ""}
            <div class="product-tags">
              <span class="tag tag-japan">日本製・国産</span>
              <a class="tag" href="../category/{category_slug}.html">{esc(category_name)}</a>
            </div>
            <p>このページは、日本製・国産の商品を探す方向けの商品掲載ページです。</p>
          </div>

          <div class="product-actions">
            <a href="{amazon_url}" class="btn btn-primary amazon-link" target="_blank" rel="noopener sponsored">
              Amazonで見る
            </a>
          </div>
        </article>

        <p style="margin-top:24px;">
          <a href="../category/{category_slug}.html">{esc(category_name)}の日本製商品を見る</a>
        </p>
        <section style="margin-top:40px;">
            <h2>関連する日本製商品</h2>
                <ul>
                    {related_html}
                </ul>
        </section>
        <p>
          <a href="../index.html">日本製・国産の商品一覧へ戻る</a>
        </p>
      </div>
    </section>
  </main>
</body>
</html>
"""


def build_category_html(category_name, slug, items):
    cards = []

    for item in items[:300]:
        asin = esc(item.get("asin", ""))
        title = esc(get_title(item) or "日本製・国産の商品")
        manufacturer = esc(item.get("manufacturer", ""))

        cards.append(f"""
        <article class="product-card">
          <div class="product-meta">
            <h2 class="product-title">
              <a href="../products/{asin}.html">{title}</a>
            </h2>
            {"<p class='product-brand'>" + manufacturer + "</p>" if manufacturer else ""}
            <div class="product-tags">
              <span class="tag tag-japan">日本製・国産</span>
            </div>
          </div>
        </article>
        """)

    cards_html = "\n".join(cards)
    page_url = f"{SITE_URL}/category/{slug}.html"
    description_text = CATEGORY_DESCRIPTIONS.get(category_name, "")

    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>【日本製】{esc(category_name)}一覧 | 日本製がいい！</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Amazonで買える日本製・国産の{esc(category_name)}を一覧で探せます。日本製だけを探したい方向けのカテゴリページです。">
  <link rel="canonical" href="{page_url}">
  <link rel="stylesheet" href="../css/style.css">
</head>
<body>
  <header class="site-header">
    <div class="container header-inner">
      <div class="site-logo">
        <a href="../index.html">
          <img src="../img/pic-header220-48pix.png" alt="日本製がいい！" class="header-logo">
        </a>
      </div>
      <nav class="site-nav">
        <ul>
          <li><a href="../index.html">トップ</a></li>
          <li><a href="../about.html">サイトについて</a></li>
          <li><a href="../contact.html">お問い合わせ</a></li>
        </ul>
      </nav>
    </div>
  </header>
    ALL_PRODUCTS = []
  <main>
    <section class="products-section">
      <div class="container">
        <h1>日本製・国産の{esc(category_name)}</h1>
        <p>
        {esc(description_text)}
        </p>
        <p>
        商品名や掲載情報を確認し、詳細はAmazonの商品ページでご確認ください。
        </p>
        <p>掲載件数：{len(items)}件</p>

        <div class="products-grid">
          {cards_html}
        </div>

        <p style="margin-top:24px;">
          <a href="../index.html">トップへ戻る</a>
        </p>
      </div>
    </section>
  </main>
</body>
</html>
"""


def write_product_pages(products):
    PRODUCTS_DIR.mkdir(exist_ok=True)

    count = 0
    for item in products:
        asin = str(item.get("asin", "")).strip()
        if not asin:
            continue

        out = PRODUCTS_DIR / f"{asin}.html"
        out.write_text(build_product_html(item), encoding="utf-8")
        count += 1

    return count


def write_category_pages(products):
    CATEGORY_DIR.mkdir(exist_ok=True)

    grouped = {}
    for item in products:
        category_name, slug = detect_category(item)
        grouped.setdefault((category_name, slug), []).append(item)

    count = 0
    for (category_name, slug), items in grouped.items():
        out = CATEGORY_DIR / f"{slug}.html"
        out.write_text(build_category_html(category_name, slug, items), encoding="utf-8")
        count += 1

    return count


def write_sitemap(products):
    today = date.today().isoformat()

    urls = [
        f"""  <url>
    <loc>{SITE_URL}/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>""",
        f"""  <url>
    <loc>{SITE_URL}/about.html</loc>
    <lastmod>{today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>""",
        f"""  <url>
    <loc>{SITE_URL}/contact.html</loc>
    <lastmod>{today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>""",
    ]

    used_categories = set()
    for item in products:
        category_name, slug = detect_category(item)
        used_categories.add(slug)

    for _, slug, _ in CATEGORY_RULES:
        if slug in used_categories:
            urls.append(f"""  <url>
    <loc>{SITE_URL}/category/{slug}.html</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>""")

    for item in products:
        asin = str(item.get("asin", "")).strip()
        if not asin:
            continue

        urls.append(f"""  <url>
    <loc>{SITE_URL}/products/{esc(asin)}.html</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>""")

    xml = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
""" + "\n".join(urls) + """
</urlset>
"""

    SITEMAP_XML.write_text(xml, encoding="utf-8")


def write_robots():
    ROBOTS_TXT.write_text(
        f"""User-agent: *
Allow: /

Sitemap: {SITE_URL}/sitemap.xml
""",
        encoding="utf-8",
    )


def main():
    global ALL_PRODUCTS

    products = load_products()
    ALL_PRODUCTS = products

    page_count = write_product_pages(products)
    category_count = write_category_pages(products)

    write_sitemap(products)
    write_robots()

    print(f"products loaded: {len(products)}")
    print(f"product pages written: {page_count}")
    print(f"category pages written: {category_count}")
    print(f"sitemap written: {SITEMAP_XML}")
    print(f"robots written: {ROBOTS_TXT}")


if __name__ == "__main__":
    main()