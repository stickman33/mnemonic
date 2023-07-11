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
		$sequenceItemsTable = $('#jqGridDetail');
	// let lastRowIdx = {};

	let seqItemDefReq = serviceRequest(sequenceItemDefUrl, 'GET', {}, {}, { dataType: 'json' });

	$.when(
		seqItemDefReq
	).done(
		function (
			seqItemDefReqVal
		) {

			let sequenceItemDef = seqItemDefReqVal[0],
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
					rowNum: 5,
					rowList: [5, 10, 20, 30],
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
