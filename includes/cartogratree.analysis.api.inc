<?php

function cartogratree_analysisapi_get_all_galaxy_accounts() {
    $records = db_query('
		SELECT galaxy_id, url, api_key, servername
        FROM {tripal_galaxy}', 
		array()
	);
    
    $galaxy_servers = array();
    foreach ($records as $row) {
        $row->api_key = "protected";
        array_push($galaxy_servers, $row);
    }
    drupal_json_output($galaxy_servers);
}

function cartogratree_analysisapi_get_all_history_from_galaxy_account($galaxy_id) {
    $records = db_query('
		SELECT galaxy_id, url, api_key, servername
        FROM {tripal_galaxy}
        WHERE galaxy_id=:galaxy_id', 
		array(':galaxy_id' => $galaxy_id)
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
    
    // echo "<br />This is all the history for all the different galaxy connections / servers<br />";
    // print_r($history_options);
    drupal_json_output($history_options);    
}

function cartogratree_analysisapi_create_new_history_for_user($galaxy_id, $history_name) {
    global $user;
    require_once (libraries_get_path('blend4php') . '/galaxy.inc');
    // connect to the Galaxy instance
    $galaxy = tripal_galaxy_get_connection($galaxy_id);


    $histories = new GalaxyHistories($galaxy);

    // Case 1: Create a history with only a single name.
    $inputs = array(
      'name' => $history_name,
    );

    $history = $histories->create($inputs);
    db_query('INSERT INTO cartogratree_histories (user_id, galaxy_id, history_id, history_name, history_json) 
        VALUES (:user_id, :galaxy_id, :history_id, :history_name, :history_json);', array(
            ':user_id' => $user->uid,
            ':galaxy_id' => $galaxy_id,
            ':history_id' => $history['id'],
            ':history_name' => $history_name,
            ':history_json' => serialize($history)
        )
    );
    drupal_json_output($history);
}

function cartogratree_analysisapi_get_all_workflows_from_galaxy_account($galaxy_id) {
    $records = db_query('SELECT * FROM tripal_galaxy_workflow WHERE galaxy_id = :galaxy_id', 
        array(':galaxy_id' => $galaxy_id)
    );
    $workflows = array();
    foreach ($records as $row) {
        array_push($workflows, $row);
    }
    drupal_json_output($workflows);
}

