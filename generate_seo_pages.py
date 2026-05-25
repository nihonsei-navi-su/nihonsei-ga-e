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

def build_feature_common_links():
    return """
<section style="margin-top:40px;">
  <h2>関連カテゴリ</h2>
  <ul>
    <li><a href="../category/kitchen.html">日本製・国産のキッチン・調理用品</a></li>
    <li><a href="../category/daily.html">日本製・国産の生活用品・日用品</a></li>
    <li><a href="../category/food.html">日本製・国産の食品・飲料</a></li>
    <li><a href="../category/hobby.html">日本製・国産の文具・趣味・その他</a></li>
  </ul>
</section>
"""

def build_feature_maker_links(products, keywords):
    makers = {}

    for item in products:
        title = get_title(item)

        if not any(keyword in title for keyword in keywords):
            continue

        maker = str(item.get("manufacturer", "")).strip()
        if not maker:
            continue

        makers[maker] = makers.get(maker, 0) + 1

    sorted_makers = sorted(
        ((maker, count) for maker, count in makers.items() if count >= 5),
        key=lambda x: x[1],
        reverse=True,
    )[:15]

    if not sorted_makers:
        return ""

    links = []
    for maker, count in sorted_makers:
        slug = slugify_maker(maker)
        links.append(
            f'<li><a href="../maker/{esc(slug)}.html">{esc(maker)}</a> ({count})</li>'
        )

    return f"""
<section style="margin-top:40px;">
  <h2>関連メーカー</h2>
  <ul>
    {"".join(links)}
  </ul>
</section>
"""
FEATURE_LINK_RULES = [
    ("燕三条", "../feature/tsubame-sanjo.html", "燕三条特集"),
    ("包丁", "../feature/japanese-knives.html", "日本製包丁特集"),
    ("ナイフ", "../feature/japanese-knives.html", "日本製包丁特集"),
    ("フライパン", "../feature/japanese-frying-pan.html", "日本製フライパン特集"),
    ("玉子焼", "../feature/japanese-frying-pan.html", "日本製フライパン特集"),
    ("卵焼", "../feature/japanese-frying-pan.html", "日本製フライパン特集"),
    ("タオル", "../feature/japanese-towels.html", "日本製タオル特集"),
    ("水筒", "../feature/japanese-water-bottle.html", "日本製水筒特集"),
    ("ボトル", "../feature/japanese-water-bottle.html", "日本製水筒特集"),
    ("タンブラー", "../feature/japanese-water-bottle.html", "日本製水筒特集"),
    ("弁当箱", "../feature/japanese-bento-box.html", "日本製弁当箱特集"),
    ("ランチボックス", "../feature/japanese-bento-box.html", "日本製弁当箱特集"),
    ("保存容器", "../feature/japanese-storage-container.html", "日本製保存容器特集"),
    ("密閉容器", "../feature/japanese-storage-container.html", "日本製保存容器特集"),
    ("まな板", "../feature/japanese-cutting-board.html", "日本製まな板特集"),
    ("鍋", "../feature/japanese-pot.html", "日本製鍋特集"),
    ("箸", "../feature/japanese-chopsticks.html", "日本製箸特集"),
    ("ケトル", "../feature/japanese-kettle.html", "日本製ケトル特集"),
    ("やかん", "../feature/japanese-kettle.html", "日本製ケトル特集"),
    ("急須", "../feature/japanese-teapot.html", "日本製急須特集"),
    ("スプーン", "../feature/japanese-spoons.html", "日本製スプーン特集"),
    ("フォーク", "../feature/japanese-forks.html", "日本製フォーク特集"),
    ("食器", "../feature/japanese-tableware.html", "日本製食器特集"),
    ("皿", "../feature/japanese-tableware.html", "日本製食器特集"),
    ("タンブラー", "../feature/japanese-tumbler.html", "日本製タンブラー特集"),
    ("マグカップ", "../feature/japanese-mug-cup.html", "日本製マグカップ特集"),
    ("爪切り", "../feature/japanese-nail-clipper.html", "日本製爪切り特集"),
    ("ハンガー", "../feature/japanese-laundry-hanger.html", "日本製洗濯ハンガー特集"),
    ("はさみ", "../feature/japanese-scissors.html", "日本製ハサミ特集"),
    ("ハサミ", "../feature/japanese-scissors.html", "日本製ハサミ特集"),
]


