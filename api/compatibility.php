<?php
// compatibility.php — логика проверки совместимости товаров
function check_compatibility($products, $pdo) {
    if (count($products) < 2) return true;
    $query = "SELECT * FROM products WHERE id IN (" . implode(",", array_fill(0, count($products), '?')) . ")";
    $stmt = $pdo->prepare($query);
    $stmt->execute($products);
    $items = $stmt->fetchAll();
    $issues = [];
    for ($i = 0; $i < count($items); $i++) {
        for ($j = $i + 1; $j < count($items); $j++) {
            $a = $items[$i];
            $b = $items[$j];
            if ($a['storage_temp'] != $b['storage_temp'] || $a['storage_humidity'] != $b['storage_humidity']) {
                $issues[] = "Несовместимы условия хранения между '{$a['name']}' и '{$b['name']}'";
            }
            if ($a['shelf_life'] != $b['shelf_life'] || $a['seasonality'] != $b['seasonality']) {
                $issues[] = "Несовместимы сроки годности/сезонность между '{$a['name']}' и '{$b['name']}'";
            }
            if ($a['packaging'] != $b['packaging']) {
                $issues[] = "Несовместимы типы упаковки между '{$a['name']}' и '{$b['name']}'";
            }
            if ($a['special_care'] != $b['special_care']) {
                $issues[] = "Особые условия хранения различаются между '{$a['name']}' и '{$b['name']}'";
            }
        }
    }
    return $issues ?: true;
}
?>
