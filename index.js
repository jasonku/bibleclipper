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

  $("#close-jumbotron").click(function () {
    $("#jumbotron").fadeOut();
  });

  $("#search").submit(function (e) {
    e.preventDefault();
    var query = passageSearchField.val();

    var request = $.ajax({
      //url: "http://nasb.literalword.com",
      url: "http://localhost:3000",
      method: "GET",
      data: {
        q: query,
        format: "json",
      },
      success: function (data) {
        var text;

        $.each(data, function (key, value) {
          text = key + ' ' + value;
        });

        $('#passages .passage-text').addClass('old-passage');

        var template = $("#passage-template");

        var passage = template.clone()
          .removeAttr('id');

        passage
          .find(".passage-text")
          .text(text)

        passage
          .prependTo("#passages");

        passageSearchField
          .val("")
          .focus();
      },
    });
    console.log('Submitted search for ' + query);
  });
};
