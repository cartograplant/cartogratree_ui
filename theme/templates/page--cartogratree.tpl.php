<?php
/**
* @file
* Theme implementation to display the CartograTree page.
*/

	if (!user_access('use cartogratree')) {
		return;
	}
	print $messages;
	//    dpm($variables);

?>

<!--````01010101....01010....0101010....101010101...101010...1010101010..1010101......01010...........101010101..0101010....0101010..1010101```````-->
<!--```010...010...010.010...010...010..101010101..101..101..101.........101...010...010.010..........101010101..010...010..010......101....```````-->
<!--```010........010...010..010...010.....101.....101..101..101..10101..101...010..010...010............101.....010...010..0101010..1010101```````-->
<!--```010........010101010..0101010.......101.....101..101..101..10101..1010101....010101010............101.....0101010....0101010..1010101```````-->
<!--```010...010..010...010..010...010.....101.....101..101..101....101..101...010..010...010............101.....010...010..010......101....```````-->
<!--````01010101..010...010..010...010.....101......101010...1010101010..101...010..010...010............101.....010...010..0101010..1010101```````-->

<?php print render($page['content_top']); ?>

<!-- Bootstrap Top Navbar -->
<nav class="navbar navbar-expand-md navbar-dark bg-success fixed-top">
    <button class="navbar-toggler navbar-toggler-right" type="button" data-toggle="collapse" data-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
    <span class="navbar-toggler-icon"></span>
    </button>
    <a class="navbar-brand" href="#">
    	<img id="tg-logo" style="height: 45px; width: auto;" src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/resources_imgs/cp_logo.png">
    </a>
    <div class="collapse navbar-collapse" id="navbarNavDropdown">
        <ul class="navbar-nav">			
			<!--
            <li class="nav-item">
                <a class="nav-link" href="#">
					<i class="fas fa-file-download"></i> Export
				</a>
            </li>
			-->
            <li class="nav-item">
                <a class="nav-link" href="#" data-toggle="modal" data-target="#about">
					<i class="fas fa-info-circle"></i> About
				</a>
            </li>
            <li class="nav-item">
				<?php
                	if($variables['logged_in']){
                		echo '<a class="nav-link" id="analysis-btn" href="#">';					
					}
					else{
                		echo '<a class="nav-link disabled" id="analysis-btn" href="#">';
					}
				?>
                    <i class="fas fa-chart-bar"></i> Analyze
                </a>
            </li>
            <li class="nav-item">
				<?php
                	if($variables['logged_in']){
                		echo '<a class="nav-link" id="jobs-btn" href="#">';					
					}
					else{
                		echo '<a class="nav-link disabled" id="jobs-btn" href="#">';
					}
				?>
                    <i class="fas fa-flask"></i> Jobs
                </a>
            </li>	

            <!-- <li class="nav-item">
                <a id="link_take_screenshot" class="nav-link" href="#">
					<i class="fas fa-camera"></i> Take screenshot
				</a>
			</li> -->
			
            <!-- This menu is hidden in bigger devices, will show up on small screens. 
                <li class="nav-item dropdown d-sm-block d-md-none">
                    <a class="nav-link dropdown-toggle" href="#" id="smallerscreenmenu" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                      Menu
                    </a>
                    <div class="dropdown-menu" aria-labelledby="smallerscreenmenu">
                        <a class="dropdown-item" href="#">Map options</a>
                        <a class="dropdown-item" href="#">Species Filter</a>
                        <a class="dropdown-item" href="#">Genus Filter</a>
                        <a class="dropdown-item" href="#">Family Filter</a>
                    </div>
                </li>
                -->
            <!-- Smaller devices menu END -->
        </ul>
        <ul class="navbar-nav ml-auto">
            <li class="nav-item dropdown">
                <?php
                    if($variables['logged_in']){
                    	echo '<a class="nav-link" href="#" id="#user-nav" data-toggle="dropdown" aria-expanded="false" aria-haspopup="true">';
                     	echo '<i class="fas fa-user-astronaut fa-2x text-success"></i><b> ' . $variables['username'] . ' </b><i class="fas fa-caret-down"></i></a>';
                      	echo '<div class="dropdown-menu" id="user-dropdown-profile" aria-labelledby="user-nav">';
						echo '<a class="dropdown-item" href="/ct" target="_blank"><i class="fas fa-address-card"></i> Profile Page</a>';
                      	echo '<a class="dropdown-item" href="#" id="view-saved-session"><i class="fas fa-list"></i> Saved Sessions</a>';
                      	echo '<a class="dropdown-item" href="#" data-toggle="modal" data-target="#view-dev-config"><i class="fas fa-code"></i> Dev</a>';
                    	echo '<div class="dropdown-divider"></div><a class="dropdown-item" id="logout-btn" href="#"><i class="fas fa-sign-out-alt"></i> Logout</a></div>';
                    }
                    else{
                    	echo '<a class="nav-link" href="/user/login/?destination=cartogratree" id="user-nav"><i class="fas fa-user-circle"></i> <b>Login</b></a>';
                    }
            	?>
            </li>
        </ul>
    </div>
</nav>
<!-- Top Navbar END -->

<!-- Modal popups-->
<div class="modal fade" id="view-dev-config" tabindex="-1" role="dialog" arai-labelledby="view-dev-config" aria-hidden="true">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Developer API Key</h3>
                <button type="button" class="close close-user-save-form" data-dismiss="modal" aria-label="close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
				<div class="row">
					<div class="col-10">
						<input id="api-key-holder" style="width: 100%" value=
							<?php 
								echo $variables['token'];
							?>
						>
					</div>
					<div class="col-2">
						<button class="btn btn-info" id="copy-api-key">Copy</button>
					</div>
				</div>
				
				<hr />

				<h4>This API key is to be used for development purposes only. To view the API documentation please go to: </h4>
				<a href="https://cartogratree.readthedocs.io/en/latest/dev.html#cartogratree-api-reference" target="_blank">https://cartogratree.readthedocs.io</a>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-danger" id="regenerate-api-key">Regenerate API Key</button>
                <button type="button" class="btn btn-secondary close-user-save-form" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>


<!-- save queries popup -->
<div class="modal fade" id="save-user-session" tabindex="-1" role="dialog" arai-labelledby="save-user-session" aria-hidden="true">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title" id="save-session-header">Save Session</h3>
                <button type="button" class="close close-user-save-form" data-dismiss="modal" aria-label="close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                </select> 
                <form id="save-session-form">
                    <div class="form-group">
                        <label class="col-form-label">Title</label>
                        <input type="text" class="form-control" maxlength="45" id="save-session-title">
                    </div>
                    <div class="form-group">
                        <label class="col-form-label">Comments</label>
                        <textarea class="form-control" id="save-session-comments" maxlength="300"></textarea>
                    </div>
                </form>
                <div id="save-success-container" class="hidden text-center text-success">
                    <h3 id="save-success-message">Session successfully saved. Copy and paste the link below to go back to this session, or view all your saved sessions from the dropdown link located below your name at the top right portion of the navbar.</h3>
					<a class="session-url" href="#"></a>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary close-user-save-form" data-dismiss="modal">Close</button>
                <button type="submit" class="btn btn-success" id="submit-user-session">Save Session</button>
            </div>
        </div>
    </div>
</div>

<!--user saved config-->
<div class="modal fade" aria-hidden="true" tabindex="-1" role="dialog" id="saved-session">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title" id="saved-session-title"><b>Your saved sessions</b></h4>                 
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <div class="list-group list-group-flush" id="saved-session-list"> 
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary load-old-session" disabled>Load</button>
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>


<div class="modal fade" aria-hidden="true" tabindex="-1" role="dialog" id="save-success">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
				<h4>Session Saved</h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
				<h5>Your session was saved! Copy and Pase the link below at any time to come back to this current session"</h5>
				<hr />
				<a class="session-url" href="#"></a>
				<hr />
				<p>If you would like to save sessions to your account, then please log in.</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>


