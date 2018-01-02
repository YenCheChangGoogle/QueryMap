# QueryMap

提供google map, openlayer地圖查詢後端資料庫的互動性操作，並且將查詢結果以Marker顯示於地圖上。

含有以下功能：
* 連結地圖的click事件，標記click的位置，在送出查詢時，將該點的經緯度資料送出，進行後端資料查詢
* 連結地圖的繪製矩形功能，在送出查詢時，將矩形的對角線2個點的經緯度資料送出，進行後端資料查詢
* 使用PHP的PDO套件進行資料庫的查詢，自動將SQL敘述中的變數以查詢的資料進行查詢。

## Requirements

* 若使用google map作為地圖服務，需在引入套件的js之前，引入[Google Maps API](https://developers.google.com/maps/)。
* 若使用openlayer作為地圖服務，需在引入套件的js之前，引入[Openlayers](https://openlayers.org/)
* 需要[JQuery](https://jquery.com/)套件

## Installation

### Google Maps

```html
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>
<script src="https://maps.googleapis.com/maps/api/js?key=[API KEY]&libraries=drawing,geometry&sensor=false"></script>
<script src="gtag.js"></script>
```

### Openlayers

```html
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>
<script src="https://openlayers.org/en/v4.6.4/build/ol.js"></script>
<script src="otag.js"></script>
```

## Usage

### Initialize

初始化GTag或OTag物件，需要的變數包括：

* map為Google Maps API或Openlayers的一個物件；
* queryForm為用來查詢的HTML的Form元件；

example：

```js
var tagmap = new OTag(map, queryForm); // 
```

### Option activation

引發標記地圖點位置或繪製矩形功能，需要的變數option為模式值，為字串型式，分別為：
* 'around'：標記地圖點位置
* 'region'：繪製矩形位置