FEATURE_DEFINITIONS = [
    {
        "slug": "tsubame-sanjo",
        "title": "燕三条の日本製商品一覧",
        "h1": "燕三条の日本製商品",
        "keywords": ["燕三条"],
        "tag": "燕三条",
        "description": "燕三条の日本製包丁、フライパン、キッチン用品などを掲載しています。Amazonで購入できる日本製商品を探せます。",
        "body": "燕三条は、新潟県の金属加工産地として知られ、包丁、鍋、フライパン、キッチン用品など日本製のものづくりで高い評価を受けています。このページでは、Amazonで販売されている燕三条関連の日本製商品を掲載しています。",
        "faq": [
            ("燕三条とは？", "燕三条は新潟県の金属加工産地で、包丁やキッチン用品など日本製のものづくりで知られています。"),
            ("燕三条製品の特徴は？", "金属加工技術や耐久性、使いやすさなどが評価され、日本製キッチン用品として人気があります。"),
        ],
    },
    {
        "slug": "japanese-knives",
        "title": "日本製包丁一覧",
        "h1": "日本製包丁一覧",
        "keywords": ["包丁", "ナイフ"],
        "tag": "日本製包丁",
        "description": "Amazonで購入できる日本製包丁を掲載しています。三徳包丁、牛刀、ペティナイフなど日本製の包丁を探せます。",
        "body": "日本製包丁は、切れ味や刃付け技術、耐久性などで高く評価されています。三徳包丁、牛刀、ペティナイフなど、Amazonで販売されている日本製包丁を掲載しています。",
        "faq": [
            ("日本製包丁の特徴は？", "切れ味や耐久性、刃付け技術などが評価され、日本製包丁は世界的にも人気があります。"),
            ("どんな包丁がありますか？", "三徳包丁、牛刀、ペティナイフ、菜切り包丁など、さまざまな種類があります。"),
        ],
    },
    {
        "slug": "japanese-frying-pan",
        "title": "日本製フライパン一覧",
        "h1": "日本製フライパン一覧",
        "keywords": ["フライパン", "玉子焼", "卵焼"],
        "tag": "日本製フライパン",
        "description": "Amazonで購入できる日本製フライパンを掲載しています。鉄フライパン、IH対応、玉子焼き器など日本製調理器具を探せます。",
        "body": "日本製フライパンは、耐久性や加工品質などで高く評価されています。鉄フライパン、IH対応、玉子焼き器など、Amazonで販売されている日本製調理器具を掲載しています。",
        "faq": [
            ("日本製フライパンの特徴は？", "耐久性や熱伝導、加工品質などが評価され、日本製フライパンは長く使いやすい製品として人気があります。"),
            ("どんな種類がありますか？", "鉄フライパン、玉子焼き器、IH対応フライパンなどさまざまな種類があります。"),
        ],
    },
    {
        "slug": "japanese-towels",
        "title": "日本製タオル一覧",
        "h1": "日本製タオル一覧",
        "keywords": ["タオル", "バスタオル", "フェイスタオル"],
        "tag": "日本製タオル",
        "description": "Amazonで購入できる日本製タオルを掲載しています。バスタオル、フェイスタオルなど日本製タオルを探せます。",
        "body": "日本製タオルは、吸水性や肌触り、耐久性などで高く評価されています。バスタオル、フェイスタオルなど、Amazonで販売されている日本製タオルを掲載しています。",
        "faq": [
            ("日本製タオルの特徴は？", "吸水性や肌触り、耐久性などが評価され、日本製タオルは日常使いとして人気があります。"),
            ("どんな種類がありますか？", "バスタオル、フェイスタオル、ハンドタオルなどさまざまな種類があります。"),
        ],
    },
    {
        "slug": "japanese-water-bottle",
        "title": "日本製水筒一覧",
        "h1": "日本製水筒一覧",
        "keywords": ["水筒", "ボトル", "マグボトル", "タンブラー"],
        "tag": "日本製水筒",
        "description": "Amazonで購入できる日本製水筒を掲載しています。ステンレスボトル、マグボトル、タンブラーなど日本製水筒を探せます。",
        "body": "日本製水筒は、保温性や耐久性などで高く評価されています。ステンレスボトル、マグボトル、タンブラーなど、Amazonで販売されている日本製水筒を掲載しています。",
        "faq": [
            ("日本製水筒の特徴は？", "保温性や耐久性、加工品質などが評価され、日本製水筒は日常使いとして人気があります。"),
            ("どんな種類がありますか？", "ステンレスボトル、マグボトル、タンブラーなどさまざまな種類があります。"),
        ],
    },
    {
        "slug": "japanese-bento-box",
        "title": "日本製弁当箱一覧",
        "h1": "日本製弁当箱一覧",
        "keywords": ["弁当箱", "ランチボックス", "お弁当箱"],
        "tag": "日本製弁当箱",
        "description": "Amazonで購入できる日本製弁当箱を掲載しています。ランチボックス、木製弁当箱など日本製弁当箱を探せます。",
        "body": "日本製弁当箱は、密閉性や耐久性などで高く評価されています。ランチボックス、木製弁当箱など、Amazonで販売されている日本製弁当箱を掲載しています。",
        "faq": [
            ("日本製弁当箱の特徴は？", "耐久性や密閉性、加工品質などが評価され、日本製弁当箱は日常使いとして人気があります。"),
            ("どんな種類がありますか？", "木製弁当箱、ステンレス弁当箱、ランチボックスなどさまざまな種類があります。"),
        ],
    },
    {
        "slug": "japanese-storage-container",
        "title": "日本製保存容器一覧",
        "h1": "日本製保存容器一覧",
        "keywords": ["保存容器", "密閉容器", "容器", "タッパー", "キャニスター"],
        "tag": "日本製保存容器",
        "description": "Amazonで購入できる日本製保存容器を掲載しています。密閉容器、食品保存容器、キャニスターなどを探せます。",
        "body": "日本製保存容器は、密閉性や耐久性、使いやすさで選ばれています。Amazonで販売されている日本製の保存容器・密閉容器を掲載しています。",
        "faq": [],
    },
    {
        "slug": "japanese-cutting-board",
        "title": "日本製まな板一覧",
        "h1": "日本製まな板一覧",
        "keywords": ["まな板", "俎板", "カッティングボード"],
        "tag": "日本製まな板",
        "description": "Amazonで購入できる日本製まな板を掲載しています。木製まな板、抗菌まな板、カッティングボードなどを探せます。",
        "body": "日本製まな板は、素材の品質や加工精度、使いやすさで選ばれています。Amazonで販売されている日本製まな板・カッティングボードを掲載しています。",
        "faq": [],
    },
    {
        "slug": "japanese-pot",
        "title": "日本製鍋一覧",
        "h1": "日本製鍋一覧",
        "keywords": ["鍋", "片手鍋", "両手鍋", "雪平鍋", "土鍋", "天ぷら鍋"],
        "tag": "日本製鍋",
        "description": "Amazonで購入できる日本製鍋を掲載しています。片手鍋、両手鍋、雪平鍋、土鍋などを探せます。",
        "body": "日本製鍋は、熱伝導や耐久性、加工品質で選ばれています。Amazonで販売されている日本製の片手鍋・両手鍋・雪平鍋・土鍋などを掲載しています。",
        "faq": [],
    },
    {
        "slug": "japanese-chopsticks",
        "title": "日本製箸一覧",
        "h1": "日本製箸一覧",
        "keywords": ["箸", "お箸", "はし", "菜箸"],
        "tag": "日本製箸",
        "description": "Amazonで購入できる日本製箸を掲載しています。お箸、菜箸、箸セットなどを探せます。",
        "body": "日本製箸は、素材や塗装、持ちやすさなどで選ばれています。Amazonで販売されている日本製のお箸・菜箸・箸セットを掲載しています。",
        "faq": [],
    },
    {
        "slug": "japanese-kettle",
        "title": "日本製ケトル・やかん一覧",
        "h1": "日本製ケトル・やかん一覧",
        "keywords": ["ケトル", "やかん", "笛吹ケトル"],
        "tag": "日本製ケトル",
        "description": "Amazonで購入できる日本製ケトル・やかんを掲載しています。ステンレスケトル、笛吹ケトルなどを探せます。",
        "body": "日本製ケトル・やかんは、耐久性や扱いやすさ、金属加工品質で選ばれています。Amazonで販売されている日本製ケトル・やかんを掲載しています。",
        "faq": [],
    },
    {
        "slug": "japanese-teapot",
        "title": "日本製急須一覧",
        "h1": "日本製急須一覧",
        "keywords": ["急須", "茶こし", "土瓶"],
        "tag": "日本製急須",
        "description": "Amazonで購入できる日本製急須を掲載しています。陶器急須、茶こし付き急須、土瓶などを探せます。",
        "body": "日本製急須は、お茶を淹れる使いやすさや素材の質感で選ばれています。Amazonで販売されている日本製急須を掲載しています。",
        "faq": [],
    },
    {
        "slug": "japanese-spoons",
        "title": "日本製スプーン一覧",
        "h1": "日本製スプーン一覧",
        "keywords": ["スプーン", "匙"],
        "tag": "日本製スプーン",
        "description": "Amazonで購入できる日本製スプーンを掲載しています。ステンレススプーン、カトラリーなどを探せます。",
        "body": "日本製スプーンは、口当たりや加工精度、耐久性で選ばれています。Amazonで販売されている日本製スプーンを掲載しています。",
        "faq": [],
    },
    {
        "slug": "japanese-forks",
        "title": "日本製フォーク一覧",
        "h1": "日本製フォーク一覧",
        "keywords": ["フォーク"],
        "tag": "日本製フォーク",
        "description": "Amazonで購入できる日本製フォークを掲載しています。ディナーフォーク、ケーキフォークなどを探せます。",
        "body": "日本製フォークは、金属加工品質や使いやすさで選ばれています。Amazonで販売されている日本製フォークを掲載しています。",
        "faq": [],
    },
    {
        "slug": "japanese-tableware",
        "title": "日本製食器一覧",
        "h1": "日本製食器一覧",
        "keywords": ["食器", "皿", "器", "茶碗", "湯呑"],
        "tag": "日本製食器",
        "description": "Amazonで購入できる日本製食器を掲載しています。皿、茶碗、器、湯呑などを探せます。",
        "body": "日本製食器は、使いやすさや質感、産地ごとのものづくりで選ばれています。Amazonで販売されている日本製食器を掲載しています。",
        "faq": [],
    },
    {
        "slug": "japanese-tumbler",
        "title": "日本製タンブラー一覧",
        "h1": "日本製タンブラー一覧",
        "keywords": ["タンブラー"],
        "tag": "日本製タンブラー",
        "description": "Amazonで購入できる日本製タンブラーを掲載しています。ステンレスタンブラーなどを探せます。",
        "body": "日本製タンブラーは、保温・保冷性能や加工品質で選ばれています。Amazonで販売されている日本製タンブラーを掲載しています。",
        "faq": [],
    },
    {
        "slug": "japanese-mug-cup",
        "title": "日本製マグカップ一覧",
        "h1": "日本製マグカップ一覧",
        "keywords": ["マグカップ", "マグ"],
        "tag": "日本製マグカップ",
        "description": "Amazonで購入できる日本製マグカップを掲載しています。陶器マグ、磁器マグなどを探せます。",
        "body": "日本製マグカップは、質感や使いやすさ、デザインで選ばれています。Amazonで販売されている日本製マグカップを掲載しています。",
        "faq": [],
    },
    {
        "slug": "japanese-nail-clipper",
        "title": "日本製爪切り一覧",
        "h1": "日本製爪切り一覧",
        "keywords": ["爪切り", "爪きり", "つめきり"],
        "tag": "日本製爪切り",
        "description": "Amazonで購入できる日本製爪切りを掲載しています。切れ味や使いやすさで選ばれる日本製爪切りを探せます。",
        "body": "日本製爪切りは、刃の精度や切れ味、使いやすさで選ばれています。Amazonで販売されている日本製爪切りを掲載しています。",
        "faq": [],
    },
    {
        "slug": "japanese-laundry-hanger",
        "title": "日本製洗濯ハンガー一覧",
        "h1": "日本製洗濯ハンガー一覧",
        "keywords": ["洗濯ハンガー", "ハンガー", "ピンチハンガー"],
        "tag": "日本製洗濯ハンガー",
        "description": "Amazonで購入できる日本製洗濯ハンガーを掲載しています。ピンチハンガー、物干しハンガーなどを探せます。",
        "body": "日本製洗濯ハンガーは、耐久性や使いやすさで選ばれています。Amazonで販売されている日本製洗濯ハンガーを掲載しています。",
        "faq": [],
    },
    {
        "slug": "japanese-scissors",
        "title": "日本製ハサミ一覧",
        "h1": "日本製ハサミ一覧",
        "keywords": ["ハサミ", "はさみ", "鋏", "キッチンハサミ"],
        "tag": "日本製ハサミ",
        "description": "Amazonで購入できる日本製ハサミを掲載しています。キッチンハサミ、作業用ハサミなどを探せます。",
        "body": "日本製ハサミは、刃物加工技術や切れ味、耐久性で選ばれています。Amazonで販売されている日本製ハサミを掲載しています。",
        "faq": [],
    },
        {
        "slug": "japanese-rice-scoop",
        "title": "日本製しゃもじ一覧",
        "description": "Amazonで購入できる日本製しゃもじを掲載しています。ご飯しゃもじ、立つしゃもじ、抗菌しゃもじなどを探せます。",
        "heading": "日本製しゃもじ一覧",
        "body": "日本製しゃもじは、使いやすさや素材、抗菌性などで選ばれています。Amazonで販売されている日本製しゃもじを掲載しています。",
        "keywords": ["しゃもじ", "杓文字"],
        "tag": "日本製しゃもじ",
    },
    {
        "slug": "japanese-grater",
        "title": "日本製おろし金一覧",
        "description": "Amazonで購入できる日本製おろし金を掲載しています。大根おろし器、薬味おろし、ステンレスおろし金などを探せます。",
        "heading": "日本製おろし金一覧",
        "body": "日本製おろし金は、切れ味や加工精度、使いやすさで選ばれています。Amazonで販売されている日本製おろし金を掲載しています。",
        "keywords": ["おろし金", "おろし器", "大根おろし", "薬味おろし"],
        "tag": "日本製おろし金",
    },
    {
        "slug": "japanese-peeler",
        "title": "日本製ピーラー一覧",
        "description": "Amazonで購入できる日本製ピーラーを掲載しています。皮むき器、千切りピーラー、野菜ピーラーなどを探せます。",
        "heading": "日本製ピーラー一覧",
        "body": "日本製ピーラーは、切れ味や持ちやすさ、加工精度で選ばれています。Amazonで販売されている日本製ピーラーを掲載しています。",
        "keywords": ["ピーラー", "皮むき", "皮むき器"],
        "tag": "日本製ピーラー",
    },
    {
        "slug": "japanese-tongs",
        "title": "日本製トング一覧",
        "description": "Amazonで購入できる日本製トングを掲載しています。調理トング、ステンレストング、キッチントングなどを探せます。",
        "heading": "日本製トング一覧",
        "body": "日本製トングは、つかみやすさや耐久性、加工品質で選ばれています。Amazonで販売されている日本製トングを掲載しています。",
        "keywords": ["トング", "キッチントング", "調理トング"],
        "tag": "日本製トング",
    },
    {
        "slug": "japanese-storage-bottle",
        "title": "日本製保存瓶一覧",
        "description": "Amazonで購入できる日本製保存瓶を掲載しています。保存びん、密封瓶、ガラス瓶などを探せます。",
        "heading": "日本製保存瓶一覧",
        "body": "日本製保存瓶は、密閉性や使いやすさ、保存性で選ばれています。Amazonで販売されている日本製保存瓶を掲載しています。",
        "keywords": ["保存瓶", "保存びん", "密封瓶", "ガラス瓶"],
        "tag": "日本製保存瓶",
    },
    {
        "slug": "japanese-coffee-dripper",
        "title": "日本製コーヒードリッパー一覧",
        "description": "Amazonで購入できる日本製コーヒードリッパーを掲載しています。陶器ドリッパー、ステンレスドリッパーなどを探せます。",
        "heading": "日本製コーヒードリッパー一覧",
        "body": "日本製コーヒードリッパーは、抽出のしやすさや素材、加工品質で選ばれています。Amazonで販売されている日本製コーヒードリッパーを掲載しています。",
        "keywords": ["コーヒードリッパー", "ドリッパー"],
        "tag": "日本製コーヒードリッパー",
    },
    {
        "slug": "japanese-coffee-filter",
        "title": "日本製コーヒーフィルター一覧",
        "description": "Amazonで購入できる日本製コーヒーフィルターを掲載しています。ペーパーフィルター、コーヒー用品などを探せます。",
        "heading": "日本製コーヒーフィルター一覧",
        "body": "日本製コーヒーフィルターは、抽出品質や使いやすさで選ばれています。Amazonで販売されている日本製コーヒーフィルターを掲載しています。",
        "keywords": ["コーヒーフィルター", "ペーパーフィルター", "フィルター"],
        "tag": "日本製コーヒーフィルター",
    },
    {
        "slug": "japanese-tea-canister",
        "title": "日本製茶筒一覧",
        "description": "Amazonで購入できる日本製茶筒を掲載しています。茶缶、茶葉保存容器、ステンレス茶筒などを探せます。",
        "heading": "日本製茶筒一覧",
        "body": "日本製茶筒は、密閉性や保存性、仕上げの美しさで選ばれています。Amazonで販売されている日本製茶筒を掲載しています。",
        "keywords": ["茶筒", "茶缶", "茶葉"],
        "tag": "日本製茶筒",
    },
    {
        "slug": "japanese-cooking-spoon",
        "title": "日本製調理スプーン一覧",
        "description": "Amazonで購入できる日本製調理スプーンを掲載しています。調理スプーン、サービングスプーン、キッチンスプーンなどを探せます。",
        "heading": "日本製調理スプーン一覧",
        "body": "日本製調理スプーンは、使いやすさや耐久性、加工品質で選ばれています。Amazonで販売されている日本製調理スプーンを掲載しています。",
        "keywords": ["調理スプーン", "サービングスプーン", "キッチンスプーン"],
        "tag": "日本製調理スプーン",
    },
    {
        "slug": "japanese-kitchen-scissors",
        "title": "日本製キッチンバサミ一覧",
        "description": "Amazonで購入できる日本製キッチンバサミを掲載しています。調理バサミ、料理ハサミ、キッチンはさみなどを探せます。",
        "heading": "日本製キッチンバサミ一覧",
        "body": "日本製キッチンバサミは、切れ味や分解しやすさ、耐久性で選ばれています。Amazonで販売されている日本製キッチンバサミを掲載しています。",
        "keywords": ["キッチンバサミ", "調理バサミ", "料理ハサミ", "キッチンはさみ"],
        "tag": "日本製キッチンバサミ",
    },
          {
        "slug": "japanese-colander",
        "title": "日本製ざる一覧",
        "description": "Amazonで購入できる日本製ざるを掲載しています。",
        "heading": "日本製ざる一覧",
        "body": "日本製ざるは、水切れや耐久性、加工品質で選ばれています。",
        "keywords": ["ざる", "ザル", "水切り"],
        "tag": "日本製ざる",
    },
    {
        "slug": "japanese-bowl",
        "title": "日本製ボウル一覧",
        "description": "Amazonで購入できる日本製ボウルを掲載しています。",
        "heading": "日本製ボウル一覧",
        "body": "日本製ボウルは、調理のしやすさや耐久性で選ばれています。",
        "keywords": ["ボウル", "ステンレスボウル"],
        "tag": "日本製ボウル",
    },
    {
        "slug": "japanese-cooking-chopsticks",
        "title": "日本製菜箸一覧",
        "description": "Amazonで購入できる日本製菜箸を掲載しています。",
        "heading": "日本製菜箸一覧",
        "body": "日本製菜箸は、持ちやすさや耐熱性で選ばれています。",
        "keywords": ["菜箸", "さいばし"],
        "tag": "日本製菜箸",
    },
    {
        "slug": "japanese-ladle",
        "title": "日本製お玉一覧",
        "description": "Amazonで購入できる日本製お玉を掲載しています。",
        "heading": "日本製お玉一覧",
        "body": "日本製お玉は、使いやすさや耐久性で選ばれています。",
        "keywords": ["お玉", "レードル"],
        "tag": "日本製お玉",
    },
    {
        "slug": "japanese-kettle-pot",
        "title": "日本製やかん一覧",
        "description": "Amazonで購入できる日本製やかんを掲載しています。",
        "heading": "日本製やかん一覧",
        "body": "日本製やかんは、耐久性や注ぎやすさで選ばれています。",
        "keywords": ["やかん", "ケトル"],
        "tag": "日本製やかん",
    },
    {
        "slug": "japanese-cake-mold",
        "title": "日本製ケーキ型一覧",
        "description": "Amazonで購入できる日本製ケーキ型を掲載しています。",
        "heading": "日本製ケーキ型一覧",
        "body": "日本製ケーキ型は、加工精度や焼きやすさで選ばれています。",
        "keywords": ["ケーキ型", "焼型"],
        "tag": "日本製ケーキ型",
    },
    {
        "slug": "japanese-whisk",
        "title": "日本製泡立て器一覧",
        "description": "Amazonで購入できる日本製泡立て器を掲載しています。",
        "heading": "日本製泡立て器一覧",
        "body": "日本製泡立て器は、混ぜやすさや耐久性で選ばれています。",
        "keywords": ["泡立て器", "ホイッパー"],
        "tag": "日本製泡立て器",
    },
    {
        "slug": "japanese-storage-case",
        "title": "日本製保存ケース一覧",
        "description": "Amazonで購入できる日本製保存ケースを掲載しています。",
        "heading": "日本製保存ケース一覧",
        "body": "日本製保存ケースは、密閉性や収納性で選ばれています。",
        "keywords": ["保存ケース", "収納ケース"],
        "tag": "日本製保存ケース",
    },
    {
        "slug": "japanese-lunch-bag",
        "title": "日本製ランチバッグ一覧",
        "description": "Amazonで購入できる日本製ランチバッグを掲載しています。",
        "heading": "日本製ランチバッグ一覧",
        "body": "日本製ランチバッグは、保冷性や耐久性で選ばれています。",
        "keywords": ["ランチバッグ", "弁当バッグ"],
        "tag": "日本製ランチバッグ",
    },
    {
        "slug": "japanese-chopstick-rest",
        "title": "日本製箸置き一覧",
        "description": "Amazonで購入できる日本製箸置きを掲載しています。",
        "heading": "日本製箸置き一覧",
        "body": "日本製箸置きは、陶器や木製など多様な素材で人気です。",
        "keywords": ["箸置き"],
        "tag": "日本製箸置き",
    },
    {
        "slug": "japanese-rice-bowl",
        "title": "日本製茶碗一覧",
        "description": "Amazonで購入できる日本製茶碗を掲載しています。",
        "heading": "日本製茶碗一覧",
        "body": "日本製茶碗は、美濃焼や有田焼など日本各地で作られています。",
        "keywords": ["茶碗", "飯碗"],
        "tag": "日本製茶碗",
    },
    {
        "slug": "japanese-donburi",
        "title": "日本製どんぶり一覧",
        "description": "Amazonで購入できる日本製どんぶりを掲載しています。",
        "heading": "日本製どんぶり一覧",
        "body": "日本製どんぶりは、陶器や磁器など多彩な素材があります。",
        "keywords": ["どんぶり", "丼"],
        "tag": "日本製どんぶり",
    },
    {
        "slug": "japanese-yunomi",
        "title": "日本製湯のみ一覧",
        "description": "Amazonで購入できる日本製湯のみを掲載しています。",
        "heading": "日本製湯のみ一覧",
        "body": "日本製湯のみは、美濃焼や有田焼などが人気です。",
        "keywords": ["湯のみ", "湯呑"],
        "tag": "日本製湯のみ",
    },
    {
        "slug": "japanese-cooling-tumbler",
        "title": "日本製急冷タンブラー一覧",
        "description": "Amazonで購入できる日本製急冷タンブラーを掲載しています。",
        "heading": "日本製急冷タンブラー一覧",
        "body": "日本製急冷タンブラーは、冷却性能や保冷性能で人気です。",
        "keywords": ["急冷タンブラー", "タンブラー"],
        "tag": "日本製急冷タンブラー",
    },
    {
        "slug": "japanese-knife-sharpener",
        "title": "日本製包丁研ぎ一覧",
        "description": "Amazonで購入できる日本製包丁研ぎを掲載しています。",
        "heading": "日本製包丁研ぎ一覧",
        "body": "日本製包丁研ぎは、砥石や簡易シャープナーなどがあります。",
        "keywords": ["包丁研ぎ", "砥石", "シャープナー"],
        "tag": "日本製包丁研ぎ",
    },
    {
        "slug": "japanese-measuring-cup",
        "title": "日本製計量カップ一覧",
        "description": "Amazonで購入できる日本製計量カップを掲載しています。",
        "heading": "日本製計量カップ一覧",
        "body": "日本製計量カップは、見やすさや耐久性で選ばれています。",
        "keywords": ["計量カップ"],
        "tag": "日本製計量カップ",
    },
    {
        "slug": "japanese-measuring-spoon",
        "title": "日本製計量スプーン一覧",
        "description": "Amazonで購入できる日本製計量スプーンを掲載しています。",
        "heading": "日本製計量スプーン一覧",
        "body": "日本製計量スプーンは、精度や耐久性で選ばれています。",
        "keywords": ["計量スプーン"],
        "tag": "日本製計量スプーン",
    },
    {
        "slug": "japanese-rice-container",
        "title": "日本製米びつ一覧",
        "description": "Amazonで購入できる日本製米びつを掲載しています。",
        "heading": "日本製米びつ一覧",
        "body": "日本製米びつは、保存性や防虫性で選ばれています。",
        "keywords": ["米びつ"],
        "tag": "日本製米びつ",
    },
    {
        "slug": "japanese-kitchen-rack",
        "title": "日本製キッチンラック一覧",
        "description": "Amazonで購入できる日本製キッチンラックを掲載しています。",
        "heading": "日本製キッチンラック一覧",
        "body": "日本製キッチンラックは、収納性や耐久性で選ばれています。",
        "keywords": ["キッチンラック", "ラック"],
        "tag": "日本製キッチンラック",
    },
]

