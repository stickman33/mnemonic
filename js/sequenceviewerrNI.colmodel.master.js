var masterColModel = [ // Master grid
					{ // Actions
						label: $.jgrid.locales.ru.actionsCol.caption, 
						name: 'actions', 
						align: 'center',
						width: 60, 
						fixed: true,
						sortable: false,
						search: false,
						formatter: 'actions', 
						formatoptions: {
							keys: true,
							editbutton : false,
							delbutton : false,
							afterRestore:  function(){
								var grid = $(this);
								grid.jqGrid('setGridParam', {datatype: 'json'}).trigger('reloadGrid');
							}
							//delOptions: {
							//	mtype: 'DELETE',
							//	width: 710,
							//	onclickSubmit: function(options, rowid) {
							//		var grid = $(this);
							//		var rowdata = grid.jqGrid('getRowData',rowid);
							//		options.url = url + 'sequenceNI' + '?guidsequence=' +rowdata['GUID'];
							//		return {};
							//	},
							//	serializeDelData: function (data) {
							//		return ''; // don't send and body for the HTTP DELETE
							//	},
								//afterSubmit: function(response, postdata){
								//	if (response.readyState === 4 && response.statusText === 'OK'){
								//		return ([true, 'Deleted OK'])
								//	} else {
								//		return ([false, 'Error: ' + response.responseText])
								//	}
								//},
								//ajaxDelOptions: {
								//	contentType: 'application/json',
								//},
							//}
						}
					},
					{ // GUID
						label: 'GUID', 
						name: 'GUID', 
						key: true,
						width: 75, 
						hidden: true, 
						sortable: false,
						search: false,
						editable: false
						//editoptions: { 
						//	defaultValue: '00000000-0000-0000-0000-000000000000',
						//	disabled: true
						//} 
					},
					{ // UIModified
						label: $.jgrid.locales.ru.uiModifiedCol.caption,
						name: 'UIModified',
						align: 'center',
						width: 200,
						fixed: true,
						search: false,
						searchoptions: {
							sopt: ['eq','ne','gt','lt','ge','le']
						},
						editable: false,
						sorttype: function (cell, rowData) {
							return (Date.parse(rowData['UIModified']));
						},
					},
					{ // Title
						label: $.jgrid.locales.ru.titleCol.caption,
						name: 'Title', 
						width: 75, 
						sortable: false,
						editable: false, 
						search: false,
						searchoptions: {
							sopt: ['cn','nc','eq','ne','bw','bn','ew','en']
						}
						//edittype: 'text', 
						//editoptions: { 
						//	defaultValue: function(){
						//		var d = new Date();
						//		var withoutMs = new Date(d.getTime() - userOffset).toISOString().split('.')[0];
						//		return 'Cyclogram-' + withoutMs;
						//	}
						//},
					},
					{ // Comment
						label: $.jgrid.locales.ru.commentCol.caption,
						name: 'Comment', 
						width: 100, 
						sortable: false,
						search: false,
						searchoptions: {
							sopt: ['cn','nc','eq','ne','bw','bn','ew','en']
						},
						editable: false
					},
					{ // Editor
						label: $.jgrid.locales.ru.editorUICol.caption,
						name: 'Editor', 
						width: 130, 
						fixed: true,
						sortable: false,
						search: false,
						searchoptions: {
							sopt: ['cn','nc','eq','ne','bw','bn','ew','en']
						},
						editable: false
					}
				]
