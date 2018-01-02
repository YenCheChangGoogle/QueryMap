# QueryMap

提供google map, openlayer地圖查詢後端資料庫的互動性操作，並且將查詢結果以Marker顯示於地圖上。

含有以下功能：
* 連結地圖的click事件，標記click的位置，在送出查詢時，將該點的經緯度資料送出，進行後端資料查詢
* 連結地圖的繪製矩形功能，在送出查詢時，將矩形的對角線2個點的經緯度資料送出，進行後端資料查詢
* 使用PHP的PDO套件進行資料庫的查詢，自動將SQL敘述中的變數以查詢的資料進行查詢。

### Requirements

* 若使用google map作為地圖服務，需在引入套件的js之前，引入[Google Maps API](https://developers.google.com/maps/)。
* 若使用openlayer作為地圖服務，需在引入套件的js之前，引入[Openlayers](https://openlayers.org/)
* 需要[JQuery](https://jquery.com/)套件