def normalize_maker_name(name):
    text = str(name or "").strip()

    replacements = {
        "貝印kai-corporation": "貝印",
        "kai corporation": "貝印",
        "kai-corporation": "貝印",
        "ハリオhario": "HARIO",
        "harioハリオ": "HARIO",
    }

    lower = text.lower()

    for k, v in replacements.items():
        if k.lower() in lower:
            return v

    return text

def slugify_maker(name):
    text = str(name or "").strip().lower()

    replacements = {
        "株式会社": "",
        "(株)": "",
        " ": "-",
        "　": "-",
        "/": "-",
        "_": "-",
    }

    for k, v in replacements.items():
        text = text.replace(k, v)

    text = re.sub(r"[^a-z0-9ぁ-んァ-ヶ一-龯\-]", "", text)
    text = re.sub(r"-+", "-", text).strip("-")

    if not text:
        text = "unknown"

    return text

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

    common_links = build_feature_common_links()

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
        {common_links}
        <p style="margin-top:24px;">
          <a href="../index.html">トップへ戻る</a>
        </p>
      </div>
    </section>
  </main>
</body>
</html>
"""

def build_maker_html(maker_name, slug, items):
    cards = []

    for item in items[:300]:
        asin = esc(item.get("asin", ""))
        title = esc(get_title(item) or "日本製・国産の商品")
        category_name, category_slug = detect_category(item)

        cards.append(f"""
        <article class="product-card">
          <div class="product-meta">
            <h2 class="product-title">
              <a href="../products/{asin}.html">{title}</a>
            </h2>
            <div class="product-tags">
              <span class="tag tag-japan">日本製・国産</span>
              <a class="tag" href="../category/{category_slug}.html">{esc(category_name)}</a>
            </div>
          </div>
        </article>
        """)

    cards_html = "\n".join(cards)

    common_links = build_feature_common_links()

    feature_links = []

    for item in items:
        title = get_title(item)

        for keyword, url, label in FEATURE_LINK_RULES:
            if keyword in title:
                link_html = f'<li><a href="{url}">{label}</a></li>'
                if link_html not in feature_links:
                    feature_links.append(link_html)

    feature_links_html = ""

    if feature_links:
        feature_links_html = f"""
    <section style="margin-top:40px;">
    <h2>関連特集</h2>
    <ul>
        {"".join(feature_links)}
    </ul>
    </section>
    """
    page_url = f"{SITE_URL}/maker/{slug}.html"

    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>【日本製】{esc(maker_name)}の商品一覧 | 日本製がいい！</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="{esc(maker_name)}の日本製・国産商品一覧です。Amazonで購入できる日本製商品を掲載しています。">
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

  <main>
    <section class="products-section">
      <div class="container">
        <h1>{esc(maker_name)} の日本製・国産商品</h1>
        <p>
          {esc(maker_name)} の日本製・国産商品を掲載しています。
          Amazonで販売されている日本製商品をカテゴリ横断で探せます。
        </p>
        <p>掲載件数：{len(items)}件</p>

        <div class="products-grid">
          {cards_html}
        </div>
        {feature_links_html}
        {common_links}
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

def write_maker_pages(products):
    maker_dir = ROOT / "maker"
    maker_dir.mkdir(exist_ok=True)

    grouped = {}

    for item in products:
        maker = str(item.get("manufacturer", "")).strip()
        if not maker:
            continue

        grouped.setdefault(maker, []).append(item)

    count = 0

    for maker_name, items in grouped.items():
        if len(items) < 5:
            continue

        maker_name = normalize_maker_name(maker_name)
        slug = slugify_maker(maker_name)

        if slug in {"unknown", "generic"}:
            continue
        out = maker_dir / f"{slug}.html"
        out.write_text(build_maker_html(maker_name, slug, items), encoding="utf-8")
        count += 1

    return count


def build_feature_page(products, feature):
    matched = []

    for item in products:
        title = get_title(item)
        if not any(keyword in title for keyword in feature["keywords"]):
            continue
        matched.append(item)

    cards = []
    for item in matched[:200]:
        asin = esc(item.get("asin", ""))
        title = esc(get_title(item))
        manufacturer = esc(item.get("manufacturer", ""))

        cards.append(f"""
        <article class="product-card">
          <div class="product-meta">
            <h2 class="product-title">
              <a href="../products/{asin}.html">{title}</a>
            </h2>
            {"<p class='product-brand'>" + manufacturer + "</p>" if manufacturer else ""}
            <div class="product-tags">
              <span class="tag tag-japan">{esc(feature["tag"])}</span>
              <span class="tag tag-japan">日本製・国産</span>
            </div>
          </div>
        </article>
        """)

    cards_html = "\n".join(cards)
    common_links = build_feature_common_links()
    maker_links = build_feature_maker_links(products, feature["keywords"])

    faq_items = []
    for question, answer in feature.get("faq", []):
        faq_items.append(f"""
    {{
      "@type": "Question",
      "name": "{esc(question)}",
      "acceptedAnswer": {{
        "@type": "Answer",
        "text": "{esc(answer)}"
      }}
    }}""")

    faq_schema = ""
    if faq_items:
        faq_schema = f"""
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {",".join(faq_items)}
  ]
}}
</script>
"""

    page_url = f"{SITE_URL}/feature/{feature['slug']}.html"

    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>{esc(feature["title"])} | 日本製がいい！</title>
  <meta name="description" content="{esc(feature["description"])}">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="canonical" href="{page_url}">
  <link rel="stylesheet" href="../css/style.css">
  {faq_schema}
</head>
<body>
<header class="site-header">
  <div class="container header-inner">
    <div class="site-logo">
      <a href="../index.html">
        <img src="../img/pic-header220-48pix.png" alt="日本製がいい！" class="header-logo">
      </a>
    </div>
  </div>
</header>

<main>
  <section class="products-section">
    <div class="container">
      <h1>{esc(feature.get("h1") or feature.get("heading") or feature["title"])}</h1>
      <p>{esc(feature["body"])}</p>
      <p>掲載件数：{len(matched)}件</p>
      <div class="products-grid">
        {cards_html}
      </div>
      {common_links}
      {maker_links}
    </div>
  </section>
</main>
</body>
</html>
"""


