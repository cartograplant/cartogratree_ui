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
    	<img class="lazy" id="tg-logo" style="height: 45px; width: auto;" src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/resources_imgs/cp_logo.png">
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
                <a class="nav-link" href="#" data-toggle="modal" data-target="#about" style="margin-right: 15px;">
					<i class="fas fa-info-circle" style="margin-right: 5px;"></i> About
				</a>
            </li>
            <li class="nav-item">
				<?php
                	if($variables['logged_in']){
                		echo '<a class="nav-link" style="margin-right: 15px;" id="analysis-btn" href="#">';					
					}
					else{
                		echo '<a class="nav-link disabled" style="margin-right: 15px;" id="analysis-btn" href="#">';
					}
				?>
                    <i class="fas fa-chart-bar" style="margin-right: 5px;"></i> Analyze
                </a>
            </li>
            <li class="nav-item">
				<?php
                	if($variables['logged_in']){
                		//echo '<a class="nav-link" style="margin-right: 15px;" id="jobs-btn" href="#">';					
					}
					else{
                		//echo '<a class="nav-link disabled" style="margin-right: 15px;" id="jobs-btn" href="#">';
					}
				?>
                    <!-- <i class="fas fa-flask" style="margin-right: 5px;"></i> Jobs -->
                <!-- </a> -->
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
                     	echo '<i class="fas fa-user" style="margin-right: 5px;"></i><b> ' . $variables['username'] . ' </b><i class="fas fa-caret-down"></i></a>';
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

