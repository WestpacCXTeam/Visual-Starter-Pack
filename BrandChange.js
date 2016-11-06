//GLOBALS //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var allBrands = ['Westpac', 'Bank of Melbourne', 'Bank SA', 'St.George', 'Westpac Group', 'BT'];
var assetsRoot = {
	'Bank of Melbourne': '05-BOM-Assets',
	'Bank SA': '06-BSA-Assets',
	'BT': '08-BT-Assets',
	'St.George': '04-STG-Assets',
	'Westpac': '03-WBC-Assets',
	'Westpac Group': '07-WBG-Assets',
};
var UIRoot = {
	'Bank of Melbourne': '03-BOM',
	'Bank SA': '04-BSA',
	'BT': '06-BT',
	'St.George': '02-STG',
	'Westpac': '01-WBC',
	'Westpac Group': '05-WBG',
};
var brandID = {
	'Bank of Melbourne': 'BOM',
	'Bank SA': 'BSA',
	'BT': 'BT',
	'St.George': 'STG',
	'Westpac': 'WBC',
	'Westpac Group': 'WBG',
};
var REPORT = {
	'assets': {
		'changed': 0,
		'failed': [],
	},
	'swatches': {
		'changed': 0,
		'failed': 0,
	},
	'styles': {
		'changed': 0,
		'failed': 0,
	},
}

/**
 * Try to guess current brand and store in properties
 *
 * @type {Object}
 */
var CurrentBrand = {
	/**
	 * The place we store the current brand globally
	 *
	 * @type {String}
	 */
	ThisBrand: '',

	/*
	 * GetCurrentBrand
	 *
	 * @param  assetsRoot  {array}   All brand root folder strings
	 */
	get: function( assetsRoot ) {
		var links = app.activeDocument.links; //get all asset links from the doc
		var currentBrand = ''; //the brand to be determined

		if( links.length > 0 ) { //if there are assets on the page
			var path = links[0].filePath; //just look at each link one to sniff out what brand we are in.

			for(var property in assetsRoot) {
				if( assetsRoot.hasOwnProperty( property ) ) {
					var _hasString = path.indexOf( ':' + assetsRoot[ property ] );

					if( _hasString > 1 ) {
						currentBrand = property;
					}
				}
			}
		}

		this.ThisBrand = currentBrand; //setting globally
	},
};


CurrentBrand.get( assetsRoot ); //try to guess current brand


//show dialog
var brandSelector = ShowMainDialog( CurrentBrand, assetsRoot, '', null );
var importDlg = brandSelector.show();