def build_feature_index_html():
    cards = []

    for feature in FEATURE_DEFINITIONS:
        slug = feature.get("slug", "").strip()

        title = (
            feature.get("h1")
            or feature.get("heading")
            or feature.get("title")
            or ""
        ).strip()

        description = (
            feature.get("description")
            or feature.get("body")
            or ""
        ).strip()

        if not slug or not title:
            continue

        cards.append(f"""
        <a class="feature-card" href="{esc(slug)}.html">
          <h2>{esc(title)}</h2>
          <p>{esc(description[:80])}</p>
        </a>
        """)

    cards_html = "\n".join(cards)

    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>日本製特集一覧 | 日本製がいい！</title>
  <meta name="description" content="日本製・国産の商品特集一覧ページです。">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="canonical" href="{SITE_URL}/feature/index.html">
  <link rel="stylesheet" href="../css/style.css">
</head>
<body>

<header class="site-header">
  <div class="container header-inner">
    <div class="site-logo">
      <a href="../index.html">
        <img src="../img/pic-header220-48pix.png"
             alt="日本製がいい！"
             class="header-logo">
      </a>
    </div>
  </div>
</header>

<main>
  <section class="products-section">
    <div class="container">

      <h1>日本製特集一覧</h1>

      <div class="feature-grid">
        {cards_html}
      </div>

      <p style="margin-top:40px;">
        <a href="../index.html">← トップページへ戻る</a>
      </p>

    </div>
  </section>
