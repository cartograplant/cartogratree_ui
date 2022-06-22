<?php

/**
 * Implements hook_drush_command().
 */
function cartogratree_drush_command() {

  $items['cartogratree-drush-command'] = array(
    'description' => 'Demonstrate how Drush commands work.',
    'aliases' => array('ct'),
	'arguments' => array(
	  'subcommand' => 'This is the subcommand',
	),	
  );

  return $items;
}

/**
 * Callback for the drush-demo-command command
 */
function drush_cartogratree_drush_command($subcommand) {
	switch ($subcommand) {
		case 'test':
			drupal_set_message(t('Hello world!'));
			break;
		case 'help':
			drupal_set_message(t('Subcommands: test, help, generate_distinct_marker_types, generate_supported_trees_on_marker_types'));
			break;
		case 'generate_distinct_marker_types':
			$time_start = microtime();
			drupal_set_message(t('Creating Materialized View chado.genotype_marker_types'));
			db_query('CREATE MATERIALIZED VIEW IF NOT EXISTS chado.genotype_marker_types AS SELECT distinct(marker_type) FROM chado.geno_view;');
			db_query('REFRESH MATERIALIZED VIEW chado.genotype_marker_types');
			$time_end = microtime();
			drupal_set_message(t('Materalized View Regenerated in ' . ($time_end - $time_start) . ' ms'));
			break;
		case 'generate_supported_trees_on_marker_types': 
			
			db_query("DROP TABLE IF EXISTS chado.geno_view_supported_trees");
			db_query("CREATE TABLE IF NOT EXISTS chado.geno_view_supported_trees AS SELECT *, '-'::text as marker_type FROM (SELECT tree_acc FROM chado.geno_view WHERE marker_type LIKE '' INTERSECT SELECT uniquename FROM chado.ct_view) AS TABLE1");
			db_query("CREATE INDEX gvst_marker_type ON chado.geno_view_supported_trees (marker_type);");
			//First get unique marker_types
			$results_markertypes = db_query('SELECT marker_type FROM chado.genotype_marker_types');
			foreach($results_markertypes as $markertypes_row) {
				//Go through each marker type
				$marker_type = $markertypes_row->marker_type;
				drupal_set_message(t('Marker Type:' . $marker_type));
				$time_start = microtime();
				drupal_set_message(t("Generating supported trees for $marker_type and inserting it into geno_view_supported_trees table"));
				//$results_insert = db_query("INSERT INTO chado.geno_view_distinct_trees select distinct(tree_acc), uniquename, description, marker_type, study_type FROM chado.geno_view WHERE marker_type LIKE '$marker_type';");
				$results_insert = db_query("INSERT INTO chado.geno_view_supported_trees SELECT *, '$marker_type' as marker_type FROM (SELECT tree_acc FROM chado.geno_view WHERE marker_type LIKE '$marker_type' INTERSECT SELECT uniquename FROM chado.ct_view) AS TABLE1");
				drupal_set_message(t("Time to generate records for $marker_type: " . ($time_end - $time_start) . ' ms'));
				$time_end = microtime();
			}
			
			break;
		default:
			drupal_set_message(t('You need to specify a valid subcommand: help'));
			break;
	}
}

?>