function cartogratree_analysisapi_get_workflow_input_types($galaxy_id, $workflow_id, $history_id) {
    drupal_page_is_cacheable(FALSE);
    require_once (libraries_get_path('blend4php') . '/galaxy.inc');
    // connect to the Galaxy instance
    $galaxy = tripal_galaxy_get_connection($galaxy_id);
    // get the workflow inputs
    $galaxy_workflows = new GalaxyWorkflows($galaxy);
    $galaxy_workflow = $galaxy_workflows->show(['workflow_id' => $workflow_id]);
    // print_r($galaxy_workflow);

    // Create a history which will be used for building tools. We have to build
    // the tools so that we can get all of the inputs and their default values.
    // $history = tripal_galaxy_create_history($galaxy, 'TG-import-tools');    

    $overall_annotation = $galaxy_workflow['annotation'];

    // Iterate through each step of the workflow.
    $steps = $galaxy_workflow['steps'];
    
   

    $input_id = -1; // this is a normal id like 0,1,2,3 etc per input
    $results['step_indexes'] = array();

    $control_id = -1;
    $debug = array();
    // print_r($steps);
    foreach ($steps as $step_index => $step) {
        $results['step_indexes'][$step['id']]['step_id'] = $step['id']; // this will hold the actual step indexes
        $input_id = $input_id + 1;
        //print_r($step);
        //if (isset($step['annotation'])) {
            $step_annotation = $step['annotation'];

            // Handle the step type. So far we only know about 'data_input' and 'tool'.
            // The succeeding tool to the.
            // $debug[] = $step;
            switch ($step['type']) {
                
                // If this is for a data 'file' input.
                case 'data_input':
                    /*
                    $tool_input_name = array_key_exists('name', $step['tool_inputs']) ? $step['tool_inputs']['name'] : 'Data File';
                    $tool_input_name = 'Data File';
                    $tool_input_name = $workflow['inputs'][$step_index]['label'];
                    */

                    // Store the type of control (we will use this to know what type of form element to display to the UI)
                    // $results['debug']['msg'] = "It came here";
                    $results['step_indexes'][$step['id']]['type'] = $step['type'];
                    $results['step_indexes'][$step['id']]['label'] = $galaxy_workflow['inputs'][$step_index]['label'];
                    
                    if($results['step_indexes'][$step['id']]['label'] == "") {
                        $results['step_indexes'][$step['id']]['label']= 'Data File';
                    }   
                    
                    // $debug[] = $results['step_indexes'][$step['id']];
                    // $debug[] = $step;
                    // $debug[] = $galaxy_workflow['inputs'][$step_index];
                    

                    // Debug code for testing LinkImputeR workflow

                    
                    $control_id = $control_id + 1;
                    $debug[] = $control_id + " " + $step['id'];
                    
                    $controls[$control_id] = array();
                    $controls[$control_id]['name'] = 'step_' . $step['id'] . '_cid_' . $control_id . '__' . '!name!' . '___' . $workflow_id;
                    $controls[$control_id]['title'] = '!title!';
                    $controls[$control_id]['type'] = 'selectfile';
                    $controls[$control_id]['description'] = 'Select the file to use.';

                    // Get all file lists from the workspace / history
                    $galaxy_history_contents= new GalaxyHistoryContents($galaxy);
                    $galaxy_contents= $galaxy_history_contents->index(['history_id' => $history_id]);
                    // $debug[] = $galaxy_contents;

                    foreach($galaxy_contents as $galaxy_content_item) {
                        // $debug[] = $galaxy_content_item;
                        if($galaxy_content_item['deleted'] == false) {
                            $galaxy_datasets = new GalaxyDatasets($galaxy);
                            // $galaxy_dataset = $galaxy_datasets->show(['dataset_id' => $galaxy_content_item['dataset_id']]);
                            $galaxy_dataset = $galaxy_datasets->show(['dataset_id' => $galaxy_content_item['id']]);
                            $debug[] = $galaxy_dataset;
                            $key = array(
                                'src' => $galaxy_dataset['hda_ldda'],
                                'id' => $galaxy_dataset['id'],
                            );
                            $controls[$control_id]['options'][json_encode($key)] = $galaxy_content_item['name'];
                        }
                    }

                    // if(array_key_exists(0, $input['default_value']['values'])) {
                    //     $key = array(
                    //     'src' => $input['default_value']['values'][0]['src'],
                    //     'id' => $input['default_value']['values'][0]['id'],
                    //     );
                    //     $controls[$control_id]['default_value'] = json_encode($key);
                    //     foreach($input['options'] as $option_name => $option) {
                    //         foreach($option as $option_id => $option_entry) {
                    //             $key = array(
                    //             'src' => $option_entry['src'],
                    //             'id' => $option_entry['id'],
                    //             );
                    //             $controls[$control_id]['options'][json_encode($key)] = $option_entry['name'];
                    //         }
                    //     }
                    // } 
                    
                                      
                    

                    break;
        
                case 'data_collection_input':
                    // TODO LATER ON : IGNORE THIS CODE FOR THE WHILE - IT DOES NOT WORK HERE IN THIS NEW IMPLEMENTATION
                    
                    // $tool_input_name = array_key_exists('name', $step['tool_inputs']) ? $step['tool_inputs']['name'] : 'Data Collection';
            
                    // $tool = [
                    //     'id' => NULL,
                    //     'name' => $tool_input_name,
                    // ];
            

                    // $input = [
                    //     'name' => $tool_input_name,
                    //     'full_name' => $tool_input_name,
                    //     'type' => 'data_collection_input',
                    //     'collection_type' => $step['tool_inputs']['collection_type'],
                    // ];
                    // $input_id = tripal_galaxy_build_webform_add_component($webform, $workflow, $step, $tool, $input, $cid, $data_inputs);
                    // $data_inputs[$step_index] = $input_id;
                    break;
        
                // If this is a tool step then handle it.
                case 'tool':

                    $results['step_indexes'][$step['id']]['type'] = 'tool';
                    // We need to iterate the $step['tool_inputs'] and save it in the $results['step_indexes']
                    // with the key 'tool_inputs' for later use

                    $tool_inputs_array = array();
                    foreach($step['tool_inputs'] as $tool_input => $tool_input_value) { 

                        if(isset($tool_input_value)) {
                            $tool_inputs_array[$tool_input] = $tool_input_value;
                        }
                    }


                    $results['step_indexes'][$step['id']]['tool_inputs'] = $tool_inputs_array;


                    // We need to iterate the $step['input_steps'] to make sure our results step information has the 'name'
                    // which would also be needed to generate paramters and inputs arrays for invoking workflow later on
                    // in the entire process
                    foreach($step['input_steps'] as $name => $name_details_info) {
                        foreach ($name_details_info as $param => $param_value) {
                            if($param == 'source_step') {
                                $results['step_indexes'][$param_value]['name'] = $name; // this gets the name and stores it in the $results array
                                // save the params in the $results array as well
                                $results['step_indexes'][$param_value]['params'] = $name_details_info;
                            }
                        }
                    }

                    // Get the tool details from the Galaxy server.
                    // get tool details
                    $galaxy_tools = new GalaxyTools($galaxy);
                    $tool_details = $galaxy_tools->build(['tool_id' => $step['tool_id'], 'history_id' => $history_id]);
                    
                    // print_r($step);

                    // print_r($tool_details);
                    // $control_id = -1;
                    foreach ($tool_details['inputs'] as $input_id => $input) {
                        $control_id = $control_id + 1;
                        $controls[$control_id] = array();  
                        // $controls[$control_id] = array();
                        $show_control = true;
                        
                        // Always assume the first step has an input
                        // This does the check to see if it's the first step
                        if($control_id == 0) {
                            $show_control =  true; // assume true
                        }
                        else if(isset($step['input_steps'][$input['name']])) {
                            $show_control = false;
                            
                        }

                        // print_r($input);
                        if(!$show_control) { // DEVELOPMENT TEST
                            // Do not show control if 
                        }
                        else {
                            // print_r($input);
                            // print_r($control_id);

                            switch ($input['type']) {
                                case 'float':
                                    $controls[$control_id]['name'] = 'step_' . $step['id'] . '_cid_' . $control_id . '__' . $input['name']  . '___' . $workflow_id;

                                    $controls[$control_id]['title'] = $input['label'];

                                    $controls[$control_id]['type'] = 'float';
                                    $controls[$control_id]['description'] = 'Enter a value between ' . $input['min'] . ' and ' . $input['max'] . '.';
                                    $controls[$control_id]['default_value'] = $input['default_value'];
                                    break;
                                case 'text':
                                    $controls[$control_id]['name'] = 'step_' . $step['id'] . '_cid_' . $control_id . '__' . $input['name']  . '___' . $workflow_id;
                                   
                                    $controls[$control_id]['title'] = $input['label'];
                                    

                                    $controls[$control_id]['type'] = 'text';
                                    $controls[$control_id]['description'] = $input['help'];
                                    $controls[$control_id]['default_value'] = $input['default_value'];
                                    break; 
                                    // $step_index;                       
                                case 'data':    // file
                                    // print_r($input);
                                    $source_step = $step['input_steps'][$input['name']]['source_step'];
                                    // print_r($galaxy_workflow['steps'][$source_step]);
                                    // if ($galaxy_workflow['steps'][$source_step]['type'] == 'data_input') {
                                        $controls[$control_id]['name'] = 'step_' . $step['id'] . '_cid_' . $control_id . '__' . $input['name'] . '___' . $workflow_id;
                                        if($input['label'] != "") {
                                            $controls[$control_id]['title'] = $input['label'];
                                        }
                                        else {
                                            $controls[$control_id]['title'] = $tool_details['name'];
                                        }
                                        // $debug[] = $tool_details;
                                        $controls[$control_id]['type'] = 'selectfile';
                                        $controls[$control_id]['description'] = 'Select the file to use.';
                                        if(array_key_exists(0, $input['default_value']['values'])) {
                                            $key = array(
                                            'src' => $input['default_value']['values'][0]['src'],
                                            'id' => $input['default_value']['values'][0]['id'],
                                            );
                                            $controls[$control_id]['default_value'] = json_encode($key);
                                            foreach($input['options'] as $option_name => $option) {
                                                foreach($option as $option_id => $option_entry) {
                                                    $key = array(
                                                    'src' => $option_entry['src'],
                                                    'id' => $option_entry['id'],
                                                    );
                                                    $controls[$control_id]['options'][json_encode($key)] = $option_entry['name'];
                                                }
                                            }
                                        }
                                    // }
                                    break;
                                case 'select':
                                    // print_r($input);
                                    $controls[$control_id]['name'] = 'step_' . $step['id'] . '_cid_' . $control_id . '__' . $input['name'] . '___' . $workflow_id;
                                    
                                    $controls[$control_id]['title'] = $input['label'];

                                    $controls[$control_id]['type'] = 'select';
                                    $controls[$control_id]['description'] = 'Select';
                                    $controls[$control_id]['default_value'] = $input['default_value'];
                                    foreach($input['options'] as $option_id => $option) {
                                        // $controls[$step_index]['options'][$option[1]] = $option[0];
                                        $controls[$control_id]['options'][$option[1]] = $option[0];
                                    }
                                    break;
                            }
                        }

                    }
                    break;
        
                default:
                    // drupal_set_message('Unhandled step type:  ' . $step['type'] . ".", 'error');
                    // return;
                    break;
            } // end switch ($step['type']) { ...      
        //}
    }

    // There is one more step to cater for data_input (that didn't come from tools)
    foreach($controls as &$control) {
        if(stripos($control['name'],'!name!') !== FALSE) {
            $control_name = $control['name'];
            $control_step = explode('_', $control['name'])[1];
            $lookup_name = $results['step_indexes'][$control_step]['name'];
            $control['name'] = str_ireplace('!name!', $lookup_name, $control['name']);
            $control['title'] = str_ireplace('!title!', $results['step_indexes'][$control_step]['label'], $control['title']);
        }
    }

    $results['debug'] = $debug;
    $results['ui_controls'] = $controls;
    $results['overall_annotation'] = $overall_annotation;
    // print_r($results);
    drupal_json_output($results);
}

