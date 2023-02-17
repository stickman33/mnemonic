/*!
 * testgrid v1.0.1
 *
 * Date: 2022-06-16 16:06:34
 */


	var url = '../services/Sequences.svc/';

	$.when(
		serviceRequest(
			'sequenceitemdefinition',
			'GET',
			{},
			{},
			{
				dataType: 'json',
				processData: false
			}
		).done(
			function (guidSequenceItemDef) {
				$(document).ready(function () {

					var lastSel;
					var lastCommandRowNum;



					//dataInitCommand = function (elem) {
					//setTimeout(function () {
					//$(elem).change();
					//}, 0);
					//};



					// Sequence grid
					$('#jqGridMaster').jqGrid($.extend({
						caption: $.jgrid.locales.ru.masterTable.caption || 'Cyclogram list',
						pager: '#jqGridMasterPager',
						url: url + 'sequenceNI',
						editurl: url + 'sequenceNI',
						forceClientSorting: true,
						navOptions: { reloadGridOptions: { fromServer: true } },
						rowNum: 5,
						rowList: [5, 10, 20, 30],
						multiselect: false,
						sortname: 'UIModified',
						sortorder: 'desc',
						serializeRowData: function (postdata) {
							return JSON.stringify(postdata);
						},
						colModel: masterColModel,
						onSelectRow: function (ids) {
							if (ids && ids !== lastSel) {
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
							var grid = $(this);
							var iCol = getColumnIndexByName(grid, 'actions');
							$(this).find('>tbody>tr.jqgrow>td:nth-child(' + (iCol + 1) + ')')
								.each(function () {
									$('<div>', {
										title: 'Details',
										mouseover: function () {
											$(this).addClass('active');
										},
										mouseout: function () {
											$(this).removeClass('active');
										},
										click: function (e) {
											var ids =  $(e.target).closest('tr.jqgrow').attr('id');
											var grid = $('#jqGridMaster');
											///*$('#jqGridDetail').jqGrid('clearGridData');*/
											if (ids == null) {
												ids = 0;
												if ($('#jqGridDetail').jqGrid('getGridParam', 'records') > 0) {
												}
											} else {
											}
											//grid.jqGrid('getRowData', ids)['GUID'];
											//console.log(ids);
											self.IndexViewModel.selectedCyclogramGUID(ids);
											self.IndexViewModel.ShowCyclogramContent(self.IndexViewModel);

											/*$('#jqGridDetail').jqGrid('setCaption', 'Cyclogram: ' + 'Title: ' + grid.jqGrid('getRowData', ids)['Title'] + ' ( GUID: ' + grid.jqGrid('getRowData', ids)['GUID'] + ')').trigger('reloadGrid');*/
											setTimeout(function () {
												if (lastCommandRowNum) {
													$("#jqGridDetail").jqGrid('setSelection', getRowIdByNum(lastCommandRowNum, $("#jqGridDetail")));
												}
											}, 500);
											lastEdited = null;
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
					}, gridCommonOptions));

					$('#jqGridMaster').jqGrid('filterToolbar', {
						stringResult: false,
						searchOperators: true,
					});


					$(window).on('resize', { gridsOnPage: ['#jqGridMaster'] }, resizeGrid).trigger('resize');

				})
			}) // end done
	); // end when