//Getting current brand ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
if(importDlg == true) { //if dialog has been clicked
	var thisBrand = '';
	var brand = '';

	for(var brandName in allBrands) { //checking what we selected for current brand
		var _active = brandSelector.currentBrands[ 'currentBrandRadios' + allBrands[ brandName ] ].value;

		if(_active == true) {
			thisBrand = allBrands[ brandName ];
		}
	}
	CurrentBrand.ThisBrand = currentBrand = thisBrand; //set the current brand globally

	for(var brandName in allBrands) { //why do I have to do this? Please give me the value of the radio button selection
		if( allBrands[ brandName ] != currentBrand ) {
			var _active = brandSelector.brands[ 'brandRadios' + allBrands[ brandName ] ].value;

			if(_active == true) {
				brand = allBrands[ brandName ];
			}
		}
	}


	if( brand == '' ) {
		alert('Please choose a brand. We can\'t do any work if you don\'t choose one... :(');
	}
	else { //if dialog had a brand chosen


//Select Starter Pack folder ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		var starterPackFolder = Folder.selectDialog("Please select the folder of the GUI-Starter-Pack");

		if( starterPackFolder === null ) {
			alert('We couldn\'t find the folder. Please try again.');
		}
		else {


//Check Starter Pack ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			starterPack = starterPackFolder + ''; //convert to string, man I miss ES7!
			var newPath = starterPack + '/' + assetsRoot[ brand ] + '/';

			var checkAsset = File( newPath + '03-Symbols/logo-phone.ai' ); //check one asset
			var checkSwatch = File( newPath + '01-Colour-Swatches/swatches.ase' ); //check swatches
			var checkKit = File( starterPack + '/01-Project-Templates/02-UI-Kits/' + UIRoot[ brand ] + '-UI-Kit.indt' ); //check UI-Kits

			if( !checkAsset.exists || !checkSwatch.exists || !checkKit.exists ) {
				alert('There is something wrong with your Starter Pack folder.\n' +
					'It seems\n' +
					(checkAsset.exists ? '' : '- some asssets are missing\n') +
					(checkSwatch.exists ? '' : '- the swatches are missing\n') +
					(checkKit.exists ? '' : '- the UI-Kit file is missing\n') + '\n' +
					'Please download the latest here: http://gel.westpacgroup.com.au/downloads/visual-design/gui-starter-pack.zip'
				);
			}
			else {


//Show progress bar ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
				progressBar = new Window('window', 'Progress');
				with(progressBar) {
					progressBar.myProgressBar = add('progressbar', [0, 0, 400, 24], 0, 100);
				}
				progressBar.show(); //open progress bard window

				var location = progressBar.location + ''; //update the progressbar position
				location = location.split(',');
				progressBar.location = location[0] + ',' + ( location[1] - 250 );
				progressBar.visible = true;


				progressBar.myProgressBar.value = 25; //update progress bar to give feedback that we are already pretty deep in the process (25% deep)


//Ask for Starter Pack location ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
				var secondDialog = ShowMainDialog( CurrentBrand, assetsRoot, brand, starterPack );
				var secondDialogReturn = secondDialog.show(); //show dialog again this time with the options filled in

				if(secondDialogReturn == true) { //second dialog has not been canceled


//Step 1 relink the assets /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
					var links = app.activeDocument.links; //get all asset links from the doc

					for(j = links.length - 1; j >= 0; j--) {
						var oldPath = links[j].filePath; //old path of the asset

						var newFile = oldPath.split( assetsRoot[ currentBrand ] + ':' ); //split on Starter pack folder name

						if( newFile.length > 1 ) { //only look for assets that are linked to the Starter Pack
							newFile = newFile[1].split(':'); //take bit after starter pack path and replace : with /
							file = newFile[ (newFile.length - 1) ];
							newFile = newPath + newFile.join('/'); //build path
							newFile = File( newFile ); //touch file to see if exists

							if(newFile.exists) {
								REPORT.assets.changed ++;

								links[j].relink(newFile);
								links[j].update();
							}
							else {
								REPORT.assets.failed.push(file);
								continue;
							}
						}

						var step = 25 + ( ( 25 / links.length ) * j );
						progressBar.myProgressBar.value = step; //update progress bar
					}


//Step 2 load the swatches /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
					var newSwatch = File( newPath + '01-Colour-Swatches/swatches.ase' ); //load new swatches for new brand

					if(newSwatch.exists) {
						app.activeDocument.loadSwatches( newSwatch );
					}
					else {
						//
					}

					progressBar.myProgressBar.value = 55; //update progress bar


//Step 3 switch the swatches ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
					var oldSwatches = app.activeDocument.swatches;

					//delete and replace duplicates
					for(var i = 0; i < oldSwatches.count(); i++) {
						if( oldSwatches[i].parentColorGroup.name.slice( 0, brandID[ currentBrand ].length ) == brandID[ currentBrand ] ) {

							try {
								var name = oldSwatches[i].name + ' copy';

								oldSwatches[i].remove( name );
								i--;
								REPORT.swatches.changed ++;
							}
							catch( error ) {
								REPORT.swatches.failed ++;
							}
						}

						var step = 55 + ( ( 15 / oldSwatches.count() ) * i );
						progressBar.myProgressBar.value = step; //update progress bar
					};

					//delete all old swatches
					for(var i = 0; i < oldSwatches.count(); i++) {
						if( oldSwatches[i].parentColorGroup.name.slice( 0, brandID[ currentBrand ].length ) == brandID[ currentBrand ] ) {

							try {
								oldSwatches[i].remove();
								i--;
								REPORT.swatches.failed --;
							}
							catch( error ) {
								//already captured
							}
						}

						var step = 70 + ( ( 15 / oldSwatches.count() ) * i );
						progressBar.myProgressBar.value = step; //update progress bar
					};

					//rename copied swatches
					for(var i = 0; i < oldSwatches.count(); i++) {
						if( oldSwatches[i].parentColorGroup.name.slice( 0, brandID[ brand ].length ) == brandID[ brand ] ) {

							try {
								newName = oldSwatches[i].name.replace( ' copy', '' );
								oldSwatches[i].name = newName;

								REPORT.swatches.changed ++;
							}
							catch( error ) {
								REPORT.swatches.failed ++;
							}
						}

						var step = 70 + ( ( 15 / oldSwatches.count() ) * i );
						progressBar.myProgressBar.value = step; //update progress bar
					};


					//delete empty groups
					var colorGroups = app.activeDocument.colorGroups;

					for(var i = 0; i < colorGroups.length; i++) {

						if( colorGroups[i].name.slice( 0, brandID[ currentBrand ].length ) === brandID[ currentBrand ] ) {
							if( colorGroups[i].colorGroupSwatches.length === 0 ) {
								colorGroups[i].remove();
								i--;
								REPORT.swatches.changed ++;
							}
						}
					}


//Step 4 load styles ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
					var newStyles = File( starterPack + '/' + '01-Project-Templates/02-UI-Kits/' + UIRoot[ brand ] + '-UI-Kit.indt' ); //touch file to see if exists

					if(newStyles.exists) {
						app.activeDocument.importStyles(ImportFormat.TEXT_STYLES_FORMAT, newStyles, GlobalClashResolutionStrategy.LOAD_ALL_WITH_OVERWRITE);
						progressBar.myProgressBar.value = (85 + (1.666666 * 1)); //update progress bar

						app.activeDocument.importStyles(ImportFormat.CHARACTER_STYLES_FORMAT, newStyles, GlobalClashResolutionStrategy.LOAD_ALL_WITH_OVERWRITE);
						progressBar.myProgressBar.value = (85 + (1.666666 * 2)); //update progress bar

						app.activeDocument.importStyles(ImportFormat.PARAGRAPH_STYLES_FORMAT, newStyles, GlobalClashResolutionStrategy.LOAD_ALL_WITH_OVERWRITE);
						progressBar.myProgressBar.value = (85 + (1.666666 * 3)); //update progress bar

						app.activeDocument.importStyles(ImportFormat.TOC_STYLES_FORMAT, newStyles, GlobalClashResolutionStrategy.LOAD_ALL_WITH_OVERWRITE);
						progressBar.myProgressBar.value = (85 + (1.666666 * 4)); //update progress bar

						app.activeDocument.importStyles(ImportFormat.OBJECT_STYLES_FORMAT, newStyles, GlobalClashResolutionStrategy.LOAD_ALL_WITH_OVERWRITE);
						progressBar.myProgressBar.value = (85 + (1.666666 * 5)); //update progress bar

						app.activeDocument.importStyles(ImportFormat.STROKE_STYLES_FORMAT, newStyles, GlobalClashResolutionStrategy.LOAD_ALL_WITH_OVERWRITE);
						progressBar.myProgressBar.value = (85 + (1.666666 * 6)); //update progress bar

						app.activeDocument.importStyles(ImportFormat.TABLE_STYLES_FORMAT, newStyles, GlobalClashResolutionStrategy.LOAD_ALL_WITH_OVERWRITE);
						progressBar.myProgressBar.value = (85 + (1.666666 * 7)); //update progress bar

						app.activeDocument.importStyles(ImportFormat.CELL_STYLES_FORMAT, newStyles, GlobalClashResolutionStrategy.LOAD_ALL_WITH_OVERWRITE);
						progressBar.myProgressBar.value = (85 + (1.666666 * 8)); //update progress bar

						app.activeDocument.importStyles(ImportFormat.TABLE_AND_CELL_STYLES_FORMAT, newStyles, GlobalClashResolutionStrategy.LOAD_ALL_WITH_OVERWRITE);
						progressBar.myProgressBar.value = (85 + (1.666666 * 9)); //update progress bar

						REPORT.styles.changed += 9;
					}
					else {
						REPORT.styles.failed -= 9;
					}

					progressBar.myProgressBar.value = 100; //update progress bar
					progressBar.hide(); //close progress bar window


//Step 5 show success message //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
					successMsg = new Window('dialog', 'Done!');
					successMsg.alignChildren = 'left';

					with(successMsg) {
						successMsg.successMessage = add('statictext', undefined, 'We changed your brand from ' + currentBrand + ' to ' + brand );

						successMsg.successMessage = add('statictext', undefined, 'Assets changed:\n' + REPORT.assets.changed, { multiline: true });
						if( REPORT.assets.failed.length ) {
							successMsg.successMessage = add('statictext', undefined, 'Assets failed:\n' + REPORT.assets.failed.join('\n'), { multiline: true });
						}

						successMsg.successMessage = add('statictext', undefined, 'Swatches changed:\n' + REPORT.swatches.changed, { multiline: true });
						if( REPORT.swatches.failed.length ) {
							successMsg.successMessage = add('statictext', undefined, 'Swatches failed:\n' + REPORT.swatches.failed, { multiline: true });
						}

						successMsg.successMessage = add('statictext', undefined, 'Styles changed:\n' + REPORT.styles.changed, { multiline: true });
						if( REPORT.styles.failed.length ) {
							successMsg.successMessage = add('statictext', undefined, 'Styles failed:\n' + REPORT.styles.failed, { multiline: true });
						}

						successMsg.buttonGrp = add('group');
						successMsg.buttonGrp.orientation = 'row';
						with(successMsg.buttonGrp) {
							successMsg.buttonGrp.btnOK = add('button', undefined, 'OK');
						}
					}

					successMsg.show();
				}
			}
		}
	}
}


