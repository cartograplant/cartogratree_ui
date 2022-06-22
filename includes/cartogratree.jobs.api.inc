<?php

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