/*
// OLD VERSION DOESN'T WORK AS INTENDED
function cartogratree_analysisapi_get_workflow_input_types($galaxy_id, $workflow_id, $history_id) {
    require_once (libraries_get_path('blend4php') . '/galaxy.inc');
    // connect to the Galaxy instance
    $galaxy = tripal_galaxy_get_connection($galaxy_id);
    // get the workflow inputs
    $galaxy_workflows = new GalaxyWorkflows($galaxy);

    // DEBUG
    // $galaxy_workflows_index = $galaxy_workflows->index();
    // drupal_json_output($galaxy_workflows_index);

    $galaxy_workflow = $galaxy_workflows->show(['workflow_id' => $workflow_id]);

    
    // drupal_json_output($galaxy_workflow['steps']);
    // drupal_json_output($galaxy_workflows);

    $debug_inputs = [];


    // This creates a tool model which describes inputs (most probably)
    $step_index = -1;
    foreach ($galaxy_workflow['steps'] as $step_index => $step) {
        
        if ($step['type'] == 'tool') {              // tool step

                 
            // get tool details
            $galaxy_tools = new GalaxyTools($galaxy);
            $tool_details = $galaxy_tools->build(['tool_id' => $step['tool_id'], 'history_id' => $history_id]);
            // $tool_details = $galaxy_tools->build(['tool_id' => $step['tool_id']]);
            
            array_push($debug_inputs, $tool_details['inputs']);
            
            foreach ($tool_details['inputs'] as $input_id => $input) {
                
                switch ($input['type']) {
                    case 'float':
                        $controls[$step_index][$input['name']]['name'] = 'step_' . $step_index . '__' . $input['name']  . '___' . $workflow_id;
                        $controls[$step_index][$input['name']]['title'] = $input['label'];
                        $controls[$step_index][$input['name']]['type'] = 'float';
                        $controls[$step_index][$input['name']]['description'] = 'Enter a value between ' . $input['min'] . ' and ' . $input['max'] . '.';
                        $controls[$step_index][$input['name']]['default_value'] = $input['default_value'];
                        break;
                    case 'text':
                        $controls[$step_index][$input['name']]['name'] = 'step_' . $step_index . '__' . $input['name']  . '___' . $workflow_id;
                        $controls[$step_index][$input['name']]['title'] = $input['label'];
                        $controls[$step_index][$input['name']]['type'] = 'text';
                        $controls[$step_index][$input['name']]['description'] = $input['help'];
                        $controls[$step_index][$input['name']]['default_value'] = $input['default_value'];
                        break;                        
                    case 'data':    // file
                        $source_step = $step['input_steps'][$input['name']]['source_step'];
                        if ($galaxy_workflow['steps'][$source_step]['type'] == 'data_input') {
                            $controls[$step_index][$input['name']]['name'] = 'step_' . $step_index . '__' . $input['name'] . '___' . $workflow_id;
                            $controls[$step_index][$input['name']]['title'] = $input['label'];
                            $controls[$step_index][$input['name']]['type'] = 'selectfile';
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
                        $controls[$step_index][$input['name']]['name'] = 'step_' . $step_index . '__' . $input['name'] . '___' . $workflow_id;
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
    
    // print_r($debug_inputs);
    // drupal_json_output($debug_inputs);
    drupal_json_output($controls);
}
*/

