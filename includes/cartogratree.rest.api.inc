<?php
/**
 * Submit a new layer to the cartogratree_layers table.
 *
 * This function handles the submission of a new layer to the cartogratree_layers table in the database.
 * It expects a POST request with the necessary layer data. The function validates the input data,
 * inserts it into the database, and returns a JSON response indicating success or failure.
 *
 * @return void
 *   Outputs a JSON response indicating the result of the layer submission.
 */
function cartogratree_rest_api_layer_submit() {
  $rest_api_token = variable_get('cartogratree_admin_rest_api_token');
  if (!isset($_REQUEST['t']) || $_REQUEST['t'] !== $rest_api_token) {
    drupal_json_output([
      'status' => 'error',
      'message' => 'Invalid or missing REST API token. Access denied.'
    ]);
    return;
  }
  unset($_REQUEST['t']);
  unset($_REQUEST['q']);
  unset($_REQUEST['filename']);
  unset($_REQUEST['nocache']);
  // print_r($_REQUEST);

  $db_table_columns = [
    'title','name', 'url', 'group_id', 'subgroup_id', 'layer_rank', 'trees_layer', 'layer_type',
    'layer_host', 'layer_styles', 'layer_legend_html',
    'layer_allow_user_select_colors', 'layer_year_range_filter_option', 'layer_year_range_filter_geoserver_parameter',
    'layer_year_range_filter_year_start', 'layer_year_range_filter_year_end',
    'layer_embedded_data_decimal_precision', 'layer_embedded_fields_hide', 'layer_embedded_fields_rename',
    'layer_embedded_data_eval', 'analysis_category_id',
    'layer_legend_orientation', 'layer_legend_hide_default',
    'layer_multilayer_rangeslider_year_option', 'layer_multilayer_rangeslider_start_year', 'layer_multilayer_rangeslider_end_year',
    'layer_file_location', 'layer_legend_image'
  ];

  $column_data = [];
  foreach ($db_table_columns as $column_name) {
    if (isset($_REQUEST[$column_name])) {
      $column_data[$column_name] = $_REQUEST[$column_name];
    }
  }

  $output_results = [];
  $column_names = implode(', ', array_keys($column_data));
  $column_values = [];
  $column_count = 0;
  foreach ($column_data as $key => $value) {
    $column_count++;
    $column_values[':value' . $column_count] = $value;
  }

  $sql = 'INSERT INTO cartogratree_layers (';
  foreach ($column_data as $column_name => $value) {
    $sql .= $column_name . ', ';
  }
  $sql = rtrim($sql, ', ');

  $sql .= ') VALUES (';
  foreach ($column_values as $placeholder => $value) {
    $sql .= $placeholder . ', ';
  }
  $sql = rtrim($sql, ', ') . ')';
  // print_r($sql);

  $args = [];

  foreach ($column_values as $placeholder => $value) {
    $args[$placeholder] = $value;
  }
  // print_r($args);

  // chado_query($sql, $args);
  // $output_results = [
  //   'status' => 'success', 
  //   'message' => 'Layer submitted successfully.'
  // ];

  try {
    chado_query($sql, $args);
    $output_results = [
      'status' => 'success', 
      'message' => 'Layer submitted successfully.'
    ];
  }
  catch (Exception $e) {
    $output_results = [
      'status' => 'error', 
      'message' => 'An error occurred while submitting the layer. Please try again later.',
      'error_message' => $e->getMessage()
    ];
    //watchdog('cartogratree', 'Error inserting layer: @message', ['@message' => $e->getMessage()], WATCHDOG_ERROR);
    //drupal_set_message(t('An error occurred while submitting the layer. Please try again later.'), 'error');
  }

  $output_results['sql'] = $sql;
  $output_results['args'] = $args;
  drupal_json_output($output_results);

}

function cartogratree_rest_api_layer_update() {
  $rest_api_token = variable_get('cartogratree_admin_rest_api_token');
  if (!isset($_REQUEST['t']) || $_REQUEST['t'] !== $rest_api_token) {
    drupal_json_output([
      'status' => 'error',
      'message' => 'Invalid or missing REST API token. Access denied.'
    ]);
    return;
  }
  unset($_REQUEST['t']);
  unset($_REQUEST['q']);
  unset($_REQUEST['filename']);
  unset($_REQUEST['nocache']);

  if (!isset($_REQUEST['name'])) {
    drupal_json_output(['error' => 'Missing name parameter']);
    return;
  }
  $machine_name = $_REQUEST['name'];
  unset($_REQUEST['name']);

  $db_table_columns = [
    'title','url', 'group_id', 'subgroup_id', 'layer_rank', 'trees_layer', 'layer_type',
    'layer_host', 'layer_styles', 'layer_legend_html',
    'layer_allow_user_select_colors', 'layer_year_range_filter_option', 'layer_year_range_filter_geoserver_parameter',
    'layer_year_range_filter_year_start', 'layer_year_range_filter_year_end',
    'layer_embedded_data_decimal_precision', 'layer_embedded_fields_hide', 'layer_embedded_fields_rename',
    'layer_embedded_data_eval', 'analysis_category_id',
    'layer_legend_orientation', 'layer_legend_hide_default',
    'layer_multilayer_rangeslider_year_option', 'layer_multilayer_rangeslider_start_year', 'layer_multilayer_rangeslider_end_year',
    'layer_file_location', 'layer_legend_image'
  ];

  $column_data = [];
  foreach ($db_table_columns as $column_name) {
    if (isset($_REQUEST[$column_name])) {
      $column_data[$column_name] = $_REQUEST[$column_name];
    }
  }

  $output_results = [];
  $set_clauses = [];
  $args = [':name' => $machine_name];
  foreach ($column_data as $key => $value) {
    $set_clauses[] = "$key = :$key";
    $args[":$key"] = $value;
  }

  if (empty($set_clauses)) {
    drupal_json_output(['error' => 'No valid columns provided for update']);
    return;
  }

  $sql = "UPDATE cartogratree_layers SET " . implode(', ', $set_clauses) . " WHERE name = :name";
  try {
    chado_query($sql, $args);
    $output_results = [
      'status' => 'success', 
      'message' => 'Layer updated successfully.'
    ];
  }
  catch (Exception $e) {
    $output_results = [
      'status' => 'error', 
      'message' => 'An error occurred while updating the layer. Please try again later.',
      'error_message' => $e->getMessage()
    ];
  }

  $output_results['sql'] = $sql;
  $output_results['args'] = $args;
  drupal_json_output($output_results);
}

/**
 * Check if a layer with the given name exists in the cartogratree_layers table.
 * @param string $layer_name
 *   The name of the layer to check for existence.
 * @return void
 *   Outputs a JSON response indicating whether the layer exists (true) or not (false).
 */
function cartogratree_rest_api_layer_exists() {
  $rest_api_token = variable_get('cartogratree_admin_rest_api_token');
  if (!isset($_REQUEST['t']) || $_REQUEST['t'] !== $rest_api_token) {
    drupal_json_output([
      'status' => 'error',
      'message' => 'Invalid or missing REST API token. Access denied.'
    ]);
    return;
  }

  if (!isset($_GET['name'])) {
    drupal_json_output(['error' => 'Missing name parameter']);
    return;
  }
  $machine_name = $_GET['name'];
  $result = chado_query('SELECT COUNT(*) AS count FROM cartogratree_layers WHERE name = :name', [':name' => $machine_name]);
  $count = 0;
  foreach ($result as $row) {
    $count = $row->count;
  }
  $output_results = false;
  if ($count > 0) {
    $output_results = true;
  }
  drupal_json_output($output_results);
}
?>