</main>

</body>
</html>
"""

def write_feature_pages(products):
    feature_dir = ROOT / "feature"
    feature_dir.mkdir(exist_ok=True)

    count = 0
    for feature in FEATURE_DEFINITIONS:
        out = feature_dir / f"{feature['slug']}.html"
        out.write_text(
            build_feature_page(products, feature),
            encoding="utf-8"
        )
        count += 1

    feature_index = feature_dir / "index.html"
    feature_index.write_text(
        build_feature_index_html(),
        encoding="utf-8"
    )

    return count

def build_feature_tsubame_sanjo(products):
    cards = []

    matched = []

    for item in products:
        title = get_title(item)

        if "燕三条" not in title:
            continue

        matched.append(item)

    for item in matched[:200]:
        asin = esc(item.get("asin", ""))
        title = esc(get_title(item))
        manufacturer = esc(item.get("manufacturer", ""))

        cards.append(f"""
        <article class="product-card">
          <div class="product-meta">

            <h2 class="product-title">
              <a href="../products/{asin}.html">
                {title}
              </a>
            </h2>

            {"<p class='product-brand'>" + manufacturer + "</p>" if manufacturer else ""}

            <div class="product-tags">
              <span class="tag tag-japan">燕三条</span>
              <span class="tag tag-japan">日本製・国産</span>
            </div>

          </div>
        </article>
        """)

    cards_html = "\n".join(cards)

    common_links = build_feature_common_links()
    maker_links = build_feature_maker_links(products, ["燕三条"])

    faq_schema = f"""
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {{
      "@type": "Question",
      "name": "燕三条とは？",
      "acceptedAnswer": {{
        "@type": "Answer",
        "text": "燕三条は新潟県の金属加工産地で、包丁やキッチン用品など日本製のものづくりで知られています。"
      }}
    }},
    {{
      "@type": "Question",
      "name": "燕三条製品の特徴は？",
      "acceptedAnswer": {{
        "@type": "Answer",
        "text": "金属加工技術や耐久性、使いやすさなどが評価され、日本製キッチン用品として人気があります。"
      }}
    }},
    {{
      "@type": "Question",
      "name": "このページでは何が見られますか？",
      "acceptedAnswer": {{
        "@type": "Answer",
        "text": "Amazonで販売されている燕三条関連の日本製商品を一覧で確認できます。"
      }}
    }}
  ]
}}
</script>
"""
    
    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">

  <title>燕三条の日本製商品一覧 | 日本製がいい！</title>

  <meta name="description"
        content="燕三条の日本製包丁、フライパン、キッチン用品などを掲載しています。Amazonで購入できる日本製商品を探せます。">

  <meta name="viewport"
        content="width=device-width, initial-scale=1">

  <link rel="canonical"
        href="{SITE_URL}/feature/tsubame-sanjo.html">

  <link rel="stylesheet"
        href="../css/style.css">
    {faq_schema}
</head>

<body>

<header class="site-header">
  <div class="container header-inner">
    <div class="site-logo">
      <a href="../index.html">
        <img src="../img/pic-header220-48pix.png"
             alt="日本製がいい！"
             class="header-logo">
      </a>
    </div>
  </div>
</header>

<main>
  <section class="products-section">

    <div class="container">

      <h1>燕三条の日本製商品</h1>

      <p>
        燕三条は、新潟県の金属加工産地として知られ、
        包丁、鍋、フライパン、キッチン用品など
        日本製のものづくりで高い評価を受けています。
      </p>

      <p>
        このページでは、Amazonで販売されている
        燕三条関連の日本製商品を掲載しています。
      </p>

      <p>掲載件数：{len(matched)}件</p>

      <div class="products-grid">
        {cards_html}
      </div>
      {common_links}
      {maker_links}

    </div>

  </section>
</main>

</body>
</html>
"""
def build_feature_japanese_knives(products):
    cards = []

    matched = []

    for item in products:
        title = get_title(item)

        if not re.search(r"包丁|ナイフ", title):
            continue

        matched.append(item)

    for item in matched[:200]:
        asin = esc(item.get("asin", ""))
        title = esc(get_title(item))
        manufacturer = esc(item.get("manufacturer", ""))

        cards.append(f"""
        <article class="product-card">
          <div class="product-meta">

            <h2 class="product-title">
              <a href="../products/{asin}.html">
                {title}
              </a>
            </h2>

            {"<p class='product-brand'>" + manufacturer + "</p>" if manufacturer else ""}

            <div class="product-tags">
              <span class="tag tag-japan">日本製包丁</span>
              <span class="tag tag-japan">日本製・国産</span>
            </div>

          </div>
        </article>
        """)

    cards_html = "\n".join(cards)

    common_links = build_feature_common_links()
    maker_links = build_feature_maker_links(products, ["包丁", "ナイフ"])

    faq_schema = f"""
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {{
      "@type": "Question",
      "name": "日本製包丁の特徴は？",
      "acceptedAnswer": {{
        "@type": "Answer",
        "text": "切れ味や耐久性、刃付け技術などが評価され、日本製包丁は世界的にも人気があります。"
      }}
    }},
    {{
      "@type": "Question",
      "name": "どんな包丁がありますか？",
      "acceptedAnswer": {{
        "@type": "Answer",
        "text": "三徳包丁、牛刀、ペティナイフ、菜切り包丁など、さまざまな種類があります。"
      }}
    }}
  ]
}}
</script>
"""

    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">

  <title>日本製包丁一覧 | 日本製がいい！</title>

  <meta name="description"
        content="Amazonで購入できる日本製包丁を掲載しています。三徳包丁、牛刀、ペティナイフなど日本製の包丁を探せます。">

  <meta name="viewport"
        content="width=device-width, initial-scale=1">

  <link rel="canonical"
        href="{SITE_URL}/feature/japanese-knives.html">

  <link rel="stylesheet"
        href="../css/style.css">

  {faq_schema}

