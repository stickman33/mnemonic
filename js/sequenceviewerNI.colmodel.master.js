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