<!-- Analysis form -->
<div class="modal fade" id="analysis-form" tabindex="-1" role="dialog" aria-labelledby="analyzeMap" aria-hidden="true">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title" id="cartogratreeTitle">
					<img id="ct-logo" src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/resources_imgs/cp_logo.png">
					Analysis
				</h3>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
				<ul class="nav nav-tabs nav-fill">
					<li class="nav-item">
						<a id='analysis-initial-configuration-tab' class="nav-link analysis-nav-tab analysis-initial-configuration active" data-toggle="tab" href="#analysis-initial-configuration">Begin</a>
					</li>				
					<li class="nav-item">
						<a id="analysis-overlapping-traits-tab" class="nav-link analysis-nav-tab analysis-overlapping-traits" data-toggle="tab" href="#analysis-overlapping-traits">Filter By Traits</a>
					</li>	
					<li class="nav-item">
						<a id="analysis-overlapping-genotypes-tab" class="nav-link analysis-nav-tab analysis-overlapping-genotypes" data-toggle="tab" href="#analysis-overlapping-genotypes">Filter By Genotypic Data</a>
					</li>				
					<!-- analysis-overlapping-genotypes -->
					
					<li class="nav-item">
						<a class="nav-link analysis-nav-tab analysis-filter-snp-section" data-toggle="tab" href="#analysis-filter-snp">Filter By SNPs</a>
					</li>
					<li class="nav-item">
						<a class="nav-link analysis-nav-tab analysis-filter-indv-section" data-toggle="tab" href="#analysis-filter-indv">Filter By Individuals</a>
					</li>
					<li class="nav-item">
						<a id='analysis-retrieve-envdata-section-tab' class="nav-link analysis-nav-tab analysis-retrieve-envdata-section" data-toggle="tab" href="#analysis-retrieve-envdata-section">Add environmental data</a>
					</li>
					<li class="nav-item">
						<a id='analysis-create-analysis-section-tab' class="nav-link analysis-nav-tab analysis-create-analysis-section" data-toggle="tab" href="#analysis-create-analysis-section">Run Analysis</a>
					</li>					
					<!--
					<li class="nav-item">
						<a class="nav-link analysis-nav-tab analysis-map-state-section" data-toggle="tab" href="#analysis-map-state">Filter By Individuals</a>
					</li>
					<li class="nav-item">
						<a class="nav-link analysis-nav-tab analysis-options-section" data-toggle="tab" href="#analysis-options">Additional Options</a>
					</li>
					-->
					<li class="nav-item">
						<a class="nav-link analysis-nav-tab analysis-confirm-section" data-toggle="tab" href="#analysis-confirm">Summary and Confirm</a>
					</li>
				</ul>
	
				<div class="tab-content">
					<div id="analysis-initial-configuration" class="tab-pane fade in active">	
						<div class="analysis-tab-content">
							<div style="margin-bottom: 10px;">
								<div>Welcome!</div>
								<fieldset>
									<div id="analysis_id" value="-1"></div>
									<div>
										Analysis name: <input id="analysis_name" type="text" value="Untitled" />
										<button id="btn_update_analysis_name">Update</button>
									</div>
								</fieldset>
								<hr />
								
								
							</div>
							<div style="margin-bottom: 10px;">
								<div>To begin analyzing data, we strongly recommend creating a workspace.</div>
								<div>A workspace stores all your uploaded files so you can use (or reuse) them when running workflow analyses. Without a workspace, you can't select data files to be used when running analyses.</div>
							</div>
							<div style="margin-bottom: 10px;">
								<div style="display: flex; margin-bottom: 10px;">
									<div style="width: 25%;">Select analysis account</div><div style="width: 75%;"><select id="create-analysis-select-galaxy-account"></select></div>
								</div>
								<div style="display: flex; margin-bottom: 10px;">
									<div style="width: 25%;">Select workspace</div>
									<div style="width: 50%;"><select id="create-analysis-select-history"></select></div>
									<div style="width: 25%;"><button id="create-analysis-new-history-button">Create new workspace</button></div>
								</div>
								<div id="create-analysis-new-history-configuration" style="display: none; margin-bottom: 10px;">
									<div style="width: 25%; padding-left: 10px;">Workspace name</div>
									<div style="width: 75%">
										<input type="text" id="create-analysis-new-history-name" />
										<button id="create-analysis-new-history-name-button">Create</button>
									</div>
								</div>
								<div id="manage-history-contents">
								</div>							
							</div>																
						</div>
					</div>				
					<div id="analysis-overlapping-traits" class="tab-pane fade in inactive">	
						<div class="analysis-tab-content">
							<div style="margin-bottom: 10px;">
								<div>Filter By Traits</div>
							</div>
							<div style="margin-bottom: 10px;">
								<div id="analysis-overlapping-traits-studies"></div>
							</div>
							<div id="analysis-overlapping-traits-traits-list-container" style="margin-bottom: 10px;">
								<div style="display: flex;">
									<div id="analysis-overlapping-traits-traits-list-summary" style="width: 25%; margin-bottom: 10px;"></div>
									<div style="width: 75%;" id="studies_intersecting_traits_timer_div"></div>
								</div>
								<div id="analysis-overlapping-traits-traits-operation-container" style="margin-bottom: 10px;">
									<div style="margin-bottom: 10px;">
										<i class="fas fa-filter"></i> Filter trees using 
										<select id="analysis-overlapping-traits-traits-operation">
											<option value="union">UNION (combination)</option>
											<!-- <option value="intersect">INTERSECT (overlap only)</option> -->
										</select> on traits:
									</div>
									<div style="margin-bottom: 10px;">
										<span id="analysis-overlapping-traits-status"></span>
									</div>									
									<div style="margin-bottom: 10px;" id="analysis-overlapping-traits-traits-list"></div>
									<div style="margin-bottom: 10px;">
										<button id="analysis-overlapping-traits-filter-by-selected-phenotypes"><i class="fas fa-filter"></i> Filter</button>
										<button id="analysis-overlapping-traits-download-by-selected-phenotypes"><i class="fas fa-download"></i> Download</button>
									</div>
									<div style="margin-bottom: 10px;" id="analysis-overlapping-traits-filter-by-selected-phenotypes-results">

									</div>									
								</div>
							</div>
						</div>
					</div>
					<div id="analysis-overlapping-genotypes" class="tab-pane fade in inactive">	
						<div class="analysis-tab-content">
							<div style="margin-bottom: 10px;">
								<div><span>Filter By Genotypic Data</span><span style="float: right;" id="analysis_genotypes_overall_status"></span></div>
								<table style="width: 100%;">
									<tr>
										<td style="width: 60%; vertical-align: top;">
											<div id="analysis-overlapping-genotypes-detected-studies"></div>
											<div id="analysis-overlapping-genotypes-across-studies"></div>
											<hr />
											<div id="analysis-overlapping-genotypes-summary-insights"></div>
											<!--
											<span id="analysis-overlapping-genotypes-algorithm-status"><i class="fas fa-clock"></i> Awaiting download to begin calculations...</span><hr />
											<input type="checkbox" id="analysis_genotypes_select_snps" /> <span>SNPs found</span> <span id="analysis-overlapping-genotypes-snps-tree-count">Querying...</span><br />
											<input type="checkbox" id="analysis_genotypes_select_ssrs" /> <span>SSRS found</span> <span id="analysis-overlapping-genotypes-ssrs-tree-count">Querying...</span><br />
											-->
											<!--
											<hr />
											<span>Study types found</span> <span id="analysis-overlapping-genotypes-study-types">...</span>
											<hr />
											<span>Overlapping genotypes</span> <span id="analysis-overlapping-genotypes-overlapped">Awaiting data...</span>
											-->
										</td>
										<td style="width: 40%; vertical-align: top;">
											<div id="analysis-overlapping-genotypes-snp-venn-diagram">

											</div>										
											<div id="analysis-overlapping-genotypes-snp-grid-filter">

											</div>
										</td>
									</tr>
								</table>

							</div>
							<div style="margin-bottom: 10px;">
								<div id="analysis-overlapping-genotypes"></div>
							</div>
						</div>
					</div>
					<div id="analysis-filter-snp" class="tab-pane fade in">
						<div class="analysis-tab-content">
							<div class="row">
								<div class="col">
									<div id="snp-chart"></div>
								</div>
								<div class="col">
									<div class="form-row align-items-center">
										<div class="col-9 my-1">
											<h3 id="chart-loading" class="hidden">Loading...</h3>
											<div id="analysis-filter-snp-progressbar"></div>
											<div id="analysis-filter-snp-progressbar-status" style="text-align: center; font-size: 12px; margin-bottom: 10px;"></div>
											<label class="mr-sm-2" for="inlineFormCustomSelect">Choose threshold to keep</label>
											<select class="custom-select mr-sm-2" id="snp-threshold-missing" style="width: 80% !important">
											</select>
											<button style="margin-top: 10px; " id="filter-chart" class="btn btn-primary">Submit</button>
										</div>
										<div class="col my-1">
											  
										</div>
									</div>
								</div>
							</div>
						</div>
						<hr />
						<button type="button" class="btn btn-info right-btn analysis-form-next">Next</button>
					</div>

					<div id="analysis-filter-indv" class="tab-pane fade">
						<div class="analysis-tab-content">
							<!--
							<h3 id="chart-loading" class="hidden">Loading...</h3>
							<div class="row">
								<div class="col">
									<div id="snp-chart"></div>
								</div>
								<div class="col">
									<div class="form-row align-items-center">
										<div class="col-9 my-1">
											<label class="mr-sm-2" for="inlineFormCustomSelect">Choose threshold to keep</label>
											<select class="custom-select mr-sm-2" id="snp-threshold-missing" style="width: 80% !important">
											</select>
										</div>
										<div class="col my-1">
											  <button id="filter-chart" class="btn btn-primary">Submit</button>
										</div>
									</div>
								</div>
							</div>
							-->
						</div>
						<hr />
						<button type="button" class="btn btn-info right-btn analysis-form-next">Next</button>
					</div>

					<div id="analysis-retrieve-envdata-section" class="tab-pane fade">
						<div class="analysis-tab-content">
							<div class="row">
								<div class="col">
									<div class="form-row align-items-center" style="height: 100%;">
										<div class="col-9 my-1">
											<label class="mr-sm-2">Choose environmental layers</label>
											<div id="analysis-retrieve-envdata-section-layers-list"></div>
										</div>
										<div class="col my-1" style="vertical-align: top; height: 100%;">
											  <!-- <button id="analysis-retrieve-envdata-section-button" class="btn btn-primary">Submit</button> -->
											  <div style="text-align: center;"><button id="analysis-generateoutput-envdata-section-button" class="btn btn-primary">Generate data</button><div id="analysis-generateoutput-elapsed-time" style="display: inline-block;"></div></div>
											  <div id="analysis-envdata-section-progressbar" style="margin-top: 10px; height: 20px;"></div>
											  <div id="analysis-envdata-section-progressbar-description" style='text-align: center; font-size: 12px;'></div>
											  <div id="analysis-envdata-section-progressbar2" style="margin-top: 10px; height: 20px;"></div>
											  <div id="analysis-envdata-section-progressbar2-description" style='text-align: center; font-size: 10px; text-align: center;'></div>
											  <div id="download_analysis_envdata_csv_data_button_container" style="text-align: center; margin-top: 10px;"></div>
										</div>
									</div>
								</div>
							</div>
						</div>
						<hr />
						<button type="button" class="btn btn-info right-btn analysis-form-next">Next</button>
					</div>

					<!-- analysis-create-analysis-section -->
					<div id="analysis-create-analysis-section" class="tab-pane fade">
						<div class="analysis-tab-content" >

							<!-- <div style="margin-bottom: 15px;">Note: A workspace must be used to store your input data in case you ever need to rerun the workflow</div>-->
							<div style="display: flex; margin-bottom: 10px;">
								<div style="width: 25%;">Step 1 - Select workflow</div>
								<div style="width: 50%;"><select id="create-analysis-select-workflow"></select></div>
								<div style="width: 25%;"><button class="button-refresh-workflow">REFRESH</button><span class="button-refresh-workflow-status"></span></div>
							</div>
							<div style="display: flex; margin-bottom: 10px;">
								<div style="width: 25%;">Step 2 - Setup analysis</div><div id="create-analysis-workflow-submit-form" style="width: 75%;"></div>
							</div>							
							<hr />
							<button type="button" class="btn btn-info right-btn analysis-form-next">Next</button>																			
						</div>

					</div>

					<div id="analysis-options" class="tab-pane fade">
						<div class="analysis-tab-content">
							<h5><b>Analysis type</b></h5>
							<select class="analysis-select">
								<option value="GxE">Landscape GxE</option>
								<option value="PxG">Associative Genetics PxG</option>
								<option value="G">Population Structure G</option>
							</select>

							<hr />

							<h5><b>Publications Selected</b></h5>
							<table class="table">
								<thead>
									<tr>
										<th>ID</th>
										<th>Title</th>
										<th>Author</th>
										<th>Year</th>
										<!--<th>Species</th>-->
										<th># Trees</th>
										<th>Study type</th>
										<th>Status</th>
									</tr>
								</thead>
								<tbody class="pub-selected-container" id="map-publications-data"> 
								</tbody>
							</table>
							
							<hr />

							<h5><b>Environmental variables</b></h5>
							<table class="table">
								<thead>
									<tr>
										<th>Layer name</th>
										<th>Source</th>
										<th>Environmental values</th>
									</tr>
								</thead>
								<tbody class="env-selected-container" id="map-environmental-data"> 
								</tbody>
							</table>
						</div>
						<button type="button" class="btn btn-secondary left-btn analysis-form-prev">Back</button>
						<button type="button" class="btn btn-info right-btn analysis-form-next">Next</button>
					</div>
					<div id="analysis-confirm" class="tab-pane fade">
						<div class="analysis-tab-content">
							<h4>Map Summary</h4>
							<ul class="list-group">						
								<li class="list-group-item d-flex justify-content-between align-items-center">
									<h5><b>Number of trees</b></h5>
									<span id="analysis-num-trees">0</span>
								</li>
								<li class="list-group-item d-flex justify-content-between align-items-center">
									<h5><b>Species</b></h5>
									<span id="analysis-num-species">0</span>
								</li>
								<li class="list-group-item d-flex justify-content-between align-items-center">
									<h5><b>Publications</b></h5>
									<span id="analysis-num-pub">0</span>
								</li>
								<li class="list-group-item d-flex justify-content-between align-items-center">
									<h5><b>Phenotypes</b></h5>
									<span id="analysis-phenotypes">No</span>
								</li>
								<li class="list-group-item d-flex justify-content-between align-items-center">
									<h5><b>Environmental values</b></h5>
									<span id="analysis-env-vals">0</span>
								</li>
							</ul>
						</div>
						<button type="button" class="btn btn-secondary left-btn analysis-form-prev">Back</button>
						<button type="submit" class="btn btn-success right-btn analysis-form-submit">Submit</button>
					</div>
				</div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>



