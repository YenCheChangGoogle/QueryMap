<?php
$dbhost = '[host]';              // 資料庫位址
$dbuser = '[username]';          // 資料庫帳號
$dbpass = '[password]';          // 資料庫密碼
$dbname = '[dbname]';            // 資料庫名稱

/**
 * define the query option and its sql statements
 * $sql_dock[[key]] = [sqlstatement]
 * query fields should be denoted by a preceding colon[:]
 * example:
 *      $sql_dock['all'] = <<<EOT
 *      select id, name, lat, lon, address
 *      from tags
 *      where type = :data;'
 *      EOT;
 */
$sql_dock['key'] = '[sql statement]';
