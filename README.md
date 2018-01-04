# QueryMap

提供「網際網路空間資訊系統」使用google map, openlayer地圖查詢後端資料庫的互動性操作，並且將查詢結果以Marker顯示於地圖上。

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
* queryForm為用來查詢的HTML的Form元件，欄位名稱不可為lat1、lon1、lat2、lon2，因為地圖標示的位置，將以這4個參數名稱傳送值進行查詢；

example：
```js
var tagmap = new OTag(map, queryForm); // 
```

### Option activation

引發標記地圖點位置或繪製矩形功能，需要的變數option為模式值，為字串型式，分別為：
* 'around'：標記地圖點位置
* 'region'：繪製矩形位置

example：
```js
tagmap.initOption('around');
```

### Main methods

* delAllMarkers()：刪除所有顯示的標記

example：
```js
tagmap.delAllMarkers();
```
* panToCc()：移動與放大地圖至預設位置

example：
```js
tagmap.panToCc();
```

### Experimental methods
此方法為實驗性方法，引入Google Maps的規劃路徑功能，將查詢的結果，透過此功能設置篩選設施實際到點位的行車距離限制，此功能目前有很多限制，結果不一定正確。

* tagmap.setDrivingLimit(distanceInKm)：設置行車距離限制，變數為距離，單位為公里，Null則為不限制行車距離。

example：
```js
tagmap.setDrivingLimit('2');
```

### Database configuration
* 設定資料庫連線資訊
```php
$dbhost = '[host]';              // 資料庫位址
$dbuser = '[username]';          // 資料庫帳號
$dbpass = '[password]';          // 資料庫密碼
$dbname = '[dbname]';            // 資料庫名稱
```
* 設定查詢字串：$sql_dock['key'] = '[sql statement]';
** key為查詢參數option的值；
** sql statement為SQL敘述，其中查詢參數需以冒號為前置字元，例如:lat1；
example：
```php
$sql_dock['all'] = 'select * from tags where type=:data';
```

### Form fields
* 欄位名稱option為套件預設使用的SQL敘述為那一個，表單欄位需包含此欄位，若需更改，請連同更改querydata.php對應之參數名稱
* 以下欄位名稱為套件預設使用之參數，請避免於表單使用
** lat1：點座標或矩形左下角之緯度資料
** lon1：點座標或矩形左下角之經度資料
** lat2：點座標或矩形右上角之緯度資料
** lon2：點座標或矩形右上角之經度資料
* 表單記得加action屬性，指向querydata.php (檔名若有修改，記得這邊也要對應修改)，例：
```html
<form id="queryform" action="querydata.php">
  <select name="option">
    <option value="all>查詢全部</option>
  </select>
  <input type="hidden" name="data" value="SHT" />
</form>
```