</head>

<body>

<header class="site-header">
  <div class="container header-inner">
    <div class="site-logo">
      <a href="../index.html">
        <img src="../img/pic-header220-48pix.png"
             alt="日本製がいい！"
             class="header-logo">
      </a>
    </div>
  </div>
</header>

<main>
  <section class="products-section">

    <div class="container">

      <h1>日本製包丁一覧</h1>

      <p>
        日本製包丁は、切れ味や刃付け技術、耐久性などで高く評価されています。
        三徳包丁、牛刀、ペティナイフなど、
        Amazonで販売されている日本製包丁を掲載しています。
      </p>

      <p>掲載件数：{len(matched)}件</p>

      <div class="products-grid">
        {cards_html}
      </div>
        {common_links}
      {maker_links}
    </div>

  </section>
</main>

</body>
</html>
"""

def build_feature_japanese_frying_pan(products):
    cards = []

    matched = []

    for item in products:
        title = get_title(item)

        if not re.search(r"フライパン|玉子焼|卵焼", title):
            continue

        matched.append(item)

    for item in matched[:200]:
        asin = esc(item.get("asin", ""))
        title = esc(get_title(item))
        manufacturer = esc(item.get("manufacturer", ""))

        cards.append(f"""
        <article class="product-card">
          <div class="product-meta">

            <h2 class="product-title">
              <a href="../products/{asin}.html">
                {title}
              </a>
            </h2>

            {"<p class='product-brand'>" + manufacturer + "</p>" if manufacturer else ""}

            <div class="product-tags">
              <span class="tag tag-japan">日本製フライパン</span>
              <span class="tag tag-japan">日本製・国産</span>
            </div>

          </div>
        </article>
        """)

    cards_html = "\n".join(cards)

    common_links = build_feature_common_links()
    maker_links = build_feature_maker_links(products, ["フライパン", "玉子焼", "卵焼"])

    faq_schema = f"""
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {{
      "@type": "Question",
      "name": "日本製フライパンの特徴は？",
      "acceptedAnswer": {{
        "@type": "Answer",
        "text": "耐久性や熱伝導、加工品質などが評価され、日本製フライパンは長く使いやすい製品として人気があります。"
      }}
    }},
    {{
      "@type": "Question",
      "name": "どんな種類がありますか？",
      "acceptedAnswer": {{
        "@type": "Answer",
        "text": "鉄フライパン、玉子焼き器、IH対応フライパンなどさまざまな種類があります。"
      }}
    }}
  ]
}}
</script>
"""

    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">

  <title>日本製フライパン一覧 | 日本製がいい！</title>

  <meta name="description"
        content="Amazonで購入できる日本製フライパンを掲載しています。鉄フライパン、IH対応、玉子焼き器など日本製調理器具を探せます。">

  <meta name="viewport"
        content="width=device-width, initial-scale=1">

  <link rel="canonical"
        href="{SITE_URL}/feature/japanese-frying-pan.html">

  <link rel="stylesheet"
        href="../css/style.css">

  {faq_schema}

</head>

<body>

<header class="site-header">
  <div class="container header-inner">
    <div class="site-logo">
      <a href="../index.html">
        <img src="../img/pic-header220-48pix.png"
             alt="日本製がいい！"
             class="header-logo">
      </a>
    </div>
  </div>
</header>

<main>
  <section class="products-section">

    <div class="container">

      <h1>日本製フライパン一覧</h1>

      <p>
        日本製フライパンは、耐久性や加工品質などで高く評価されています。
        鉄フライパン、IH対応、玉子焼き器など、
        Amazonで販売されている日本製調理器具を掲載しています。
      </p>

      <p>掲載件数：{len(matched)}件</p>

      <div class="products-grid">
        {cards_html}
      </div>
        {common_links}
      {maker_links}
    </div>

  </section>
</main>

</body>
</html>
"""

def build_feature_japanese_towels(products):
    cards = []

    matched = []

    for item in products:
        title = get_title(item)

        if not re.search(r"タオル|バスタオル|フェイスタオル", title):
            continue

        matched.append(item)

    for item in matched[:200]:
        asin = esc(item.get("asin", ""))
        title = esc(get_title(item))
        manufacturer = esc(item.get("manufacturer", ""))

        cards.append(f"""
        <article class="product-card">
          <div class="product-meta">

            <h2 class="product-title">
              <a href="../products/{asin}.html">
                {title}
              </a>
            </h2>

            {"<p class='product-brand'>" + manufacturer + "</p>" if manufacturer else ""}

            <div class="product-tags">
              <span class="tag tag-japan">日本製タオル</span>
              <span class="tag tag-japan">日本製・国産</span>
            </div>

          </div>
        </article>
        """)

    cards_html = "\n".join(cards)

    common_links = build_feature_common_links()
    maker_links = build_feature_maker_links(products, ["タオル", "バスタオル", "フェイスタオル"])

    faq_schema = f"""
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {{
      "@type": "Question",
      "name": "日本製タオルの特徴は？",
      "acceptedAnswer": {{
        "@type": "Answer",
        "text": "吸水性や肌触り、耐久性などが評価され、日本製タオルは日常使いとして人気があります。"
      }}
    }},
    {{
      "@type": "Question",
      "name": "どんな種類がありますか？",
      "acceptedAnswer": {{
        "@type": "Answer",
        "text": "バスタオル、フェイスタオル、ハンドタオルなどさまざまな種類があります。"
      }}
    }}
  ]
}}
</script>
"""

    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">

  <title>日本製タオル一覧 | 日本製がいい！</title>

  <meta name="description"
        content="Amazonで購入できる日本製タオルを掲載しています。バスタオル、フェイスタオルなど日本製タオルを探せます。">

  <meta name="viewport"
        content="width=device-width, initial-scale=1">

  <link rel="canonical"
        href="{SITE_URL}/feature/japanese-towels.html">

  <link rel="stylesheet"
        href="../css/style.css">

  {faq_schema}