<div class="modal fade" id="filter-view-study-phenotypes" tabindex="-1" role="dialog" arai-labelledby="filter-view-study-phenotypes" aria-hidden="true">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Phenotypes found in this study</h3>
                <button type="button" class="close close-user-save-form" data-dismiss="modal" aria-label="close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
				<div class="phenotypes">

				</div>
            </div>
            <div class="modal-footer">
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
				<button id="save-session" class="btn btn-success" style="margin-bottom: 10px;">Save current session</button>
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
    <div class="modal-dialog" style="width: 100% !important; max-width: 75% !important;" role="document">
        <div class="modal-content">
            <div class="modal-header">
				<div class="row" style="width: 100%;">
					<div class="col-2">
						<!-- <h3 style="padding: 0px;" class="modal-title" id="cartogratreeTitle">

						</h3> -->
						<img style="width: 100%;" id="ct-logo" src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/resources_imgs/cp_logo.png">
					</div>
					<div class="col-10" style="padding-top: 10px;">
						<div id="analysis_summary_html"></div>	
					</div>
				</div>

                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                	<span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
				<div class="row">
					
					<div class="col-2" style="border-right: 1px solid #d9fbd3;">
						<!-- <ul class="nav nav-tabs nav-fill" aria-orientations="vertical"> -->
						<ul class="nav nav-pills" aria-orientations="vertical">
							<li class="nav-item">
								<a id='analysis-initial-configuration-tab' class="nav-link analysis-nav-tab analysis-initial-configuration active" data-toggle="tab" href="#analysis-initial-configuration">Create & manage workspace</a>
							</li>
							<li class="nav-item">
								<a id='analysis-study-context-tab' class="nav-link study-context-nav-tab analysis-study-context" data-toggle="tab" href="#analysis-study-context">Select studies</a>
							</li>	
							<li class="nav-item">
								<a id="analysis-overlapping-traits-tab" class="nav-link analysis-nav-tab analysis-overlapping-traits" data-toggle="tab" href="#analysis-overlapping-traits">Filter traits</a>
							</li>	
							<li class="nav-item">
								<a id="analysis-overlapping-genotypes-tab" class="nav-link analysis-nav-tab analysis-overlapping-genotypes" data-toggle="tab" href="#analysis-overlapping-genotypes">Select genotypes</a>
							</li>				
							
							<li class="nav-item">
								<a id="analysis-filter-snp-section-tab" class="nav-link analysis-nav-tab analysis-filter-snp-section" data-toggle="tab" href="#analysis-filter-snp">Filter markers and genotypes</a>
							</li>
							<li class="nav-item">
								<a id="analysis-popstruct-section-tab" class="nav-link analysis-nav-tab analysis-popstruct-section-tab" data-toggle="tab" href="#analysis-popstruct-section">Assess population structure</a>
							</li>
							<li class="nav-item">
								<a id='analysis-retrieve-envdata-section-tab' class="nav-link analysis-nav-tab analysis-retrieve-envdata-section" data-toggle="tab" href="#analysis-retrieve-envdata-section">Select environmental metrics</a>
							</li>
							<li class="nav-item">
								<a id='analysis-create-analysis-section-tab' class="nav-link analysis-nav-tab analysis-create-analysis-section" data-toggle="tab" href="#analysis-create-analysis-section">Conduct analysis</a>
							</li>					
							<li class="nav-item">
								<a id="analysis-confirm-section-tab" class="nav-link analysis-nav-tab analysis-confirm-section" data-toggle="tab" href="#analysis-confirm">View run summary</a>
							</li>
						</ul>
					</div>
					
					<!-- 
					<div class="col-3">
						<div class="nav flex-column nav-pills" id="v-pills-tab" role="tablist" aria-orientation="vertical">
						<button class="nav-link active" id="v-pills-home-tab" data-toggle="pill" data-target="#v-pills-home" type="button" role="tab" aria-controls="v-pills-home" aria-selected="true">Home</button>
						<button class="nav-link" id="v-pills-profile-tab" data-toggle="pill" data-target="#v-pills-profile" type="button" role="tab" aria-controls="v-pills-profile" aria-selected="false">Profile</button>
						<button class="nav-link" id="v-pills-messages-tab" data-toggle="pill" data-target="#v-pills-messages" type="button" role="tab" aria-controls="v-pills-messages" aria-selected="false">Messages</button>
						<button class="nav-link" id="v-pills-settings-tab" data-toggle="pill" data-target="#v-pills-settings" type="button" role="tab" aria-controls="v-pills-settings" aria-selected="false">Settings</button>
						</div>
					</div>
					-->
					<div class="col-10">
						<div class="tab-content">
							<div id="analysis-initial-configuration" class="tab-pane fade in active">	
								<div class="analysis-tab-content">
									<div style="margin-bottom: 10px;">
										<!-- <h4 class="mb-2">Welcome to the Analysis Panel</h4> -->

							
										<div>
											<div class="row">
												<div class="col-sm-2">
													<div class="tag-header" style="width: 100%;background-color: #fff3d7;color: #000000;"><div style="text-transform: uppercase; font-size: 10px;">Step 1</div>Specify analysis details</div>
												</div>
												<div class="col-sm-10">
													<div class="mb-2" style="font-weight: 500;">Provide a unique name and specify analysis type:</div>
													<fieldset>
														<div id="analysis_id" class="mb-2" value="-1"></div>
														<div>
															<table>
																<tr>
																	<td class="p-2" style="padding-left: 0rem !important;">Analysis name</td>
																	<td class="p-2"><input id="analysis_name" type="text" value="Untitled" /></td>
																</tr>
																<tr>
																	<td class="p-2" style="padding-left: 0rem !important;">Analysis type</td>
																	<td class="p-2">
																	<select id="analysis_type">
																		<option value="GxPxE" selected>Genotype x Phenotype x Environmental</option>
																		<option value="GxP">Genotype x Phenotype</option>
																		<option value="GxE">Genotype x Environmental</option>
																	</select>
																	</td>
																</tr>
															</table>
															<!-- 
															<div style="">Analysis name: <input id="analysis_name" type="text" value="Untitled" /></div>
															<div style="">Analysis type: <select id="analysis_type">
																<option value="GxPxE" selected>Genotype x Phenotype x Environmental</option>
																<option value="GxP">Genotype x Phenotype</option>
																<option value="GxE">Genotype x Environmental</option>
															</select>
															</div>
															-->
															<div class="mt-2" style="margin-right: 10px;">
															<button class="btn btn-info" id="btn_update_analysis_name">Update</button>
															</div>
														</div>
													</fieldset>
												</div>
											</div>
										</div>

										<hr />
									</div>
									<div style="margin-bottom: 10px;">
									<div class="row">
											<div class="col-2">
												<div class="tag-header" style="width: 100%;background-color: #fff3d7;color: #000000;"><div style="text-transform: uppercase; font-size: 10px;">Step 2</div>Select a workspace to store analysis results</div>
											</div>
											<div class="col-10">
												<div style="font-weight: 500; margin-bottom: 10px;">Create a workspace below to store and reuse files associated with your analysis:</div>
												<div class="d-inline-block">To begin analyzing data, we strongly recommend creating a workspace.</div>
												<div class="mb-2">A workspace stores all your uploaded files so you can use (or reuse) them when running workflow analyses. Without a workspace, you can't select data files to be used when running analyses.</div>
												<div style="display: flex; margin-bottom: 10px;">
													<div style="width: 100%" id="nextflow-create-analysis-select-history-caption">Select workspace 
													<select id="nextflow-create-analysis-select-history"></select> 
													<button class="btn btn-info" id="nextflow-create-analysis-new-workspace-button">Create new workspace</button>
													</div>
												</div>
												<div id="nextflow-create-analysis-new-workspace-configuration" style="display: none; margin-bottom: 10px;">
													<div style="width: 25%; padding-left: 10px;">Workspace name</div>
													<div style="width: 75%">
														<input type="text" id="nextflow-create-analysis-new-workspace-name" />
														<button id="nextflow-create-analysis-new-workspace-name-button">Create</button>
													</div>
												</div>
												<!-- <div style="margin-bottom: 10px;">
													<div>
														<div style="display: inline-block;"><h2>Manage workspace files</h2></div>
														<div style="display: inline-block;"><button  class="nextflow-manage-workspace-files-refresh btn btn-success"><i class="fa fa-refresh" aria-hidden="true"></i></button></div>
														<div class="nextflow-workspace-nextflow-files-loader" style="margin-left:5px; display: inline-block;"></div>
													</div>
													<div id="nextflow-upload-workspace-file-container">
														<div style="padding-top: 10px; padding-bottom: 10px;"><input id="nextflow-upload-workspace-file" type="file" /><button class="btn btn-info" id="nextflow-upload-workspace-file-button">Upload</button><span style="padding-left: 10px;" id="nextflow-upload-workspace-file-progress"></span></div>
													</div>
													<div id="nextflow-manage-workspace-contents">
													</div>							
												</div>-->
											</div>
										</div>
										<hr />
										<div class="row">
											<div class="col-2">
												<div class="tag-header" style="width: 100%;background-color: #fff3d7;color: #000000;"><div style="text-transform: uppercase; font-size: 10px;">File management</div>Workspace input and output files</div>
											</div>
											<div class="col-10">
												<div style="margin-bottom: 10px;">
													<div>
														<div style="display: inline-block; font-weight: 500; margin-bottom: 10px;">Manage workspace files</div>
														<div>Return to this workspace area after performing analysis tasks to view input and output files</div>
														<div style="display: inline-block;"><button  class="nextflow-manage-workspace-files-refresh btn btn-success"><i class="fa fa-refresh" aria-hidden="true"></i></button></div>
														<div class="nextflow-workspace-nextflow-files-loader" style="margin-left:5px; display: inline-block;"></div>
													</div>
													<div id="nextflow-upload-workspace-file-container">
														<div style="padding-top: 10px; padding-bottom: 10px;"><input id="nextflow-upload-workspace-file" type="file" /><button class="btn btn-info" id="nextflow-upload-workspace-file-button">Upload</button><span style="padding-left: 10px;" id="nextflow-upload-workspace-file-progress"></span></div>
													</div>
													<div id="nextflow-manage-workspace-contents">
													</div>
												</div>
												<!--
												<div style="margin-bottom: 10px;">
													<div>
														<div style="display: inline-block; font-weight: 500;">Manage workspace files</div>
														<div style="display: inline-block;"><button  class="manage-workspace-files-refresh btn btn-success"><i class="fa fa-refresh" aria-hidden="true"></i></button></div>
														<div class="workspace-files-loader" style="margin-left:5px; display: inline-block;"></div>
													</div>
													<div id="manage-history-contents">
													</div>							
												</div>
												-->
											</div>
										</div>
										<div class="row" style="display: none;">
											<div class="col-2">
												<div class="tag-header" style="width: 100%;background-color: #effffb;color: #57c2a2;">Step 2 (Galaxy)</div>
											</div>
											<div class="col-10">
												<div class="d-inline-block">To begin analyzing data, we strongly recommend creating a workspace.</div>
												<div class="mb-2">A workspace stores all your uploaded files so you can use (or reuse) them when running workflow analyses. Without a workspace, you can't select data files to be used when running analyses.</div>
												<div style="display: flex; margin-bottom: 10px;" id="create-analysis-select-galaxy-account-container">
													<div style="width: 25%;" id="create-analysis-select-galaxy-account-caption">Select analysis account</div>
													<div style="width: 75%;"><select id="create-analysis-select-galaxy-account"></select></div>
												</div>
												<div style="display: flex; margin-bottom: 10px;">
													<div style="width: 25%;" id="create-analysis-select-history-caption">Select workspace</div>
													<div style="width: 50%;"><select id="create-analysis-select-history"></select></div>
													<div style="width: 25%;"><button class="btn btn-info" id="create-analysis-new-history-button">Create new workspace</button></div>
												</div>
												<div id="create-analysis-new-history-configuration" style="display: none; margin-bottom: 10px;">
													<div style="width: 25%; padding-left: 10px;">Workspace name</div>
													<div style="width: 75%">
														<input type="text" id="create-analysis-new-history-name" />
														<button id="create-analysis-new-history-name-button">Create</button>
													</div>
												</div>
	
											</div>
										</div>

									</div>
																	
								</div>
								<!-- <button type="button" class="btn btn-info right-btn analysis-form-next">Next</button> -->
							</div>
							<div id="analysis-study-context" class="tab-pane fade in inactive">
								<div class="analysis-tab-content">
									<div id="analysis_detections" class="mb-2">

									</div>
								</div>
							</div>			
							<div id="analysis-overlapping-traits" class="tab-pane fade in inactive">	
								<div class="analysis-tab-content">
									<div style="margin-bottom: 10px;">
										<div id="analysis-overlapping-traits-studies"></div>
									</div>
									
									<div id="analysis-overlapping-traits-traits-list-container" style="margin-bottom: 10px;">
										<div style="display: none;">
											<div id="analysis-overlapping-traits-traits-list-summary" style="width: 25%; margin-bottom: 10px;"></div>
											<div style="width: 75%;" id="studies_intersecting_traits_timer_div"></div>
										</div>
										<div id="analysis-overlapping-traits-traits-operation-container" style="margin-bottom: 10px;">
											<!-- <div style="margin-bottom: 10px;">
												<i class="fas fa-filter"></i> Filter trees using 
												<select id="analysis-overlapping-traits-traits-operation">
													<option value="union">UNION (combination)</option>
												</select> on traits:
											</div>
											<div style="margin-bottom: 10px;">
												<span id="analysis-overlapping-traits-status"></span>
											</div>	
											-->
											
										
											<div style="margin-bottom: 10px;  vertical-align: top;" id="analysis-overlapping-traits-traits-left-container">
												<div style="margin-bottom: 10px; vertical-align: top; display: inline-block; vertical-align: top; width: 65%;" id="analysis-overlapping-traits-traits-list">
											
												</div>
												<div style="max-width: 30%; display: inline-block; vertical-align: top; width: 30%;" id="analysis-overlapping-traits-visual-elements">
													
													<div id="analysis-overlapping-traits-pca" style=""></div>								
												</div>	
												
												<div style="margin-bottom: 10px; vertical-align: top; display: inline-block; width: 65%;" id="analysis-overlapping-traits-traits-histogram-grid">
												<!-- Contains divs of each histogram of traits that overlap -->
												</div>	
												<div id="analysis-overlapping-traits-histogram" style="margin-bottom: 10px; vertical-align: top; display: inline-block; width: 30%;"></div>	
																					
											</div>
										

											<!--
											<div style="margin-bottom: 10px;">
												<button id="analysis-overlapping-traits-filter-by-selected-phenotypes"><i class="fas fa-filter"></i> Filter</button>
												<button id="analysis-overlapping-traits-download-by-selected-phenotypes"><i class="fas fa-download"></i> Download</button>
											</div>
											<div style="margin-bottom: 10px;" id="analysis-overlapping-traits-filter-by-selected-phenotypes-results">

											</div>
											-->									
										</div>
									</div>
								</div>
								<!-- <button type="button" class="btn btn-info right-btn analysis-form-next">Next</button> -->
							</div>
							<div id="analysis-overlapping-genotypes" class="tab-pane fade in inactive">	
								<div class="analysis-tab-content">
									<div style="margin-bottom: 10px;">
										<div><span style="float: right;" id="analysis_genotypes_overall_status"></span></div>
										<table style="width: 100%;">
											<tr>
												<td style="width: 100%; vertical-align: top;">
													<div id="analysis-overlapping-genotypes-detected-studies"></div>
													<div id="analysis-overlapping-genotypes-across-studies"></div>
													<div id="analysis-overlapping-genotypes-upset-1" class="d-inline-block"></div>
													<div id="analysis-overlapping-genotypes-upset-2-status" class="d-inline-block"></div>
													<div id="analysis-overlapping-genotypes-upset-2" class="d-inline-block"></div>
													<div id="analysis-overlapping-genotypes-metadata"></div>
													<div id="analysis-overlapping-genotypes-refgenome"></div>
													<div id="analysis-overlapping-genotypes-summary-insights"></div>
													<div id="analysis-overlapping-genotypes-gt-check"></div>
													<div id="analysis-overlapping-genotypes-merge-vcfs"></div>
													
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
												<td style="width: 0%; vertical-align: top;">
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
								<!-- <button type="button" class="btn btn-info right-btn analysis-form-next">Next</button> -->
							</div>
							<div id="analysis-filter-snp" class="tab-pane fade in">
								<div class="analysis-tab-content">
									<div class="row">
										<div class="col">
											
											<div id="analysis-filter-snp-vcf-detection">Please return to the begin tab and ensure you have set up your workspace.</div>
											<div id="snp-chart"></div>
										</div>
										<!--
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
										-->
									</div>
								</div>
								<hr />
								<!-- <button type="button" class="btn btn-info right-btn analysis-form-next">Next</button> -->
							</div>

							<div id="analysis-popstruct-section" class="tab-pane fade">
								<div class="analysis-tab-content">
									<h4>Nextflow Population Structure Workflow</h4>
									<table id="nextflow-population-structure-workflow-container">
										<tr>
											<td style="width: 35%">
												<div id="nextflow-population-structure-workflow" ></div>
											</td>
											<td style="width: 65%">
												<div id="nextflow-population-structure-visualization" style="vertical-align: top;"></div>
											</td>
										</tr>
									</table>
									<div style="display: none;">
										<h4>Galaxy Population Structure Workflow</h4>
										<div style="text-align: center;">
											Number of populations<br />
											<input id="analysis-popstruct-section-k-value" type="text" value="2" style="text-align: center" /><br />
											<div style="display: inline-block;">Select VCF file</div><div style="display: inline-block;" class="select_loading"></div><br />
											<select style="margin-bottom: 10px; " id="analysis-popstruct-section-vcf-selectfile">
												<option>SELECT VCF FILE</option>
											</select><br />
											<button class="btn btn-info" id="analysis-popstruct-section-button-generate-fast-structure">Generate Fast Structure</button>
										</div>
										<div id="analysis-popstruct-status" style="text-align: center"></div>
										<div id="analysis-popstruct-dapc-step1-plot-container"></div>
									</div>
									<!--
									<h3 id="chart-loading" class="hidden">Loading...</h3>
									<div class="row">
										<div class="col">
											<div id="snp-study-vcf-detection"></div>
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
								<!-- <button type="button" class="btn btn-info right-btn analysis-form-next">Next</button> -->
							</div>

							<div id="analysis-retrieve-envdata-section" class="tab-pane fade">
								<div class="analysis-tab-content">
									<div class="row">
										<div class="col">
											<!-- class: align-items-center -->
											<div class="form-row" style="height: 100%;">
												<div class="col-md-8 my-1">
													<label class="mr-sm-2">Choose environmental layers</label>
													<div id="analysis-retrieve-envdata-section-layers-list"></div>
												</div>
												<div class="col-md-4 my-1" style="vertical-align: top; height: 100%;">
													<!-- <button id="analysis-retrieve-envdata-section-button" class="btn btn-primary">Submit</button> -->
													<?php
														global $user;
														if (in_array('administrator', $user->roles)) {
															// do fancy stuff
													?>
													<div style="border: 1px solid #c3b113; background-color: #fff2be; padding: 10px; text-align: center; margin-bottom: 10px;">
													<i class="fa-solid fa-circle-info"></i> By adjusting your selected environmental layers, the PCA scatterplot will (re)generate after you click Gather and upload to workspace button. 
													</div>
													<div style="text-align: center;"><button id="analysis-generateoutput-envdata-section-button" class="btn btn-primary">Precache values</button><div id="analysis-generateoutput-elapsed-time" style="display: inline-block;"></div></div><br />
													<?php } ?>
													<div style="text-align: center;"><button id="analysis-generateoutput-envdata-section-from-db-button" class="btn btn-primary">Gather and upload to workspace</button></div>
													<div style="text-align: center;" id="analysis-generateoutput-envdata-section-from-db-status"></div>
													<div id="analysis-envdata-section-progressbar" style="margin-top: 10px; height: 20px;"></div>
													<div id="analysis-envdata-section-progressbar-description" style='text-align: center; font-size: 12px;'></div>
													<div id="analysis-envdata-section-progressbar2" style="margin-top: 10px; height: 20px;"></div>
													<div id="analysis-envdata-section-progressbar2-description" style='text-align: center; font-size: 10px; text-align: center;'></div>
													<div id="download_analysis_envdata_csv_data_button_container" style="text-align: center; margin-top: 10px;"></div>
													<div id="envdata_scatter_plot" style="text-align: center; margin-top: 10px;"></div>
												</div>
											</div>
										</div>
									</div>
								</div>
								<hr />
								<!-- <button type="button" class="btn btn-info right-btn analysis-form-next">Next</button> -->
							</div>

							<!-- analysis-create-analysis-section -->
							<div id="analysis-create-analysis-section" class="tab-pane fade">
								<div class="analysis-tab-content" >
									<div id="nextflow-gwas-interface-container">
										<div><h4>Nextflow - Marker Association Workflow</h4></div>
										<table width="100%">
											<tr>
												<td width="100%" style="vertical-align: top;">
													<div id="nextflow-gwas-interface"></div>
													<div id="nextflow-gwas-data"></div>
													<div id="nextflow-gwas-results"></div>
													<div id="nextflow-gwas-visualization" style="vertical-align: top;"></div>
													<div id="nextflow-gwas-flags"></div>
												</td>
												<!-- <td width="50%" style="vertical-align: top;">
													
												</td>
												-->
										</table>
									</div>
									<!-- <div style="margin-bottom: 15px;">Note: A workspace must be used to store your input data in case you ever need to rerun the workflow</div>-->
									<!--
									<div style="display: flex; margin-bottom: 10px;">
										<div style="width: 15%;">Step 1 - Select workflow</div>
										<div style="width: 50%;"><select id="create-analysis-select-workflow"></select></div>
										<div style="width: 35%;">
											<button class="btn btn-success manage-workspace-files-refresh d-inline-block">Refresh file list</button>
											<div class="workspace-files-loader d-inline-block" style="margin-left:5px;"></div>
											<button class="d-inline-block btn btn-primary button-refresh-workflow">Reload workflow</button>
											<span class="button-refresh-workflow-status d-inline-block"></span>
										</div>
									</div>
									<div style="display: flex; margin-bottom: 10px;">
										<div style="width: 15%;">Step 2 - Setup analysis</div><div id="create-analysis-workflow-submit-form" style="width: 75%;"></div>
									</div>							
									<hr />
									-->
									<!-- <button type="button" class="btn btn-info right-btn analysis-form-next">Next</button> -->																		
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
												<th># Plants</th>
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
								<!-- 
								<button type="button" class="btn btn-secondary left-btn analysis-form-prev">Back</button>
								<button type="button" class="btn btn-info right-btn analysis-form-next">Next</button>
								-->
							</div>
							<div id="analysis-confirm" class="tab-pane fade">
								<div class="analysis-tab-content">
									<h4>Map Summary</h4>
									<ul class="list-group">						
										<li class="list-group-item d-flex justify-content-between align-items-center">
											<h5><b>Number of plants</b></h5>
											<span id="analysis-num-trees">0</span>
										</li>
										<li class="list-group-item d-flex justify-content-between align-items-center">
											<h5><b>Species</b></h5>
											<span id="analysis-num-species">0</span>
										</li>
										<li class="list-group-item d-flex justify-content-between align-items-center">
											<h5><b>Studies</b></h5>
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
								<!-- 
								<button type="button" class="btn btn-secondary left-btn analysis-form-prev">Back</button>
								<button type="submit" class="btn btn-success right-btn analysis-form-submit">Submit</button>
								-->
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