function cartogratree_analysisapi_upload_file_to_history() {
    require_once (libraries_get_path('blend4php') . '/galaxy.inc');
    
    global $user;

    // GET FILE CONTENTS
    $file_data = file_get_contents($_FILES['file1']['tmp_name']);
    

    //@drupal_mkdir();
    $upload_dir = DRUPAL_ROOT . '/sites/default/files/cartogratree_analysis_history_uploads/';
    @file_prepare_directory($upload_dir, FILE_CREATE_DIRECTORY);
    

    $file = @file_save_data($file_data, 'public://cartogratree_analysis_history_uploads/' . $user->uid . '-' . time() . '-' . $_FILES['file1']['name']);


    $galaxy_id = $_POST['galaxy_id'];
    $workflow_id = $_POST['workflow_id'];
    $history_id = $_POST['history_id'];

    $galaxy = tripal_galaxy_get_connection($galaxy_id);
    $galaxy_history_contents = new GalaxyHistoryContents($galaxy);
    $history_contents = $galaxy_history_contents->index(['history_id' => $history_id]);
    
    // if ($error['message']) {
    //     $error = $b4p_galaxy->getError();
    //     throw new Exception($error['message']);
    // }
    
    // Now upload the file.
    ob_start();
    @tripal_galaxy_upload_file($galaxy, $file->fid, $history_id, $history_contents);    
    ob_end_clean();
    $result = array(
        'result' => 'uploaded'
    );
    drupal_json_output($result);
    
}

function cartogratree_analysisapi_upload_file_raw_data_to_history() {
    require_once (libraries_get_path('blend4php') . '/galaxy.inc');
    
    global $user;

    // GET FILE CONTENTS
    $file_data = $_POST['raw_data'];
    $file_name = $_POST['file_name'];
    

    //@drupal_mkdir();
    $upload_dir = DRUPAL_ROOT . '/sites/default/files/cartogratree_analysis_history_uploads/';
    @file_prepare_directory($upload_dir, FILE_CREATE_DIRECTORY);
    

    $file = @file_save_data($file_data, 'public://cartogratree_analysis_history_uploads/' . $user->uid . '-' . time() . '-' . $file_name);


    $galaxy_id = $_POST['galaxy_id'];
    $workflow_id = $_POST['workflow_id'];
    $history_id = $_POST['history_id'];

    $galaxy = tripal_galaxy_get_connection($galaxy_id);
    $galaxy_history_contents = new GalaxyHistoryContents($galaxy);
    $history_contents = $galaxy_history_contents->index(['history_id' => $history_id]);
    
    // if ($error['message']) {
    //     $error = $b4p_galaxy->getError();
    //     throw new Exception($error['message']);
    // }
    
    // Now upload the file.
    ob_start();
    @tripal_galaxy_upload_file($galaxy, $file->fid, $history_id, $history_contents);    
    ob_end_clean();
    $result = array(
        'result' => 'uploaded'
    );
    drupal_json_output($result);
    
}

