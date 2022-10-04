<?php

function ct_save_user_config(){
	$map_state = json_decode($_POST['data'], true);
	$current_date = date('Y-m-d H:i:s');
	$title = $map_state['title'];
	$user_id = $map_state['user_id'];
	$comments = $map_state['comments'];
	$layers = json_encode($map_state['layers']);
	$filters = json_encode($map_state['filters']);

	if(db_select('ct_saved_config', 'c')->fields('c')
		->condition('title', $title, '=')
		->condition('user_id', $user_id, '=')
		->execute()->rowCount() == 0){
			db_insert('ct_saved_config')->fields(
				array(
	  				'user_id' => $user_id,
	  				'title' => $title,
					'comments' => $comments,
					'updated_at' => $current_date,
					'selected_layers' => $layers,
					'selected_filters' => $filters,
					'zoom' => $map_state['user_data']['zoom'],
					'pitch' => $map_state['user_data']['pitch'],
					'bearing' => $map_state['user_data']['bearing'],
					'center' => json_encode($map_state['user_data']['center']),
					'excluded_trees' => json_encode($map_state['user_data']['excluded_trees']),
					'datasets' => json_encode($map_state['user_data']['tree_datasets']),
				)
			)->execute();
		}
	else{
		db_update('ct_saved_config')->fields(
			array( 
				'comments' => $comments,
				'updated_at' => $current_date,
				'selected_layers' => $layers,
				'selected_filters' => $filters,
				'zoom' => $map_state['user_data']['zoom'],
				'pitch' => $map_state['user_data']['pitch'],
				'bearing' => $map_state['user_data']['bearing'],
				'center' => json_encode($map_state['user_data']),
				'excluded_trees' => json_encode($map_state['user_data']['excluded_trees']),
				'datasets' => json_encode($map_state['user_data']['tree_datasets']),
			)
		)
		->condition('user_id', $user_id, '=')
		->condition('title', $title, '=')
		->execute();
	}
//	drupal_json_output($map_state['user_data']);
	drupal_json_output('Config for ' . $user_id . ' saved.');
}

function ct_delete_user_config(){
	$user_data = json_decode($_POST['data'], true);
	$user_id = $user_data['user'];
	$title = $user_data['title'];

	$deleted = db_delete('ct_saved_config')
		->condition('user_id', $user_id, '=')
		->condition('title', $title, '=')
		->execute();
	drupal_json_output('Config for ' . $user_id . ' deleted. o: ' . $deleted);
}

function ct_get_user_config_hist(){
	global $user;
	$config_records = db_select('ct_saved_config', 'c')->fields('c')
		->condition('user_id', $user->mail, '=')
		->orderBy('created_at', 'DESC')
		->execute();
	$saved_config = array();
	foreach($config_records as $idx=>$config){
		$date_created = new DateTime($config->created_at);
		$date_updated = new DateTime($config->updated_at);
		$saved_config['user_history'][$idx] = array(
			'created_at' => $date_created->format('Y-m-d H:i:s'),
			'updated_at' => $date_updated->format('Y-m-d H:i:s'),
			'title' => $config->title,
			'comments' => $config->comments, 
			'layers' => json_decode($config->selected_layers, true),
			'filters' => json_decode($config->selected_filters, true),
			'zoom' => $config->zoom,
			'pitch' => $config->pitch,
			'bearing' => $config->bearing,
			'center' => json_decode($config->center, true),
			'excluded_trees' => json_decode($config->excluded_trees, true),
			'datasets' => json_decode($config->datasets, true),
		); 
	}
	drupal_json_output($saved_config);
}

?>
