// longtable 2.0 - a minimalist javascript table pager

// Copyright 2011, 2012, 2013, 2014, 2015 Chris Forno
// Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php).

// Unsupported browsers:
// Internet Explorer <= 8

// Assumptions:
// * The table has a single <tbody>.
// * All rows have the same number of columns (more specifically, the
//   first row has the max number of columns of all rows).

(function () {

  // Fire a custom event named "name" from element "element" with
  // extra data "data" attached to the details of the event.
  function customEvent(name, element, data) {
    if (window.CustomEvent) {
      var event = new CustomEvent(name, {detail: data});
    } else {
      var event = document.createEvent('CustomEvent');
      event.initCustomEvent(name, true, true, data);
    }
    element.dispatchEvent(event);
  }

  window.longtable = function (table, options) {
    if (table.tBodies.length === 0) throw new Error('longtable: Missing table <tbody>.');

    // How many rows per page should we display?
    var perPage = options !== undefined && 'perPage' in options ? options.perPage : 10;
    // Which page should we start on?
    var startPage = options !== undefined && 'startPage' in options ? options.startPage : 1;
    // What's the maximum number of on either side of the current page?
    var maxLinks = options !== undefined && 'maxLinks' in options ? options.maxLinks : 9;

    var currentPage = null;
    var rows = table.tBodies[0].rows;
    var nPages = Math.max(1, Math.ceil(rows.length / perPage));
    // Determine the number of columns in the table.
    var nCols = 0;
    if (rows.length > 0) {
      for (var i = 0; i < rows[0].cells.length; i++) {
        nCols += rows[0].cells[i].colSpan;
      }
    }

    var prev = document.createElement('a');
    prev.className = 'page prev';
    prev.setAttribute('href', '');

    var next = document.createElement('a');
    next.className = 'page next';
    next.setAttribute('href', '');

    var leftElipsis = document.createElement('span');
    leftElipsis.className = 'elipsis';

    var rightElipsis = document.createElement('span');
    rightElipsis.className = 'elipsis';

    var links = [];
    for (var i = 1; i <= nPages; i++) {
      var link = document.createElement('a');
      link.className = 'page direct';
      link.setAttribute('href', '');
      link.textContent = i;
      links.push(link);
    }

    var controls = document.createElement('th');
    controls.colSpan = nCols;
    controls.className = 'paging-controls';    
    // <prev  1 ... 3 4 5 6 7 ... 9  next>
    controls.appendChild(prev);
    controls.appendChild(links[0]);
    controls.appendChild(leftElipsis);
    controls.appendChild(document.createTextNode(' '));
    for (var i = 2; i < nPages; i++) {
      controls.appendChild(links[i - 1]);
      controls.appendChild(document.createTextNode(' '));
    }
    controls.appendChild(rightElipsis);
    controls.appendChild(links[links.length - 1]);
    controls.appendChild(next);    
    table.createTFoot().insertRow().appendChild(controls);

    table.gotoPage = function (n) {
      if (n < 1 || n > nPages) throw new RangeError('longtable: gotoPage number must be between 1 and ' + nPages);

      // Hide or show the previous/next controls if we're moving to the first/last page.
      prev.style.visibility = n === 1 ? 'hidden' : '';
      next.style.visibility = n === nPages ? 'hidden' : '';

      // Display up to maxLinks links.
      var nLinksLeft = Math.min(n, maxLinks - Math.min(nPages - n, Math.floor(maxLinks / 2))) - 1;
      var nLinksRight = Math.min(nPages - n, maxLinks - nLinksLeft - 1);
      for (var i = 1; i <= links.length; i++) {
        if (i === n) { // current page
          links[i-1].style.display = '';
          links[i-1].removeAttribute('href');
        } else if (i === 1 || // Always show the first page number.
                   i === nPages || // Always show the last page number.
                   (i > n - nLinksLeft && i < n + nLinksRight)) {
          links[i-1].setAttribute('href', '');
          links[i-1].style.display = '';
        } else {
          links[i-1].style.display = 'none';
        }
      }

      // Hide or show elipses based on how far away we are from the ends.
      leftElipsis.style.display = n > nLinksLeft + 1 ? '' : 'none';
      rightElipsis.style.display = n < nPages - nLinksRight ? '' : 'none';
      
      if (currentPage !== null) { // Hide currently displayed rows.
        for (var i = (currentPage - 1) * perPage; i < Math.min(currentPage * perPage, rows.length); i++) {
          rows[i].style.display = 'none';
        }
      } else { // Hide all rows
        for (var i = 0; i < rows.length; i++) {
          rows[i].style.display = 'none';
        }
      }
      // Display new rows.
      for (var i = (n - 1) * perPage; i < Math.min(n * perPage, rows.length); i++) {
        rows[i].style.display = '';
      }

      currentPage = n;

      customEvent('longtable.pageChange', table, {page: n});      
    };

    controls.addEventListener('click', function (event) {
      if (event.target.tagName === 'A') {
        event.preventDefault();
        if (event.target.className == 'page prev') {
          table.gotoPage(currentPage - 1);
        } else if (event.target.className == 'page next') {
          table.gotoPage(currentPage + 1);
        } else {
          table.gotoPage(parseInt(event.target.textContent, 10));
        }
      }
    });

    table.gotoPage(startPage);
  };

})();