function cartogratree_analysisapi_initiate_job() {
    require_once (libraries_get_path('blend4php') . '/galaxy.inc');

    // Grab the user id of the current user.
    global $user;
    // $uid = $user->uid;
    // $rids = is_array($user->roles) ? array_keys($user->roles) : array();
    $ui_inputs = json_decode($_POST['inputs'],true);
    $step_indexes = json_decode($_POST['step_indexes']);
    $galaxy_id = $_POST['galaxy_id'];
    $history_id = $_POST['history_id'];
    $workflow_id = $_POST['workflow_id'];
    $workflow_name = $_POST['workflow_name'];
    // print_r($ui_inputs);
    // print_r($step_indexes);
    // exit;

    // connect to the Galaxy instance
    $galaxy = tripal_galaxy_get_connection($galaxy_id);
    // get the workflow inputs
    $galaxy_workflows = new GalaxyWorkflows($galaxy);
    // $galaxy_workflow = $galaxy_workflows->show(['workflow_id' => $workflow_id]);    
    
    $workflow_submit_values['workflow_id'] = $workflow_id;
    $workflow_submit_values['history_id'] = $history_id;

    // $workflow_submit_values have additional indexes 'inputs' and 'parameters'
    // A basic idea can be found in the tripal_galaxy documentation for more details

    $inputs = array();
    // go through each ui_input to get file inputs for the inputs array
    foreach ($ui_inputs as $ui_input_index => $ui_input) {
        
        foreach($ui_input as $tool_name => $ui_input_value) {

            if(is_array($ui_input_value)) {
                if(isset($ui_input_value['id'])) {
                    $inputs[$ui_input_index] = $ui_input_value;
                }
            }
        } 
    }



    $parameters = $ui_inputs; // by pattern, this will enter the ui_inputs which seem to be compatible with what parameters should have
    
    // go through each step
    foreach ($step_indexes as $step) {
        $step = get_object_vars($step);

        
        // Generate parameters array for submission by using/analyzing each step
        if($step['type'] == "tool") {
            
            $tool_inputs = $step['tool_inputs'];
            foreach($tool_inputs as $tool_name => $tool_value) {
                //check if does not exist in parameters array
                if(!isset($parameters[$step['step_id']][$tool_name]) && is_object($tool_value)) {
                    
                    //OLD CODE THAT WORKS WITH SNP FILTERING
                    // $prev_step = get_object_vars($step_indexes[$step['step_id'] -1]);
                    // $parameters[$step['step_id']][$tool_name] = get_object_vars($prev_step['params']);
                    
                    // NEW CODE
                    // Go through each step indexes to find params
                    foreach($step_indexes as $step_tmp) {
                        $step_tmp_arr = get_object_vars($step_tmp);
                        if($step_tmp_arr['name'] == $tool_name) {
                            $parameters[$step['step_id']][$tool_name] = get_object_vars($step_tmp_arr['params']);
                            break;
                        }
                    }

                }
            }
        }
        elseif ($step['type'] == "data_input") { // did this using the dummy workflow [ not sure if this is dynamic enough ]
            // Dummy workflow code (works)
            // // print_r($step['step_id']);
            // $next_input = $ui_inputs[$step['step_id'] + 1];
            // // print_r($next_input);
            // $parameters[$step['step_id']][$step['label']] = $next_input[$step['name']];

            // $parameters[$step['step_id'] + 1][$step['name']] = $step['params'];

            // // pull the input backwards
            // $inputs[$step['step_id']] = $inputs[$step['step_id'] + 1];
            // unset($inputs[$step['step_id'] + 1]);


            // New code for compatibility with ImputeR
            $parameters[$step['step_id']][$step['label']] = $ui_inputs[$step['step_id']][$step['name']];

        }
    }

    
    // debug - REMOVE THIS BEFORE WORKFLOW EXECUTION!@)#)@)@!!!!@
    
    /*
    unset($parameters[0]['vcf']);
    unset($parameters[1]['inifile']);
    unset($parameters[0]['input']);
    */
    

    ksort($parameters); // order by the keys (this just makes it presentable)
    // print_r($parameters);
    // print_r($inputs);
    // exit;

    // OLD CODE USED FOR DUMMY WORKFLOW
    // $parameters = array();
    // foreach ($step_indexes as $step) {
    //     $step = get_object_vars($step);
    //     $step_no = $step['step_id'];
    //     if($step['type'] == 'data_input') {
    //         // Use the name to get the selected values from the inputs sub-array
    //         $name = $step['name'];
    //         $label = $step['label'];
    //         foreach($ui_inputs as $ui_input_details) {
    //             if(isset($ui_input_details[$name])) {
    //                 $parameters[$step_no][$label] = $ui_input_details[$name];
    //                 $inputs[$step_no] = $ui_input_details[$name];
    //                 break;
    //             }
    //         }
    //     }
    //     else if($step['type'] == "tool") {
    //         $tool_inputs = $step['tool_inputs'];
    //         foreach($tool_inputs as $tool_name => $tool_value) {
    //             if(!is_object($tool_value)) {
    //                 // search ui_inputs
                    
    //                 foreach($ui_inputs as $ui_input_array) {
    //                     if(array_key_exists($tool_name, $ui_input_array)) {
    //                         $parameters[$step_no][$tool_name] = $ui_input_array[$tool_name];
    //                         break;
    //                         //drupal_json_output($ui_input_array);
    //                         // exit;
    //                     }
    //                 }
                    
    //                 // $parameters[$step_no][$tool_name] = $tool_value;
    //             }
    //             else {
    //                 foreach($step_indexes as $step_indexes_arr_index => $step_indexes_arr_details) {
    //                     $step_indexes_arr_details = get_object_vars($step_indexes_arr_details);

    //                     if($step_indexes_arr_details['name'] == $tool_name) {
    //                         $parameters[$step_no][$tool_name] = $step_indexes_arr_details['params'];
    //                         break;
    //                     }
    //                 }
    //             }
    //         }

    //     }
    // }
    
    $workflow_submit_values['parameters'] = $parameters;
    $workflow_submit_values['inputs'] = $inputs;
    
    /*
    $workflow_submit_values['step_indexes'] = $step_indexes;
    $workflow_submit_values['ui_inputs'] = $ui_inputs;
    */

    /*
    drupal_json_output($workflow_submit_values);
    exit;
    */
    
    
    


    global $user;
    global $base_url;
    
    $invocation = $galaxy_workflows->invoke($workflow_submit_values);
    
    $results['response'] = 'success';
    $results['workflow_submit_values'] = $workflow_submit_values;
    if(!$invocation) {
        $error = $galaxy->getError();
        $results['response'] = 'error';
        $results['error_message'] = $error;

        $record = array(
            'type' => 'galaxy',
            'uid' => $user->uid,
            'invocation_id' => $invocation['id'],
            'workflow_name' => $workflow_name,
            'results' => serialize($invocation),
            'status' => 'error',
            'submit_args' => serialize($workflow_submit_values),
            'galaxy_id' => $galaxy_id,
        );
        drupal_write_record('cartogratree_analysis', $record);

    }
    else {
        $results['invocation'] = $invocation;

        $record = array(
            'type' => 'galaxy',
            'uid' => $user->uid,
            'invocation_id' => $invocation['id'],
            'workflow_name' => $workflow_name,
            'results' => serialize($invocation),
            'status' => 'invoked',
            'submit_args' => serialize($workflow_submit_values),
            'galaxy_id' => $galaxy_id,
        );
        drupal_write_record('cartogratree_analysis', $record); 

        // Send email
        $params = array();
        $to = $user->mail;
        $from = variable_get('site_mail', '');
        $params['subject'] = "Cartograplant Analysis " . $workflow_name . " - Processing";
      

        // $params['base_url'] = $base_url;
        //$logo_link = $base_url . '/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/resources_imgs/cp_logo.png';
        //$params['body'] = '<img style="width: 150px; height: auto;" src="' . $logo_link . '" /><br />';
        $params['body'] = "Congratulations! Your " . $workflow_name . " analysis has been submitted to Galaxy and is being processed!\n";
        
        $job_link = $base_url . '/cartogratree?job_id=' . $invocation['id'];
        $params['body'] .= "You can view the status of your analysis progress by clicking the link below:\n";
        $params['body'] .= $job_link . "\n\n";
        $params['body'] .= "TreeGenes / Cartograplant";
        //$params['headers'][] = 'MIME-Version: 1.0';
        //$params['headers'][] = 'Content-type: text/html; charset=iso-8859-1';
      
        drupal_mail('cartogratree', 'analysis_running', $to, user_preferred_language($user), $params, $from, TRUE);
      
    }
    
    // $results = cartogratree_analysisapi_masquerade_workflow($galaxy_id, $workflow_id, $workflow_submit_values);
    drupal_json_output($results);



}

