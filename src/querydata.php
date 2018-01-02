<?php
require_once('db_config.php');
$option = $_REQUEST['option'];
$sql = $sql_dock[$option];

preg_match_all("/:([a-zA-Z0-9_]+)/", $sql, $matches);

$params = array();

$keys = $matches[1];

$message = '';
foreach ($keys as $key) {
    if (isset($_REQUEST[$key])) {
        if (!isset($params[$key])) {
            $params[$key] = $_REQUEST[$key];
        }
    } else {
        $message = 'Parameters might be lost!';
        break;
    }
}

if ($message === '') {
    try {
        $db = new PDO("mysql:host=$dbhost;dbname=$dbname",
                      $dbuser,
                      $dbpass,
                      array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8")
            );
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $stmt = $db->prepare($sql);
        foreach ($params as $key=>$value) {
            $stmt->bindValue($key, $value, PDO::PARAM_STR);
        }
        $stmt->execute();
        $data = $stmt->fetchAll();

    } catch (PDOException $e) {
        $message = $e->getMessage();
    }
}

if (isset($data)) {
    if (empty($data)) {
        $message = '沒有符合的資料';
    }
}

if ($message !== '') {
    echo json_encode(array('message'=>$message));
} else {
    echo json_encode($data);
}