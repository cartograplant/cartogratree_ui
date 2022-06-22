Version 1.5.0

# Changelog
All notable changes made in regards to the Cartogratree module

## [1.7.0] - 06-24-2019
### Added
- Query builder
- CORS support for NodeJS API
- Map pans to location of filtered trees
- Reset map button
- Reset filter button
- Multi image support slider

### Changed
- NodeJS API
  - Added two controllers
  - Will be primary endpoint for cartogratree data

- Filtering system
  - Filter using a query builder and parsing to SQL
- Tree features properties
  - Removed everything except for the tree id

### Removed
- Legacy code and bad html generation functions



## [1.5.0] - 05-20-2019
### Added
- Inclusive/Exclusive Filtering
- Environmental layer legends
- Additional stages in analysis form
- All TreeSnap trees based on TreeSnap API integration
- Nav indicator
- Data clustering
- D3js integration
- NEON layers
- Caching for NodeJS API
- Table generation based on trees with SNP marker

### Changed
- Filtering 
- UI layout for filters and environmental layers panel
- Layout for detailed view for trees
  - Phenotypes and marketypes of trees now shown
  - Associated publication, if exists, also now shown
- Switched to OOP
- About CartograTree popup
- NodeJS API endpoints
- Layer hosting now split between geoserver and mapbox
- Tree icons
- Saving of sessions
  - filters and layers activated
  - current state and position of the map
- Split main module file into several files
- Trees from each dataset now loaded into a single feature list, instead of separate feature list for each dataset
- CartograTree readthedocs

### Removed
- Some legacy code
- Old legend images being loaded from geoserver



## [1.1.0] - 01-22-2019
### Added
- Analysis form
- Save/Delete/Load queries/current state of the map
- Saving session and state of the map on exit
- Popup to show additional information when clicking random point with no trees
- Publications/Phenotypes/Markertypes sections and filters
- Login/logout functionality
- Map summary as an overlay of the map
- Legends of active layers
- TreeSnap and Datadryad datasets
- Logos of third party resources being used to the about page
- close button on popups
- environmental data is now shown for the area of the map that was clicked
- Added organism section to Menu to house the family/genus/species filters

### Changed
- Phenotypes and publication data are now shown on detailed tree view
- Publication and species counters on the map summary now depend on whether they are present on the map, not on whether they are filtered by the user
- Stopped preloading the large layers, and they are now only laoded by the user directly or by the map if they are saved by a session
- Removing a parent filter now removes all the child filters of the parent
- Popups are now created based on whenever a tree is clicked and are not unqiue for each dataset
- FIlter by the individual trees instead of having separate filtering dynamics for the organisms and other types of filters
- Moved the icons and logos to their own directories
- Split the module file int other files somewhat

### Fixed
- Soil layer bug with sections being selected (still to be some issues when multiple layers are active and showing the environmental data, can display multiple popups)

### Removed
- some invalid trees from publications and foreign datasets
- Hover to tree clusters on filter(temporarily)
- Some legacy code left from the merger



## [1.0.0] - 11-29-2018
### Added
- CHANGELOG to make it easier for others to view changes made
- Map panning to cluster center of trees when filtered
- Top navigation bar to house links and further menu options for user
- Icons from [fontawesome](https://fontawesome.com/) for uniform design 
- About section as a modal popup
- Mobile devices support by restructuring the layout
- Searchable dropdown menus for filtering
- Tooltips for each section of the menu and for the legend indicators

### Changed
- Structure and UI of the application, but core components kept intact
- Clear indicator of a collapsing menu at the bottom of the sidebar
- Map options section now has link to old cartogratree
- Colorscheme to dark colors and green
- Clear distinction between the main menu and layers menu
- Map summary now shown as an overlay of the map on left hand side
- Put the family/species/genus filters in an overarching organism category
- Sidebar will not completely dissapear once it collapses
- Login option on the top nav
- Using a modular approach for the js to remove global variables and obfuscate some of the data
- Instead of having a key/val pair for each filter option, put into a single array that is stored in the settings of drupal
- Swap to $ from jQuery for consistency
- put the js and css files into their own directories
- limited max and min zoom for mapbox to allow for shorter load times
- changed species naming from just species, to genus + species
- changed ordering of family/genus/species filters

### Fixed
- dawn.js conflict by using an earlier version of jQuery
- tooltip not working for dynamically created elements

### Removed
- old js and css files from the two separate modules pre-merger
- buttons for adding more options for the filters
- openlayers
- Redundant code for creating the filter select options, and added a generic function in its place