<!-- jobs form -->
<div class="modal fade" id="jobs-form" tabindex="-1" role="dialog" aria-labelledby="analyzeMap" aria-hidden="true">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title" id="cartogratreeTitle">
					<img id="ct-logo" src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/resources_imgs/cp_logo.png">
					Jobs
				</h3>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
				<ul class="nav nav-tabs nav-fill">
					<li class="nav-item">
						<a id='jobs-latest-tab' class="nav-link jobs-nav-tab jobs-latest active" data-toggle="tab" href="#jobs-latest">Your job analyses</a>
					</li>				
					<li class="nav-item">
						<a id="jobs-details-tab" class="nav-link jobs-nav-tab jobs-details" data-toggle="tab" href="#jobs-details">Job information</a>
					</li>				

				</ul>
	
				<div class="tab-content">
					<div id="jobs-latest" class="tab-pane fade in active">	
						<div class="jobs-tab-content">
							<div style="margin-bottom: 10px;">
								<div>Your Job Analyses</div>
							</div>
							<div style="margin-bottom: 10px;">
								<div id="job-analyses-list"></div>
							</div>																
						</div>
					</div>				
					<div id="jobs-details" class="tab-pane fade in inactive">	
						<div class="jobs-tab-content">
							<div style="margin-bottom: 10px;">
								<div>Job Information</div>
							</div>
							<div style="margin-bottom: 10px;">
								<div id="jobs-details-info"></div>
							</div>
						</div>
					</div>
				</div>
			</div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>


