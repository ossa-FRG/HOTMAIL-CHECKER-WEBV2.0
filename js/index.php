<?php
header('Content-Type: application/json; charset=utf-8');
$res['data']['code']   = 403;
$res['data']['status'] = 'forbidden';
$res['data']['msg']    = 'access denied!';
$res['telegram']       = 't.me/zlaxtert';
$res['API_from']       = 'www.darkxcode.site';
$res['author']         = 'ZLAXTERT';
echo json_encode($res);
exit();