//Helper methods ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
 * ShowMainDialog
 *
 * @param  CurrentBrand  {object}  The current brand from our global var
 * @param  assetsRoot    {array}   All brand root folder strings
 * @param  brand         {string}  Brand to be selected
 * @param  SPpath        {string}  Path to Stater Pack
 */
function ShowMainDialog( CurrentBrand, assetsRoot, brand, SPpath ) {
	var brandSelector = new Window('dialog', 'BRAND SWITCHER');
	var currentBrand = CurrentBrand.ThisBrand;

	with(brandSelector) {

		brandSelector.srcFileTxt = add('statictext', undefined, '_________________________ SWITCH THE BRAND _______________________');
		brandSelector.srcFileTxt.alignment = 'center';
		brandSelector.srcFileTxt = add('statictext', undefined, 'Like switching Vegemite to Marmite');
		brandSelector.srcFileTxt.alignment = 'center';
		brandSelector.srcFileTxt = add('statictext', undefined, '');

		brandSelector.alignChildren = 'left';

		brandSelector.currentBrands = add('group');
		brandSelector.currentBrands.orientation = 'column';
		brandSelector.currentBrands.alignment = 'fill';
		brandSelector.currentBrands.alignChildren = 'left';
		brandSelector.currentBrands.srcFileTxt = add('statictext', undefined, '1. Please select the brand this document is in.');

		if( brand === '' || CurrentBrand.ThisBrand === '' ) {
			for(var property in assetsRoot) {
				if( assetsRoot.hasOwnProperty( property ) ) {
					brandSelector.currentBrands[ ('currentBrandRadios' + property) ] = add('radioButton', undefined, property, { name: property });
					brandSelector.currentBrands[ ('currentBrandRadios' + property) ].alignment = 'fill';

					if( property === currentBrand ) {
						brandSelector.currentBrands[ ('currentBrandRadios' + property) ].value = true;
					}
				}
			}
		}
		else {
			brandSelector.currentBrands.srcFileTxt = add('statictext', undefined, currentBrand);
		}


		brandSelector.srcFileTxt = add('statictext', undefined, '');


		brandSelector.brands = add('group');
		brandSelector.brands.orientation = 'column';
		brandSelector.brands.alignment = 'fill';
		brandSelector.brands.alignChildren = 'left';

		with(brandSelector.brands) {
			brandSelector.brands.srcFileTxt = add('statictext', undefined, '2. Select a brand');

			if( brand !== '' ) {
				brandSelector.brands.srcFileTxt = add('statictext', undefined, brand);
			}
			else {
				for(var property in assetsRoot) {
					if( assetsRoot.hasOwnProperty( property ) ) {
						brandSelector.brands[ ('brandRadios' + property) ] = add('radioButton', undefined, property, { name: property });
					}
				}
			}
		}


		brandSelector.srcFileTxt = add('statictext', undefined, '');


		brandSelector.buttonGrp = add('group');
		brandSelector.buttonGrp.orientation = 'row';
		brandSelector.buttonGrp.orientation = 'column';
		brandSelector.buttonGrp.alignment = 'fill';
		brandSelector.buttonGrp.alignChildren = 'left';

		with(brandSelector.buttonGrp) {
			brandSelector.buttonGrp.srcFileTxt = add('statictext', undefined, '3. Locate your GUI starter pack folder');
			if( SPpath == null ) {
				brandSelector.buttonGrp.btnOK = add('button', undefined, 'Choose', { name: 'OK' });
			}
			else {
				brandSelector.buttonGrp.srcFileTxt = add('statictext', undefined, SPpath);
			}
		}

		brandSelector.lastGrp = add('group');
		brandSelector.lastGrp.orientation = 'row';
		brandSelector.lastGrp.alignment = 'right';
		brandSelector.lastGrp.alignChildren = 'right';

		with(brandSelector.lastGrp) {
			if( SPpath != null ) {
				brandSelector.buttonGrp.btnOK = add('button', undefined, 'Switch the brand!', { name: 'Ok' });
			}
			brandSelector.lastGrp.btnCancel = add('button', undefined, 'Cancel');
		}
	};

	brandSelector.center();
	return brandSelector;
}