<!-- About popup, info taken from original cartogratree -->
<div class="modal fade" id="about" tabindex="-1" role="dialog" aria-labelledby="aboutCartogratree" aria-hidden="true">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="cartogratreeTitle"><img id="ct-logo" src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/resources_imgs/cp_logo.png"></h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <h3><small>Introduction</small></h3>
                <p>The original concept of CartograTree was envisioned by a group of forest tree biology researchers that represented traditionally separate research areas including physiology, ecology, genomics, and systematics. Guided by the NSF-funded iPlant Cyberinfrastructure, the focus was to enable interdisciplinary forest tree biology research through geo-referenced data with an application that could be easily deployed, expanded, and used by members of all disciplines. CartograTree is a web-based application that allows researchers to identify, filter, compare, and visualize geo-referenced biotic and abiotic data. Its goal is to support numerous multi-disciplinary research endeavors including: phylogenetics, population structure, and association studies.</p>
                <hr />
                <h3><small>Development and Advisory Team</small></h3>
                <!-- <table style="width: 100%">
                    <tr>
                        <th>Member</th>
                        <th>Institution</th>
                        <th>Position</th>
                    </tr>
                    <tr>
                        <td>Nic Herndon</td>
                        <td>University of Connecticut</td>
                        <td>Programmer</td>
                    </tr>
                    <tr>
                        <td>Emily Grau</td>
                        <td>University of Connecticut</td>
                        <td>TreeGenes Lead Database Administrator</td>
                    </tr>
                    <tr>
                        <td>Charlie Demurjian</td>
                        <td>University of Connecticut</td>
                        <td>Curator</td>
                    </tr>
                    <tr>
                        <td>Isaac McEvoy</td>
                        <td>University of Connecticut</td>
                        <td>Curator</td>
                    </tr>
                    <tr>
                        <td>Irene Cobo</td>
                        <td>University of Connecticut</td>
                        <td>Postdoctoral Scholar</td>
                    </tr>
                    <tr>
                        <td>Peter Richter</td>
                        <td>University of Connecticut</td>
                        <td>Developer</td>
                    </tr>
                    <tr>
                        <td>Risharde Ramnath</td>
                        <td>Dove Technologies</td>
                        <td>TreeGenes Developer</td>
                    </tr>
                    <tr>
                        <td>Jill Wegrzyn</td>
                        <td>University of Connecticut</td>
                        <td>Principal Investigator</td>
                    </tr>
                </table> -->
				<table style="width: 100%; text-align: left;">
					<tbody>
						<tr>
							<th style="width: 32%;">Member</th>
							<th style="width: 32%;">Institution</th>
							<th style="width: 32%;">Position</th>
						</tr>
						<tr>
							<td>Jill Wegrzyn</td>
							<td>University of Connecticut</td>
							<td>Principal Investigator</td>
						</tr>
						<tr>
							<td>Nic Herndon</td>
							<td>University of Connecticut</td>
							<td>Co-Principal Investigator</td>
						</tr>
						<tr>
							<td>Meg Staton</td>
							<td>University of Tennessee</td>
							<td>Co-Principal Investigator</td>
						</tr>
						<tr>
							<td>Irene Cobo</td>
							<td>University of Connecticut</td>
							<td>Postdoctoral Scholar</td>
						</tr>
						<tr>
							<td>Risharde Ramnath</td>
							<td>University of Connecticut</td>
							<td>Lead Developer</td>
						</tr>
						<tr>
							<td>Peter Richter</td>
							<td>University of Connecticut</td>
							<td>Developer</td>
						</tr>
						<tr>
							<td>Emily Grau</td>
							<td>University of Connecticut</td>
							<td>Lead Database Administrator</td>
						</tr>
						<tr>
							<td>Charlie Demurjian</td>
							<td>University of Connecticut</td>
							<td>Curator</td>
						</tr>
					</tbody>
				</table>							
                <div class="featurette-divider"></div>
				<h3>TreeSnap</h3>
				<p><a href="treesnap.org">TreeSnap</a> is a forest tree map utility that allows users to locate and take pictures of trees around the nation. TreeSnap was developed as a collaboration between Scientists at the University of Kentucky and the University of Tennessee. CartograTree makes use of the tree data collected by TreeSnap</p>
                <table style="width: 100%">
                    <tr>
                        <th>Member</th>
                        <th>Institution</th>
                        <th>Position</th>
                    </tr>
                    <tr>
                        <td>Meg Staton</td>
                        <td>University of Tennessee</td>
                        <td>Principal Investigator</td>
                    </tr>
					<tr>
						<td>Abdullah Almsaeed</td>
						<td>University of Tennessee</td>
						<td>TreeSnap Developer</td>
					</tr>
					<tr>
						<td>Ellen Crocker</td>
						<td>College of Agriculture, Food and Environment</td>
						<td>Extension and Outreach Specialist</td>
					</tr>					
				</table>
				<div class="featurette-divider"></div>
                <h3><small>Citing</small></h3>
				<p>Wegrzyn J.L., Staton M.A., Street N. R., Main D., Grau E., Herndon N., Buehler S., Falk T., Zaman S., Ramnath R., Richter P., Sun L., Condon B., Almsaeed A., Chen M.,Mannapperuma C., Jung S., Ficklin S. Cyberinfrastructure to Improve Forest Health and Productivity: The Role of Tree Databases in Connecting Genomes, Phenomes, and the Environment, TreeGenes. Database, Volume 2019. doi:10.3389/fpls.2019.00813</p>
				<p>Falk, T., Herndon, N., Grau, E., Buehler, S., Richter, P., Zaman, S., Baker, E. M., Ramnath, R., Ficklin, S., Staton, M., Feltus, F. A., Jung, S., Main, D., & Wegrzyn, J. L (2018) <a href=" http://dx.doi.org/10.1093/database/bay084">Growing and cultivating the forest genomics database, TreeGenes</a> <i>Database, Volume 2018</i></p>
                <!-- <p>Herndon, N., Grau, E. S., Batra, I., Demurjian Jr., S. A., Vasquez-Gross, H. A., Staton, M. E., and Wegrzyn, J. L. (2016) <a href="https://peerj.com/preprints/2345v4.pdf">CartograTree: Enabling Landscape Genomics for Forest Trees</a>. In <i>Proceedings of the Open Source Geospatial Research & Education Symposium</i> (OGRS 2016), Perugia, Italy.</p> -->
				<hr />
				<h3><small>Participating Groups</small></h2>
				<div class="d-flex justify-content-between" style='align-items: center;'>
					<img style="height: 5em;" src='/sites/default/files/uploads/uconn.png' />
					<img style="height: 6em;" src='/sites/default/files/uploads/wsu.png' />
					<img style="height: 6em;" src='/sites/default/files/uploads/utk.png' />
				</div>
				<hr />
				<h3><small>Funding</small></h2>	
				<div style='text-align: center;'>
					<img style='width: 25%;' src='https://treegenesdb.org/Drupal/sites/default/files/uploads/USDA_logo-cmp.png' />
					<h3>National Institute of Food and Agirculture</h3>
					<h3>USDA-NIFA #2018-09223</h3>
				</div>							
				</hr />			
				<h3>In collaboration with: </h3>
				<div id="sources-imgs" class="d-flex justify-content-between" style="margin-left: 2em; margin-right: 2em; align-items: center;">
					<img style="width:8em; height:7em;" src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/resources_imgs/Galaxy_icon.png">
					<img style="width:15em; height:5em;" src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/resources_imgs/GMod_Chado.png">
					<img style="width:15em; height:4.5em;"src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/resources_imgs/TripalLogo_dark.png">
					
				</div>
				<div id="sources-imgs-2" class="d-flex justify-content-between" style="margin-left: 2em; margin-right: 2em; align-items: center;">
					<img style="width:8em; height:8em;"src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/resources_imgs/TreeSnap.jpg">
					<img style="width:12em; height:7em;" src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/resources_imgs/wfid.png">
					<img style="width:15em; height:5em;" src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/resources_imgs/wildtype.png">
				</div>				
                <hr />
                <h3><small>Project Alumni</small></h3>
                <table style="width: 100%">
					<tr>
                        <th>Member</th>
                        <th>Institution</th>
                        <th>Position</th>
                    </tr>
                    <tr>
                        <td>Damian Gessler</td>
                        <td>Semantic Options, LLC</td>
                        <td>Advisory member</td>
                    </tr>
                    <tr>
                        <td>Taylor Falk</td>
                        <td>University of Connecticut</td>
                        <td>Bioinformatics Developer</td>
                    </tr>
                    <tr>
                        <td>Ronald Santos</td>
                        <td>University of Connecticut</td>
                        <td>Programmer</td>
                    </tr>
					<tr>
						<td>Isaac McEvoy</td>
						<td>University of Connecticut</td>
						<td>Curator</td>
					</tr>										
				</table>					
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>


<div class="modal fade" aria-hidden="true" tabindex="-1" role="dialog" id="tree-full-picture">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <!-- <div class="modal-header">
				<h4></h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div> -->
            <div class="modal-body">
				<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
				<img id="tree-full-picture-img" src="" style="width: 100%;" />
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" aria-hidden="true" tabindex="-1" role="dialog" id="filter-instructions">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <!-- <div class="modal-header">
				<h4></h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div> -->
            <div class="modal-body">
				<div>
					<h2>Add Rule</h2>
					Add Rule will add a new filter rule to the current set of filters. This new rule will conform to the operator (AND / OR) that is currently selected.
					For example, if you already had a current rule in which the conjunction 'AND' has been selected, this new rule will filter by both the old rule AND the new rule created.<br />
					It follows the same concept of SQL AND and ORs.<br />
					Practical example: Old rule (Family equal Fabaceae) OR (Family equal Rosaceae) will show both families of trees on the map. Using AND would show no trees since the families do not overlap.<br />
				</div>
				<div>
					<h2>Add Group</h2>
					Add Group will add a new filter group to the current set of filters. This new group will conform to the conjunction (AND / OR) that is currently selected.
					For example, if you already had a current rule in which the conjunction 'AND' has been selected and you then require an OR filter, you would need to add a new group first and then add a new rule under this new group to be able to select the 'OR' operator.
				</div>				
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" aria-hidden="true" tabindex="-1" role="dialog" id="modal-trees-selected">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <!-- <div class="modal-header">
				<h4></h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div> -->
			<h2 style="padding-top: 10px; padding-bottom: 0px; padding-left: 12px;">Selected Trees</h2>
            <div class="modal-body">
				<table class="modal-table" style="width: 100%;">
				
				</table>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>