</head>

<body>

<header class="site-header">
  <div class="container header-inner">
    <div class="site-logo">
      <a href="../index.html">
        <img src="../img/pic-header220-48pix.png"
             alt="日本製がいい！"
             class="header-logo">
      </a>
    </div>
  </div>
</header>

<main>
  <section class="products-section">

    <div class="container">

      <h1>日本製タオル一覧</h1>

      <p>
        日本製タオルは、吸水性や肌触り、耐久性などで高く評価されています。
        バスタオル、フェイスタオルなど、
        Amazonで販売されている日本製タオルを掲載しています。
      </p>

      <p>掲載件数：{len(matched)}件</p>

      <div class="products-grid">
        {cards_html}
      </div>
        {common_links}
      {maker_links}
    </div>

  </section>
</main>

</body>
</html>
"""

def build_feature_japanese_water_bottle(products):
    cards = []

    matched = []

    for item in products:
        title = get_title(item)

        if not re.search(r"水筒|ボトル|マグボトル|タンブラー", title):
            continue

        matched.append(item)

    for item in matched[:200]:
        asin = esc(item.get("asin", ""))
        title = esc(get_title(item))
        manufacturer = esc(item.get("manufacturer", ""))

        cards.append(f"""
        <article class="product-card">
          <div class="product-meta">

            <h2 class="product-title">
              <a href="../products/{asin}.html">
                {title}
              </a>
            </h2>

            {"<p class='product-brand'>" + manufacturer + "</p>" if manufacturer else ""}

            <div class="product-tags">
              <span class="tag tag-japan">日本製水筒</span>
              <span class="tag tag-japan">日本製・国産</span>
            </div>

          </div>
        </article>
        """)

    cards_html = "\n".join(cards)

    common_links = build_feature_common_links()
    maker_links = build_feature_maker_links(products, ["水筒", "ボトル", "マグボトル", "タンブラー"])

    faq_schema = f"""
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {{
      "@type": "Question",
      "name": "日本製水筒の特徴は？",
      "acceptedAnswer": {{
        "@type": "Answer",
        "text": "保温性や耐久性、加工品質などが評価され、日本製水筒は日常使いとして人気があります。"
      }}
    }},
    {{
      "@type": "Question",
      "name": "どんな種類がありますか？",
      "acceptedAnswer": {{
        "@type": "Answer",
        "text": "ステンレスボトル、マグボトル、タンブラーなどさまざまな種類があります。"
      }}
    }}
  ]
}}
</script>
"""

    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">

  <title>日本製水筒一覧 | 日本製がいい！</title>

  <meta name="description"
        content="Amazonで購入できる日本製水筒を掲載しています。ステンレスボトル、マグボトル、タンブラーなど日本製水筒を探せます。">

  <meta name="viewport"
        content="width=device-width, initial-scale=1">

  <link rel="canonical"
        href="{SITE_URL}/feature/japanese-water-bottle.html">

  <link rel="stylesheet"
        href="../css/style.css">

  {faq_schema}

</head>

<body>

<header class="site-header">
  <div class="container header-inner">
    <div class="site-logo">
      <a href="../index.html">
        <img src="../img/pic-header220-48pix.png"
             alt="日本製がいい！"
             class="header-logo">
      </a>
    </div>
  </div>
</header>

<main>
  <section class="products-section">

    <div class="container">

      <h1>日本製水筒一覧</h1>

      <p>
        日本製水筒は、保温性や耐久性などで高く評価されています。
        ステンレスボトル、マグボトル、タンブラーなど、
        Amazonで販売されている日本製水筒を掲載しています。
      </p>

      <p>掲載件数：{len(matched)}件</p>

      <div class="products-grid">
        {cards_html}
      </div>
        {common_links}
      {maker_links}
    </div>

  </section>
</main>

</body>
</html>
"""

def build_feature_japanese_bento_box(products):
    cards = []

    matched = []

    for item in products:
        title = get_title(item)

        if not re.search(r"弁当箱|ランチボックス|お弁当箱", title):
            continue

        matched.append(item)

    for item in matched[:200]:
        asin = esc(item.get("asin", ""))
        title = esc(get_title(item))
        manufacturer = esc(item.get("manufacturer", ""))

        cards.append(f"""
        <article class="product-card">
          <div class="product-meta">

            <h2 class="product-title">
              <a href="../products/{asin}.html">
                {title}
              </a>
            </h2>

            {"<p class='product-brand'>" + manufacturer + "</p>" if manufacturer else ""}

            <div class="product-tags">
              <span class="tag tag-japan">日本製弁当箱</span>
              <span class="tag tag-japan">日本製・国産</span>
            </div>

          </div>
        </article>
        """)

    cards_html = "\n".join(cards)

    common_links = build_feature_common_links()
    maker_links = build_feature_maker_links(products, ["弁当箱", "ランチボックス", "お弁当箱"])

    faq_schema = f"""
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {{
      "@type": "Question",
      "name": "日本製弁当箱の特徴は？",
      "acceptedAnswer": {{
        "@type": "Answer",
        "text": "耐久性や密閉性、加工品質などが評価され、日本製弁当箱は日常使いとして人気があります。"
      }}
    }},
    {{
      "@type": "Question",
      "name": "どんな種類がありますか？",
      "acceptedAnswer": {{
        "@type": "Answer",
        "text": "木製弁当箱、ステンレス弁当箱、ランチボックスなどさまざまな種類があります。"
      }}
    }}
  ]
}}
</script>
"""

    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">

  <title>日本製弁当箱一覧 | 日本製がいい！</title>

  <meta name="description"
        content="Amazonで購入できる日本製弁当箱を掲載しています。ランチボックス、木製弁当箱など日本製弁当箱を探せます。">

  <meta name="viewport"
        content="width=device-width, initial-scale=1">

  <link rel="canonical"
        href="{SITE_URL}/feature/japanese-bento-box.html">

  <link rel="stylesheet"
        href="../css/style.css">

  {faq_schema}

</head>

<body>

<header class="site-header">
  <div class="container header-inner">
    <div class="site-logo">
      <a href="../index.html">
        <img src="../img/pic-header220-48pix.png"
             alt="日本製がいい！"
             class="header-logo">
      </a>
    </div>
  </div>
</header>

<main>
  <section class="products-section">

    <div class="container">

      <h1>日本製弁当箱一覧</h1>

      <p>
        日本製弁当箱は、密閉性や耐久性などで高く評価されています。
        ランチボックス、木製弁当箱など、
        Amazonで販売されている日本製弁当箱を掲載しています。
      </p>

      <p>掲載件数：{len(matched)}件</p>

      <div class="products-grid">
        {cards_html}
      </div>
        {common_links}
      {maker_links}
    </div>

  </section>
</main>

</body>
</html>
"""

def build_feature_japanese_storage_container(products):
    cards = []
    matched = []

    for item in products:
        title = get_title(item)
        if not re.search(r"保存容器|密閉容器|容器|タッパー|キャニスター", title):
            continue
        matched.append(item)

    for item in matched[:200]:
        asin = esc(item.get("asin", ""))
        title = esc(get_title(item))
        manufacturer = esc(item.get("manufacturer", ""))

        cards.append(f"""
        <article class="product-card">
          <div class="product-meta">
            <h2 class="product-title">
              <a href="../products/{asin}.html">{title}</a>
            </h2>
            {"<p class='product-brand'>" + manufacturer + "</p>" if manufacturer else ""}
            <div class="product-tags">
              <span class="tag tag-japan">日本製保存容器</span>
              <span class="tag tag-japan">日本製・国産</span>
            </div>
          </div>
        </article>
        """)

    cards_html = "\n".join(cards)

    common_links = build_feature_common_links()
    maker_links = build_feature_maker_links(products, ["保存容器", "密閉容器", "容器", "タッパー", "キャニスター"])

    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>日本製保存容器一覧 | 日本製がいい！</title>
  <meta name="description" content="Amazonで購入できる日本製保存容器を掲載しています。密閉容器、食品保存容器、キャニスターなどを探せます。">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="canonical" href="{SITE_URL}/feature/japanese-storage-container.html">
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
  </div>
</header>

<main>
  <section class="products-section">
    <div class="container">
      <h1>日本製保存容器一覧</h1>
      <p>
        日本製保存容器は、密閉性や耐久性、使いやすさで選ばれています。
        Amazonで販売されている日本製の保存容器・密閉容器を掲載しています。
      </p>
      <p>掲載件数：{len(matched)}件</p>
      <div class="products-grid">
        {cards_html}
      </div>
      {common_links}
      {maker_links}
    </div>
  </section>
</main>
</body>
</html>
"""

