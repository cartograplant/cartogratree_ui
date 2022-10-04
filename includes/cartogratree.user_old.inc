<?php

/* 
 * @file
 * User pages for this module.
 */

/**
 * Prepare data collection to upload to Galaxy.
 * URL suffix: ?q=cartogratree_data_collection
 */
function cartogratree_data_collection_form($form, &$form_state) {
    // Grab the user id of the current user.
    global $user;
    $uid = $user->uid;
    $rids = is_array($user->roles) ? array_keys($user->roles) : array();

    $http_referer_path = explode('/', parse_url($_SERVER['HTTP_REFERER'], PHP_URL_PATH));
    $request_uri = explode('/', $_SERVER['REQUEST_URI']);
    $session_id = '';
    // if origin is cartogratree page on this server then write session details to database
    if (isset($_SERVER['HTTP_ORIGIN']) && parse_url($_SERVER['HTTP_ORIGIN'], PHP_URL_HOST) == $_SERVER['HTTP_HOST'] && $http_referer_path[count($request_uri) - 1] == 'cartogratree') {
    	parse_str(parse_url($_SERVER['HTTP_REFERER'], PHP_URL_QUERY), $query_string);
    	$session_id = $query_string['session_id'];
        
        // write session details to database
        $record = array(
        	'session_id' => $session_id,
        	'operation_type' => 2,    // write
        	'operation_timestamp' => date('Y-m-d H:i:s'),
        	'remote_addr' => $_SERVER['REMOTE_ADDR'],
        	'http_user_agent' => $_SERVER['HTTP_USER_AGENT'],
        	'uid' => $uid,
        	'rid' => implode(',', $rids),
        );
        drupal_write_record('cartogratree_sessions', $record);
        // get latest ID for this session
        $records = db_query('
			SELECT id FROM {cartogratree_sessions} WHERE session_id=:session_id AND operation_type = 2 ORDER BY id', 
			array(':session_id' => $session_id)
		);

        $id = '';
        foreach ($records as $r) {
            $id = $r->id;
        }

        $cartogratree_session = json_decode($_POST['cartogratree_session'], true);
        foreach ($cartogratree_session['layers'] as $layer_id => $layer) {
            $record = array(
            	'id' => $id,
            	'layer_id' => $layer_id,
            );
            drupal_write_record('cartogratree_session_layers', $record);
            foreach ($layer['fields'] as $field_id => $field) {
                foreach ($field['values'] as $val => $dmy) {
                    $record = array(
                    	'id' => $id,
                    	'layer_id' => $layer_id,
                    	'filter_id' => $field_id,
                    	'field_value' => $val,
                    );
                    drupal_write_record('cartogratree_session_filters', $record);
                }
            }
        }
        foreach ($cartogratree_session['records']['list'] as $record_id => $dmy) {
            $record = array(
            	'id' => $id,
            	'record_id' => $record_id,
            );
            drupal_write_record('cartogratree_session_records', $record);
        }
    }
    else if (isset($_POST['cartogratree_session_id'])) {
        $session_id = $_POST['cartogratree_session_id'];
    }
    else {
        parse_str($_SERVER['QUERY_STRING'], $query_string);
        $session_id = $query_string['cartogratree_session_id'];
    }

    $form['cartogratree_session_id'] = array(
    	'#type' => 'hidden',
    	'#value' => $session_id,
    );

    $form['cartogratree_skip_fields'] = array(
    	'#type' => 'hidden',
    	'#value' => 'genus,species,subkingdom,family,latitude,longitude,coordinate_type',
    );
    
    // Only grab galaxy instances the current user has created.
    $records = db_query('
		SELECT galaxy_id, url, api_key, servername
        FROM {tripal_galaxy}
        WHERE uid=:uid', 
		array(':uid' => $uid)
	);
    $server_options = array(); $history_options = array();
    $cmd = ''; $display_results = 'test';
    require_once (libraries_get_path('blend4php') . '/galaxy.inc');
    foreach ($records as $r) {
        $server_options[$r->url . ',' . $r->api_key] = $r->servername;
        // use blend4php to get list of Galaxy history entries
        $b4p_galaxy = tripal_galaxy_get_connection($r->galaxy_id);

        $b4p_history = new GalaxyHistories($b4p_galaxy);
        $b4p_histories = $b4p_history->index(array('deleted' => false));
        foreach($b4p_histories as $hist_entry) {
            $history_options[$r->servername][$hist_entry['id']] = $hist_entry['name'];
        }
    }
    $form['galaxy_server'] = array(
    	'#type' => 'select',
    	'#title' => 'Galaxy server',
    	'#options' => $server_options,
    	'#description' => count($server_options) ? '' : 'Set up a Galaxy instance at admin/tripal/extension/galaxy.',
    	'#required' => TRUE,
    );
    $form['galaxy_history'] = array(
    	'#type' => 'select',
    	'#title' => 'Galaxy history',
    	'#options' => $history_options,
    	'#description' => count($history_options) ? '' : 'Create and save a history in your Galaxy account.',
    	'#required' => TRUE,
    );

    $form['submit'] = array(
    	'#type' => 'submit',
    	'#value' => t('Send data to Galaxy'),
    );
        
    $header = array(
    	'uniquename' => array('data' => t('Tree ID'), 'field' => 'n.uniquename', 'sort' => 'asc'),
    	'genus' => array('data' => t('Genus'), 'field' => 'n.genus'),
    	'species' => array('data' => t('Species'), 'field' => 'n.species'),
    	'subkingdom' => array('data' => t('Sub-kingdom'), 'field' => 'n.subkingdom'),
    	'family' => array('data' => t('Family'), 'field' => 'n.family'),
    	'latitude' => array('data' => t('Latitude'), 'field' => 'n.latitude'),
    	'longitude' => array('data' => t('Longitude'), 'field' => 'n.longitude'),
    	'coordinate_type' => array('data' => t('Coordinate type'), 'field' => 'n.coordinate_type'),
    );

    // get latest ID for this session
    $id = '';
    $records = db_query('
		SELECT id FROM {cartogratree_sessions} WHERE session_id=:session_id AND operation_type = 2 ORDER BY id', 
		array(':session_id' => $session_id)
	);
    foreach ($records as $r) {
        $id = $r->id;
    }
    // get the ids of the environmental layers the user has selected and has permissions to
    // along with the field ids that should be shown in the table and their display names
    $records = db_query('
		SELECT t1.layer_id, t4.field_id, t4.display_name
   		FROM {cartogratree_layer_permissions} AS t1
    	JOIN {cartogratree_session_layers} AS t2 on t1.layer_id = t2.layer_id
    	JOIN {cartogratree_layers} AS t3 ON t1.layer_id = t3.layer_id
    	JOIN {cartogratree_fields} AS t4 ON t1.layer_id = t4.layer_id
        WHERE (t1.uid = 11 OR t1.rid = 2) AND t2.id = :id AND t3.trees_layer = 0 AND t4.data_table = 1', 
		array(':id' => $id)
	);
    $query = array (
    	'select' => 'SELECT t2.*',
    	'from' => ' FROM {cartogratree_session_records} AS t1 JOIN {chado.ct_view} AS t2 ON t1.record_id = t2.uniquename',
    );
    $tbl_num = 3;
    $fields = array();
    foreach ($records as $r) {
        $field_id = 'field' . $r->field_id;
        $tbl_id = 't' . $tbl_num++;
        $header[$field_id] = array('data' => t($r->display_name), 'field' => 'n.' . $field_id);
        array_push($fields, $field_id);
        $query['select'] .= ', ' .$tbl_id . '.field_value as ' . $field_id;
        $query['from'] .= ' JOIN {cartogratree_environmental_values} AS ' . $tbl_id . ' ON t2.latitude = cast(' . $tbl_id . '.latitude AS double precision) AND t2.longitude = cast(' . $tbl_id . '.longitude as double precision) AND ' . $tbl_id . '.field_id = ' . $r->field_id;
    }
    $query['where'] = ' WHERE t1.id=:id';
    $results = db_query($query['select'] . $query['from'] . $query['where'], array(':id' => $id));
//    $results = array();
////    $results = db_query("select * from {chado.ct_view} where uniquename in (:ids)", array(':ids' => $_POST['cartogratree_data_collection_individual_ids']));
////    $results = db_query("select * from {chado.ct_view} where uniquename in (:ids)", array(':ids' => $ids));
//    $results = db_query('select * from {chado.ct_view} where uniquename in (' . $ids . ')');
////    $results = db_select('chado.ct_view', 'v')
////        ->extend('PagerDefault')
////        ->fields('v')
////        ->condition('uniquename', explode(',', $_POST['cartogratree_data_collection_individual_ids']), 'IN')
////        ->limit(25)
////        ->execute();
//    $options = array();
    foreach ($results as $r) {
        $options[$r->uniquename] = array(
        	'uniquename' => $r->uniquename,
            'genus' => $r->genus,
            'species' => $r->species,
            'subkingdom' => $r->subkingdom,
            'family' => $r->family,
            'latitude' => $r->latitude,
            'longitude' => $r->longitude,
            'coordinate_type' => $r->coordinate_type,
        );
        foreach ($fields as $f) {
            $options[$r->uniquename][$f] = $r->$f;
        }
    }
    $form['table'] = array(
    	'#prefix' => '<div id="cartogratree_collection_table">',
    	'#type' => 'tableselect',
    	'#header' => $header,
    	'#options' => $options,
    	'#emtpy' => t('No plants selected.'),
    	'#attributes' => array('width' => '100%'),
    	'#suffix' => '</div>',
    );

    drupal_add_css(drupal_get_path('module', 'cartogratree') . '/cartogratree_data_collection.css');

    return $form;
}

