/*!
 * ion-sequenceEditor-NI v1.0.1
 *
 * Date: 2023-02-07 16:33:09
 */
$(document).ready(function () {
	// Variables to define filter colors. FIXIT - move to css?
	let filterCSScolor = {
		filtered: '#fff19d',
		unfiltered: 'inherit'
	};

	let hsNumber = 1; // Variable to keep halfset number for the next added commands. Initial value is the first halfset. FIXIT maybe do not use global variable?
	let idToSelect; // Variable to set a new row selected in the sequences table, so the table scrolls to the row
	console.log(idToSelect);
	let $sequencesTable = $('#jqGridMaster'),
		$sequenceItemsTable = $('#jqGridDetail'),
		sequenceItemsTablePager = '#jqGridDetailPager';
	// let lastRowIdx = {};

	let seqItemDefReq = serviceRequest(sequenceItemDefUrl, 'GET', {}, {}, { dataType: 'json' }),
		errItemDefReq = serviceRequest(errorItemDefUrl, 'GET', {}, {}, { dataType: 'json' });

	$.when(
		seqItemDefReq,
		errItemDefReq
	).done(
		function (
			seqItemDefReqVal,
			errItemDefReqVal
		) {

			let sequenceItemDef = seqItemDefReqVal[0],
				exceptionDef = errItemDefReqVal[0],
				lastSel,
				topPagerDiv = $('#jqGridDetail_toppager')[0],
				botPagerDiv = $('#jqGridDetailPager')[0];


			// Sequence grid
			$sequencesTable.jqGrid($.extend(
				{}, // Sequences grid options object
				gridCommonOptions,
				{ // Actual options
					caption: $.jgrid.locales.ru.masterTable.caption || 'Cyclogram list',
					pager: '#jqGridMasterPager',
					url: sequenceNIUrl,
					editurl: sequenceNIUrl,
					forceClientSorting: true,
					navOptions: { reloadGridOptions: { fromServer: true } },
					rowNum: 10,
					rowList: [5, 10, 20, 30, "10000:All"],
					multiselect: false,
					sortname: 'UIModified',
					sortorder: 'desc',
					colModel: masterColModel,
					serializeRowData: function (postdata) {
						return JSON.stringify(postdata);
					},
					onSelectRow: function (ids) {
						if (ids && ids !== lastSel) {

							// Only for inline editing!
							// cancel editing of the previous selected row if it was in editing state.
							// jqGrid hold intern savedRow array inside of jqGrid object,
							// so it is safe to call restoreRow method with any id parameter
							// if jqGrid not in editing state

							if (typeof lastSel !== 'undefined') {
								$(this).jqGrid('restoreRow', lastSel);
							}
							lastSel = ids;
						}
					},
					loadComplete: function () {

						let grid = $(this),
							iCol = getColumnIndexByName(grid, 'actions');

						grid.find('>tbody>tr.jqgrow>td:nth-child(' + (iCol + 1) + ')').each(function () {
							$('<div>', {
								title: $.jgrid.locales.ru.nav.detailtitle || 'Details',
								mouseover: function () {
									$(this).addClass('active');
								},
								mouseout: function () {
									$(this).removeClass('active');
								},
								click: function (e) {
									let ids = $(e.target).closest('tr.jqgrow').attr('id'),
										gridMasterRowData = grid.jqGrid('getRowData', ids),
										gridDetail = $sequenceItemsTable,
										gridDetailDefCaption = $.jgrid.locales.ru.detailTable.caption,
										gridDetailParam = gridDetail.jqGrid('getGridParam');

									gridDetail.jqGrid('clearGridData');
									gridDetail.jqGrid('setGridParam',
										{
											url: sequenceItemNIUrl + '?guidsequence=' + gridMasterRowData['GUID'],
											datatype: 'json',
										}
									);
									gridDetail.jqGrid('setCaption',
										[gridDetailDefCaption, gridMasterRowData['Title']].join(' : ')
									).trigger('reloadGrid');

									lastEdited = null;
									idToSelect = undefined;
									console.log(idToSelect);

									// draw mnemosquares and timeline
									self.IndexViewModel.selectedCyclogramGUID(ids);
									self.IndexViewModel.ShowCyclogramContent(self.IndexViewModel);

									$('#scInfoContainer').empty(); // Clear the info area
								}
							}
							).css({ float: 'left', cursor: 'pointer' })
								//.addClass('btn btn-xs btn-outline-secondary ui-pg-div ui-inline-custom')
								.addClass('btn btn-xs btn-outline-secondary ui-pg-div ui-inline-custom')
								//.append('<span class="fa fa-bar-chart"></span>')
								.append('<span class="fa fa-fw fa-bar-chart"></span>')
								.appendTo($(this).children('div'));
						});
					}
				}
			));




			$sequencesTable.jqGrid('navGrid', '#jqGridMasterPager',
				{
					edit: false,
					add: false,
					del: false,
					search: false,
					refresh: true,
					view: false,
					position: 'left',
					cloneToTop: true,
					afterRefresh: function () {
						$('#scInfoContainer').empty();
						$sequenceItemsTable.jqGrid('setGridParam', { datatype: 'json' }).trigger('reloadGrid');
					}
				},
				{ // Edit parameters. Set in the 'actions' for inline edit
				},
				{ // Add parameters
				},
				{ // Delete parameters. Set in the 'actions' for inline delete
				}
			);
			$sequencesTable.jqGrid('filterToolbar', {
				stringResult: false,
				searchOperators: true,
				afterSearch: function () {
					var filterClass = "filteredColumn",
						filterCSS = { 'background-color': filterCSScolor.unfiltered },
						filters,
						colsFitered,
						grid = $(this),
						param = grid.jqGrid('getGridParam'),
						postData = param['postData'],
						cols = param['colModel'];
					for (var i = 0; i < cols.length; i += 1) {
						grid.jqGrid(
							'setColProp',
							cols[i]['name'],
							{
								classes: '',
								labelClasses: ''
							}
						);
						grid.jqGrid(
							'setLabel',
							cols[i]['name'],
							false,
							filterCSS
						);
					};
					if (postData['_search']) {
						filterCSS['background-color'] = filterCSScolor.filtered;
						filters = JSON.parse(postData['filters']);
						colsFitered = filters['rules'];
						for (var i = 0; i < colsFitered.length; i += 1) {
							grid.jqGrid(
								'setColProp',
								colsFitered[i]['field'],
								{
									classes: filterClass,
									labelClasses: filterClass
								}
							);
							grid.jqGrid(
								'setLabel',
								colsFitered[i]['field'],
								false,
								filterCSS
							);
						}
					};
				},
			});

			// Sequence items grid
			$sequenceItemsTable.jqGrid($.extend(
				{}, // SequenceItems grid options object
				gridCommonOptions,
				{ // SequenceItems grid actual options
					caption: $.jgrid.locales.ru.detailTable.caption || 'Cyclogram',
					pager: sequenceItemsTablePager,
					url: sequenceItemNIUrl,
					editurl: sequenceItemNIUrl,
					height: 300,
					multiselect: false,
					userDataOnFooter: true,
					userDataOnHeader: true,
					altRows: true,
					sortname: 'Offset',
					sortorder: 'asc',
					loadonce: true,
					rowNum: -1,
					forceClientSorting: true,
					hiddengrid: true,
					colModel: detailColModel(sequenceItemDef, exceptionDef),
					beforeSelectRow: handleMultiSelect, // handle multi select
					navOptions: {
						reloadGridOptions: {
							fromServer: true
						}
					},
					actionsNavOptions: {

					},
					loadComplete: function (data) {
						var grid = $(this), param, gridId;
						var iCol = getColumnIndexByName(grid, 'actions');
						param = grid.jqGrid('getGridParam');
						gridId = param['id'];

						$("#del_" + gridId).removeClass('disabled');
						$("#del_" + gridId + "_top").removeClass('disabled');
						$("#shiftToPos_" + gridId).removeClass('disabled');
						$("#shiftToPos_" + gridId + "_top").removeClass('disabled');
						$("#setTimePos_" + gridId).removeClass('disabled');
						$("#setTimePos_" + gridId + "_top").removeClass('disabled');
						$("#setHalfSet_" + gridId).removeClass('disabled');
						$("#setHalfSet_" + gridId + "_top").removeClass('disabled');

						// There is a bug in jquery.jqgrid.src.js. 
						// Even if editformbutton is set to true and actionsNavOptions is set to hide edit button, 
						// one has to remove manually the edit button (like it is done here). 
						// Otherwise inline edit buttons will be visible and active. Is to make fork???
						$(this).find('>tbody>tr.jqgrow>td:nth-child(' + (iCol + 1) + ')')
							.each(function () {
								$('div[data-jqactionname="edit"]', this).attr('style', 'display:none;')
							});
						if (idToSelect) {
							grid.jqGrid('setSelection', idToSelect);
							//$("#" + $.jgrid.jqID(idToSelect)).effect("highlight", {}, 3000);
						}
					},
					loadError: function (xhr, status, error) {
						console.log(xhr, status, error);
					},
					formEditing: {
						//width: 710,
						closeOnEscape: true,
						closeAfterEdit: true,
						//savekey: [true, 13]
					},
					onSelectAll: function () {
						let grid = $(this),
							param = grid.jqGrid('getGridParam'),
							buttons = ['del', 'shiftToPos', 'setTimePos', 'setHalfSet'];

						toggleButtons(param.id, buttons, checkCanExecute(param.selarrrow, param.data, sequenceItemDef));

					},
					onSelectRow: function () {
						let grid = $(this),
							value,
							selrow,
							param = grid.jqGrid('getGridParam');
						// Check if there are any rows in grid
						// If there are rows 
						if (param.data.length > 0) {
							selrow = param['selrow'];

							// The new command Offset
							// One or more rows selected, set Offset = last SELECTED command Offset + 
							if (selrow) {
								let rowData = param.data.find(item => item.GUID == selrow);

								value = parseInt(rowData.Offset) * 1000 + 1;
								IndexViewModel.timeLineOptions.selectedTime(new Date(value));
							}
							// No rows at all, set Offset = 0	
						} else {
							value = 0;
						}
					},
				}
			));




			// Some functions
			function checkCanExecute(selGUIDs, gridData, def) {
				let show = true;

				if (selGUIDs.length > 0) {
					for (let i = 0; i < selGUIDs.length; i += 1) { // Anyway, check the whole array
						defData = def.find(defItem => defItem.GUID == gridData.find(el => el.GUID == selGUIDs[i]).GUIDSequenceItemDef) || { CanExecute: false };
						show = show && defData.CanExecute;
					}
				}

				return show;
			}

			function toggleButtons(gridId, buttonIds, isShow) {

				buttonIds.forEach(buttonId => {
					$('#' + buttonId + '_' + gridId).toggleClass('disabled', !isShow);
					$('#' + buttonId + '_' + gridId + '_top').toggleClass('disabled', !isShow);
				});

			}


			function errorText(response) {
				//console.log(this, response);
				let gridDetail = $(this),
					alertHtml = '',
					gridParam = gridDetail.jqGrid('getGridParam');
				if (response.responseJSON) {
					if (!response.responseJSON.isValid) {
						let errors = response.responseJSON.Errors;
						for (let i = 0; i < errors.length; i += 1) {
							let error = errors[i];
							alertHtml += getAlertHtml(exceptionDef, 'error', error, gridParam.locale, gridDetail);
						};
					}
				} else {
					let errorUnknown = {
						TextID: 'ErrorUnknown',
						ElementGUID: $('input#GUID', '#FrmGrid_' + gridParam.id).val()
					};
					alertHtml = getAlertHtml(exceptionDef, 'error', errorUnknown, gridParam.locale, gridDetail);
				}
				return alertHtml;
			}
			$('#instrSelect').on('change', function () {
				serviceRequest(
					sequenceItemDefUrl + '?userRole=' + $('#instrSelect').val(),
					'GET',
					{},
					function (jqXHR) {
						sequenceItemDef = jqXHR.responseJSON;
						$sequenceItemsTable.jqGrid('setGridParam', { datatype: 'json' }).trigger('reloadGrid');
					},
					{
						dataType: 'json',
						processData: false
					}
				)
			});
			$(window).on('resize', { gridsOnPage: ['#jqGridMaster', '#jqGridDetail'] }, resizeGrid).trigger('resize');

		}) // end done
		.fail( // Here are going to be loading errors
			function () {
				//console.log( 'Fail' );
			});

}); // end document.ready
