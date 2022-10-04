<?php



/**
 * Inform Ultimate Cron about cron jobs.
 *
 * Note that the result of this hook is cached.
 *
 * @return array
 *   Array of cron jobs, keyed by name.
 *    - "title": (optional) The title of the cron job. If not provided, the
 *      name of the cron job will be used.
 *    - "file": (optional) The file where the callback lives.
 *    - "module": The module where this job lives.
 *    - "file path": (optional) The path to the directory containing the file
 *      specified in "file". This defaults to the path to the module
 *      implementing the hook.
 *    - "callback": (optional) The callback to call when running the job.
 *      Defaults to the job name.
 *    - "callback arguments": (optional) Arguments for the callback. Defaults
 *      to array().
 *    - "enabled": (optional) Initial state of the job. Defaults to TRUE.
 *    - "tags": (optional) Tags for the job. Defaults to array().
 *    - "settings": (optional) Default settings (plugin type) for this job.
 *      Example of a job declaring some default settings for a plugin called
 *      "some_plugin":
 *      'settings' => array(
 *        'some_plugin' => array(
 *          'some_value' => 60,
 *        ),
 *      ),
 *    - "scheduler": (optional) Default scheduler (plugin type) for this job.
 *      Example of a job using the crontab scheduler as default:
 *      'scheduler' => array(
 *        'name' => 'crontab',
 *        'crontab' => array(
 *          'rules' => array('* * * * *'),
 *        ),
 *      ),
 *    - "launcher": (optional) Default launcher (plugin type) for this job.
 *      Example of a job using the serial launcher as default:
 *      'launcher' => array(
 *        'name' => 'serial',
 *        'serial' => array(
 *          'thread' => 'any',
 *        ),
 *      ),
 *    - "logger": (optional) Default logger (plugin type) for this job.
 *      Example of a job using the cache logger as default:
 *      'logger' => array(
 *        'name' => 'cache',
 *        'cache' => array(
 *          'bin' => 'mycachebin',
 *        ),
 *      ),
 */
function cartogratree_cronapi() {
    $items = array();
  
    $items['cartogratree_analysis_job_status_checker'] = array(
      'title' => t('Cartogratree Analysis Job Status Checker and Updater'),
      'file' => 'cartogratree.cron.api.inc',
      'file path' => drupal_get_path('module', 'cartogratree') . '/includes/',
      'callback' => 'cartogratree_cron_job_status_checker_updater',
      'callback arguments' => array('cronjob1'),
      'enabled' => FALSE,
      'tags' => array('cartogratree analysis job job'),
      'scheduler' => array(
        'name' => 'crontab',
        'crontab' => array(
          'rules' => array('*/3+@ * * * *'),
        ),
      ),
    );

    return $items;

}

function cartogratree_cron_job_status_checker_updater() {
    // WATCHDOG_ERROR WATCHDOG_INFO WATCHDOG_NOTICE WATCHDOG
    UltimateCronLogger::log('status', "Status checker updater was initialized successfully\n", WATCHDOG_INFO); 

    // We need to get all jobs with status as 'invoking'
    $jobs_rows = db_query('SELECT * FROM cartogratree_analysis WHERE status ILIKE :status', array(
        ':status' => 'invoked'
    ));

    UltimateCronLogger::log('status', 'Found ' . $jobs_rows->rowCount() . " analysis with status: invoked\n", WATCHDOG_INFO);
    foreach($jobs_rows as $jobs_row) {
        // each job perform a lookup to see whether the job is completed
        $galaxy_id = $jobs_row->galaxy_id;
        $invocation_id = $jobs_row->invocation_id;

        $submit_args = unserialize($jobs_row->submit_args);
        $history_id = $submit_args['history_id'];
        $workflow_id = $submit_args['workflow_id'];

        $arr_results = cartogratree_analysisapi_get_invocation_outputs($galaxy_id, $history_id, $workflow_id, $invocation_id, 'cron');
        // UltimateCronLogger::log('status', print_r($arr_results, true) . "\n", WATCHDOG_INFO);

        $job_completed = true;
        foreach ($arr_results['job_states'] as $tmp_state) {
            if($tmp_state == "ok" || $tmp_state == "error" || $tmp_state == "paused" || $tmp_state == "discarded" || $tmp_state == "deleted") {
                // still defaulting to $job_completed = true above
            }
            else {
                // galaxy invocation still running
                $job_completed = false;
            }
        }

        

        if($job_completed == true) {
            // update the record row status
            db_query('UPDATE cartogratree_analysis SET status = :status WHERE invocation_id = :invocation_id', array(
                ':status' => 'finished',
                ':invocation_id' => $invocation_id,
            ));
            UltimateCronLogger::log('status', "This analysis completed successfully so sending an email to user.\n", WATCHDOG_INFO);

            global $base_url;
            // Send email
            $user = user_load($jobs_row->uid);
            $params = array();
            $to = $user->mail;
            $from = variable_get('site_mail', '');
            $params['subject'] = "Cartograplant Analysis " . $jobs_row->workflow_name .  " - Finished!";
        

            // $params['base_url'] = $base_url;
            //$logo_link = $base_url . '/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/resources_imgs/cp_logo.png';
            //$params['body'] = '<img style="width: 150px; height: auto;" src="' . $logo_link . '" /><br />';
            $params['body'] = "Congratulations! Your " . $jobs_row->workflow_name . " analysis has finished!\n";
            
            $job_link = $base_url . '/cartogratree?job_id=' . $invocation_id;
            $params['body'] .= "You can view the status of your analysis by clicking the link below:\n";
            $params['body'] .= $job_link . "\n\n";
            $params['body'] .= "TreeGenes / Cartograplant";
            //$params['headers'][] = 'MIME-Version: 1.0';
            //$params['headers'][] = 'Content-type: text/html; charset=iso-8859-1';
        
            drupal_mail('cartogratree', 'analysis_finished', $to, user_preferred_language($user), $params, $from, TRUE);            
        }
        else {
            UltimateCronLogger::log('status', "This analysis is still running so we wait for the next cron to check status.\n", WATCHDOG_INFO);
        }

        
    }

    // return;
}
?>