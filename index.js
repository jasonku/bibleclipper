toastr.options = {
  closeButton: false,
  debug: false,
  newestOnTop: false,
  progressBar: false,
  positionClass: "toast-bottom-right",
  preventDuplicates: false,
  showDuration: "300",
  hideDuration: "1000",
  timeOut: "5000",
  extendedTimeOut: "1000",
  showEasing: "swing",
  hideEasing: "linear",
  showMethod: "fadeIn",
  hideMethod: "fadeOut",
}

var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

window.onload = function () {
  var clipboardTextArea = document.createElement("textarea");

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

  // Place in bottom-right corner of screen regardless of scroll position.
  clipboardTextArea.style.position = 'absolute';
  clipboardTextArea.style.bottom = 0;
  clipboardTextArea.style.right = 0;

  // Ensure it has a small width and height. Setting to 1px / 1em
  // doesn't work as this gives a negative w/h on some browsers.
  clipboardTextArea.style.width = '2em';
  clipboardTextArea.style.height = '2em';

  // We don't need padding, reducing the size if it does flash render.
  clipboardTextArea.style.padding = 0;

  // Clean up any borders.
  clipboardTextArea.style.border = 'none';
  clipboardTextArea.style.outline = 'none';
  clipboardTextArea.style.boxShadow = 'none';

  // Avoid flash of white box if rendered for any reason.
  clipboardTextArea.style.background = 'transparent';
  clipboardTextArea.style.opacity = '0';

  clipboardTextArea.value = "";

  document.body.appendChild(clipboardTextArea);

  var passageSearchField = $("#passage-search");
  passageSearchField.focus();

  var queries = [''];
  var queryIndex;

  var markAsSelected = function (element) {
    $('.translation-option').removeClass('selected-translation');
    $(element).addClass('selected-translation');
  }

  var translationSelectionHandler = function (e) {
    translation = e.target.id;
    window.localStorage.setItem('bibleclipperTranslation', translation);

    markAsSelected(e.target);
  }

  $('.translation-option')
    .on('click', translationSelectionHandler);

  var translation = window.localStorage.getItem('bibleclipperTranslation') || 'nasb';

  markAsSelected($('#' + translation));

  document.onkeypress = function (evt) {
     evt = evt || window.event;
     var charCode = evt.which || evt.keyCode;

     var charStr = String.fromCharCode(charCode);
     if (/[a-z0-9]/i.test(charStr) && !passageSearchField.is(":focus")) {
       passageSearchField.focus();
     }
  };

  document.onkeydown = function (evt) {
     evt = evt || window.event;

     if ((evt.keyCode === 38 || evt.keyCode === 40) && queries.length > 0) {
       evt.preventDefault();

       if (queryIndex === undefined) {
         queryIndex = queries.length - 2;
       } else {
         if (evt.keyCode === 38 && queryIndex > 0) {
           queryIndex = queryIndex - 1;
         }
         if (evt.keyCode === 40 && queryIndex < queries.length - 1) {
           queryIndex = queryIndex + 1;
         }
       }

       query = queries[queryIndex];

       passageSearchField.focus();
       passageSearchField.val(query);
     }
  }

  // https://stackoverflow.com/a/30810322
  function copyTextToClipboard(reference, text) {
    if (text !== null) {
      clipboardTextArea.value = text;
    }

    function showError() {
      toastr.error('Error copying ' + reference + ' to clipboard :(');
    }

    try {
      clipboardTextArea.select();

      var successful = document.execCommand('copy');
      if (successful) {
        console.log('Copy succeeded.');

        toastr.success('Copied ' + reference + ' to clipboard!');
      } else {
        console.log('Copy failed.');

        showError();
      }
    } catch (err) {
      console.log('Copy failed: ', err);
      showError();
    }
    passageSearchField.focus();
  }

  var placePassages = function () {
    var passagesPlacement = $('.jumbotron').position().top + $('.jumbotron').height() + 60;
    $('#passages').css('margin-top', passagesPlacement);
  };

  $("#search").submit(function (e) {
    e.preventDefault();
    var query = passageSearchField.val();

    clipboardTextArea.value = "";

    if (isSafari) {
      // For some reason this extra copy needed for the copy inside of the setInterval to work in Safari 13 ಠ_ಠ
      clipboardTextArea.select();
      var successful = document.execCommand('copy');

      var clipboardInterval = setInterval(function () {
        if (clipboardTextArea.value !== "") {
          copyTextToClipboard(clipboardTextArea.getAttribute('reference'), null);
          clearInterval(clipboardInterval);
        }
      }, 100);
    }

    queries.splice(queries.length - 1, 0, query);
    queryIndex = undefined;

    function showQueryError() {
      toastr.error('Error looking up "' + query + '".');

      passageSearchField
        .val("")
        .focus();
    }

    var request = $.ajax({
      url: "http://" + translation + ".literalword.com",
      method: "GET",
      data: {
        q: query,
        format: "json",
      },
      async: false, // Otherwise copy to clipboard won't work: https://stackoverflow.com/questions/31925944/execcommandcopy-does-not-work-in-xhr-callback
      success: function (data) {
        var reference;
        var text;
        $.each(data, function (key, value) {
          reference = key;
          text = value;
        });

        if (text.length === 0) {
          showQueryError();
          return;
        }

        var combo = reference + ' ' + text;

        clipboardTextArea.value = combo;
        clipboardTextArea.setAttribute('reference', reference);

        $('#passages .passage-text').addClass('old-passage');

        var template = $("#passage-template");

        var passage = template.clone()
          .removeAttr('id');

        var passageClickHandler = function (e) {
          copyTextToClipboard(reference, combo);
        };

        passage
          .find(".passage-text")
          .text(combo)
          .click(passageClickHandler);

        passage
          .prependTo("#passages");

        if (!isSafari) {
          copyTextToClipboard(reference, combo);
        }

        passageSearchField
          .val("")
          .focus();

        $(window).scrollTop(0);
      },
      error: function (jqXHR, textStatus, err) {
        showQueryError();
      },
      complete: placePassages,
    });

    console.log('Submitted search for ' + query);

    ga('send', 'event', 'Passage', 'search', query);
  });

  $(window).resize(function () {
    placePassages();
  });
};

