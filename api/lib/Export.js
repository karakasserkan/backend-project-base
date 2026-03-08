const xlsx = require("node-xlsx");

class Export {
  constructor() {}

  /**
   *
   * @param {Array} titles Excel tablosunun başıkları
   * @param {Array} columns Excel tablosuna yazılacak verilerin isimleri
   * @param {Array} data Excel tablosuna yazılacak veriler
   */
  toExcel(titles, columns, data = []) {
    if (titles.length !== columns.length)
      throw new Error("titles and columns length must match");
    let rows = [];
    rows.push(titles);
    for (let i = 0; i < data.length; i++) {
      let item = data[i];
      let cols = [];
      for (let j = 0; j < columns.length; j++) {
        cols.push(item[columns[j]] ?? ""); // null ise "" , undefined ise ""
      }

      rows.push(cols);
    }

    return xlsx.build([{ name: "Sheet", data: rows }]);
  }
}

module.exports = Export;