function cartogratree_analysisapi_get_history_details($galaxy_id, $history_id) {
    require_once (libraries_get_path('blend4php') . '/galaxy.inc');
    // connect to the Galaxy instance
    $galaxy = tripal_galaxy_get_connection($galaxy_id);
    $histories = new GalaxyHistories($galaxy);
    $history = $histories->show(['history_id' => $history_id]);
    $history_contents = new GalaxyHistoryContents($galaxy);
    $history_content = $history_contents->index(['history_id' => $history_id]);

    $datasets = [];//new array

    foreach($history_content as $history_content_item) {
        // print_r($history_content_item);
        if($history_content_item['deleted'] == false) {
            $galaxy_datasets = new GalaxyDatasets($galaxy);
            // $galaxy_dataset = $galaxy_datasets->show(['dataset_id' => $galaxy_content_item['dataset_id']]);
            $galaxy_dataset = $galaxy_datasets->show(['dataset_id' => $history_content_item['id']]);
            
            $content_params['history_id'] = $history_id;
            $content_params['id'] = $galaxy_dataset['id'];
            $content = $history_contents->show($content_params);
            // $output_array['name'] = $content['name'];
            // $output_array['file_ext'] = $content['file_ext'];
            // $output_array['file_size'] = $content['file_size'];
            // $output_array['state'] = $content['state'];
            /*
            $debug[] = $galaxy_dataset;
            $key = array(
                'src' => $galaxy_dataset['hda_ldda'],
                'id' => $galaxy_dataset['id'],
            );
            $controls[$control_id]['options'][json_encode($key)] = $galaxy_content_item['name'];
            */
            $new_item = array(
                'dataset_name' => $history_content_item['name'],
                'dataset_id' => $galaxy_dataset['id'],
                'dataset_url' => $output_array['download_url'] =  $galaxy->getURL() . '/api/histories/' . $history_id . '/contents/' . $galaxy_dataset['id'] . '/display?to_ext=' . $content['file_ext'] . '&key=' . $galaxy->getAPIKey(),
                'dataset_size' => $content['file_size']
            );
            $datasets[] = $new_item;
        }        
    }
    // drupal_json_output($history_content);
    drupal_json_output($datasets);
}