<!-- jobs form -->
<div class="modal fade" id="jobs-form" tabindex="-1" role="dialog" aria-labelledby="analyzeMap" aria-hidden="true">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title" id="cartogratreeTitle">
					<img class="lazy" id="ct-logo" src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/resources_imgs/cp_logo.png">
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
                <h5 class="modal-title lazy" id="cartogratreeTitle"><img style="width: 20em; margin-left: 1.5em;" id="ct-logo" src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/resources_imgs/cp_logo.png"></h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
				<style>
					.ct_left_card {
						width: 100%;
    					margin-bottom: 10px !important;
						display: inline-block;
						border-radius: 3px;
						border: 1px solid #EEEEEE;
						padding: 10px;
						border-left: 3px solid #e2b448;
						background: #FFFFFF;
					}

					.ct_left_card h2 {
						padding-top: 0px;
						border-bottom: 3px solid #b4d6c9 !important;
						font-size: 18px !important;
						padding-bottom: 10px !important;
						font-weight: normal !important;
					}
				</style>
				<div class="ct_left_card">
                	<h2>Introduction</h2>
                	<!-- <p>The original concept of CartograPlant was envisioned by a group of forest tree biology researchers that represented traditionally separate research areas including physiology, ecology, genomics, and systematics. Guided by the NSF-funded iPlant Cyberinfrastructure, the focus was to enable interdisciplinary forest tree biology research through geo-referenced data with an application that could be easily deployed, expanded, and used by members of all disciplines. CartograPlant is a web-based application that allows researchers to identify, filter, compare, and visualize geo-referenced biotic and abiotic data. Its goal is to support numerous multi-disciplinary research endeavors including: phylogenetics, population structure, and association studies.</p>-->
					 <p>
					 The idea for CartograPlant began in June of 2011, when a group of forest tree biology researchers from different fields like physiology, ecology, genomics, and systematics realized the need for a unified platform to integrate and visualize spatial biological data. These researchers came together through workshops and collaborations funded by the NSF iPlant Collaborative (now CyVerse), a project designed to support data-driven biological research.<br />