/**
 * Prepare data collection to upload to Galaxy: Submission.
 * URL suffix: ?q=cartogratree_data_collection
 */
function cartogratree_data_collection_form_submit($form, &$form_state) {
    $env_tbl = array(); $skip_fields = array(); $used_fields = array();
    // get the list of skipped fields/columns
    foreach (explode(',', $form_state['values']['cartogratree_skip_fields']) as $id => $val) {
        $skip_fields[$val] = $val;
    }
    // get the header row
    $env_tbl[0] = array();
    foreach($form['table']['#header'] as $key => $val) {
        if (!isset($skip_fields[$key])) {
            array_push($used_fields, $key);
            array_push($env_tbl[0], preg_replace ('/\s+/', '_', $val['data']));
        }
    }
    // get the values for the selected records
    foreach ($form_state['values']['table'] as $id => $selected) {
        if (isset($selected) && $selected != '') {
            $row = array(0 => $id);
            foreach($form['table']['#options'][$id] as $key => $val) {
                $index = array_search($key, $used_fields);
                if($index) {
                    $row[$index] = $val;
                }
            }
            array_push($env_tbl, $row);
        }
    }
    // create file(s)
    global $user;
    // parameter file
    $file_name = 'public://' . date('Ymd_') . $user->uid . '_params.tsv';
    $data = '# Do environmental and genetic files have headers?' . PHP_EOL;
    $data .='HEADERS YES' . PHP_EOL;
    $data .= '# Number of columns in the environmental input' . PHP_EOL;
    $data .= 'NUMVARENV ' . (count($used_fields) - 1) . PHP_EOL;
    $data .= '# Number of columns in the matrix of genetic data' . PHP_EOL;
    $data .= 'NUMMARK ?' . PHP_EOL;
    $data .= '# The number of individuals (the number of rows of each file without the header)' . PHP_EOL;
    $data .= 'NUMINDIV ' . (count($env_tbl) - 1) . PHP_EOL;
    $data .= '# The name of the column that contains the samples identifiers' . PHP_EOL;
    $data .= 'IDINDIV Tree_ID' . PHP_EOL;
    $data .= '# The maximal degree of complexity for the models that will be built' . PHP_EOL;
    $data .= 'DIMMAX 2' . PHP_EOL;
    $data .= '# How should the output be written?' . PHP_EOL;
    $data .= 'SAVETYPE END ALL' . PHP_EOL;
    $file = file_save_data($data, $file_name);
    // upload file(s) to selected history
    $galaxy = explode (',', $form_state['values']['galaxy_server']);
    require_once (libraries_get_path('blend4php') . '/galaxy.inc');
    $records = db_query('SELECT galaxy_id, url, api_key, servername
        FROM {tripal_galaxy}
        WHERE uid=:uid and url=:url', array(':uid' => $user->uid, ':url' => $galaxy[0]));
    foreach ($records as $r) {
        $b4p_galaxy = tripal_galaxy_get_connection($r->galaxy_id);
        // Get the history contents so we don't upload the same file more than once
        // in the event that this invocation occurs more than once.
        $galaxy_history_contents = new GalaxyHistoryContents($b4p_galaxy);
        $history_contents = $galaxy_history_contents->index(['history_id' => $form_state['values']['galaxy_history']]);
        if ($error['message']) {
        	$error = $b4p_galaxy->getError();
        	throw new Exception($error['message']);
        }
        // Now upload the file.
        tripal_galaxy_upload_file($b4p_galaxy, $file->fid, $form_state['values']['galaxy_history'], $history_contents);
    }
    
    // environmental file
    $file_name = 'public://' . date('Ymd_') . $user->uid . '_env.tsv';
    $data = '';
    foreach ($env_tbl as $row) {
        $data .= implode("\t", $row) . PHP_EOL;
    }
    $file = file_save_data($data, $file_name);
    // upload file(s) to selected history
    tripal_galaxy_upload_file($b4p_galaxy, $file->fid, $form_state['values']['galaxy_history'], $history_contents);
    // redirect user to galaxy instance
    $form_state['redirect'] = $galaxy[0];
}

/**
 * Run workflow on Galaxy.
 * URL suffix: ?q=cartogratree_galaxy_workflow/<workflow id>/history/<history id>
 */
function cartogratree_galaxy_workflow_form($form, &$form_state) {
    global $user;

    if (isset($form_state['build_info']['args'][0]) && isset($form_state['build_info']['args'][1])) {  // <workflow id> and <history id> are provided in the URL
        $history_id = $form_state['build_info']['args'][1];
        $controls = get_workflow_controls_for_cartogratree_galaxy_workflow_form($history_id, $form_state['build_info']['args'][0]);
        // get the Galaxy instances the user has access to
        $records = db_query('
            SELECT galaxy_id, servername
            FROM {tripal_galaxy}
            WHERE uid=:uid', array(':uid' => $user->uid))->fetchObject();
        
        if (isset($records->galaxy_id)) {               // the user has access to at least one Galaxy instance
            // get the workflow requested (<workflow id>), if the user has access to it
            $records = db_query('
                SELECT	t1.*
                FROM	{tripal_galaxy_workflow} as t1
                JOIN	{tripal_galaxy} as t2 using (galaxy_id)
                WHERE	galaxy_workflow_id=:workfflow_id AND uid=:uid', array(':workfflow_id' => $form_state['build_info']['args'][0], ':uid' => $user->uid))->fetchObject();
            
            if (isset($records->galaxy_workflow_id)) {  // the user has access to this workflow
                $form['workflow_name'] = array(
                  '#markup' => '<h1>Workflow: ' . $records->workflow_name . '</h1>',
                );
                foreach($controls as $step_id => $step) {
                    foreach($step as $control_id => $control) {
                        switch ($control['type']) {
                            case 'select':
                                $form[$control['name']] = array (
                                	'#type' => 'select',
                                	'#title' => t($control['title']),
                                	'#options' => $control['options'],
                                	'#default_value' => $control['default_value'],
                                	'#description' => $control['description'],
                                	'#required' => TRUE,
                                );
                                break;
                            case 'textfield':
                                $form[$control['name']] = array (
                               		'#type' => 'textfield',
                                	'#title' => t($control['title']),
                                	'#default_value' => $control['default_value'],
                                	'#description' => $control['description'],
                                	'#required' => TRUE,
                                );
                                break;
                        }
                    }
                }
                $form['submit'] = array('#type' => 'submit', '#value' => t('Execute workflow'));
            }
            else {                                      // the user doesn't have access to this workflow
                // inform the user and provide a link to admin/tripal/extension/galaxy/workflows
                $form['info'] = array(
                  '#markup' => '<p>' . t('Workflow not found. Add workflow at ') . l('admin/tripal/extension/galaxy/workflows', $base_url . 'admin/tripal/extension/galaxy/workflows') . '.</p>',
                );
            }
        }
        else {                                          // the user has no access to any Galaxy instance
            // inform the user and provide a link to admin/tripal/extension/galaxy
            $form['info'] = array(
              '#markup' => '<p>' . t('No Galaxy instance found. Add an instance at ') . l('admin/tripal/extension/galaxy', $base_url . 'admin/tripal/extension/galaxy') . '.</p>',
            );
        }
    }
    return $form;
}

/**
 * Generates an associative array with the controls to be used to run <workflow_id> on <history_id>.
 * @param type $history_id
 * @param type $workflow_id
 */
function get_workflow_controls_for_cartogratree_galaxy_workflow_form ($history_id, $workflow_id) {
    require_once (libraries_get_path('blend4php') . '/galaxy.inc');
    
    global $user;

    if (isset($workflow_id) && isset($history_id)) {  // <workflow id> and <history id> are provided
        // get the workflow requested (<workflow id>), if the user has access to it
        $records = db_query('
            SELECT	t1.*
            FROM	{tripal_galaxy_workflow} as t1
            JOIN	{tripal_galaxy} as t2 using (galaxy_id)
            WHERE	galaxy_workflow_id=:workfflow_id AND uid=:uid', array(':workfflow_id' => $workflow_id, ':uid' => $user->uid))->fetchObject();

        if (isset($records->galaxy_workflow_id)) {  // the user has access to this workflow and this Galaxy instance             
            // connect to the Galaxy instance
            $galaxy = tripal_galaxy_get_connection($records->galaxy_id);
            // get the workflow inputs
            $galaxy_workflows = new GalaxyWorkflows($galaxy);
            $galaxy_workflow = $galaxy_workflows->show(['workflow_id' => $records->workflow_id]);
            // get the worfklow steps
            foreach ($galaxy_workflow['steps'] as $step_index => $step) {
                if ($step['type'] == 'tool') {              // tool step
                    // get tool details
                    $galaxy_tools = new GalaxyTools($galaxy);
                    $tool_details = $galaxy_tools->build(['tool_id' => $step['tool_id'], 'history_id' => $history_id]);
                    foreach ($tool_details['inputs'] as $input_id => $input) {
                        switch ($input['type']) {
                            case 'float':
                                $controls[$step_index][$input['name']]['name'] = 'step_' . $step_index . '__' . $input['name'];
                                $controls[$step_index][$input['name']]['title'] = $input['label'];
                                $controls[$step_index][$input['name']]['type'] = 'textfield';
                                $controls[$step_index][$input['name']]['description'] = 'Enter a value between ' . $input['min'] . ' and ' . $input['max'] . '.';
                                $controls[$step_index][$input['name']]['default_value'] = $input['default_value'];
                                break;
                            case 'data':    // file
                                $source_step = $step['input_steps'][$input['name']]['source_step'];
                                if ($galaxy_workflow['steps'][$source_step]['type'] == 'data_input') {
                                    $controls[$step_index][$input['name']]['name'] = 'step_' . $step_index . '__' . $input['name'];
                                    $controls[$step_index][$input['name']]['title'] = $input['label'];
                                    $controls[$step_index][$input['name']]['type'] = 'select';
                                    $controls[$step_index][$input['name']]['description'] = 'Select the file to use.';
                                    if(array_key_exists(0, $input['default_value']['values'])) {
                                        $key = array(
                                          'src' => $input['default_value']['values'][0]['src'],
                                          'id' => $input['default_value']['values'][0]['id'],
                                        );
                                        $controls[$step_index][$input['name']]['default_value'] = json_encode($key);
                                        foreach($input['options'] as $option_name => $option) {
                                            foreach($option as $option_id => $option_entry) {
                                                $key = array(
                                                  'src' => $option_entry['src'],
                                                  'id' => $option_entry['id'],
                                                );
                                                $controls[$step_index][$input['name']]['options'][json_encode($key)] = $option_entry['name'];
                                            }
                                        }
                                    }
                                }
                                break;
                            case 'select':
                                    $controls[$step_index][$input['name']]['name'] = 'step_' . $step_index . '__' . $input['name'];
                                    $controls[$step_index][$input['name']]['title'] = $input['label'];
                                    $controls[$step_index][$input['name']]['type'] = 'select';
                                    // $controls[$step_index][$input['name']]['description'] = 'Select the file to use.';
                                    $controls[$step_index][$input['name']]['default_value'] = $input['default_value'];
                                    foreach($input['options'] as $option_id => $option) {
                                        $controls[$step_index][$input['name']]['options'][$option[1]] = $option[0];
                                    }
                                break;
                        }
                    }
                }
            }
        }
    }

    return $controls;   
}

/**
 * Run workflow on Galaxy: Submission
 * URL suffix: ?q=cartogratree_galaxy_workflow/<workflow id>/history/<history id>
 */
function cartogratree_galaxy_workflow_form_submit($form, &$form_state) {
    require_once (libraries_get_path('blend4php') . '/galaxy.inc');
    
    global $user;

    if (isset($form_state['build_info']['args'][0]) && isset($form_state['build_info']['args'][1])) {  // <workflow id> and <history id> are provided in the URL
        $history_id = $form_state['build_info']['args'][1];
        $controls = get_workflow_controls_for_cartogratree_galaxy_workflow_form($history_id, $form_state['build_info']['args'][0]);
        // get the workflow requested (<workflow id>), if the user has access to it
        $records = db_query('
            SELECT	t1.*
            FROM	{tripal_galaxy_workflow} as t1
            JOIN	{tripal_galaxy} as t2 using (galaxy_id)
            WHERE	galaxy_workflow_id=:workfflow_id AND uid=:uid', array(':workfflow_id' => $form_state['build_info']['args'][0], ':uid' => $user->uid))->fetchObject();

        if (isset($records->galaxy_workflow_id)) {  // the user has access to this workflow                
            $workflow['workflow_id'] = $records->workflow_id;
            $workflow['history_id'] = $history_id;

            /**
             * Get workflow details from Galaxy
             */
            // connect to the Galaxy instance
            $galaxy = tripal_galaxy_get_connection($records->galaxy_id);
            // get the workflow inputs
            $galaxy_workflows = new GalaxyWorkflows($galaxy);
            $galaxy_workflow = $galaxy_workflows->show(['workflow_id' => $records->workflow_id]);
            // get the worfklow steps
            foreach ($galaxy_workflow['steps'] as $step_index => $step) {
                if ($step['type'] == 'tool') {
                    // get tool details
                    $galaxy_tools = new GalaxyTools($galaxy);
                    $tool_details = $galaxy_tools->build(['tool_id' => $step['tool_id'], 'history_id' => $history_id]);
                    foreach ($tool_details['inputs'] as $input_id => $input) {
                        switch ($input['type']) {
                            case 'float':
                                $workflow['parameters'][$step_index][$input['name']] = $form_state['values']['step_' . $step_index . '__' . $input['name']];
                                break;
                            case 'data':
                                $workflow['parameters'][$step_index] = $step['input_steps'];

                                $source_step = $step['input_steps'][$input['name']]['source_step'];
                                if ($galaxy_workflow['steps'][$source_step]['type'] == 'data_input') {
                                    foreach($step['input_steps'] as $input_step_id => $input_step) {
                                        $values = json_decode($form_state['values']['step_' . $step_index . '__' . $input_step_id], $assoc = TRUE);

                                        $workflow['inputs'][$input_step['source_step']]['id'] = $values['id'];
                                        $workflow['inputs'][$input_step['source_step']]['src'] = $values['src'];
                                        $workflow['parameters'][$input_step['source_step']]['Data File'] = $values['id'];

                                    }
                                }
                                break;
                            case 'select':
                                $workflow['parameters'][$step_index][$input['name']] = $form_state['values']['step_' . $step_index . '__' . $input['name']];
                                break;
                        }
                    }
                }
            }
            
            // masquerade as TripalGalaxy workflow
            $sid = db_query("SELECT MAX(sid) as max_sid FROM webform_submissions")->fetchCol()[0] + 1;
            $nid = $records->nid;
            $serial = db_query("SELECT MAX(serial) as max_serial FROM webform_submissions WHERE nid = " . $nid)->fetchCol()[0] + 1;
            $time = REQUEST_TIME;
            $record = array(
            	'sid' => $sid,
            	'nid' => $nid,
            	'serial' => $serial,
            	'uid' => $user->uid,
            	'is_draft' => 0,
            	'highest_valid_page' => 0,
            	'submitted' => $time,
            	'completed' => $time,
            	'modified' => $time,
            	'remote_addr' => ip_address(),
            );
            drupal_write_record('webform_submissions', $record);

            // invoke workflow
            $invocation = $galaxy_workflows->invoke($workflow);
            if(!$invocation) {
                $error = $galaxy->getError();
                drupal_set_message($error['message'], 'error');

                $record = array (
                	'sid' => $sid,
                	'galaxy_workflow_id' => $form_state['build_info']['args'][0],
                 	'errors' => $error['message'],
                	'status' => 'Error',
                	'submit_date' => $time,
                );
                drupal_write_record('tripal_galaxy_workflow_submission', $record);
                tripal_galaxy_send_submission_failed_mail($sid, $user->uid);
            }
            else {
                drupal_set_message("Job 'Galaxy Workflow #" . $sid . "' submitted.");
                drupal_set_message("Check the " . l('jobs page', 'admin/tripal/tripal_jobs') . " for status.");
                drupal_set_message("You can execute the job queue manually on the command line using the following Drush command:");
                drupal_set_message("drush trp-run-jobs --username=" . $user->mail . " --root=" . DRUPAL_ROOT);
                drupal_set_message("Your job is successfully submitted to the job queue! You will be notified by email when your job begins and completes.");

                $record = array (
                	'sid' => $sid,
                	'galaxy_workflow_id' => $form_state['build_info']['args'][0],
                	'status' => 'Submitted',
                	'submit_date' => $time,
                	'start_time' => $time,
                	'invocation_id' => $invocation['id'],
                );
                drupal_write_record('tripal_galaxy_workflow_submission', $record);
                tripal_galaxy_send_submission_start_mail($sid, $user->uid);
            }
            // redirect user
            drupal_goto('user/' . $user->uid . '/galaxy-jobs');
        }
    }
}