function cartogratree_analysisapi_delete_history_content_id($galaxy_id, $history_id, $content_id) {
    require_once (libraries_get_path('blend4php') . '/galaxy.inc');
    // connect to the Galaxy instance
    $galaxy = tripal_galaxy_get_connection($galaxy_id);
    $histories = new GalaxyHistories($galaxy);
    $history = $histories->show(['history_id' => $history_id]);
    $history_contents = new GalaxyHistoryContents($galaxy);
    $history_content = $history_contents->index(['history_id' => $history_id]);
    
    drupal_json_output($history_contents->delete(['history_id' => $history_id, 'id' => $content_id, 'purge' => true]));
}

function cartogratree_analysisapi_get_latest_job_details($galaxy_id, $history_id) {
    require_once (libraries_get_path('blend4php') . '/galaxy.inc');
    // connect to the Galaxy instance
    $galaxy = tripal_galaxy_get_connection($galaxy_id);
    $galaxy_jobs = new GalaxyJobs($galaxy);
    $jobs_ids = $galaxy_jobs->index(['history_id' => $history_id, 'state' => 'ok']);

    drupal_json_output($jobs_ids);
}

// This function actually does multiple things
// 1. Get the invocation details which contains job_id(s)
// 2. Gets the above job details using the job_id which contains output file ids
// 3. Gets direct links to the output file ids
function cartogratree_analysisapi_get_invocation_outputs($galaxy_id, $history_id, $workflow_id, $invocation_id, $output_type = 'web') {
    $results = array();
    require_once (libraries_get_path('blend4php') . '/galaxy.inc');
    // connect to the Galaxy instance
    $galaxy = tripal_galaxy_get_connection($galaxy_id);
    
    // 1. Get the invocation details which contains job_id(s)
    $galaxy_workflows = new GalaxyWorkflows($galaxy);
    $invocation = $galaxy_workflows->showInvocations([
        'workflow_id' => $workflow_id,
        'invocation_id' => $invocation_id,
    ]);


    $results['invocation_id'] = $invocation['id'];
    $results['invocation_state'] = $invocation['state'];
    

    $job_ids = array();
    $steps = $invocation['steps'];
    foreach($steps as $index => $step_array) {
        if(isset($step_array['job_id'])) {
            $job_ids[] = $step_array['job_id'];
        }
    }

    $results['invocation'] = $invocation;

    $results['job_ids'] = $job_ids;

    // 2. Gets the above job details using the job_id which contains output file ids
    $output_file_ids = array();

    $job_states = array();
    $galaxy_jobs = new GalaxyJobs($galaxy);
    foreach($job_ids as $job_index => $job_id) {
        $job_details = $galaxy_jobs->show(['job_id' => $job_id]);
        $job_states[] = $job_details['state'];
        $outputs = $job_details['outputs'];
        foreach($outputs as $output_key => $output_array) {
            if(isset($output_array['id'])) {
                $output_file_ids[] = $output_array['id'];
            }
        }
    }

    $results['job_states'] = $job_states;
    $results['output_file_ids'] = $output_file_ids;


    // 3. Gets direct links to the output file ids
    $galaxy_history_contents = new GalaxyHistoryContents($galaxy);




    $output_details = array();
    foreach ($output_file_ids as $file_id) {
        $content_params['history_id'] = $history_id;
        $content_params['id'] = $file_id;
        $content = $galaxy_history_contents->show($content_params);
        $output_array = array();
        $output_array['history_id'] = $history_id;
        $output_array['file_id'] = $file_id;
        $output_array['api_key'] = $galaxy->getAPIKey();
        $output_array['name'] = $content['name'];
        $output_array['file_ext'] = $content['file_ext'];
        $output_array['file_size'] = $content['file_size'];
        $output_array['state'] = $content['state'];

        $output_array['download_url'] =  $galaxy->getURL() . '/api/histories/' . $history_id . '/contents/' . $file_id . '/display?to_ext=' . $content['file_ext'] . '&key=' . $galaxy->getAPIKey();
        $output_details[] = $output_array;


        /*
        // This didn't do what I wanted to do which is also get the name of the file
        $params['url_only'] = TRUE;
        $params['history_id'] = $history_id;
        $params['history_content_id'] = $file_id;
        $link = $galaxy_history_contents->download_history_content($params); 
        $links[] = $link; 
        */
    }
    $results['output_details'] = $output_details;
    //print_r($results);
    if($output_type == 'web') {
        drupal_json_output($results);
    }
    else if ($output_type == 'cron') {
        return $results;
    }

}

