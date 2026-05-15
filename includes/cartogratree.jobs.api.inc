<?php

function cartogratree_jobsapi_get_nextflow_user_jobs($page_no) {
    global $user;
    $user_id = $user->uid;

    $items_limit = 10;
    $offset = ($page_no - 1) * $items_limit;
    $c1 = 0;
    $records_count = db_query('
        SELECT count(*) as c1
        FROM public.cartogratree_analysis_index WHERE user_id = :uid', 
        array(
            ':uid' => $user_id
        )
    );
    foreach ($records_count as $row_count) {
        // $row->api_key = "protected";
        $c1 = $row_count->c1;
    }

    $records = db_query('
        SELECT * 
        FROM public.cartogratree_analysis_index 
        WHERE user_id = :uid
        ORDER BY analysis_id DESC LIMIT ' . $items_limit . ' OFFSET :offset', 
        array(
            ':offset' => $offset,
            ':uid' => $user_id
        )
    );

    
    $results = array();
    $user_analysis_rows = array();
    foreach ($records as $row) {
        // $row->api_key = "protected";
        $row_array = (array) $row;

        $analysis_directory = '/isg/treegenes/cartograplant_analysis/' . $row->analysis_id;

        $vcfmerge_directory = $analysis_directory . '/variant-filtering-pipeline/vcf-merge';
        $vcfmerge_completion_message_file = $vcfmerge_directory . '/completion_message.json';
        if (file_exists($vcfmerge_completion_message_file)) {
            $completion_message_content = file_get_contents($vcfmerge_completion_message_file);
            $completion_message_array = json_decode($completion_message_content, true);
            $row_array['vcfmerge_completion_message'] = $completion_message_array;
            // Remove /isg/treegenes from the commandLine if it exists
            if (isset($row_array['vcfmerge_completion_message']['commandLine'])) {
                // Check if there is a payload.json file in the $row_array['vcfmerge_completion_message']['commandLine'] using regex and get the exact location
                $payload_location = null;
                if (preg_match('/--input (.*payload.json)/', $row_array['vcfmerge_completion_message']['commandLine'], $matches)) {
                    $payload_location = $matches[1];
                }
                // $row_array['payload_location'] = $payload_location;
                if ($payload_location) {
                    $row_array['payload'] = file_get_contents($payload_location);
                }
                else {
                    $row_array['payload'] = null;
                }

                $row_array['vcfmerge_completion_message']['commandLine'] = str_replace('/isg/treegenes', '', $row_array['vcfmerge_completion_message']['commandLine']);
            }
        } else {
            $row_array['vcfmerge_completion_message'] = null;
        }

        $popstruct_directory = $analysis_directory . '/popstruct';
        $popstruct_completion_message_file = $popstruct_directory . '/completion_message.json';
        if (file_exists($popstruct_completion_message_file)) {
            $completion_message_content = file_get_contents($popstruct_completion_message_file);
            $completion_message_array = json_decode($completion_message_content, true);
            $row_array['popstruct_completion_message'] = $completion_message_array;
            // Remove /isg/treegenes from the commandLine if it exists
            if (isset($row_array['popstruct_completion_message']['commandLine'])) {
                // Check if there is a payload.json file in the $row_array['popstruct_completion_message']['commandLine'] using regex and get the exact location
                $payload_location = null;
                if (preg_match('/--input (.*payload.json)/', $row_array['popstruct_completion_message']['commandLine'], $matches)) {
                    $payload_location = $matches[1];
                }
                // $row_array['payload_location'] = $payload_location;
                if ($payload_location) {
                    $row_array['payload'] = file_get_contents($payload_location);
                }
                else {
                    $row_array['payload'] = null;
                }

                $row_array['popstruct_completion_message']['commandLine'] = str_replace('/isg/treegenes', '', $row_array['popstruct_completion_message']['commandLine']);
            }
        } else {
            $row_array['popstruct_completion_message'] = null;
        }

        $gwas_directory = $analysis_directory . '/gwas-pipeline';
        $gwas_completion_message_file = $gwas_directory . '/completion_message.json';
        if (file_exists($gwas_completion_message_file)) {
            $completion_message_content = file_get_contents($gwas_completion_message_file);
            $completion_message_array = json_decode($completion_message_content, true);
            $row_array['gwas_completion_message'] = $completion_message_array;
            // Remove /isg/treegenes from the commandLine if it exists
            if (isset($row_array['gwas_completion_message']['commandLine'])) {
                // Check if there is a payload.json file in the $row_array['gwas_completion_message']['commandLine'] using regex and get the exact location
                $payload_location = null;
                if (preg_match('/--input (.*payload.json)/', $row_array['gwas_completion_message']['commandLine'], $matches)) {
                    $payload_location = $matches[1];
                }
                // $row_array['payload_location'] = $payload_location;
                if ($payload_location) {
                    $row_array['payload'] = file_get_contents($payload_location);
                }
                else {
                    $row_array['payload'] = null;
                }

                $row_array['gwas_completion_message']['commandLine'] = str_replace('/isg/treegenes', '', $row_array['gwas_completion_message']['commandLine']);
            }
        } else {
            $row_array['gwas_completion_message'] = null;
        }

        array_push($user_analysis_rows, $row_array);
    }

    // Go through each 

    $results['analysis'] = $user_analysis_rows;
    $results['total_count'] = $c1;
    $results['page_no'] = $page_no;
    $results['items_limit'] = $items_limit;
    drupal_json_output($results);
}

function cartogratree_jobsapi_get_user_jobs($page_no) {
    global $user;
    $items_limit = 10;
    $offset = ($page_no - 1) * $items_limit;

    $c1 = 0;
    $records_count = db_query('
		SELECT count(*) as c1
        FROM public.cartogratree_analysis WHERE uid = :uid', 
		array(
            ':uid' => $user->uid
        )
	);  
    foreach ($records_count as $row_count) {
        // $row->api_key = "protected";
        $c1 = $row_count->c1;
    }     

    $records = db_query('
		SELECT * 
        FROM public.cartogratree_analysis 
        WHERE uid = :uid
        ORDER BY id DESC LIMIT 10 OFFSET :offset', 
		array(
            ':offset' => $offset,
            ':uid' => $user->uid
        )
	);
    
    $results = array();
    $jobs_rows = array();
    foreach ($records as $row) {
        // $row->api_key = "protected";
        $row->submit_args = json_encode(unserialize($row->submit_args));
        $row->results = json_encode(unserialize($row->results));
        array_push($jobs_rows, $row);
    }
    $results['jobs'] = $jobs_rows;
    $results['total_count'] = $c1;
    $results['page_no'] = $page_no;
    $results['items_limit'] = $items_limit;
    drupal_json_output($results);
}


?>