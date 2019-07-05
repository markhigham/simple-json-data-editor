let referenceModel;
let patchStack = {};

function makeReferenceDataModel(jsonText) {
  const parsed = JSON.parse(jsonText);
  const result = {
    history: [],
    keyField: "key",
    rows: []
  };

  if (Array.isArray(parsed)) {
    result.rows.push(...parsed);
    return result;
  }

  // Let's assume that the data is ok - it probably isn't and should be checked
  return parsed;
}

function logEvent(verb, key, fieldName, oldValue, newValue) {
  if (oldValue == newValue) return;
  console.log(`/${verb}/${key}`);

  patchStack[fieldName] = {
    old: oldValue,
    new: newValue
  };
}

var gridOptions = {
  editType: "fullRow",
  rowSelection: "multiple",
  rowData: [],
  defaultColDef: {
    resizable: true,
    sortable: true,
    editable: true
  },
  onCellValueChanged: function(e) {
    const fieldName = e.colDef.field;
    logEvent("PATCH", e.data.key, fieldName, e.oldValue, e.newValue);
    // debugger;
  },
  onRowValueChanged: function(e) {
    // End of row being edited.. perhaps stack up the cell changes

    const delta = {
      timestamp: new Date().getTime(),
      changed: patchStack
    };

    console.log(JSON.stringify(delta, null, 2));
  }
};

// lookup the container we want the Grid to use
var eGridDiv = document.querySelector("#myGrid");
// create the grid passing in the div to use together with the columns & data we want to use
new agGrid.Grid(eGridDiv, gridOptions);

$("#download-link").click(function() {
  var link = document.createElement("a");
  const json = JSON.stringify(referenceModel, null, 4);
  link.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(json)
  );
  link.setAttribute("download", "data.json");
  document.body.appendChild(link);
  link.click();
});

$("#new-row-button").click(function() {
  console.log("new row");
  referenceModel.rows.push({
    name: "New College",
    region: "New region",
    "start-date": new Date().toISOString()
  });

  gridOptions.api.setRowData(referenceModel.rows);
});

$("#delete-row-button").click(function() {
  console.log("delete row");
  var selectedData = gridOptions.api.getSelectedRows();
  var res = gridOptions.api.updateRowData({ remove: selectedData });
  console.log(res);
});

function makeColumnDefs(model) {
  const columnDefs = [];
  if (!model.rows.length) return columnDefs;

  const row = model.rows[0];
  for (let prop in row) {
    const col = {
      headerName: prop,
      field: prop
    };

    if (prop == model.keyField) {
      col.editable = false;
    }

    columnDefs.push(col);
  }

  return columnDefs;
}

function rebindGrid(model) {
  const columnDefs = makeColumnDefs(model);

  gridOptions.api.setColumnDefs(columnDefs);
  referenceModel = model;

  gridOptions.api.setRowData(referenceModel.rows);
  gridOptions.api.refreshCells();
}

$("#inline-upload").change(function() {
  const el = $(this)[0];

  if (!el.files.length) return;

  const file = el.files[0];
  var reader = new FileReader();
  reader.onloadend = function(e) {
    const json = JSON.parse(e.target.result);
    const model = makeReferenceDataModel(e.target.result);
    console.log(model);
    rebindGrid(model);
  };

  reader.readAsText(file);
});
