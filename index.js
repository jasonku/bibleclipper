window.onload = function () {
  var passageSearchField = $("#passage-search");
  passageSearchField.focus();

  document.onkeypress = function(evt) {
     evt = evt || window.event;
     var charCode = evt.which || evt.keyCode;
     var charStr = String.fromCharCode(charCode);
     if (/[a-z0-9]/i.test(charStr) && !passageSearchField.is(":focus")) {
       passageSearchField.focus();
     }
  };

  // https://stackoverflow.com/a/30810322
  function copyTextToClipboard(reference, text) {
    var textArea = document.createElement("textarea");

    //
    // *** This styling is an extra step which is likely not required. ***
    //
    // Why is it here? To ensure:
    // 1. the element is able to have focus and selection.
    // 2. if element was to flash render it has minimal visual impact.
    // 3. less flakyness with selection and copying which **might** occur if
    //    the textarea element is not visible.
    //
    // The likelihood is the element won't even render, not even a flash,
    // so some of these are just precautions. However in IE the element
    // is visible whilst the popup box asking the user for permission for
    // the web page to copy to the clipboard.
    //

    // Place in top-left corner of screen regardless of scroll position.
    textArea.style.position = 'fixed';
    textArea.style.top = 0;
    textArea.style.left = 0;

    // Ensure it has a small width and height. Setting to 1px / 1em
    // doesn't work as this gives a negative w/h on some browsers.
    textArea.style.width = '2em';
    textArea.style.height = '2em';

    // We don't need padding, reducing the size if it does flash render.
    textArea.style.padding = 0;

    // Clean up any borders.
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';

    // Avoid flash of white box if rendered for any reason.
    textArea.style.background = 'transparent';

    textArea.value = text;

    document.body.appendChild(textArea);

    textArea.select();

    function showError() {
      $('#copied-error').fadeOut(200, function complete() {
        $('.copied-reference').text(reference);
        $('#copied-error').fadeIn(200);
      });
    }

    try {
      var successful = document.execCommand('copy');
      if (successful) {
        console.log('Copy succeeded.');
        $('#copied-success').fadeOut(200, function complete() {
          $('.copied-reference').text(reference);
          $('#copied-success').fadeIn(200);
        });
      } else {
        console.log('Copy failed.');
        showError();
      }
    } catch (err) {
      console.log('Copy failed: ', err);
      showError();
    }

    document.body.removeChild(textArea);
  }

  $("#search").submit(function (e) {
    e.preventDefault();
    var query = passageSearchField.val();

    function showQueryError() {
      $('#query-error').fadeOut(200, function complete() {
        $('.query-attempt').text(query);
        $('#query-error').fadeIn(200);
      });
    }

    var request = $.ajax({
      //url: "http://nasb.literalword.com",
      url: "http://localhost:3000",
      method: "GET",
      data: {
        q: query,
        format: "json",
      },
      async: false, // Otherwise copy to clipboard won't work: https://stackoverflow.com/questions/31925944/execcommandcopy-does-not-work-in-xhr-callback
      success: function (data) {
        $('.alert').hide();
        var reference;
        var text;
        $.each(data, function (key, value) {
          reference = key;
          text = value;
        });

        passageSearchField
          .val("")
          .focus();

        if (text.length === 0) {
          showQueryError();
          return;
        }

        var combo = reference + ' ' + text
        $('#passages .passage-text').addClass('old-passage');

        var template = $("#passage-template");

        var passage = template.clone()
          .removeAttr('id');

        passage
          .find(".passage-text")
          .text(combo)

        passage
          .prependTo("#passages");

        copyTextToClipboard(reference, combo);
      },
      error: function (jqXHR, textStatus, err) {
        $('.alert').hide();

        passageSearchField
          .val("")
          .focus();

        showQueryError();
      },
    });
    console.log('Submitted search for ' + query);
  });
};