function cartogratree_analysisapi_get_job_details($galaxy_id, $job_id) {
    require_once (libraries_get_path('blend4php') . '/galaxy.inc');
    // connect to the Galaxy instance
    $galaxy = tripal_galaxy_get_connection($galaxy_id);    
    $galaxy_jobs = new GalaxyJobs($galaxy);
    $job_details = $galaxy_jobs->show(['job_id' => $job_id]);
    drupal_json_output($job_details);

}

function cartogratree_analysisapi_get_invocation_details($galaxy_id, $workflow_id, $invocation_id) {
    require_once (libraries_get_path('blend4php') . '/galaxy.inc');
    // connect to the Galaxy instance
    $galaxy = tripal_galaxy_get_connection($galaxy_id);    
    $gworkflows = new GalaxyWorkflows($galaxy);
    $invocation = $gworkflows->showInvocations([
        'workflow_id' => $workflow_id,
        'invocation_id' => $invocation_id,
    ]);  
    drupal_json_output($invocation);  
}

function cartogratree_analysisapi_download_historycontents_file($galaxy_id, $history_id, $history_file_id) {
    require_once (libraries_get_path('blend4php') . '/galaxy.inc');
    // connect to the Galaxy instance
    $galaxy = tripal_galaxy_get_connection($galaxy_id);    
     // Get the history contents for this history.
    $ghistory_contents = new GalaxyHistoryContents($galaxy);
    $history_contents = $ghistory_contents->index([
      'history_id' => $history_id,
    ]);

    $params['url_only'] = FALSE;
    $params['history_id'] = $history_id;
    $params['history_content_id'] = $history_file_id;
    $link = $ghistory_contents->download_history_content($params); 
    drupal_json_output($link);   
}

/**
 * This doesn't work the way it should - I think it's because Tripal Galaxy module stores information differently
 * as in different history name formats etc. Even though a submission is created, it never gets updated.
 */
function cartogratree_analysisapi_masquerade_workflow($galaxy_id, $workflow_id, $workflow_submit_values) {
    global $user;

    // connect to the Galaxy instance
    $galaxy = tripal_galaxy_get_connection($galaxy_id);
    // get the workflow inputs
    $galaxy_workflows = new GalaxyWorkflows($galaxy);
    // $galaxy_workflow = $galaxy_workflows->show(['workflow_id' => $workflow_id]);      

    // Get Galaxy Workflow ID
    $records = db_query('
    SELECT	*
    FROM	{tripal_galaxy_workflow} as t1
    WHERE	workflow_id=:workflow_id', array(':workflow_id' => $workflow_id))->fetchObject();
    $galaxy_workflow_id = $records->galaxy_workflow_id;

    $records = db_query('
    SELECT	t1.*
    FROM	{tripal_galaxy_workflow} as t1
    JOIN	{tripal_galaxy} as t2 using (galaxy_id)
    WHERE	galaxy_workflow_id=:galaxy_workflow_id', array(':galaxy_workflow_id' => $galaxy_workflow_id))->fetchObject();

    // masquerade as TripalGalaxy workflow
    $sid = db_query("SELECT MAX(sid) as max_sid FROM webform_submissions")->fetchCol()[0] + 1;
    $nid = $records->nid;
    
    $serial = db_query("SELECT MAX(serial) as max_serial FROM webform_submissions WHERE nid = " . $nid)->fetchCol()[0] + 1;
    $time = (int) $_SERVER['REQUEST_TIME'];
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
    $invocation = $galaxy_workflows->invoke($workflow_submit_values);

    $results = array();
    $results['response'] = 'success';
    $results['workflow_submit_values'] = $workflow_submit_values;    

    if(!$invocation) {
        $error = $galaxy->getError();
        $results['response'] = 'error';
        $results['error_message'] = $error;

        $record = array (
            'sid' => $sid,
            'uid' => $user->uid,
            'galaxy_workflow_id' => $galaxy_workflow_id,
            'errors' => $error['message'],
            'status' => 'Error',
            'submit_date' => $time,
        );
        drupal_write_record('tripal_galaxy_workflow_submission', $record);
        tripal_galaxy_send_submission_failed_mail($sid, $user->uid);
    }
    else {
        $results['invocation'] = $invocation;
        /*
        drupal_set_message("Job 'Galaxy Workflow #" . $sid . "' submitted.");
        drupal_set_message("Check the " . l('jobs page', 'admin/tripal/tripal_jobs') . " for status.");
        drupal_set_message("You can execute the job queue manually on the command line using the following Drush command:");
        drupal_set_message("drush trp-run-jobs --username=" . $user->mail . " --root=" . DRUPAL_ROOT);
        drupal_set_message("Your job is successfully submitted to the job queue! You will be notified by email when your job begins and completes.");
        */
        $record = array (
            'sid' => $sid,
            'uid' => $user->uid,
            'galaxy_workflow_id' => $galaxy_workflow_id,
            'status' => 'Submitted',
            'submit_date' => $time,
            'start_time' => $time,
            'invocation_id' => $invocation['id'],
        );
        drupal_write_record('tripal_galaxy_workflow_submission', $record);
        tripal_galaxy_send_submission_start_mail($sid, $user->uid);
    } 
    return $results;   
}
?>