<div class="modal fade" aria-hidden="true" tabindex="-1" role="dialog" id="modal-unique-species">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <!-- <div class="modal-header">
				<h4></h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div> -->
			<h2 style="padding-top: 10px; padding-bottom: 0px; padding-left: 12px;">Unique Species</h2>
            <div class="modal-body">
				<div class="modal-status"></div>
				<table class="modal-table" style="width: 100%;">
				
				</table>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>
<!-- modal popups end-->

<!-- Bootstrap row -->
<div class="row" id="body-row">
    <!-- Main Sidebar -->
    <div id="main-menu" class="sidebar-expanded d-none d-md-block col-3 sidebar-container">
        <!-- d-* hides the Sidebar in smaller devices. Its items can be kept on the Navbar 'Menu' -->
        <ul class="list-group">
			<li>
                <a href="#map-navigation" data-toggle="collapse" aria-expanded="false" class="bg-dark list-group-item list-group-item-action flex-column align-items-start sidebar-separator-title">
                    <div class="d-flex w-100 justify-content-start sidebar-menu-header align-items-center">
                        <span class="mr-2"><i class="fas fa-map-marker-alt"></i></span>
                        <span class="menu-collapsed"><b>Map Navigation</b></span>
                        <span class="submenu-icon ml-auto"></span>
                    </div>
                </a>
                <div class="filter-options collapse sidebar-submenu" id="map-navigation" aria-expanded="false">
                    <ul class="list-group">
                        <li class="list-group-item list-group-item-action d-flex justify-content-center">
                            <div class="row row-100">					
                                <div class="col-4 text-center" style='margin-bottom: 5px;'>
									<input style="width: 100%; text-align: center;" type="text" id="nav-coordinate-lat-go" placeholder="Lat" />
                                </div>
								<div class="col-4 text-center" style='margin-bottom: 5px;'>
									<input style="width: 100%; text-align: center;" type="text" id="nav-coordinate-lon-go"  placeholder="Lon"/>
								</div>
								<div class="col-4 text-center" style='margin-bottom: 5px;'>
									<button style="width: 100%;" id="nav-coordinate-go" type="button" class="btn btn-success">Go</button>
								</div>
                            </div>
                        </li>
                    </ul>
                </div>
            </li>		
            <li>
                <a href="#map-options" data-toggle="collapse" aria-expanded="false" class="bg-dark list-group-item list-group-item-action flex-column align-items-start sidebar-separator-title">
                    <div class="d-flex w-100 justify-content-start sidebar-menu-header align-items-center">
                        <span class="mr-2"><i class="fas fa-cog"></i></span>
                        <span class="menu-collapsed"><b>Map Options</b></span>
                        <span class="submenu-icon ml-auto"></span>
                    </div>
                </a>
                <div class="filter-options collapse sidebar-submenu" id="map-options" aria-expanded="false">
                    <ul class="list-group">
						<li class="list-group-item list-group-item-action d-flex">
                            <div class="row row-100">
                                <div class="col-7">
                                    <h6 class="text-muted">
                                        Environment Layers
                                    </h6>
                                </div>
                                <div class="col-4">
                                    <button type="button" data-toggle="button" class="env-layers-btn btn btn-toggle" id="env-layers-btn" aria-pressed="false" autocomplete="off">
                                        <div class="handle"></div>
                                    </button>
                                </div>					
							</div>
						</li>
						
                        <!-- <li class="list-group-item list-group-item-action d-flex justify-content-center">
                            <button type="button" id="layers-menu-btn" class="btn btn-secondary show-layers-menu" data-toggle="tooltip" data-placement="right" title="Toggle Layers Panel">
                            Environmental Layers <i class="fas fa-plus"></i>
                            </button>
                        </li> -->
						
                        <li class="list-group-item list-group-item-action d-flex justify-content-center">
                            <div class="row row-100">
                                <div class="col text-center" style='margin-bottom: 5px;'>
									<button id="reset-map" type="button" class="btn btn-danger">Reset Map</button>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
            </li>
            <li>
                <a href="#map-summary" data-toggle="collapse" aria-expanded="false" class="bg-dark list-group-item list-group-item-action flex-column align-items-start sidebar-separator-title">
                    <div class="d-flex w-100 justify-content-start sidebar-menu-header align-items-center">
                        <span class="mr-2"><i class="fas fa-map-marked-alt"></i></span>
                        <span class="menu-collapsed"><b>Map Summary</b></span>
                        <span class="submenu-icon ml-auto"></span>
                    </div>
                </a>
                <div class="filter-options collapse sidebar-submenu" id="map-summary" aria-expanded="false">
                    <ul class="list-group">	
						<li id="map-summary-loading">
							<div class="map-summary-loading-class sidebar-submenu"  aria-expanded="false">
								<ul class="list-group">
									<li style="background-color: #006fab !important; color: #FFFFFF;" class="list-group-item list-group-item-action d-flex justify-content-center">
										<div class="row row-100">					
											<div id="map-summary-loading-text-status" class="text-center" style='margin-bottom: 5px;'>
												...
											</div>							
										</div>
									</li>
									<li style="background-color: #555 !important; color: #FFFFFF;" class="list-group-item list-group-item-action d-flex justify-content-center">
										<div class="row row-100">					
											<div id="map-summary-loading-progressbar" class="text-center" style='width: 100%; margin-bottom: 5px;'>
												<div id="map-summary-loading-progressbar-progress" class="text-center" style="border-radius: 3px; background-color: #d4942c; height: 5px; width: 1%;">&nbsp;</div>
											</div>
											<div id="map-summary-loading-progressbar-progress-text" class="text-center" style="width: 100%; color: #FFFFFF;">&nbsp;</div>						
										</div>								
									</li>
								</ul>
							</div>
						</li>												
                        <li class="list-group-item list-group-item-action d-flex">
				            <div class="row row-100">
                                <div class="col-8">
                                    <h6>
                                        <i class="fas fa-tree"></i> Number of Plants<br />
										<div style="margin-left: 15px; margin-top: 5px;" id="plants_loading"></div>
										<div style="margin-left: 15px; margin-top: 5px;" id="plants_details_icons"></div>
                                    </h6>
                                </div>
                                <div class="col-2">
									<h6 id="num-trees">0</h6>
                                </div>
                                <div class="col-1" style="padding-top: 8px;">
									<!-- <input type="checkbox" id="select-num-trees" /> -->
									<button type="button" data-toggle="button" class="btn btn-sel-all" id="select-num-trees" style="margin-left: 10px;" autocomplete="off" data-original-title='Select all trees'>
                                        SEL ALL
                                    </button>
                                </div>								
              	            </div>
						</li>
                        <li id="map-summary-selected-trees" class="list-group-item list-group-item-action d-flex">
				            <div class="row row-100">
                                <div class="col-8">
                                    <h6>
                                        <i class="fab fa-pagelines"></i> Selected Plants
                                    </h6>
                                </div>
                                <div class="col-2">
									<h6 id="num-selected-trees">0</h6>
                                </div>
                                <div class="col-2">
									<div id="btn-find-unique-species" title="Get unique species" style="margin-top: 6.5px;"><i class="far fa-lg fa-dot-circle"></i></div>
                                </div>								
              	            </div>
						</li>						
                        <li class="list-group-item list-group-item-action d-flex">
				            <div class="row row-100">
                                <div class="col-8">
                                    <h6>
                                        <i class="fas fa-leaf"></i> Number of Species
                                    </h6>
                                </div>
                                <div class="col-3">
									<h6 id="num-species">0</h6>
                                </div>
              	            </div>
						</li>
                        <li class="list-group-item list-group-item-action d-flex">
				            <div class="row row-100">
                                <div class="col-8">
                                    <h6>
                                        <i class="fas fa-book"></i> Publications Count
                                    </h6>
                                </div>
                                <div class="col-3">
									<h6 id="num-pubs">0</h6>
                                </div>
              	            </div>
						</li>
                        <li class="list-group-item list-group-item-action d-flex">
				            <div class="row row-100">
                                <div class="col-8">
                                    <h6>
                                        <i class="fas fa-map"></i> Number of Layers
                                    </h6>
                                </div>
                                <div class="col-3">
									<h6 id="num-layers">0</h6>
                                </div>
              	            </div>
						</li>
					</ul>
				</div>
			</li>
            <li>
                <a href="#dataset-options" data-toggle="collapse" aria-expanded="false" class="bg-dark list-group-item list-group-item-action flex-column align-items-start sidebar-separator-title">
                    <div class="d-flex w-100 justify-content-start sidebar-menu-header align-items-center">
                        <span class="mr-2"><i class="fas fa-database"></i></span>
                        <span class="menu-collapsed"><b>Plant Dataset Sources</b></span>
                        <span class="submenu-icon ml-auto"></span>
                    </div>
                </a>
                <div class="filter-options collapse sidebar-submenu" id="dataset-options" aria-expanded="false">					
                    <ul class="list-group">
						<li id="map-dataset-loading">
							<div class="map-dataset-loading-class sidebar-submenu"  aria-expanded="false">
								<ul class="list-group">
									<li style="background-color: #006fab !important; color: #FFFFFF;" class="list-group-item list-group-item-action d-flex justify-content-center">
										<div class="row row-100">					
											<div id="map-dataset-loading-text-status" class="text-center" style='margin-bottom: 5px;'>
												...
											</div>							
										</div>
									
									</li>
									<li style="background-color: #555 !important; color: #FFFFFF;" class="list-group-item list-group-item-action d-flex justify-content-center">
										<div class="row row-100">					
											<div id="map-dataset-loading-progressbar" class="text-center" style='width: 100%; margin-bottom: 5px;'>
												<div id="map-dataset-loading-progressbar-progress" class="text-center" style="border-radius: 3px; background-color: #d4942c; height: 5px; width: 1%;">&nbsp;</div>
											</div>
											<div id="map-dataset-loading-progressbar-progress-text" class="text-center" style="width: 100%; color: #FFFFFF;">&nbsp;</div>						
										</div>								
									</li>
								</ul>
							</div>
						</li>						
						<!-- justify-content-center was removed from the classes to keep alignments with above list the same too -->
                        <li class="list-group-item list-group-item-action d-flex ">
                            <div class="row row-100">
                                <div class="col-7">
                                    <h6 class="text-muted">
                                        <i class="fas fa-tree"></i> TreeGenes
                                    </h6>
                                </div>
                                <div class="col-4">
                                    <button type="button" data-toggle="button" class="tree-dataset-btn btn btn-toggle" id="treegenes-data" aria-pressed="true" autocomplete="off">
                                        <div class="handle"></div>
                                    </button>
                                </div>
                            </div>
                        </li>
                        <li class="list-group-item list-group-item-action d-flex">
                            <div class="row row-100">
                                <div class="col-7">
                                    <h6 class="text-muted">
                                        <i class="fas fa-mobile-alt"></i> TreeSnap
                                    </h6>
                                </div>
                                <div class="col-4">
                                    <button type="button" data-toggle="button" class="btn btn-toggle tree-dataset-btn" id="treesnap-data" aria-pressed="true" autocomplete="off">
                                        <div class="handle"></div>
                                    </button>
                                </div>
                            </div>
                        </li>
                        <li class="list-group-item list-group-item-action d-flex">
                            <div class="row row-100">
                                <div class="col-7">
                                    <h6 class="text-muted">
                                        <i class="fas fa-database"></i> DRYAD
                                    </h6>
                                </div>
                                <div class="col-4">
                                    <button type="button" data-toggle="button" class="btn btn-toggle tree-dataset-btn" id="datadryad-data" aria-pressed="true" autocomplete="off">
                                        <div class="handle"></div>
                                    </button>
                                </div>
                            </div>
                        </li>
                        <!-- <li class="list-group-item list-group-item-action d-flex">
                            <div class="row row-100">
                                <div class="col-7">
                                    <h6 class="text-muted">
                                        <i class="fas fa-table"></i> BIEN
                                    </h6>
                                </div>
                                <div class="col-4">
                                    <button type="button" data-toggle="button" class="btn btn-toggle bien-dataset-btn" id="bien-data" aria-pressed="true" autocomplete="off">
                                        <div class="handle"></div>
                                    </button>
                                </div>
                            </div>
                        </li> -->

						<!--
                        <li class="list-group-item list-group-item-action d-flex">
                            <div class="row row-100">
                                <div class="col-7">
                                    <h6 class="text-muted">
                                        <i class="fas fa-table"></i> BIEN vs (TG & DA) Tiles
                                    </h6>
                                </div>
                                <div class="col-4">
                                    <button type="button" data-toggle="button" class="btn btn-toggle tree-dataset-btn" id="bien_geoserver_tileset-data" aria-pressed="true" autocomplete="off">
                                        <div class="handle"></div>
                                    </button>
                                </div>
                            </div>							
                        </li>
						-->
						<?php
							$results = unserialize(variable_get('ct_geoserver_datasets', serialize(array())));
							foreach ($results as $r) {
								$element_name = $r['geoserver_dataset_name'];
								$element_name = strtolower($element_name);
								$element_name = str_ireplace(' ', '_', $element_name);
								$element_name = $element_name . '_geoserver_tileset-data';
						?>
							<li class="list-group-item list-group-item-action d-flex">
								<div class="row row-100">
									<div class="col-7">
										<h6 class="text-muted">
											<i class="fas fa-table"></i> <?php echo $r['geoserver_dataset_name']; ?>
										</h6>
									</div>
									<div class="col-4">
										<button type="button" data-toggle="button" class="btn btn-toggle tree-dataset-btn" id="<?php echo $element_name; ?>" aria-pressed="false" autocomplete="off">
											<div class="handle"></div>
										</button>
									</div>
								</div>							
							</li>						
						<?php		
							}
						?>
						<!-- WFID TODO -->
						<?php if( user_access("access cartogratree wfid") ) { ?>
						
                        <li class="list-group-item list-group-item-action d-flex">
                            <div class="row row-100">
                                <div class="col-7">
                                    <h6 class="text-muted">
                                        <i class="fas fa-database"></i> WFID
                                    </h6>
                                </div>
                                <div class="col-4">
                                    <button type="button" data-toggle="button" class="btn btn-toggle tree-dataset-btn" id="wfid_geojson-data" aria-pressed="false" autocomplete="off">
                                        <div class="handle"></div>
                                    </button>
                                </div>
                            </div>
                        </li>
						<?php } ?>											
						<!--
                        <li class="list-group-item list-group-item-action d-flex">
                            <div class="row row-100">
                                <div class="col-7">
                                    <h6 class="text-muted">
                                        <i class="fas fa-table"></i> BIEN vs (TG & DA)
                                    </h6>
                                </div>
                                <div class="col-4">
                                    <button type="button" data-toggle="button" class="btn btn-toggle bien-vs-tgda-dataset-btn" id="bien-data" aria-pressed="true" autocomplete="off">
                                        <div class="handle"></div>
                                    </button>
                                </div>
                            </div>							
                        </li>
						-->
                        <li id='trees-by-source-id-import-status' class="list-group-item list-group-item-action d-flex hidden">
                            <div class="row row-100">
                                <div class="col-8">
                                    <h6 class="text-muted">
                                        <i class="fas fa-hourglass-half"></i> Retrieving...
                                    </h6>
                                </div>
                                <div class="col-3">
									<h6 id='trees-by-source-id-import-status-text'>0</h6>
                                </div>
                            </div>
							
                        </li>
						<li id='trees-by-source-id-import-time-status' class="list-group-item list-group-item-action d-flex hidden">	
                            <div class="row row-100">
                                <div class="col-8">
                                    <h6 class="text-muted">
                                        <i class="fas fa-stopwatch"></i> Time Elapsed
                                    </h6>
                                </div>
                                <div class="col-3">
									<h6 id='trees-by-source-id-import-time-elapsed-text'>0</h6>
                                </div>
                            </div>						
						</li>
						<li id='trees-by-source-id-import-datasize-status' class="list-group-item list-group-item-action d-flex hidden">	
                            <div class="row row-100">
                                <div class="col-8">
                                    <h6 class="text-muted">
                                        <i class="fas fa-download"></i> Size (bytes)
                                    </h6>
                                </div>
                                <div class="col-3">
									<h6 id='trees-by-source-id-import-datasize-text'>0</h6>
                                </div>
                            </div>						
						</li>						
                    </ul>
                </div>
            </li>
	
			<li>			
				<a href="#tree-filter-options" data-toggle="collapse" aria-expanded="false" class="bg-dark list-group-item list-group-item-action flex-column align-items-start">
					<div class="d-flex w-100 sidebar-menu-header justify-content-start align-items-center">
						<span class="mr-2"><i class="fas fa-filter"></i></span>
						<span class="menu-collapsed"><b>Filters</b></span>
						<span class="submenu-icon ml-auto"></span>
					</div>
				</a>
				<div class="collapse sidebar-submenu" id="tree-filter-options" aria-expanded="false">
					<div style="position: relative;top: 2px;right: -93%;color: #ffffff;"><i onclick='show_filter_instructions();' class="fas fa-question-circle"></i></div>
					<div id="builder"></div>

					<br />

					<div class="row row-100 text-center">
						<div class="col">
							<button class="btn btn-success" id="btn-get">Apply filter</button>
						</div>
						<div class="col">
							<!--<button class="btn btn-primary" id="btn-get">Get Rules</button>-->
							<button class="btn btn-danger" id="btn-reset">Reset filter</button>
						</div>
					</div>
				</div>
			</li>
		
			<hr />

			<li style="border: 1px solid white; padding: 20px;">
				<div class="justify-content-center row">
					<button class="btn btn-success" id="save-session">Save Session</button>
				</div>
			</li>

			<hr />
    	    <!--collapse button-->
            <a href="#" data-toggle="sidebar-collapse" class="bg-dark list-group-item list-group-item-action d-flex align-items-center">
                <div class="d-flex w-100 sidebar-menu-header justify-content-start align-items-center">
                    <span id="collapse-icon" class="fa fa-2x mr-2"></span>
                    <span id="collapse-text" class="menu-collapsed">Collapse</span>
                </div>
            </a>
        </ul>
    </div>
    <!-- LAYERS SIDEBAR -->
    <div id="layers-menu" class="sidebar-expanded d-none d-md-block col-2 sidebar-container bg-secondary hidden">
        <!-- d-* hiddens the Sidebar in smaller devices. Its items can be kept on the Navbar 'Menu' -->
        <ul class="list-group" id="layers-fields-container">
            <li class="list-group-item text-muted menu-collapsed">
                <div class="row">
                    <div class="col-1">
                        <i class="fas fa-caret-left fa-2x clickable show-layers-menu" data-toggle="tooltip" data-placement="bottom" title="Collapse Layers Panel"></i>
                    </div>
                    <div class="col">
						<div class="row justify-content-center">
                       		<b>Environmental Layers <i class="fas fa-layer-group"></i></b>
						</div>
                    </div>
                </div>
            </li>
            <!-- php script to populate environmental layers categorical values-->
            <?php
                foreach($variables['cartogratree_layers'] as $group){
                	if($group['group_name'] != 'Trees'){
                    	//generate outer most list  
                    	echo '<a href="#main-layer-' . $group['group_rank'] . '"  data-toggle="collapse" aria-expanded="false" class="bg-dark list-group-item list-group-item-action flex-column align-items-start">';
						if(count($group['subgroups']) > 1){
                    		echo '<div class="d-flex w-100 justify-content-start align-items-center"><h6><span class="menu-collapsed">' . $group['group_name'] . '</span></h6><span class="submenu-icon ml-auto"></span></div></a>';
						}
						else{
                    		echo '<div class="d-flex w-100 justify-content-start align-items-center"><h6><span class="menu-collapsed">' . $group['group_name'] . '</span></h6><span class="submenu-icon ml-auto"></span></div></a>';
						}
                    	echo '<div class="collapse sidebar-submenu" id="main-layer-' . $group['group_rank'] . '"><ul class="list-unstyled components layers-container">';    
						if(count($group['subgroups']) == 1){
							foreach($group['subgroups'] as $key => $subgroup){
								foreach($subgroup['layers'] as $layer){
									echo '<li class="justify-content-center container layers-items-header"><div class="row inner-layer-header row-100"><div class="col-6"><h7 id="ct-layer-title-' . $layer['layer_id'] . '">';
									
									//Clean up code for Species Ranges
									if(stripos($layer['layer_title'],'range') !== FALSE) {
										$layer['layer_title'] = str_ireplace(' range','', $layer['layer_title']);
									}

									echo $layer['layer_title'] . '</h7></div><div class="col-6"><button type="button" data-toggle="button" class="btn btn-toggle layers-btn" id="cartogratree_layer_' . $layer['layer_id'] . '-' . $layer['layer_host'] . '" aria-pressed="false" autocomplete="off"><div class="handle"></div></button><center><i title="Layer details" id="layer_info_icon_' . $layer['layer_id'] . '" style="color: #08afff; cursor: pointer; font-size: 20px; margin-top:10px; margin-left: 45px;" class="fas fa-info-circle"></i></center></div></div>';
									echo '<div id="opacity-ctrl-' . $layer['layer_id'] . '" class="row inner-layer-op row-100 hidden"><div class="col-5"><label>Opacity <span id="opacity-value-' . $layer['layer_id'] . '">100%</span></label></div><div class="col-7"><input class="opacity" id="slider-' . $layer['layer_id'] . '-' . $layer['layer_host'] . '" type="range" min="5" max="100" step="0" value="100"/></div></div></li>';	
								}
							}
						}
						else{
							foreach($group['subgroups'] as $key => $subgroup){
								echo '<li class="justify-content-center layers-items-header"><h6><a href="#layer-group-' . $key . $group['group_rank'] . '" data-toggle="collapse" aria-expanded="false" class="dropdown-toggle">';
								echo preg_replace('/\sv\d+/', '', $subgroup['subgroup_name']) . '</a></h6><div class="collapse container-fluid" id="layer-group-' . $key . $group['group_rank'] . '"><ul class="list-unstyled components layers-container">';
								foreach($subgroup['layers'] as $layer){
									echo '<li class="justify-content-center container layers-items"><div class="row inner-layer-header" style="margin-left: -2.0rem;"><div class="col-6"><h7 id="ct-layer-title-' . $layer['layer_id'] . '">';
									
									//Clean up code for Precipitation layers
									if(stripos($layer['layer_title'],'precipitation') !== FALSE) {
										$layer['layer_title'] = str_ireplace('precipitation ','', $layer['layer_title']);
									}

									echo $layer['layer_title'] . '</h7></div><div class="col-6"><button type="button" data-toggle="button" class="btn btn-toggle layers-btn" id="cartogratree_layer_' . $layer['layer_id'] . '-' . $layer['layer_host'] . '" aria-pressed="false" autocomplete="off"><div class="handle"></div></button><center><i title="Layer details" id="layer_info_icon_' . $layer['layer_id'] . '" style="color: #08afff; cursor: pointer; font-size: 20px; margin-top:10px; margin-left: 45px;" class="fas fa-info-circle"></i></center></div></div>';
									echo '<div id="opacity-ctrl-' . $layer['layer_id'] . '" class="row inner-layer-op hidden"><div class="col-5"><label>Opacity <span id="opacity-value-' . $layer['layer_id'] . '">100%</span></label></div><div class="col-7"><input class="opacity" id="slider-' . $layer['layer_id'] . '-' . $layer['layer_host'] . '" type="range" min="5" max="100" step="0" value="100"/></div></div></li>';
								}
								echo '</ul></div></li>';
							}
						}
                  		echo '</ul></div>';
                  	}
            	} 
        	?> 
        </ul>
    </div>
    <!-- sidebar-container END -->
    <!-- MAIN -->

	<!--<i id="map-loading" class="fas fa-circle-notch fa-spin fa-10x"></i>-->
	<div class="hidden" id="overlay-selected-trees" style="position: fixed; bottom: -5px; right: 20px; z-index: 3; padding: 5px; background-color: #408649; color: #FFFFFF; font-size: 12px; border-radius: 5px;">
		&nbsp;
	</div>	
    <div class="col py-3" id="map-container">
        <!-- body-row END -->
        <div id="map"></div>
        <div id="legend" style="overflow-y: scroll; max-height: 50%;" class="w240 round shadow-darken10 px12 py12 txt-s"></div>

		<div class="hidden map-overlay" id="tree-details">
			<div id="tree-details-wrapper">
				<div class="card card-cascade narrower mb-4 tree-card">
					<i id="tree-details-closebutton" style="    position: absolute; right: 8px; top: 5px; font-size: 18px;" class="fas fa-window-close"></i>
					<div style="padding: .75rem 0.75rem;" class="card-header" id="headingOne">
						<table>
							<tr>
							<td><i id="tree-details-prev-tree" class="fas fa-arrow-left"></i></td>
							<td>
							<h4 class="mb-0" id="tree-id">
							Unknown
							</h4>
							<h6 id="tree-coordinates">Unknown</h6>
							<h6 id="tree-elevation">Unknown</h6>
							</td>
							<td><i id="tree-details-next-tree" class="fas fa-arrow-right"></i></td>
							</tr>
						</table>
					</div>

					<div>
						<div class="view view-cascade">
							<br />
							<div id="tree-img-carousel" class="carousel" data-interval="false">
							  <ol class="carousel-indicators" id="tree-imgs-indicators">
							  </ol>
							  <div class="carousel-inner" id="tree-imgs-slides">
							  </div>
							  <a class="carousel-control-prev" role="button">
								<span class="carousel-control-prev-icon" aria-hidden="true"></span>
								<span class="sr-only">Next</span>
							  </a>
							  <a class="carousel-control-next" role="button">
								<span class="carousel-control-next-icon" aria-hidden="true"></span>
								<span class="sr-only">Prev</span>
							  </a>
							</div>
							<a>
								<div class="mask rgba-white-slight"></div>
							</a>
						</div>

						<!--Card content-->
						<div class="card-body card-body-cascade">
							<h5 class="pink-text"><i class="fas fa-spa"></i> <span id="tree-family">Family</span></h5>
							<!--Title-->
							<h4 class="card-title"><i class="fas fa-seedling"></i> <span id="tree-species">Species</span></h4>
							<hr />

							<div class="row">
								<!-- <div class="col">
									<i class="fab fa-ethereum"></i><b> Plant group</b>
								</div>	-->
								<div class="col" style='padding-left: 0px; padding-right: 0px;'>
									<i class="fas fa-map-marker-alt"></i><b> Coord. Type</b>
								</div>								
								<div class="col" style='padding-left: 0px; padding-right: 0px;'>
									<i class="fas fa-map-marker-alt"></i><b> Source</b>
								</div>
							</div>
							<div class="row" style='margin-bottom: 5px;'>
								<!-- <div class="col" id="tree-plant-group">
									Plant group
								</div>	-->
								<div class="col" id="tree-coord-type">
									Approximate
								</div>								
								<div class="col" id="tree-source">
									source
								</div>
							</div>
				
							<!-- <div class="row justify-content-center">
								<h6>Coordinate Type: <span id="tree-coord-type">Approximate</span></h6>
							</div> -->

							<div class="row justify-content-center">
								<!-- <button id="hide-tree-details" type="button" class="btn btn-danger" style='margin-bottom: 3px; font-size:11px;' disabled>Close Plant View</button> -->
								<button class="btn btn-primary" data-toggle="modal" data-target="#tree-more-info" style='margin-bottom: 3px;'>Study Info</button>
								<!-- <button id='expand-image-view-button' class="btn btn-primary" data-toggle="modal" data-target="#tree-all-images" style='margin-bottom: 3px;' >Expand Image View</button> -->
							</div>

							<div id="tpps-link" style='margin-bottom:3px;'>			
							</div>

							<!-- <hr /> -->

							<ul class="list-group" id="tree-details-extra">
							</ul>

							<button class="btn btn-success" id="add-all-trees">Add All Trees</button>

						</div>
					</div>
			  		<!--/.Card content-->
				</div>
				<!--</div>-->
				<div class="btn-group-vertical" id="tree-ids-list" style='padding-top: 10px;'>
				</div>
			</div>
    	</div>
    </div>
    <!-- Main Col END -->
    <div id="loading-spinner" class="modal fade bd-example-modal-lg" data-backdrop="static" data-keyboard="false" tabindex="-1">
        <div class="modal-dialog modal-sm">
            <div class="modal-content" style="width: 48px">
                <span class="fa fa-spinner fa-spin fa-3x"></span>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="tree-more-info" tabindex="-1" role="dialog" aria-labelledby="tree-more-info-label" aria-hidden="true">	
	<div class="modal-dialog modal-lg" role="document">
		<div class="modal-content">
			<div class="modal-header">
				<h3 class="modal-title" id="tree-more-info-label" style="padding-top: 0px;padding-bottom: 0;padding: 5px;background-color: #333333;border-radius: 5px;color: #FFFFFF;">TGDR001-2123</h3>
				<button type="button" class="close" data-dismiss="modal" aria-label="Close">
					<span aria-hidden="true">&times;</span>
				</button>
			</div>
			<div class="modal-body">
				<div class="row" style="margin-bottom: 15px;">
					<div id="biome-info-container">
						<div id="biome-label" style="display: inline-block; display: inline-block; margin-left: 22px; padding: 2px; background: #589a60; color: #FFFFFF; border-radius: 2px;">BIOME</div>
						<!-- <div id="biome-number" style="display: inline-block; margin-left: 10px;"></div> -->
						<div id="biome-desc" style="display: inline-block; margin-left: 10px; "></div>
					</div>
				</div>
				<div class="row">

					<div id="tree-endangered-container" style="width: 100%; padding-left: 20px; padding-right: 10px;">
						<!-- <h3 id="tree-phenotypes-label" style="padding-top: 5px; padding-bottom: 5px;">Phenotypes recorded</h3> -->
						<div id="tree-endangered-status">
						</div>	
					</div>
				
					<div id="tree-study-associated-container" style="width: 100%;padding-left: 20px;padding-right: 10px;">
						<h3 id="tree-study-associated-label" style="padding-top: 5px; padding-bottom: 5px;">Study Associated</h3>
						<div class="media">
							<i class="fas fa-book-open fa-4x align-self-center mr-3" style="position: relative; top: -15px;"></i>
							<div class="media-body">
								<h4 class="mt-0" id="tree-pub-title" style="margin-bottom: 0px;">Who</h4>
								<h5 id="tree-pub-author" style="display: inline-block; margin-right: 10px;">Unknown.</h5>
								<p class="mb-0" id="tree-pub-year" style="display: inline-block; margin-right: 10px;">2000</p>
								<a href="#" target="_blank" id="tree-pub-link">View Additional Details</a>
								<p id="study-download-files" class="hidden" style="margin: 0; padding: 0;"></p>						
							</div>
						</div>
					</div>
			
					<div id="tree-phenotypes-container" style="width: 100%; padding-left: 20px; padding-right: 10px;">
						<h3 id="tree-phenotypes-label" style="padding-top: 5px; padding-bottom: 5px;">Phenotypes recorded</h3>
						<div id="tree-phenotypes">
						</div>	
					</div>
				</div>

				<div class="row row-100">
					<!-- <div class="col-4"> -->
					<div style="width: 33%; padding-left: 20px;">
						<h3 id="tree-study-type-label" style="padding-bottom: 5px;">Study Type</h3>
						<span class="badge badge-info" id="tree-study-type"></span>
					</div>	
					<!-- <div class="col-8"> -->
					<div style="width: 30%">
						<h3 id="tree-markers-label" style="padding-bottom: 5px; font-size: 16px;">Markers</h3>
						<span style='font-size: 14px;' class="badge badge-primary" id="tree-markers"></span>
					</div>
					<div style="width: 30%">
						<h3 id="tree-markers-label" style="padding-bottom: 5px; font-size: 16px;">Markers Count</h3>
						<span style='font-size: 14px;' class="badge badge-primary" id="tree-markers-count"></span>
						<h3 id="tree-markers-label" style="padding-bottom: 5px; font-size: 16px;">Phenotype Reads</h3>
						<span style='font-size: 14px;' class="badge badge-primary" id="tree-phenotypes-count"></span>
					</div>					
				</div>
				<div style= "width: 100%;" class="row">
					<div id="tree-more-info-phenotype-container" style="margin-left: 22px; margin-top: 10px; width: 100%;">
						
					</div>
					<div id="tree-more-info-genotype-container" style="margin-left: 22px; margin-top: 10px; width: 100%;">
						
					</div>					
				</div>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
			</div>
		</div>
	</div>
</div>

<div class="modal fade" id="tree-all-images" tabindex="-1" role="dialog" aria-labelledby="tree-view-images-label" aria-hidden="true">	
	<div class="modal-dialog modal-lg" role="document">
		<div class="modal-content">
			<div class="modal-header">
				<h3 class="modal-title" id="all-imgs-title"></h3>
				<button type="button" class="close" data-dismiss="modal" aria-label="Close">
					<span aria-hidden="true">&times;</span>
				</button>
			</div>
			<div class="modal-body">
				<h3 id="tree-submitter"></h3>
				<h4 id="tree-collection-date"></h4>
				<div id="tree-imgs-container">
				</div>	
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
			</div>
		</div>
	</div>
</div>