def build_feature_japanese_cutting_board(products):
    cards = []
    matched = []

    for item in products:
        title = get_title(item)
        if not re.search(r"まな板|俎板|カッティングボード", title):
            continue
        matched.append(item)

    for item in matched[:200]:
        asin = esc(item.get("asin", ""))
        title = esc(get_title(item))
        manufacturer = esc(item.get("manufacturer", ""))

        cards.append(f"""
        <article class="product-card">
          <div class="product-meta">
            <h2 class="product-title">
              <a href="../products/{asin}.html">{title}</a>
            </h2>
            {"<p class='product-brand'>" + manufacturer + "</p>" if manufacturer else ""}
            <div class="product-tags">
              <span class="tag tag-japan">日本製まな板</span>
              <span class="tag tag-japan">日本製・国産</span>
            </div>
          </div>
        </article>
        """)

    cards_html = "\n".join(cards)

    common_links = build_feature_common_links()
    maker_links = build_feature_maker_links(products, ["まな板", "俎板", "カッティングボード"])

    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>日本製まな板一覧 | 日本製がいい！</title>
  <meta name="description" content="Amazonで購入できる日本製まな板を掲載しています。木製まな板、抗菌まな板、カッティングボードなどを探せます。">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="canonical" href="{SITE_URL}/feature/japanese-cutting-board.html">
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
  </div>
</header>

<main>
  <section class="products-section">
    <div class="container">
      <h1>日本製まな板一覧</h1>
      <p>
        日本製まな板は、素材の品質や加工精度、使いやすさで選ばれています。
        Amazonで販売されている日本製まな板・カッティングボードを掲載しています。
      </p>
      <p>掲載件数：{len(matched)}件</p>
      <div class="products-grid">
        {cards_html}
      </div>
      {common_links}
      {maker_links}
    </div>
  </section>
</main>
</body>
</html>
"""

def build_feature_japanese_pot(products):
    cards = []
    matched = []

    for item in products:
        title = get_title(item)
        if not re.search(r"鍋|片手鍋|両手鍋|雪平鍋|土鍋|天ぷら鍋", title):
            continue
        matched.append(item)

    for item in matched[:200]:
        asin = esc(item.get("asin", ""))
        title = esc(get_title(item))
        manufacturer = esc(item.get("manufacturer", ""))

        cards.append(f"""
        <article class="product-card">
          <div class="product-meta">
            <h2 class="product-title">
              <a href="../products/{asin}.html">{title}</a>
            </h2>
            {"<p class='product-brand'>" + manufacturer + "</p>" if manufacturer else ""}
            <div class="product-tags">
              <span class="tag tag-japan">日本製鍋</span>
              <span class="tag tag-japan">日本製・国産</span>
            </div>
          </div>
        </article>
        """)

    cards_html = "\n".join(cards)

    common_links = build_feature_common_links()
    maker_links = build_feature_maker_links(products, ["鍋", "片手鍋", "両手鍋", "雪平鍋", "土鍋", "天ぷら鍋"])

    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>日本製鍋一覧 | 日本製がいい！</title>
  <meta name="description" content="Amazonで購入できる日本製鍋を掲載しています。片手鍋、両手鍋、雪平鍋、土鍋などを探せます。">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="canonical" href="{SITE_URL}/feature/japanese-pot.html">
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
  </div>
</header>

<main>
  <section class="products-section">
    <div class="container">
      <h1>日本製鍋一覧</h1>
      <p>
        日本製鍋は、熱伝導や耐久性、加工品質で選ばれています。
        Amazonで販売されている日本製の片手鍋・両手鍋・雪平鍋・土鍋などを掲載しています。
      </p>
      <p>掲載件数：{len(matched)}件</p>
      <div class="products-grid">
        {cards_html}
      </div>
      {common_links}
      {maker_links}
    </div>
  </section>
</main>
</body>
</html>
"""

def build_feature_japanese_chopsticks(products):
    cards = []
    matched = []

    for item in products:
        title = get_title(item)
        if not re.search(r"箸|お箸|はし|菜箸", title):
            continue
        matched.append(item)

    for item in matched[:200]:
        asin = esc(item.get("asin", ""))
        title = esc(get_title(item))
        manufacturer = esc(item.get("manufacturer", ""))

        cards.append(f"""
        <article class="product-card">
          <div class="product-meta">
            <h2 class="product-title">
              <a href="../products/{asin}.html">{title}</a>
            </h2>
            {"<p class='product-brand'>" + manufacturer + "</p>" if manufacturer else ""}
            <div class="product-tags">
              <span class="tag tag-japan">日本製箸</span>
              <span class="tag tag-japan">日本製・国産</span>
            </div>
          </div>
        </article>
        """)

    cards_html = "\n".join(cards)

    common_links = build_feature_common_links()
    maker_links = build_feature_maker_links(products, ["箸", "お箸", "はし", "菜箸"])

    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>日本製箸一覧 | 日本製がいい！</title>
  <meta name="description" content="Amazonで購入できる日本製箸を掲載しています。お箸、菜箸、箸セットなどを探せます。">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="canonical" href="{SITE_URL}/feature/japanese-chopsticks.html">
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
  </div>
</header>

<main>
  <section class="products-section">
    <div class="container">
      <h1>日本製箸一覧</h1>
      <p>
        日本製箸は、素材や塗装、持ちやすさなどで選ばれています。
        Amazonで販売されている日本製のお箸・菜箸・箸セットを掲載しています。
      </p>
      <p>掲載件数：{len(matched)}件</p>
      <div class="products-grid">
        {cards_html}
      </div>
      {common_links}
      {maker_links}
    </div>
  </section>
</main>
</body>
</html>
"""

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
    
    
    for feature in FEATURE_DEFINITIONS:
        urls.append(f"""  <url>
    <loc>{SITE_URL}/feature/{esc(feature['slug'])}.html</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.95</priority>
  </url>""")

    urls.append(f"""    <url>
    <loc>{SITE_URL}/feature/index.html</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    </url>""")

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
    
    used_makers = {}

    for item in products:
        maker = str(item.get("manufacturer", "")).strip()
        if not maker:
            continue

        maker = normalize_maker_name(maker)
        slug = slugify_maker(maker)

        if slug in {"unknown", "generic"}:
            continue

        used_makers.setdefault(maker, 0)
        used_makers[maker] += 1

    for maker_name, count in used_makers.items():
        if count < 5:
            continue

        maker_name = normalize_maker_name(maker_name)
        slug = slugify_maker(maker_name)

        if slug in {"unknown", "generic"}:
            continue

        urls.append(f"""  <url>
    <loc>{SITE_URL}/maker/{esc(slug)}.html</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
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

    deduped_urls = []
    seen_locs = set()

    for block in urls:
        m = re.search(r"<loc>(.*?)</loc>", block)
        loc = m.group(1) if m else block

        if loc in seen_locs:
            continue

        seen_locs.add(loc)
        deduped_urls.append(block)

    xml = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
""" + "\n".join(deduped_urls) + """
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
    maker_count = write_maker_pages(products)
    feature_count = write_feature_pages(products)

    write_sitemap(products)
    write_robots()

    print(f"products loaded: {len(products)}")
    print(f"product pages written: {page_count}")
    print(f"category pages written: {category_count}")
    print(f"maker pages written: {maker_count}")
    print(f"feature pages written: {feature_count}")
    print(f"sitemap written: {SITEMAP_XML}")
    print(f"robots written: {ROBOTS_TXT}")


if __name__ == "__main__":
    main()