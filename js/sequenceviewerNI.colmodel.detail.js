/*!
 * ion-sequenceEditor-NI v1.0.1
 *
 * nate: 2023-02-07 16:33:09
 */
let detailColModel = function(commandDefObj, errorDefObj) {
	let colModel;





	// GUIDSequenceItemDef functions
	function GUIDSequenceItemDefFormatter(cellvalue, options, rowObject) {
		return commandDefObj.find(item=>item.GUID==cellvalue).Title;
	}
	function GUIDSequenceItemDefUnformatter(cellvalue,options,cell){
		//return commandDefObj.find(item=>item.Title==cellvalue).GUID;
		return cell;
	}
	function GUIDSequenceItemDefControl(value, options) {
		let el = $(htmlGUIDSequenceItemDefControl);
		let guidDef = (options.rowId == '_empty') ? null : $(this).jqGrid('getGridParam','data').find(item=>item.GUID==options.rowId).GUIDSequenceItemDef;
		let items = commandDefObj.filter(item=>item.CanExecute).map(item=>$('<option>').val(item.GUID).text(item.Title));
		$('select',el).empty();
		$('select',el).append(items);
		$('select',el).val(guidDef);
		return el[0];
	}
	function GUIDSequenceItemDefControlValue(elem, operation, value) {
		if(operation === 'get') {
			return $('select',elem).val();
		} else if(operation === 'set') {
			let guidVal = (!value) ? commandDefObj[0].GUID : commandDefObj.find(item=>item.Title==$(value).text()).GUID;
			$('select',elem).val(guidVal).trigger('change'); // ???
		}
	}
	function changeGUIDSequenceItemDef(value, event, def){
		let selectedDef = def.find(item=>item.GUID == value);
		changeBitParam(selectedDef.bitParameters, event.data.gridId);
		changeByteParam(selectedDef.byteParameters, event.data.gridId);
		$('td[class="danger"]','#FrmGrid_' + event.data.gridId).empty();
	}
	function changeBitParam(def, gridId){
		let $elem = $('#bitParameters','#FrmGrid_'+gridId);
		$elem.empty();
		$elem.bitParametersControl(def, null);
	}
	function changeByteParam(def, gridId){
		let $elem = $('#byteParameters','#FrmGrid_'+gridId);
		$elem.empty();
		$elem.byteParametersControl(def, null);
	}

	colModel = [ 
		{ // GUID
			label: 'GUID', 
			name: 'GUID', 
			width: 75, 
			hidden: true, 
			key: true,
			editable: false, 
			edittype: 'text', 
			editoptions: { 
				defaultValue: '00000000-0000-0000-0000-000000000000',
				disabled: true
			},
			formoptions: {
				rowpos: 1,
				colpos: 1,
			},
			sortable: false,
		},
		{ // GUIDSequence
			label: 'GUIDSequence', 
			name: 'GUIDSequence', 
			width: 75, 
			hidden: true, 
			editable: false, 
			edittype: 'text', 
			editoptions: { 
				defaultValue: function () {
					return selMasterRowData === null ? '00000000-0000-0000-0000-000000000000' : selMasterRowData['GUID'];
				},
				disabled: true
			},
			formoptions: {
				rowpos: 2,
				colpos: 1,
			},
			sortable: false,
		},
		{ // Offset
			label: $.jgrid.locales.ru.offsetCol.caption,
			name: 'Offset', 
			align: 'center',
			width: 100, 
			fixed: true,
			search: true,
			searchoptions: {
				sopt: ['eq','ne','gt','lt','ge','le']
			},
			editable: false, 
			edittype: 'custom',
			editoptions: {
				custom_element: offsetElement,
				custom_value: offsetValue,

				defaultValue: function(){ 
					let grid = $(this), 
						value, 
						selrow, 
						param = grid.jqGrid('getGridParam');
					// Check if there are any rows in grid
					// If there are rows 
					if ( param.data.length > 0 ){
						selrow = param['selrow'];
						
						// The new command Offset
						// One or more rows selected, set Offset = last SELECTED command Offset + 
						if (selrow)	{
							let rowData = param.data.find(item => item.GUID == selrow);

							console.log(rowData.Offset);
							value = parseInt(rowData.Offset);
						} 	
						// No rows at all, set Offset = 0	
					} else {
						value = 0;
					}

					return value;
				},
				dataEvents: [
					{ 
						type: 'change', 
						data: { grid: $('#jqGridDetail')},
						fn: changeOffsetSecLabel, 
						// fn: function (e) { 
						// 	changeOffsetSecLabel(e);
						// } 
					},
					{ 
						type: 'change', 
						data: { grid: $('#jqGridDetail')},
						fn: changeShiftVal,
						
					},
				],
			},
			formoptions: {
				rowpos: 5,
				colpos: 1,
			},
			sortable: true,
			sorttype: 'integer',
			//formatter: 'integer',
			formatter: offsetFormatter,
			unformat: offsetUnFormatter,
		},	
		{ // Shift
			label: $.jgrid.locales.ru.shiftCol.caption,
			name: 'Shift',
			align: 'center',
			width: 100,
			sortable: false,
			fixed: true,
			search: false,
			searchoptions: {
				sopt: ['eq','ne','gt','lt','ge','le']
			},
			editable: false,
			edittype: 'custom',
			editoptions:
			{
				dataEvents: [

					{
						type: 'change',
						data: { grid: $('#jqGridDetail'), timeout: null},
						fn: function (e) {

							if (e.data.timeout !== null) {
								clearTimeout(e.data.timeout);
							}

							console.log('Shift input changed!');
							 let fields,
							 	newShiftVal = e.target.value,
							 	grid = $(e.data.gridIdSel),
							 	gridData = grid.jqGrid('getGridParam','data'),
							 	length = gridData.length,
							 	rowData = gridData.find(el=>el.GUID == e.data.rowId),
							 	oldOffsetVal = rowData.Offset,
							 	oldShiftVal = rowData.Shift,
							 	diffVal = parseInt(newShiftVal) - parseInt(oldShiftVal),
							 	newOffsetVal = (parseInt(newShiftVal) - parseInt(oldShiftVal)) + parseInt(oldOffsetVal);
							

							 fields = $('form.FormGrid').find('#Offset').find('input');
							 fields.timeEntry('setTime', toHMS(newOffsetVal));

							 for (let i=gridData.indexOf(rowData); i < length; i+=1){ // FIXIT Maybe not here?
							 	gridData[i].Offset += diffVal;	
							 }

							serviceRequest(
								sequenceItemNIUrl,
								'PUT',
								JSON.stringify(gridData),
								function (jqXHR, textStatus) {
									var successResult = [true, '', ''], ret = successResult;
									if ((jqXHR.status >= 300 && jqXHR.status !== 304) || (jqXHR.status === 0 && jqXHR.readyState === 4)) {
										ret[0] = false;
										ret[1] = textStatus + ' Status: ' + jqXHR.statusText + '. Error code: ' + jqXHR.status;
									} else {
										grid.jqGrid('setGridParam',{ datatype: 'json'}).trigger('reloadGrid');
										hideDialog();
									}
									if (ret[0] === false) {
										$('#FormError>td', '#'+IDs.scrollelm).html(ret[1]);
										$('#FormError', '#'+IDs.scrollelm).show();
									}
								}, 
								{}
							);

							//grid.jqGrid().trigger('reloadGrid');

						}
					},
				],
				disabled: true,
				custom_element: shiftElement,
				custom_value: shiftElementValue,
			},
			formoptions: {
				rowpos: 6,
				colpos: 1,
			},
			sortable: false,
			sorttype: 'integer',
			formatter: function (cellValue, option, rowObject) { // FIXIT! Make a function and move it to lib
				let grid = $(this),
					data = grid.jqGrid('getGridParam','data');

				for(let i=0; i < data.length; i++){
					if (i == 0){
						data[i]['Shift'] = data[i]['Offset'];
					} else {
						data[i]['Shift'] = data[i]['Offset'] - data[i-1]['Offset'];
					}

					if (data[i]['GUID'] === rowObject['GUID']){
						return data[i]['Shift'];
					}
				}
			},
		},
		{ // HalfsetNumber 
			label: $.jgrid.locales.ru.halfsetCol.caption,
			name: 'HalfsetNumber',
			align: 'center',
			width: 30, 
			editable: false, 
			edittype: 'custom',
			autoResizableMinColSize: 40 ,	
			editoptions: {
				//defaultValue: hsNumber || 1,
				custom_element: halfSetNumberElement,
				custom_value: halfSetNumberElementValue,
			},
			formoptions: {
				rowpos: 7,
				colpos: 1,
			},
			search: false,
			sortable: false,
		},
		{ // GUIDSequenceItemDef (Command)
			label: $.jgrid.locales.ru.commandDefCol.caption,
			name: 'GUIDSequenceItemDef', 
			width: 75, 
			sortable: false,
			editable: false, 
			search: true,
			stype: 'text',
			searchoptions: {
				sopt: ['eq','ne'],
				//value: buidSelectOpts(commandDefObj, 'GUID', 'Title', {'':'All'}),
				dataInit: function (elem) {
					$(elem).autocomplete({source: commandDefObj.map(function(item){ return {'label': item.Title,'value':item.GUID}})});
					//$(elem).toggle();
				}
			},
			edittype: 'custom',
			editoptions: {
				custom_element: 	GUIDSequenceItemDefControl,
				custom_value: 		GUIDSequenceItemDefControlValue,
				dataEvents: [
					{ 
						type: 'change', 
						fn: function (e) { 
							changeGUIDSequenceItemDef($(e.target).val(), e, commandDefObj); 
						} 
					},
				],
			},
			formatter: 			GUIDSequenceItemDefFormatter,
			unformat: 			GUIDSequenceItemDefUnformatter,
			formoptions: {
				rowpos: 3,
				colpos: 1,
			},
		},
		{ // bitParameters
			label: $.jgrid.locales.ru.bitParametersCol.caption,
			name: 'bitParameters', 
			width: 90, 
			sortable: false,
			search: false,
			editable: false,
			edittype: 'custom',
			editoptions: {
				custom_element: function(value, options){
					let guidDef = (options.rowId == '_empty') ? null : $(this).jqGrid('getGridParam','data').find(item=>item.GUID==options.rowId).GUIDSequenceItemDef,
						bitParamDef = (!guidDef) ? commandDefObj[0].bitParameters : commandDefObj.find(item => item.GUID==guidDef).bitParameters;
					return bitParametersElement(bitParamDef, value, options);
				},
				custom_value: bitParametersElementValue,
			},
			editrules: { custom: true, custom_func: bitParamValueCheck },
			formoptions: {
				rowpos: 8,
				colpos: 1,
			},
			formatter: 			bitParametersFormatter,
			unformat: 			bitParametersUnformatter,
		},
		{ // byteParameters
			label: $.jgrid.locales.ru.byteParametersCol.caption,
			name: 'byteParameters', 
			width: 90, 
			sortable: false,
			search: false,
			editable: false,
			edittype: 'custom', 	
			editoptions: {
				custom_element: function(value, options){
					let guidDef = (options.rowId == '_empty') ? null : $(this).jqGrid('getGridParam','data').find(item=>item.GUID==options.rowId).GUIDSequenceItemDef,
						byteParamDef = (!guidDef) ? commandDefObj[0].byteParameters : commandDefObj.find(item => item.GUID==guidDef).byteParameters;
					return byteParametersElement(byteParamDef, value, options);
				},
				custom_value: byteParametersElementValue,
			}, 
			// editrules: { custom: true, custom_func: paramValueCheck },
			formoptions: {
				rowpos: 9,
				colpos: 1,
			},
			formatter: 			byteParametersFormatter,
			unformat: 			byteParametersUnformatter,
		},
		{ // Comment
			label: $.jgrid.locales.ru.commentCol.caption,
			name: 'Comment', 
			width: 100, 
			sortable: false,
			search: true,
			searchoptions: {
				sopt: ['cn','nc','eq','ne','bw','bn','ew','en'],
			},
			editable: false,
			edittype: 'textarea',
			editoptions: { rows:'2', cols:'10' },
			formoptions: {
				rowpos: 10,
				colpos: 1,
			},
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
	];

	return colModel;
}