Their goal was to create a tool that could help bridge the gaps between disciplines and enable easier access to georeferenced population data, with traits and genotypes. The focus was on building a web-based application that could be deployed and used by researchers from various backgrounds, making complex data more accessible and useful for a wide range of studies.<br /><br />
The first version of CartograPlant (then, CartograTree) was released in 2012, built on the resources and infrastructure provided by iPlant. By 2015, a more refined version of the platform was launched, allowing users to identify, filter, compare, and visualize spatial data. The tool was designed to handle different types of datasets, including species distributions, genetic information, and environmental factors.<br /><br />
Today, CartograPlant continues to support the forest tree community, and increasingly, other plant systems as well. The application supports advanced analysis through HPC and reproducible workflows, such as population structure, genetic diversity, and association genetics. CarograPlant aims to help scientists understand how environmental and genetic factors influence the diversity and global distribution of plant species, engaging scientist and practitioners at all levels.<br />
					 </p>
				</div>
				
					<div class='ct_left_card'>
						<h2>TreeGenes Database</h2>
						<!-- <div class='about_treegenesdatabase'>The TreeGenes database provides custom informatics tools to manage the flood of information resulting from high-throughput genomics projects in forest trees from sample collection to downstream analysis. This resource is enhanced with systems that are well connected with federated databases, automated data flows, machine learning analysis, standardized annotations and quality control processes. The database itself contains several curated modules that support the storage of data and provide the foundation for web-based searches and visualization tools. -->
						<p>
						The TreeGenes Database traces its origins to the Dendrome Project, launched in the mid-1990s as one of the first USDA Agricultural Research Service (ARS) genome databases. Conceived as a centralized resource for forest tree genetics, Dendrome was developed to manage and share emerging molecular data for conifers and other tree species. It served as the first of three ARS genome databases, alongside those for maize and grasses, and provided early tools for the storage, retrieval, and visualization of genetic maps, expressed sequence tags (ESTs), and marker data.<br /><br />
	Over time, Dendrome evolved into TreeGenes, expanding both its taxonomic scope and infrastructure to meet the demands of large-scale sequencing and comparative genomics. As high-throughput sequencing changed life science research, TreeGenes grew to accommodate large genetic datasets and diverse data types, from genome assemblies and transcriptomes to population genetics and environmental metadata.<br /><br />
	A key development in TreeGenes’ evolution was its full adoption of the Tripal platform, an open-source toolkit that integrates the Chado schema with modern web content management (Drupal) to create flexible, interoperable biological databases. This transition enabled TreeGenes to modularize its infrastructure, enhance its scalability, and connect with other Tripal-based resources. Within this framework, TreeGenes develops and maintains custom Tripal modules, including CartograPlant, a map-based interface that visualizes genotypes, phenotypes, and environmental variables to support landscape and association genomics.  The platform also integrates workflows that support metadata/data annotation, quality control, and analysis within a FAIR (Findable, Accessible, Interoperable, Reusable) data ecosystem.<br /><br />
	Today, TreeGenes stands as one of the largest and longest running plant genomics databases in the world. It provides curated modules to access reference genome assemblies, transcriptomic data, variant calls, phenotypic observations, and environmental context, linked through standardized metadata and georeferenced accessions.
						</p>
					</div>

					<div class="featurette-divider"></div>
					<div class="ct_left_card">
						<h2>TreeSnap</h2>
						<!-- <p><a href="treesnap.org">TreeSnap</a> is a forest tree map utility that allows users to locate and take pictures of trees around the nation. TreeSnap was developed as a collaboration between Scientists at the University of Kentucky and the University of Tennessee. CartograPlant makes use of the tree data collected by TreeSnap</p>-->
						<p>
							<a href="treesnap.org" target="_blank">Treesnap</a> is a citizen science application designed to connect researchers and the public in the effort to monitor and understand forest trees, and their diseases, across North America. Developed through a collaboration between scientists at the University of Kentucky and the University of Tennessee, TreeSnap allows users to locate, photograph, and record observations of individual trees in their local environments. Each submission contributes valuable data on species distribution, health, and phenotypic variation, supporting large-scale studies.<br /><br />
							By engaging landowners, naturalists, and students alongside researchers, TreeSnap enables a nationwide network of tree observations. These data integrate with platforms such as CartograPlant. Together, TreeSnap and CartograPlant create a connected framework that links public participation with advanced genomic research, enhancing efforts to track forest health, identify resilient individuals, and guide species restoration and conservation strategies.<br />
						</p>
					</div>
				</div>
				<div style="padding: 15px;">	
					<table style="width: 100%">	
						<tr>
							<td width="33%" style="vertical-align: top;">
								<div class="ct_left_card" style="height: 280px;">

									<h2>Cartograplant Team</h2>
									<div style="float: right; position: relative; top: 20px; right: 20px;">
										<img class="lazy" style="width:7em;"src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/resources_imgs/cp_logo.png">
									</div>
									<table style="width: 100%; text-align: left; position: relative;top: -30px;">
										<tbody>
											<!-- <tr>
												<th style="width: 32%;">Member</th>
												<th style="width: 32%;">Institution</th>
												<th style="width: 32%;">Position</th>
											</tr> -->
											<tr>
												<td>University of Connecticut</td>
											</tr>
											<tr>
												<td>Jill Wegrzyn (Principal Investigator)</td>
											</tr>
											<tr>
												<td>Brandon Lind (Postdoctoral Scholar)</td>
											</tr>
											<tr>
												<td>Meghan Myles (PhD Student)</td>
											</tr>
											<tr>
												<td>Risharde Ramnath (Lead Developer)</td>
											</tr>
											<tr>
												<td>Emily Grau (Lead Database Administrator)</td>
											</tr>
											<tr>
												<td>Gabe Barrett (Developer)</td>
											</tr>
											<tr>
												<td>Vlad Savitsky (Developer)</td>
											</tr>
											<tr>
												<td>Phoebe Zhou (Curator)</td>	
											</tr>
											<tr>
												<td>Trang Nguyen (Curator)</td>	
											</tr>				
										</tbody>
									</table>
								</div>
							</td>
							<td width="33%" style="vertical-align: top;">
								<div class="ct_left_card" style="height: 280px;">
									<h2>Treesnap Team</h2>
									<div style="float: right; position: relative; top: 20px; right: 20px;">
										<img class="lazy" style="width:4em; height:4em;"src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/resources_imgs/TreeSnap.jpg">
									</div>
									<table style="width: 100%; position: relative;top: -45px;">
										<!-- <tr>
											<th>Member</th>
											<th>Institution</th>
											<th>Position</th>
										</tr> -->
										<tr>
											<td>University of Tennessee<br />Meg Staton (Principal Investigator)</td>
										</tr>
										<tr>
											<td>Florence Caldwell (Mobile and Web Developer)</td>
										</tr>
										<tr>
											<td>Chance Stribling (Mobile Developer)</td>
										</tr>
										<!-- <tr>
											<td>Abdullah Almsaeed</td>
											<td>University of Tennessee</td>
											<td>TreeSnap Developer</td>
										</tr>-->
										<tr>
											<td><br />University of Kentucky<br />Ellen Crocker (Extension and Outreach Specialist)</td>
										</tr>					
									</table>
								</div>
							</td>
							<td width="34%" style="vertical-align: top;">
								<div class="ct_left_card" style="height: 280px;">
									<h2>MaMa Team</h2>
									<div style="float: right; position: relative; top: 20px; right: 20px;">
										<img class="lazy" style="width:4em; height:4em;"src="https://www.monitoringash.org/wp-content/uploads/2025/05/MaMa-logo-150x150-1.png">
									</div>
									<table style="width: 100%; position: relative;top: -50px;">
										<!-- <tr>
											<th>Member</th>
											<th>Institution</th>
											<th>Position</th>
										</tr> -->
										<tr>
											<td>Ecological Research Institute<br />Jonathan Rosenthal</td>
										</tr>
										<tr>
											<td>Radka Wildova</td>
										</tr>

										<!-- <tr>
											<td>Abdullah Almsaeed</td>
											<td>University of Tennessee</td>
											<td>TreeSnap Developer</td>
										</tr>-->					
									</table>
								</div>
							</td>
						</tr>
					</table>
				

				<div class="featurette-divider"></div>
				<table>
					<tr>
						<td width="50%" style="vertical-align: top;">
							<div class="ct_left_card" style="height: 300px; overflow-y: auto;">
							<h2>Citations</h2>
								<table style="">
									<tr>
										<td style="vertical-align: top;">
											<p style="padding: 5px;">Lind, Cobo Simon, Myles et al (2025). CartograPlant: Bridging genomic, phenotypic, and environmental data to advance plant resilience and eco-evolutionary insight. EcoEvo Rxiv. <a href="https://doi.org/10.32942/X2Q06D">doi:10.32942/X2Q06D</a></p>

											<p style="padding: 5px;">Staton et al (2021). Tripal, a community update after 10 years of supporting open source standards-based genetic, genomic and breeding databases. Briefings in Bioinformatics, 22(6), bbab238. <a href="https://doi.org/10.1093/bib/bbab238">doi:10.1093/bib/bbab238</a></p>

											<p style="padding: 5px;">Crocker et al (2020). TreeSnap: A citizen science app connecting tree enthusiasts and forest scientists. Plants, People, Planet. 2020 Jan;2(1):47-52. <a href="https://doi.org/10.1002/ppp3.41">doi:10.1002/ppp3.41</a></p>

											<p style="padding: 5px;">Wegrzyn et al (2019). Cyberinfrastructure and resources to enable an integrative approach to studying forest trees. Evolutionary Applications, 13(1), 228-241. <a href="https://doi.org/10.1111/eva.12860">doi:10.1111/eva.12860</a></p>

											<p style="padding: 5px;">Wegrzyn et al (2019). Cyberinfrastructure to Improve Forest Health and Productivity: The Role of Tree Databases in Connecting Genomes, Phenomes, and the Environment, TreeGenes. Database, Volume 2019. <a href="https://doi.org/10.3389/fpls.2019.00813">doi:10.3389/fpls.2019.00813</a></p>

											<p style="padding: 5px;">Falk et al (2018). Growing and cultivating the forest genomics database, TreeGenes Database, Volume 2018. <a href="https://doi.org/10.1093/database/bay084">doi:10.1093/database/bay084</a></p>

											<p style="padding: 5px;">Vasquez-Gross et al (2013). CartograTree: connecting tree genomes, phenotypes, and environment Molecular Ecology Resources, 13(3), 528-537. <a href="https://doi.org/10.1111/1755-0998.12067">doi:10.1111/1755-0998.12067</a></p>				

											<!-- 

											<p style="padding: 5px;">Lind, B. M., Cobo-Simón, I., Myles, M., Barrett, G., Grau, E., Ramnath, R., Savitsky, V., & Wegrzyn, J. L. (2025). CartograPlant: Bridging genomic, phenotypic, and environmental data to advance plant resilience and eco-evolutionary insight. EcoEvo Rxiv. doi:10.32942/X2Q06D</p>

											<p style="padding: 5px;">Staton, S. E., Ramirez, J. D., Dziedzic, A., Austillo, C., Massey, A. R., Allu, M. K., Mock, S. A., Almsaeed, A., Ficklin, S. P., & Feltus, F. A. (2021). Tripal, a community update after 10 years of supporting open source standards-based genetic, genomic and breeding databases. Briefings in Bioinformatics, 22(6), bbab238. doi:10.1093/bib/bbab238</p>

											<p style="padding: 5px;">Crocker E, Condon B, Almsaeed A, Jarret B, Nelson CD, Abbott AG, Main D, Staton M. (2020). TreeSnap: A citizen science app connecting tree enthusiasts and forest scientists. Plants, People, Planet. 2020 Jan;2(1):47-52.</p>
											
											<p style="padding: 5px;">Wegrzyn J.L., Falk T., Grau E., Buehler S., Ramnath R., Herndon N. (2019). Cyberinfrastructure and resources to enable an integrative approach to studying forest trees. Evolutionary Applications, 13(1), 228-241. doi:doi.org/10.1111/eva.12860</p>
										
											<p style="padding: 5px;">Wegrzyn J.L., Staton M.A., Street N. R., Main D., Grau E., Herndon N., Buehler S., Falk T., Zaman S., Ramnath R., Richter P., Sun L., Condon B., Almsaeed A., Chen M.,Mannapperuma C., Jung S., Ficklin S. (2019) Cyberinfrastructure to Improve Forest Health and Productivity: The Role of Tree Databases in Connecting Genomes, Phenomes, and the Environment, TreeGenes. Database, Volume 2019. doi:10.3389/fpls.2019.00813</p>

											<p style="padding: 5px;">Falk, T., Herndon, N., Grau, E., Buehler, S., Richter, P., Zaman, S., Baker, E. M., Ramnath, R., Ficklin, S., Staton, M., Feltus, F. A., Jung, S., Main, D., & Wegrzyn, J. L. (2018). Growing and cultivating the forest genomics database, TreeGenes Database, Volume 2018</p>

											<p style="padding: 5px;">Vasquez-Gross H.A., Yu J.J., Figueroa B., Gessler D.D.G., Neale D.B., and Wegrzyn J.L. (2013) CartograTree: connecting tree genomes, phenotypes, and environment Molecular Ecology Resources, 13(3), 528-537</p>				
											
											-->
										</td>
									</tr>
								</table>
							</div>
						</td>
						<td width="50%" style="vertical-align: top;">
							<div class="ct_left_card" style="height: 300px;">				
								<h2>Project Alumni</h2>
								<table style="width: 100%">
									<tr>
										<th></th>
										<!-- <th>Position</th> -->
									</tr>							
									<tr>
										<td>Nic Herndon</td>
									</tr>
									<!-- <tr>
										<td>Meg Staton</td>
										<td>University of Tennessee</td>
										<td>Co-Principal Investigator</td>
									</tr> -->
									<tr>
										<td>Irene Cobo</td>
									</tr>
									<tr>
										<td>Damian Gessler</td>
									</tr>
									<tr>
										<td>Taylor Falk</td>
									</tr>
									<tr>
										<td>Ronald Santos</td>
									</tr>
									<tr>
										<td>Peter Richter</td>
									</tr>
									<tr>
										<td>Charles Demurjian</td>
									</tr>											
									<tr>
										<td>Isaac McEvoy</td>
									</tr>
									<tr>
										<td>Madison Gadomski</td>
									</tr>
									<tr>
										<td>Nicola Bacon</td>
									</tr>
									<tr>
										<td>Isabella Harding</td>
									</tr>									
								</table>
							</div>
						</td>
					</tr>
				</table>

				<table width="100%" style="margin-top: 10px; margin-bottom: 10px;">
					<tr>
						<td width="50%" style="vertical-align: top;">
							<div class="ct_left_card" style="height: 200px;">
								<h2>Participating Groups</h2>
								<table style="width: 100%; margin-top: 10px;">
									<tr>
										<td style="text-align: center; width: 25%; padding: 10px;"><img style="height: 2em;" src='/sites/default/files/uploads/uconn.png' /></td>
										<td style="text-align: center; width: 25%; padding: 10px;"><img style="height: 2.5em;" src='/sites/default/files/uploads/wsu.png' /></td>
										<td style="text-align: center; width: 25%; padding: 10px;"><img style="height: 2.5em;" src='/sites/default/files/uploads/utk.png' /></td>
										<td style="text-align: center; width: 25%; padding: 10px;"><img style="height: 2.5em;" src='https://www.agbiodata.org/agbiodata-header.png' /></td>
									</tr>
									<tr>
										<td style="text-align: center; width: 25%; padding: 10px;"><img style="height: 4em;" src='https://www.monitoringash.org/wp-content/uploads/2025/05/MaMa-logo-150x150-1.png' /></td>
										<td style="text-align: center; width: 25%; padding: 10px;"></td>
										<td style="text-align: center; width: 25%; padding: 10px;"></td>
										<td style="text-align: center; width: 25%; padding: 10px;"></td>
									</tr>
								</table>
								<!-- <div class="d-flex justify-content-between" style='align-items: center;'>
									<img style="height: 5em;" src='/sites/default/files/uploads/uconn.png' />
									<img style="height: 6em;" src='/sites/default/files/uploads/wsu.png' />
									<img style="height: 6em;" src='/sites/default/files/uploads/utk.png' />
								</div> -->
							</div>
						</td>
						<td width="50%" style="vertical-align: top;">
							<div class="ct_left_card" style="height: 200px;">	
								<h2>Technologies </h2>
								<table style="margin-top: 10px; width: 100%">
									<tr>
										<td style="text-align: center; width: 25%; padding: 10px;">
											<img class="lazy" style="width:7em;" src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/resources_imgs/GMod_Chado.png">
										</td>
										<td style="text-align: center; width: 25%; padding: 10px;">
											<img class="lazy" style="width:7em;"src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/resources_imgs/TripalLogo_dark.png">
										</td>
										<td style="text-align: center; width: 25%; padding: 10px;">
											<img class="lazy" style="width:7em;" src="https://geoserver.org/img/geoserver-logo.png" />
										</td>
										
										<td style="text-align: center; width: 25%; padding: 10px;">
											<img class="lazy" style="width: 7em; margin-bottom: 3px;" src="https://www.nextflow.io/img/nextflow.svg">
										</td>
									</tr>
								</table>
								<div id="sources-imgs" class="d-flex justify-content-between" style="margin-left: 2em; margin-right: 2em; align-items: center;">	
									<!-- <img class="lazy" style="width:15em; height:5em;" src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/resources_imgs/GMod_Chado.png">
									<img class="lazy" style="width:15em; height:4.5em;"src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/resources_imgs/TripalLogo_dark.png">
									<img class="lazy" style="width:8em; height:8em;"src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/resources_imgs/TreeSnap.jpg"> -->
								</div>
								<div id="sources-imgs-2" class="d-flex justify-content-between" style="margin-left: 2em; margin-right: 2em; align-items: center;">
									<!-- 
									<img class="lazy" style="width:12em; height:7em;" src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/resources_imgs/wfid.png">
									<img class="lazy" style="width:15em; height:5em;" src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/resources_imgs/wildtype.png">
									-->
								</div>
							</div>
						</td>
					</tr>
				</table>

				
		
				<div class="ct_left_card">
					<h2>Funding</h2>
					<table style="margin-top:20px;">
						<tr>
							<td width="33%">
								<div style='text-align: center;'>
									<img class="lazy" style='width: 25%;' src='https://nsf-gov-resources.nsf.gov/styles/featured_content_tablet/s3/2023-10/NSF_Official_logo_Med_Res_600ppi_rectangle.png?VersionId=_BzE41fXUTKWnh2WWSpDiBtR5xAf4YQs&itok=G01s-MfI' />
								</div>
							</td>
							<td width="33%">
								<div style='text-align: center;'>
									<img class="lazy" style='width: 25%;' src='https://treegenesdb.org/Drupal/sites/default/files/uploads/USDA_logo-cmp.png' />
								</div>
							</td>
							<td width="34%">
								<div style='text-align: center;'>
									<img class="lazy" style='width: 25%;' src='https://www.nature.org/content/dam/tnc/nature/en/logos/tnc-logo-primary-registered-dark-text.svg' />
								</div>
							</td>
						</tr>
						<tr>
							<td width="33%" style="text-align: center;">
								<h4 style="margin-bottom: 0px;">U.S National Science Foundation</h4>
								<h3 style="padding-top: 0px;"><a href="https://nsf.gov/awardsearch/showAward?AWD_ID=1443040">1443040</a> and <a href="https://www.nsf.gov/awardsearch/showAward?AWD_ID=1444573">1444573</a></h3>
							</td>
							<td width="33%" style="text-align: center;">
								<h4 style="margin-bottom: 0px;">National Institute of Food and Agriculture</h4>
								<h3 style="padding-top: 0px;"><a href="https://portal.nifa.usda.gov/web/crisprojectpages/1019897-fact-enabling-association-mapping-and-landscape-genomics-through-the-advanced-integration-of-genotype-phenotype-and-geospatial-data.html">2019-67021-29920</a></h3>
							</td>
							<td width="34%" style="text-align: center;">
								<h4 style="margin-bottom: 0px;">The Nature Conservancy</h4>
								<h3 style="padding-top: 0px;"></h3>								
							</td>
						</tr>
					</table>
				</div>	
				</div>					
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
					Practical example: Old rule (Family equal Fabaceae) OR (Family equal Rosaceae) will show both families of plants on the map. Using AND would show no plants since the families do not overlap.<br />
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
			<h2 style="padding-top: 10px; padding-bottom: 0px; padding-left: 12px;">Selected Plants</h2>
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
	<div id="main-menu" style="display: none;" class="sidebar-expanded md-block col-3 sidebar-container">
    	<!-- <div id="main-menu" class="sidebar-expanded d-none d-md-block col-3 sidebar-container"> REMOVED mobile hiding -->
        <!-- d-* hides the Sidebar in smaller devices. Its items can be kept on the Navbar 'Menu' -->
        <ul class="list-group">
			<!-- 
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
			-->
			<!--	
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
			-->
			<!--
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
                                        <div style="display: inline-block; margin-left: -4px; margin-right: 3px;"><i class="fas fa-leaf"></i></div><div style="display: inline-block">Species count</div>
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
			-->

			<!--
            <li>
                <a href="#dataset-options" id="dataset-options-heading" data-toggle="collapse" aria-expanded="false" class="bg-dark list-group-item list-group-item-action flex-column align-items-start sidebar-separator-title">
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
						
                        <li class="list-group-item list-group-item-action d-flex ">
                            <div class="row row-100">
                                <div class="col-7">
                                    <h6 class="text-muted" style="line-height: 20px;">
                                        <div style="display: inline-block; width: 20%;"><i class="fas fa-tree" style="position: relative; top: -5px;"></i></div><div style="display: inline-block; width: 70%;">Internal submissions</div>
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
                                        <i class="fas fa-mobile-alt" style="margin-right: 5px;"></i> TreeSnap
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
                                    <h6 class="text-muted" style="line-height: 20px;">
                                        <div style="display: inline-block; width: 20%;"><i class="fas fa-database" style="position:relative; top:-5px;"></i></div><div style="display: inline-block; width: 70%;">Direct submissions</div>
                                    </h6>
                                </div>
                                <div class="col-4">
                                    <button type="button" data-toggle="button" class="btn btn-toggle tree-dataset-btn" id="datadryad-data" aria-pressed="true" autocomplete="off">
                                        <div class="handle"></div>
                                    </button>
                                </div>
                            </div>
                        </li>
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
											<i class="fas fa-table" style="margin-right: 5px;"></i> <?php echo $r['geoserver_dataset_name']; ?>
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
						
						<?php if( user_access("access cartogratree wfid") ) { ?>
						
                        <li class="list-group-item list-group-item-action d-flex">
                            <div class="row row-100">
                                <div class="col-7">
                                    <h6 class="text-muted">
                                        <i class="fas fa-database" style="margin-right: 5px;"></i> WFID
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
			-->
			<!--
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
						<div class="col" style="margin-bottom: 15px;">
							<button class="btn btn-danger" id="btn-reset">Reset filter</button>
						</div>
					</div>
				</div>
			</li>
			

			<li id="pop-struct-options-container">			
				<a href="#pop-struct-options" data-toggle="collapse" aria-expanded="false" class="bg-dark list-group-item list-group-item-action flex-column align-items-start">
					<div class="d-flex w-100 sidebar-menu-header justify-content-start align-items-center">
						<span class="mr-2"><i class="fas fa-filter"></i></span>
						<span class="menu-collapsed"><b>Population Structures</b></span>
						<span class="submenu-icon ml-auto"></span>
					</div>
				</a>
				<div class="collapse sidebar-submenu" id="pop-struct-options" aria-expanded="false">
					<div id="pop-struct-options-toggles" style="background-color: #FFFFFF; color: #000000;">
					</div>
				</div>
			</li>
			-->		
		
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
	<!-- 
	<div id="layers-menu" class="sidebar-expanded md-block col-2 sidebar-container bg-secondary hidden">
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
									echo '<li class="justify-content-center container layers-items-header"><div class="row inner-layer-header row-100">';
									echo '<div class="col-6"><div style="font-size:10px; line-height: 1.6em;" id="ct-layer-title-' . $layer['layer_id'] . '">';
									
									//Clean up code for Species Ranges
									if(stripos($layer['layer_title'],'range') !== FALSE) {
										$layer['layer_title'] = str_ireplace(' range','', $layer['layer_title']);
									}

									echo $layer['layer_title'] . '</div>';
									echo '</div><div class="col-6">';
									echo '<button type="button" data-toggle="button" class="btn btn-toggle layers-btn" id="cartogratree_layer_' . $layer['layer_id'] . '-' . $layer['layer_host'] . '" aria-pressed="false" autocomplete="off"><div class="handle"></div></button>';
									echo '<div style="position: relative; left: -15px; width: 100px;">';
									echo '<i title="Layer details" id="layer_info_icon_' . $layer['layer_id'] . '" style="color: #08afff; cursor: pointer; font-size: 20px; margin-top:10px;" class="fas fa-info-circle"></i>';
									echo '<i title="Legend details" id="legend_legend_icon_' . $layer['layer_id'] . '" style="color: #08afff; cursor: pointer; margin-left: 4px; margin-right: 0px; display: none; font-size:18px;" class="fas fa-chart-bar"></i>';
									echo '</div>';
									echo '</div></div>';
									echo '<div id="opacity-ctrl-' . $layer['layer_id'] . '" class="row inner-layer-op row-100 hidden">';
									echo '<div class="col-5"><label>Opacity <span id="opacity-value-' . $layer['layer_id'] . '">100%</span></label></div>';
									echo '<div class="col-7"><input class="opacity" id="slider-' . $layer['layer_id'] . '-' . $layer['layer_host'] . '" type="range" min="5" max="100" step="0" value="100"/></div>';
									echo '</div></li>';	
								}
							}
						}
						else{
							foreach($group['subgroups'] as $key => $subgroup){
								echo '<li class="justify-content-center layers-items-header"><h6><a href="#layer-group-' . $key . $group['group_rank'] . '" data-toggle="collapse" aria-expanded="false" class="dropdown-toggle">';
								echo preg_replace('/\sv\d+/', '', $subgroup['subgroup_name']) . '</a></h6><div class="collapse container-fluid" id="layer-group-' . $key . $group['group_rank'] . '"><ul class="list-unstyled components layers-container">';
								foreach($subgroup['layers'] as $layer){
									echo '<li class="justify-content-center container layers-items">';
									echo '<div class="row inner-layer-header" style="margin-left: -2.0rem;">';
									echo '<div class="col-6"><div style="font-size:10px; line-height: 1.6em;"  id="ct-layer-title-' . $layer['layer_id'] . '">';
									
									//Clean up code for Precipitation layers
									// if(stripos($layer['layer_title'],'precipitation') !== FALSE) {
									// 	$layer['layer_title'] = str_ireplace('precipitation ','', $layer['layer_title']);
									// }

									echo $layer['layer_title'] . '</div></div>';
									echo '<div class="col-6">';
									echo '<div><button type="button" data-toggle="button" class="btn btn-toggle layers-btn" id="cartogratree_layer_' . $layer['layer_id'] . '-' . $layer['layer_host'] . '" aria-pressed="false" autocomplete="off"><div class="handle"></div></button></div>';
									echo '<div style="position: relative; left: 35px;">';
									echo '<i title="Layer details" id="layer_info_icon_' . $layer['layer_id'] . '" style="color: #08afff; cursor: pointer; font-size: 20px; margin-top:10px; margin-left: 0px;" class="fas fa-info-circle"></i>';
									echo '<i title="Legend details" id="legend_legend_icon_' . $layer['layer_id'] . '" style="color: #08afff; cursor: pointer; margin-left: 4px; margin-right: 0px; display: none; font-size:18px;" class="fas fa-chart-bar"></i>';
									echo '</div>';
									echo '</div>';
									echo '</div>'; // end row
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
	-->
    <!-- sidebar-container END -->
    <!-- MAIN -->

	<!--<i id="map-loading" class="fas fa-circle-notch fa-spin fa-10x"></i>-->
	<div class="hidden" id="overlay-selected-trees" style="position: fixed; bottom: -5px; right: 20px; z-index: 3; padding: 5px; background-color: #408649; color: #FFFFFF; font-size: 12px; border-radius: 5px;">
		&nbsp;
	</div>	
    <div class="col py-3" id="map-container">
        <!-- body-row END -->
        <div id="map"></div>
		<div id="map-right-icons">
			<div class="map-right-icon-parent-container" style="">
				<!-- 
				<div id="map-icon-opened-layers" class="map-right-icon-square">
					<i class="fas fa-layer-group fa-lg"></i>
					<div class="map-right-counter">0</div>
				</div>
				-->
			</div>
		</div>
		<div id="map-right-buttons">
			<div class="map-right-buttons-parent-container" style="">
				<button id="map-summary-button" style="" class="map-right-button" data-state="closed">Map Summary <span class="arrow"><i class="fa-solid fa-chevron-up"></i></span></button>
				<div style="" class="map-right-container map-right-hidden">
					<ul class="list-group">
						<li>
							<!-- 
							<a href="#map-summary" data-toggle="collapse" aria-expanded="false" class="bg-dark list-group-item list-group-item-action flex-column align-items-start sidebar-separator-title">
								<div class="d-flex w-100 justify-content-start sidebar-menu-header align-items-center">
									<span class="mr-2"><i class="fas fa-map-marked-alt"></i></span>
									<span class="menu-collapsed"><b>Map Summary</b></span>
									<span class="submenu-icon ml-auto"></span>
								</div>
							</a>
							-->
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
											<div class="col-6">
												<h6>
													<!-- <i class="fas fa-tree"></i> --> Number of Plants<br />
													<div style="margin-left: 15px; margin-top: 5px;" id="plants_loading"></div>
													<div style="margin-left: 15px; margin-top: 5px;" id="plants_details_icons"></div>
												</h6>
											</div>
											<div class="col-2">
												<h6 id="num-trees">0</h6>
											</div>
											<div class="col-1" style="padding-top: 8px;">
												<button type="button" data-toggle="button" class="btn btn-sel-all" id="select-num-trees" style="transform: scale(0.75); margin-left: 10px;" autocomplete="off" data-original-title='Select all plants'>
													SEL ALL
												</button>
											</div>								
										</div>
									</li>
									<li id="map-summary-selected-trees" class="list-group-item list-group-item-action d-flex">
										<div class="row row-100">
											<div class="col-6">
												<h6>
													<!-- <i class="fab fa-pagelines"></i> --> Selected Plants
												</h6>
											</div>
											<div class="col-2">
												<h6 id="num-selected-trees">0</h6>
											</div>
											<div class="col-1">
												<div id="btn-find-unique-species" title="Get unique species" style="margin-left: 20px; margin-top: 6.5px;"><i class="far fa-lg fa-dot-circle"></i></div>
											</div>								
										</div>
									</li>						
									<li class="list-group-item list-group-item-action d-flex">
										<div class="row row-100">
											<div class="col-6">
												<h6>
													<!-- <div style="display: inline-block; margin-left: -4px; margin-right: 3px;"><i class="fas fa-leaf"></i></div> --><div style="display: inline-block">Species count</div>
												</h6>
											</div>
											<div class="col-4">
												<h6 id="num-species">0</h6>
											</div>
										</div>
									</li>
									<li class="list-group-item list-group-item-action d-flex">
										<div class="row row-100">
											<div class="col-6">
												<h6>
													<!-- <i class="fas fa-book"></i> --> Publications Count
												</h6>
											</div>
											<div class="col-4">
												<h6 id="num-pubs">0</h6>
											</div>
										</div>
									</li>
									<li class="list-group-item list-group-item-action d-flex">
										<div class="row row-100">
											<div class="col-6">
												<h6>
													<!-- <i class="fas fa-map"></i> --> Number of Layers
												</h6>
											</div>
											<div class="col-2">
												<h6 id="num-layers">0</h6>
											</div>
											<div class="col-1">
												<div id="map-icon-opened-layers" class="map-right-icon-square" style="cursor: pointer; margin-left: 10px; color: #fff000;">
													<i class="fas fa-layer-group fa-lg"></i>
													<div class="map-right-counter">0</div>
												</div>
											</div>
										</div>
									</li>
								</ul>
							</div>
						</li>
					</ul>
					<div id="map-opened-layers-container" >
						<div id="map-opened-layers-list" style="padding: 10%">No layers selected</div>
					</div>
				</div>
			</div>
		</div>
		<div id="map-top-buttons">
			<div class="map-top-buttons-parent-container" style="">
				<div id="map-top-layers" class="map-top-container map-top-hidden">
					<div id="layers-menu" class="md-block bg-secondary">
						<ul class="list-group" id="layers-fields-container">
							<!--
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
							-->
							
							<?php
								foreach($variables['cartogratree_layers'] as $group){
									if($group['group_name'] != 'Trees'){
										//generate outer most list 
										$group_name = $group['group_name'];
										$group_name_parts = explode('(', $group_name);
										$group_name_title = $group_name_parts[0];
										$group_name_source = str_replace(')', '', $group_name_parts[1]); 
										echo '<a href="#main-layer-' . $group['group_rank'] . '"  data-toggle="collapse" aria-expanded="false" class="bg-dark list-group-item list-group-item-action flex-column align-items-start">';
										if(count($group['subgroups']) > 1){
											echo '<div class="d-flex w-100 justify-content-start align-items-center"><h6><span class="menu-collapsed">' . $group_name_title . '</span></h6><span class="submenu-icon ml-auto"></span><h6><div style="text-align: right; font-size: 8px; margin-left: 5px;">' . $group_name_source . '</div></h6></div></a>';
										}
										else{
											echo '<div class="d-flex w-100 justify-content-start align-items-center"><h6><span class="menu-collapsed">' . $group_name_title . '</span></h6><span class="submenu-icon ml-auto"></span><h6><div style="text-align: right; font-size: 8px; margin-left: 5px;">' . $group_name_source . '</div></h6></div></a>';
										}
										echo '<div class="collapse sidebar-submenu" id="main-layer-' . $group['group_rank'] . '"><ul class="list-unstyled components layers-container">';    
										if(count($group['subgroups']) == 1){
											foreach($group['subgroups'] as $key => $subgroup){
												foreach($subgroup['layers'] as $layer){
													echo '<li class="justify-content-center container layers-items-header"><div class="row inner-layer-header row-100">';
													echo '<div class="col-7"><div style="font-size:10px; line-height: 1.6em;"  id="ct-layer-title-' . $layer['layer_id'] . '">';
													
													//Clean up code for Species Ranges
													if(stripos($layer['layer_title'],'range') !== FALSE) {
														$layer['layer_title'] = str_ireplace(' range','', $layer['layer_title']);
													}

													echo $layer['layer_title'] . '</div>';
													echo '</div><div class="col-3">';
													echo '<button type="button" data-toggle="button" class="btn btn-toggle layers-btn" id="cartogratree_layer_' . $layer['layer_id'] . '-' . $layer['layer_host'] . '" aria-pressed="false" autocomplete="off"><div class="handle"></div></button>';
													echo '<div style="position: relative; left: -15px; width: 100px;">';
													echo '<i title="Layer details" id="layer_info_icon_' . $layer['layer_id'] . '" style="color: #08afff; cursor: pointer; font-size: 20px; margin-top:10px; margin-left: 45px;" class="fas fa-info-circle"></i>';
													echo '<i title="Legend details" id="legend_legend_icon_' . $layer['layer_id'] . '" style="color: #08afff; cursor: pointer; margin-left: 4px; margin-right: 0px; display: none; font-size:18px;" class="fas fa-chart-bar"></i>';
													echo '</div>';
													echo '</div></div>';
													echo '<div id="opacity-ctrl-' . $layer['layer_id'] . '" class="row inner-layer-op row-100 hidden">';
													echo '<div class="col-5"><label>Opacity <span id="opacity-value-' . $layer['layer_id'] . '">100%</span></label></div>';
													echo '<div class="col-7"><input class="opacity" id="slider-' . $layer['layer_id'] . '-' . $layer['layer_host'] . '" type="range" min="5" max="100" step="0" value="100"/></div>';
													echo '</div></li>';	
												}
											}
										}
										else{
											foreach($group['subgroups'] as $key => $subgroup){
												echo '<li class="justify-content-center layers-items-header"><h6><a class="layer_group_title" href="#layer-group-' . $key . $group['group_rank'] . '" data-toggle="collapse" aria-expanded="false" class="dropdown-toggle">';
												echo preg_replace('/\sv\d+/', '', $subgroup['subgroup_name']) . '</a></h6><div class="collapse container-fluid" id="layer-group-' . $key . $group['group_rank'] . '"><ul class="list-unstyled components layers-container">';
												foreach($subgroup['layers'] as $layer){
													echo '<li class="justify-content-center container layers-items">';
													echo '<div class="row inner-layer-header" style="margin-left: -2.0rem;">';
													echo '<div class="col-6"><div style="font-size:10px; line-height: 1.6em;"  id="ct-layer-title-' . $layer['layer_id'] . '">';
													
													//Clean up code for Precipitation layers
													// if(stripos($layer['layer_title'],'precipitation') !== FALSE) {
													// 	$layer['layer_title'] = str_ireplace('precipitation ','', $layer['layer_title']);
													// }

													echo $layer['layer_title'] . '</div></div>';
													echo '<div class="col-6">';
													echo '<div><button type="button" data-toggle="button" class="btn btn-toggle layers-btn" id="cartogratree_layer_' . $layer['layer_id'] . '-' . $layer['layer_host'] . '" aria-pressed="false" autocomplete="off"><div class="handle"></div></button></div>';
													echo '<div style="position: relative; left: 35px;">';
													echo '<i title="Layer details" id="layer_info_icon_' . $layer['layer_id'] . '" style="color: #08afff; cursor: pointer; font-size: 20px; margin-top:10px; margin-left: 0px;" class="fas fa-info-circle"></i>';
													echo '<i title="Legend details" id="legend_legend_icon_' . $layer['layer_id'] . '" style="color: #08afff; cursor: pointer; margin-left: 4px; margin-right: 0px; display: none; font-size:18px;" class="fas fa-chart-bar"></i>';
													echo '</div>';
													echo '</div>';
													echo '</div>'; // end row
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
				</div>
				<button class="map-top-button" data-state="closed">Layers <span class="arrow"><i class="fa-solid fa-chevron-down"></i></span></button>
			</div>
			
			<div class="map-top-buttons-parent-container" style="">
				<div id="map-top-plant-data-sources" class="map-top-container map-top-hidden">
					<!-- <div class="filter-options sidebar-submenu" id="dataset-options" aria-expanded="false"> -->
						<ul class="list-group">
							<li>
								<!-- 
								<a href="#dataset-options" id="dataset-options-heading" data-toggle="collapse" aria-expanded="false" class="bg-dark list-group-item list-group-item-action flex-column align-items-start sidebar-separator-title">
									<div class="d-flex w-100 justify-content-start sidebar-menu-header align-items-center">
										<span class="mr-2"><i class="fas fa-database"></i></span>
										<span class="menu-collapsed"><b>Plant Dataset Sources</b></span>
										<span class="submenu-icon ml-auto"></span>
									</div>
								</a>
								-->
								<div class="filter-options sidebar-submenu" id="dataset-options" aria-expanded="false">					
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
											<div class="" style="width: 100%;">
												<div class="" style="display: inline-block; width: 60%;">
													<h6 class="" style="line-height: 20px;">
														<div style="display: inline-block; width: 20%;"><!-- <i class="fas fa-tree" style="position: relative; top: -5px;"></i> --> <img src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/trees_imgs/plant.png" /></div><div style="display: inline-block; width: 70%;">Internal submissions</div><!-- TreeGenes -->
													</h6>
												</div>
												<div class="" style="display: inline-block; width: 20%;">
													<button type="button" data-toggle="button" class="tree-dataset-btn btn btn-toggle" id="treegenes-data" aria-pressed="true" autocomplete="off">
														<div class="handle"></div>
													</button>
												</div>
											</div>
										</li>
										<li class="list-group-item list-group-item-action d-flex">
											<div class="" style="width: 100%;">
												<div class="d-inline-block" style="width: 60%;">
													<h6 class="">
														<!-- <i class="fas fa-mobile-alt" style="margin-right: 5px;"></i>--> <img src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/trees_imgs/plant_treesnap.png" /> TreeSnap
													</h6>
												</div>
												<div class="" style="display: inline-block; width: 20%;">
													<button type="button" data-toggle="button" class="btn btn-toggle tree-dataset-btn" id="treesnap-data" aria-pressed="true" autocomplete="off">
														<div class="handle"></div>
													</button>
												</div>
											</div>
										</li>
										<li class="list-group-item list-group-item-action d-flex">
											<div class="" style="width: 100%;">
												<div class="" style="display: inline-block; width: 60%;">
													<h6 class="">
														<!-- <i class="fas fa-database" style="margin-right: 5px;"></i>--> <img src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/trees_imgs/plant_treesnap.png" /> MAMA EAB
													</h6>
												</div>
												<div class="" style="display: inline-block; width: 20%;">
													<button type="button" data-toggle="button" class="btn btn-toggle tree-dataset-btn" id="mamaeab-data" aria-pressed="false" autocomplete="off">
														<div class="handle"></div>
													</button>
												</div>
											</div>
										</li>
										<li class="list-group-item list-group-item-action d-flex">
											<div class="" style="width: 100%;">
												<div class="" style="display: inline-block; width: 60%;">
													<h6 class="" style="line-height: 20px;">
														<div style="display: inline-block; width: 20%;"><!-- <i class="fas fa-database" style="position:relative; top:-5px;"></i>--><img src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/trees_imgs/plant.png" /></div><div style="display: inline-block; width: 70%;">Direct submissions</div> <!-- DRYAD -->
													</h6>
												</div>
												<div class="" style="display: inline-block; width: 20%;">
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
												<div class="" style="width: 100%;">
													<div class="" style="display: inline-block; width: 60%;">
														<h6 class="">
															<?php if ($r['geoserver_dataset_name'] == 'BIEN' ) { ?>
																<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#00992e" class="bi bi-circle-fill" viewBox="0 0 16 16">
																	<circle cx="8" cy="8" r="8"/>
																</svg>
															<?php } else { ?>
															<i class="fas fa-table" style="margin-right: 5px;"></i>
															<?php } ?> <?php echo $r['geoserver_dataset_name']; ?>
														</h6>
													</div>
													<div class="" style="display: inline-block; width: 20%;">
														<button type="button" data-toggle="button" class="btn btn-toggle tree-dataset-btn" id="<?php echo $element_name; ?>" aria-pressed="false" autocomplete="off">
															<div class="handle"></div>
														</button>
													</div>
												</div>							
											</li>						
										<?php		
											}
										?>
										<li class="list-group-item list-group-item-action d-flex">
											<div class="" style="width: 100%;">
												<div class="" style="display: inline-block; width: 60%;">
													<h6 class="">
														<!-- <i class="fas fa-database" style="margin-right: 5px;"></i>--><img src="/sites/all/modules/cartogratree/ct/CartograTree/drupal_module/theme/templates/trees_imgs/plant_treesnap.png" /> EVOME
													</h6>
												</div>
												<div class="" style="display: inline-block; width: 20%;">
													<button type="button" data-toggle="button" class="btn btn-toggle tree-dataset-btn" id="evome-data" aria-pressed="false" autocomplete="off">
														<div class="handle"></div>
													</button>
												</div>
											</div>
										</li>

										<!-- WFID TODO -->
										<?php if( user_access("access cartogratree wfid") ) { ?>
										
										<li class="list-group-item list-group-item-action d-flex">
											<div class="" style="width: 100%;">
												<div class="" style="display: inline-block; width: 60%;">
													<h6 class="">
														<i class="fas fa-database" style="margin-right: 5px;"></i> WFID
													</h6>
												</div>
												<div class="" style="display: inline-block; width: 20%;">
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
						</ul>
					<!-- </div> -->
				</div>
				<button class="map-top-button" data-state="closed">Plant Data Sources <span class="arrow"><i class="fa-solid fa-chevron-down"></i></span></button>
			</div>
			
			<div class="map-top-buttons-parent-container" style="">
				<div id="map-top-filters" class="map-top-container map-top-hidden" style="overflow-x: auto;">
					<div class="" id="tree-filter-options" aria-expanded="false">
					<div style="float: right; z-index: 1002; position: relative;top: 5px; right: 5px; color: #ffffff;"><i onclick='show_filter_instructions();' class="fas fa-question-circle"></i></div>
						<div class="filter-operation-buttons text-center" style="">
							<button class="btn btn-success" id="btn-get">Apply filter</button>
							<button class="btn btn-danger" id="btn-reset">Reset filter</button>
						</div>
						<div id="builder" style="margin-left: 5px;"></div>
						<!-- <div id="pop-struct-options-toggles"></div> -->

					</div>
				</div>
				<button class="map-top-button" data-state="closed">
					Filters <span class="arrow"><i class="fa-solid fa-chevron-down"></i></span>
				</button>
			</div>

			<div class="map-top-buttons-parent-container map-top-popstruct-filter-container" style="">
				<div id="map-top-popstruct-filters" class="map-top-container map-top-hidden" style="overflow-x: auto;">
					<div class="" id="popstruct-filter-options" aria-expanded="false">
						<div style="float: right; z-index: 1002; position: relative;top: 5px; right: 5px; color: #ffffff;"></div>
						<div id="pop-struct-options-toggles" style="background-color: #FFFFFF; padding: 5px;"></div>
					</div>
				</div>
				<button class="map-top-button" data-state="closed">
					Population Structure <span class="arrow"><i class="fa-solid fa-chevron-down"></i></span>
				</button>
			</div>
			
			<div class="map-top-buttons-parent-container" style="">
				<div id="map-top-coordinate-search" class="map-top-container map-top-hidden">
					<div style="padding: 5px;" class="">					
						<div class=" text-center" style='display: inline-block; width: 30%;'>
							<input style="width: 100%; text-align: center; font-size: 10px;" type="text" id="nav-coordinate-lat-go" placeholder="Lat" />
						</div>
						<div class="text-center" style='display: inline-block; width: 30%;'>
							<input style="width: 100%; text-align: center; font-size: 10px;" type="text" id="nav-coordinate-lon-go"  placeholder="Lon"/>
						</div>
						<div class="text-center" style='display: inline-block; width: 30%;'>
							<button style="width: 100%; font-size: 10px; padding: 3px 2px;" id="nav-coordinate-go" type="button" class="btn btn-success">Go</button>
						</div>
					</div>
				</div>
				<button class="map-top-button" data-state="closed">Coordinate Search <span class="arrow"><i class="fa-solid fa-chevron-down"></i></span></button>
			</div>
		</div>
        <div id="legend" style="overflow-y: scroll; max-height: 50%;" class="w240 round shadow-darken10 px12 py12 txt-s"></div>

		<div class="hidden map-overlay" id="tree-details">
			<div id="tree-details-wrapper">
				<div class="card card-cascade narrower mb-4 tree-card">
					<i id="tree-details-closebutton" style="    position: absolute; right: 8px; top: 5px; font-size: 18px;" class="fas fa-window-close"></i>
					<div>Accession Summary</div>
					<div style="padding: .75rem 0.75rem;" class="card-header" id="headingOne">
						<!-- 
						<table>
							<tr>
							<td class="col-2"><i style="margin: 10px; cursor: pointer;" id="tree-details-prev-tree" class="fas fa-arrow-left"></i></td>
							<td class="col">
							<h4 class="mb-0" id="tree-id">
							Unknown
							</h4>
							<h6 id="tree-coordinates">Unknown</h6>
							<h6 id="tree-elevation">Unknown</h6>
							</td>
							<td class="col-2"><i style="margin: 10px; cursor: pointer;" id="tree-details-next-tree" class="fas fa-arrow-right"></i></td>
							</tr>
						</table>
						-->
						<div class="row">
							<div class="col-2">
								<i style="cursor: pointer;" id="tree-details-prev-tree" class="fas fa-arrow-left"></i>
							</div>
							<div class="col-8">
								<h4 class="mb-0" id="tree-id">
								Unknown
								</h4>
								<h6 id="tree-coordinates">Unknown</h6>
								<h6 id="tree-elevation">Unknown</h6>
							</div>
							<div class="col-2">
								<i style="cursor: pointer;" id="tree-details-next-tree" class="fas fa-arrow-right"></i>
							</div>
						</div>
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
							<div class="row">
								<div class="col">
									<button class="btn btn-primary w-100" data-toggle="modal" data-target="#tree-more-info" style='margin-bottom: 3px; font-size: 10px;'>Study Info</button>
								</div>
								<div class="col">
									<button class="btn btn-primary w-100" data-toggle="modal" data-target="#mama-project-more-info" style='margin-bottom: 3px; font-size: 10px;'>Project Info</button>
								</div>
								<div class="col">
									<button class="btn btn-primary w-100" data-toggle="modal" data-target="#species-details-info" style='margin-bottom: 3px; font-size: 10px;'>Species Info</button>
								</div>
							</div>
				
							<!-- <div class="row justify-content-center">
								<h6>Coordinate Type: <span id="tree-coord-type">Approximate</span></h6>
							</div> -->

							<div class="row justify-content-center">
								<!-- <button id="hide-tree-details" type="button" class="btn btn-danger" style='margin-bottom: 3px; font-size:11px;' disabled>Close Plant View</button> -->
								<div class="col">
									<button class="btn w-100 btn-primary add-all-study-plants" style='margin-bottom: 3px; font-size: 10px;'>Add all study plants</button>
								</div>
								<!-- <button id='expand-image-view-button' class="btn btn-primary" data-toggle="modal" data-target="#tree-all-images" style='margin-bottom: 3px;' >Expand Image View</button> -->
							</div>

							<div id="tpps-link" style='margin-bottom:3px;'>			
							</div>

							<!-- <hr /> -->

							<ul class="list-group" id="tree-details-extra">
							</ul>

							

						</div>
					</div>
			  		<!--/.Card content-->
				</div>
				<!--</div>-->
				<div class="btn-group-vertical card narrower mb-4 tree-card"  style='padding-top: 10px; overflow-y: scroll; overflow-x: hidden; max-height: 15vh;'>
					<button style="line-height: 140%; width: 80%; font-size: 0.8em; margin-left: auto; margin-right: auto;" class="btn btn-success p-1" id="add-all-trees">Add All Plants</button>
					<div id="tree-ids-list" style='padding-top: 10px;'></div>
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
				<h3 class="modal-title" id="tree-more-info-label-species" style="padding-top: 0px;padding-bottom: 0;padding: 5px;background-color: #FFFFFF;border-radius: 5px;color: #000000; margin-left: 1em;"></h3>
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
					<div id="treesnap-collection-container" style="width: 100%;padding-left: 20px;padding-right: 10px;" class="hidden">

					</div>
					<div style="width: 100%;">
						<div id="tree-study-associated-container" style="display: inline-block; width: 48%;padding-left: 20px;padding-right: 10px; vertical-align: top;">
							<h3 id="tree-study-associated-label" style="padding-top: 5px; padding-bottom: 5px;">Study Details</h3>
							<div class="media">
								<!-- <i class="fas fa-book-open fa-4x align-self-center mr-3" style="position: relative; top: -15px;"></i> -->
								<div class="media-body">
									<h4 class="mt-0" id="tree-pub-title" style="margin-bottom: 0px;">Who</h4>
									<div style="margin-bottom: 5px;">
										<h5 id="tree-pub-author" style="display: inline-block; margin-right: 10px;">Unknown.</h5>
										<div class="mb-0" id="tree-pub-year" style="display: inline-block; margin-right: 10px;">2000</div>
										<a href="#" target="_blank" id="tree-pub-link">View Additional Details</a>
									</div>
									<div id="tree-details-view-study-type"></div>
									<div id="tree-details-view-study-statistics"></div>
									<p id="study-organisms-csv" style="margin: 0; padding: 0; margin-bottom: 10px;"></p>
									<p id="study-genotypes-count" style="margin: 0; padding: 0; margin-bottom: 10px;"></p>
									<p id="study-phenotypes-count" style="margin: 0; padding: 0; margin-bottom: 10px;"></p>	
									<p id="study-download-files" class="hidden" style="margin: 0; padding: 0;"></p>						
								</div>
							</div>
						</div>
						<div id="plant-details-container" style="display: inline-block; height: 100%; width: 48%; vertical-align: top; border-left: 1px solid #dbdbdb; padding-left: 20px;">
							<h3 id="plant-details-label" style="padding-top: 5px; padding-bottom: 20px;">Plant details</h3>
							<h4 class="mt-0" id="tree-specific-info-label" style="margin-bottom: 0px;"></h4>
							<div id="tree-specific-location-container" style="display: inline-block; width: 50%">
								<h3 id="tree-specific-location-label" style="padding-bottom: 5px; font-size: 16px;">Location</h3>
								<span style='font-size: 14px;' class="badge badge-primary" id="tree-specific-location-value"></span>
							</div>
							<div id="tree-specific-coord-container" style="display: inline-block; width: 50%">
								<h3 id="tree-specific-coord-label" style="padding-bottom: 5px; font-size: 16px;">Coordinate type</h3>
								<span style='font-size: 14px;' class="badge badge-primary" id="tree-specific-coord-value"></span>
							</div>
							<div id="tree-specific-unique-phenotypes-container" style="display: inline-block; width: 50%">
								<h3 id="tree-specific-unique-phenotypes-count-label" style="padding-bottom: 5px; font-size: 16px;">Unique Phenotypes</h3>
								<span style='font-size: 14px;' class="badge badge-primary" id="tree-specific-unique-phenotypes-count"></span>
							</div>
							<div id="tree-specific-unique-genotypes-container" style="display: inline-block; width: 50%">
								<h3 id="tree-specific-unique-genotypes-count-label" style="padding-bottom: 5px; font-size: 16px;">Unique Genotypes</h3>
								<span style='font-size: 14px;' class="badge badge-primary" id="tree-specific-unique-genotypes-count">0</span>
							</div>
						</div>
						<div id="treesnap-images-container" class="hidden" style="display: inline-block; height: 100%; width: 48%; vertical-align: top; border-left: 1px solid #dbdbdb; padding-left: 20px;">
							<div class="view view-cascade">
								<div id="treesnap-img-carousel" class="carousel" data-interval="false">
								<ol class="carousel-indicators" id="treesnap-imgs-indicators">
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
						</div>
					</div>
					<div id="tree-study-environmental-container" style="width: 100%;padding-left: 20px;padding-right: 10px;">
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
					<div id="tree-markers-count-container" style="width: 30%">
						<h3 id="tree-markers-label" style="padding-bottom: 5px; font-size: 16px;">Markers</h3>
						<span style='font-size: 14px;' class="badge badge-primary" id="tree-markers"></span>
					</div>
					<div id="tree-phenotypes-count-container" style="width: 30%">
						<h3 id="tree-markers-count-label" style="padding-bottom: 5px; font-size: 16px;">Markers Count</h3>
						<span style='font-size: 14px;' class="badge badge-primary" id="tree-markers-count"></span>
						<h3 id="tree-phenotypes-count-label" style="padding-bottom: 5px; font-size: 16px;">Phenotype Measures</h3>
						<span style='font-size: 14px;' class="badge badge-primary" id="tree-phenotypes-count"></span>
					</div>					
				</div>
				<hr />
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

<div class="modal fade" id="mama-project-more-info" tabindex="-1" role="dialog" aria-labelledby="project-more-info-label" aria-hidden="true">	
	<div class="modal-dialog modal-lg" role="document">
		<div class="modal-content">
			<div class="modal-header">
				<!-- <h3 class="modal-title" id="project-more-info-label">Project Info</h3> -->
				<button type="button" class="close" data-dismiss="modal" aria-label="Close">
					<span aria-hidden="true">&times;</span>
				</button>
			</div>
			<div class="modal-body">
				<div id="project-info-container">
					<!-- <div id="project-info-header" style="display: inline-block; margin-left: 22px; padding: 2px; background: #589a60; color: #FFFFFF; border-radius: 2px;">Project Information</div> -->
					<!-- <div id="biome-number" style="display: inline-block; margin-left: 10px;"></div> -->
					
					<div id="project-info-desc" style="margin-left: 5px; "></div>
					<h2 id="project-tree-id"></h2>
					<div id="project-tree-species" style="padding: 5px 10px 5px 10px; background-color: #589a60; border-radius: 5px; color: #FFFFFF; display: inline-block;"></div>
					<h2>Plant specific details</h2>
					<div id="project-info-phenotypes-images" style="margin-left: 5px; "></div>
					<div id="project-info-phenotypes" style="margin-left: 5px; "></div>
				</div>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
			</div>
		</div>
	</div>
</div>


<div class="modal fade" id="species-details-info" tabindex="-1" role="dialog" aria-labelledby="species-details-info-label" aria-hidden="true">	
	<div class="modal-dialog modal-lg modal-dialog-centered" role="document">
		<div class="modal-content">
			<div class="modal-header">
				<div id="species-details-info-title"></div>
				<button type="button" class="close" data-dismiss="modal" aria-label="Close">
					<span aria-hidden="true">&times;</span>
				</button>
			</div>
			<div class="modal-body">
				<div class="row w-100">
					<div class="p-2 w-100 ml-2" id="species-details-info-body-genomes-header" style="background-color: #589a60; color: #FFFFFF; border: 1px solid #41824c"><h2 style="padding-top: 0px; padding-bottom: 0px;">Genomes</h2></div>
				</div>
				<div class="row w-100">
					<div class="p-2 w-100" id="species-details-info-body-genomes-container"></div>
				</div>
				<div class="row w-100 mt-2">
					<div class="p-2 w-100 ml-2" id="species-details-info-body-studies-header" style="background-color: #589a60; color: #FFFFFF; border: 1px solid #41824c"><h2 style="padding-top: 0px; padding-bottom: 0px;">TPPS Studies</h2></div>
				</div>
				<div class="row w-100">
					<div class="p-2 w-100" id="species-details-info-body-studies-container"></div>
				</div>
				<div class="row w-100">
					<div class="p-2 w-100" id="species-details-info-species-link-container"></div>
					<div class="p-2 w-100" id="species-details-info-iframe-species-container"></div>
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
