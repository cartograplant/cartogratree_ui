<?php

/*
 * Implements template_preprocess_page().
 */
function cartogratree_preprocess_page(&$variables) {
    if (current_path() == 'cartogratree' || current_path() == 'cartograplant') {
		drupal_add_css('https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,700', 'external');
		drupal_add_css('https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css', 'external');
		drupal_add_js('https://code.jquery.com/jquery-3.1.1.min.js', 'external');
		drupal_add_js('https://api.tiles.mapbox.com/mapbox-gl-js/v0.49.0/mapbox-gl.js', 'external');
		drupal_add_css('https://api.tiles.mapbox.com/mapbox-gl-js/v0.49.0/mapbox-gl.css', 'external'); 
		drupal_add_js('https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v2.0.1/mapbox-gl-geocoder.js', 'external');
		drupal_add_css('https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v2.0.1/mapbox-gl-geocoder.css', 'external');
		drupal_add_js('https://npmcdn.com/@turf/turf/turf.min.js', 'external');
		
		$records = db_query('
			SELECT *
			FROM {chado.ct_view}
			LIMIT 1');
		$trees = array();
		
		foreach($records as $record){
			//$result[$record->uniquename] = array();
			$trees[$record->uniquename]['genus'] = $record->genus;
			$trees[$record->uniquename]['species'] = $record->species;
			$trees[$record->uniquename]['subgroup'] = $record->subkingdom;
			$trees[$record->uniquename]['family'] = $record->family;
		}
		
		$settings = array(
			'trees' => $trees,
		);
		
		drupal_add_js($settings, 'setting');	
		drupal_add_js(drupal_get_path('module', 'cartogratree') . '/cartogratree_mb.js');
        drupal_add_css(drupal_get_path('module', 'cartogratree') . '/main.css');
		drupal_add_css(drupal_get_path('module', 'cartogratree') . '/mobile.css');
        drupal_add_css(drupal_get_path('module', 'cartogratree') . '/toggle_btn.css');
    }
}
